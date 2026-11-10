export {};

type Sounds = typeof import('./sounds');

class FakeParam {
  value = 0;
  setValueAtTime = jest.fn();
  linearRampToValueAtTime = jest.fn();
  exponentialRampToValueAtTime = jest.fn();
}

class FakeContext {
  static instances: FakeContext[] = [];
  /** When set, resume() waits until release() is called. */
  static stall = false;
  static release: () => void = () => undefined;
  state: 'suspended' | 'running' | 'closed' = 'suspended';
  currentTime = 0;
  destination = {};
  oscillators: { type: string; frequency: FakeParam; start: jest.Mock; stop: jest.Mock }[] = [];
  resume = jest.fn((): Promise<void> => {
    if (!FakeContext.stall) {
      this.state = 'running';
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      FakeContext.release = () => {
        this.state = 'running';
        resolve();
      };
    });
  });
  suspend = jest.fn(async () => {
    this.state = 'suspended';
  });

  constructor() {
    FakeContext.instances.push(this);
  }

  createOscillator() {
    const osc = { type: 'sine', frequency: new FakeParam(), connect: jest.fn(), start: jest.fn(), stop: jest.fn() };
    this.oscillators.push(osc);
    return osc;
  }

  createGain() {
    return { gain: new FakeParam(), connect: jest.fn() };
  }

  createBiquadFilter() {
    return { type: '', frequency: new FakeParam(), connect: jest.fn() };
  }

  createBuffer() {
    return {};
  }

  createBufferSource() {
    return { buffer: null, connect: jest.fn(), start: jest.fn() };
  }
}

let visibility: DocumentVisibilityState = 'visible';
Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function load(): Sounds {
  let sounds!: Sounds;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    sounds = require('./sounds');
  });
  return sounds;
}

beforeEach(() => {
  localStorage.clear();
  visibility = 'visible';
  FakeContext.instances = [];
  FakeContext.stall = false;
  (window as unknown as { AudioContext?: unknown }).AudioContext = FakeContext;
  // A frozen clock: a slow test machine must not trip the late-sound or repeat timers.
  jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(() => {
  delete (window as unknown as { AudioContext?: unknown }).AudioContext;
});

test('plays a sound once the audio has opened', async () => {
  const sounds = load();
  sounds.playSound('win');
  await flush();
  const ctx = FakeContext.instances[0];
  expect(ctx.resume).toHaveBeenCalled();
  expect(ctx.oscillators.length).toBe(sounds.SOUNDS.win.notes.length);
  expect(ctx.oscillators.every((osc) => osc.start.mock.calls.length === 1)).toBe(true);
});

test('sounds are on by default and turning them off is remembered on this phone', async () => {
  const sounds = load();
  expect(sounds.soundsOn()).toBe(true);
  sounds.setSoundsOn(false);
  expect(localStorage.getItem('wgw-sounds')).toBe('off');

  const later = load();
  expect(later.soundsOn()).toBe(false);
  later.playSound('alert');
  await flush();
  expect(FakeContext.instances).toHaveLength(0);
});

test('stays silent while the game is off screen', async () => {
  const sounds = load();
  visibility = 'hidden';
  sounds.playSound('alert');
  await flush();
  expect(FakeContext.instances).toHaveLength(0);
});

test('two of the same sound in one update play once', async () => {
  const sounds = load();
  sounds.playSound('alert');
  sounds.playSound('alert');
  await flush();
  expect(FakeContext.instances[0].oscillators.length).toBe(sounds.SOUNDS.alert.notes.length);
});

test('a sound that could not start in time is dropped, not played late', async () => {
  FakeContext.stall = true;
  const sounds = load();
  sounds.playSound('busted');
  jest.spyOn(Date, 'now').mockReturnValue(1_005_000);
  FakeContext.release();
  await flush();
  expect(FakeContext.instances[0].oscillators).toHaveLength(0);
});

test('the speaker is switched off after the sound ends', async () => {
  jest.useFakeTimers();
  const sounds = load();
  sounds.playSound('join');
  await Promise.resolve();
  await Promise.resolve();
  const ctx = FakeContext.instances[0];
  expect(ctx.state).toBe('running');
  jest.advanceTimersByTime(2000);
  expect(ctx.suspend).toHaveBeenCalled();
  jest.useRealTimers();
});

test('does nothing where Web Audio is missing', () => {
  delete (window as unknown as { AudioContext?: unknown }).AudioContext;
  const sounds = load();
  expect(() => sounds.playSound('go')).not.toThrow();
});
