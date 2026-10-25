import fs from 'fs';
import path from 'path';
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { AwsGameProvider } from '../context/AwsGameContext';
import { configureAws, getAwsGameClient } from '../services/aws';
import { currentPushSubscription } from '../services/pushService';

jest.mock('browser-image-compression', () => jest.fn());

const mockClient = {
  queries: { getGameView: jest.fn() },
  mutations: { gameAction: jest.fn() },
  subscriptions: { onGameUpdated: jest.fn() },
};
jest.mock('../services/aws', () => ({
  configureAws: jest.fn(async () => undefined),
  getAwsGameClient: jest.fn(async () => mockClient),
  getIdentityId: jest.fn(async () => 'identity'),
  uploadPrivateImage: jest.fn(),
}));

// The RFC 8291 example key: 65 bytes, uncompressed P-256 point.
const SERVER_KEY = 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4';
const keyBuffer = (key: string) =>
  Uint8Array.from(atob(key.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (key.length % 4)) % 4)), (c) =>
    c.charCodeAt(0),
  ).buffer;

function fakeSubscription(endpoint: string, key: string) {
  return {
    options: { applicationServerKey: keyBuffer(key) },
    unsubscribe: jest.fn(async () => true),
    toJSON: () => ({ endpoint, keys: { p256dh: 'p', auth: 'a' } }),
  };
}

function installPush(existing: ReturnType<typeof fakeSubscription> | null, permission = 'granted') {
  const pushManager = {
    getSubscription: jest.fn(async () => existing),
    subscribe: jest.fn(async () => fakeSubscription('https://fcm.googleapis.com/fcm/send/new', SERVER_KEY)),
  };
  const registration = { pushManager };
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { getRegistration: jest.fn(async () => registration), ready: Promise.resolve(registration) },
  });
  Object.assign(window, { PushManager: function PushManager() {} });
  Object.assign(window, { Notification: { permission } });
  return pushManager;
}

describe('currentPushSubscription', () => {
  it('subscribes this phone with the server key', async () => {
    const pushManager = installPush(null);
    const subscription = await currentPushSubscription(SERVER_KEY);
    expect(subscription?.endpoint).toBe('https://fcm.googleapis.com/fcm/send/new');
    const options = (pushManager.subscribe.mock.calls[0] as unknown as [PushSubscriptionOptionsInit])[0];
    expect(options.userVisibleOnly).toBe(true);
    expect(Array.from(options.applicationServerKey as Uint8Array)).toEqual(Array.from(new Uint8Array(keyBuffer(SERVER_KEY))));
  });

  it('reuses a matching subscription and replaces one made for another key', async () => {
    const same = fakeSubscription('https://fcm.googleapis.com/fcm/send/same', SERVER_KEY);
    let pushManager = installPush(same);
    expect((await currentPushSubscription(SERVER_KEY))?.endpoint).toBe('https://fcm.googleapis.com/fcm/send/same');
    expect(pushManager.subscribe).not.toHaveBeenCalled();

    const stale = fakeSubscription('https://fcm.googleapis.com/fcm/send/old', 'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8');
    pushManager = installPush(stale);
    expect((await currentPushSubscription(SERVER_KEY))?.endpoint).toBe('https://fcm.googleapis.com/fcm/send/new');
    expect(stale.unsubscribe).toHaveBeenCalled();
  });

  it('does nothing without notification permission', async () => {
    const pushManager = installPush(null, 'default');
    expect(await currentPushSubscription(SERVER_KEY)).toBeNull();
    expect(pushManager.subscribe).not.toHaveBeenCalled();
  });
});

