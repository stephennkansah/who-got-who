import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Haptics } from '@capacitor/haptics';
import { invitePath, publicGameOrigin, shareInvite, buzz, isShareCancelled } from './appPlatform';

jest.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: jest.fn() } }));
jest.mock('@capacitor/share', () => ({ Share: { share: jest.fn() } }));
jest.mock('@capacitor/haptics', () => ({ Haptics: { impact: jest.fn() }, ImpactStyle: { Medium: 'MEDIUM' } }));
jest.mock('@capacitor/camera', () => ({ Camera: {}, CameraResultType: {}, CameraSource: {}, CameraDirection: {} }));
jest.mock('@capacitor/filesystem', () => ({ Filesystem: {}, Directory: {} }));

const native = Capacitor.isNativePlatform as jest.Mock;
beforeEach(() => {
  jest.clearAllMocks();
  native.mockReturnValue(false);
  Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
});

test('native invites use the public site instead of the WebView origin', () => {
  expect(publicGameOrigin()).toBe(window.location.origin);
  native.mockReturnValue(true);
  expect(publicGameOrigin()).toBe('https://whogotwho.club');
});

test('accepts trusted invitations and preserves the holiday mode', () => {
  expect(invitePath('https://whogotwho.club/?join=ABCD12')).toBe('/?join=ABCD12');
  expect(invitePath('https://whogotwho.club/?join=ABCD12&type=you-got-who')).toBe('/?join=ABCD12&type=you-got-who');
  expect(invitePath('whogotwho://join?join=ABCD12')).toBe('/?join=ABCD12');
});

test.each([
  'https://example.com/?join=ABCD12',
  'http://whogotwho.club/?join=ABCD12',
  'https://whogotwho.club.evil.test/?join=ABCD12',
  'https://whogotwho.club/privacy.html?join=ABCD12',
  'https://whogotwho.club/?join=%3Cscript%3E',
  'whogotwho://other?join=ABCD12',
  'not a url',
])('does not navigate for an untrusted or malformed invitation: %s', url => {
  expect(invitePath(url)).toBeNull();
});

test('uses native sharing, and retains browser fallback when sharing is unavailable', async () => {
  const data = { title: 'Join', text: 'Game', url: 'https://whogotwho.club/?join=ABCD12' };
  expect(await shareInvite(data)).toBe(false);
  native.mockReturnValue(true);
  (Share.share as jest.Mock).mockResolvedValue({});
  expect(await shareInvite(data)).toBe(true);
  expect(Share.share).toHaveBeenCalledWith(data);
});

test('a cancelled share remains distinguishable from a real failure', () => {
  expect(isShareCancelled(new DOMException('Cancelled', 'AbortError'))).toBe(true);
  expect(isShareCancelled(new Error('User cancelled sharing'))).toBe(true);
  expect(isShareCancelled(new Error('Network unavailable'))).toBe(false);
});

test('native buzz uses haptics without requiring navigator.vibrate', () => {
  native.mockReturnValue(true);
  (Haptics.impact as jest.Mock).mockResolvedValue(undefined);
  buzz([120, 60, 120]);
  expect(Haptics.impact).toHaveBeenCalledWith({ style: 'MEDIUM' });
});