describe('AwsGameProvider push wiring', () => {
  beforeEach(() => {
    // Create React App resets mocks before each test, so the fake client is wired up here.
    (configureAws as jest.Mock).mockResolvedValue(undefined);
    (getAwsGameClient as jest.Mock).mockResolvedValue(mockClient);
    // jsdom has no Web Crypto; the provider uses it for request ids.
    Object.defineProperty(window, 'crypto', {
      configurable: true,
      value: { randomUUID: () => `test-${Math.random().toString(36).slice(2)}` },
    });
    localStorage.clear();
    localStorage.setItem('currentGameId', 'GAME23');
    installPush(null);
    mockClient.queries.getGameView.mockResolvedValue({
      data: {
        revision: 3,
        payload: {
          serverTime: new Date().toISOString(),
          pushKey: SERVER_KEY,
          game: { id: 'GAME23', status: 'live', createdAt: new Date().toISOString(), players: [{ id: 'me', tasks: [] }], settings: {} },
          currentPlayer: { id: 'me', tasks: [] },
          activeDisputes: [],
        },
      },
    });
    mockClient.mutations.gameAction.mockResolvedValue({ data: { gameId: 'GAME23', revision: 4 } });
    mockClient.subscriptions.onGameUpdated.mockReturnValue({ subscribe: () => ({ unsubscribe: jest.fn() }) });
  });

  it('hands the server this phone once per game', async () => {
    const view = render(<AwsGameProvider><div /></AwsGameProvider>);
    await waitFor(() => expect(mockClient.mutations.gameAction).toHaveBeenCalled());
    const [args] = mockClient.mutations.gameAction.mock.calls[0];
    expect(args.action).toBe('SAVE_PUSH');
    expect(args.gameId).toBe('GAME23');
    expect(JSON.parse(args.payload).subscription.endpoint).toBe('https://fcm.googleapis.com/fcm/send/new');
    await waitFor(() => expect(localStorage.getItem('wgw-push:GAME23:me')).toBe('https://fcm.googleapis.com/fcm/send/new'));

    view.unmount();
    mockClient.mutations.gameAction.mockClear();
    render(<AwsGameProvider><div /></AwsGameProvider>);
    await waitFor(() => expect(mockClient.queries.getGameView).toHaveBeenCalledTimes(2));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mockClient.mutations.gameAction).not.toHaveBeenCalled();
  });
});

describe('service worker push handler', () => {
  function loadWorker(clients: Array<{ visibilityState: string; focused: boolean }>) {
    const listeners: Record<string, (event: unknown) => void> = {};
    const showNotification = jest.fn(async () => undefined);
    const self = {
      addEventListener: (type: string, listener: (event: unknown) => void) => {
        listeners[type] = listener;
      },
      skipWaiting: jest.fn(),
      registration: { showNotification },
      clients: { matchAll: jest.fn(async () => clients), claim: jest.fn(), openWindow: jest.fn() },
      location: { origin: 'https://whogotwho.club' },
    };
    const source = fs.readFileSync(path.join(__dirname, '../../public/sw.js'), 'utf8');
    // eslint-disable-next-line no-new-func
    new Function('self', 'caches', source)(self, {});
    const push = async (data: unknown) => {
      let pending: Promise<unknown> = Promise.resolve();
      listeners.push({ data: { json: () => data, text: () => '' }, waitUntil: (work: Promise<unknown>) => (pending = work) });
      await pending;
    };
    return { push, showNotification };
  }

  it('shows the pushed notification, buzzing only when nobody is looking', async () => {
    const away = loadWorker([]);
    await away.push({ title: 'Gotcha claimed!', body: 'Host says they got you', tag: 'claim-1' });
    expect(away.showNotification).toHaveBeenCalledWith(
      'Gotcha claimed!',
      expect.objectContaining({ body: 'Host says they got you', tag: 'claim-1', silent: false, renotify: false }),
    );

    const looking = loadWorker([{ visibilityState: 'visible', focused: true }]);
    await looking.push({ title: 'Gotcha claimed!', tag: 'claim-1' });
    expect(looking.showNotification).toHaveBeenCalledWith('Gotcha claimed!', expect.objectContaining({ silent: true }));
  });
});
