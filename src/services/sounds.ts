/**
 * Short sounds for the game's big shared moments: gotchas opening, a win, a
 * claim on you. They are made in code with Web Audio, so there are no audio
 * files to ship.
 *
 * Secret moves (reading missions, swapping, filing a gotcha, calling a bust)
 * stay silent on purpose: a sound there would give you away to the people
 * sitting next to you.
 *
 * Sounds only play while the game is on screen; a locked phone gets the
 * notification sound instead. On iPhone, Web Audio follows the Ring/Silent
 * switch and mixes with music that is already playing. Players can turn sounds
 * off, and the phone remembers it.
 */

export type SoundName = 'go' | 'score' | 'win' | 'gameOver' | 'busted' | 'alert' | 'join';

interface Note {
  /** Seconds after the sound starts. */
  at: number;
  freq: number;
  dur: number;
  wave?: OscillatorType;
  /** 0 to 1, before the master volume. */
  level?: number;
  /** Slide to this pitch by the end of the note. */
  slideTo?: number;
}

interface Sound {
  notes: Note[];
  /** Low-pass cutoff in Hz, to round off bright waves. */
  soften?: number;
}

const STORAGE_KEY = 'wgw-sounds';
/** Peaks land between about 0.2 and 0.55: heard at a dinner table, never harsh. */
const MASTER = 0.6;
/** The same sound twice inside this window plays once (e.g. two claims in one update). */
const REPEAT_MS = 600;
const STALE_MS = 1500;

const G4 = 392.0;
const A4 = 440.0;
const F4 = 349.23;
const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const A5 = 880.0;
const B5 = 987.77;
const C6 = 1046.5;
const E6 = 1318.51;
const G6 = 1567.98;

const bell = (at: number, freq: number, dur: number, level = 0.5): Note[] => [
  { at, freq, dur, wave: 'triangle', level },
  { at, freq: freq * 2, dur: dur * 0.6, wave: 'sine', level: level * 0.25 },
];

const brass = (at: number, freq: number, dur: number, level = 0.4): Note[] => [
  { at, freq, dur, wave: 'sawtooth', level: level * 0.5 },
  { at, freq, dur, wave: 'triangle', level },
];

export const SOUNDS: Record<SoundName, Sound> = {
  // Someone joined your lobby (host only): a soft pop.
  join: { notes: [{ at: 0, freq: 560, slideTo: 1120, dur: 0.12, wave: 'sine', level: 0.6 }] },
  // A gotcha claimed on you, or your vote is needed: a two-note chime.
  alert: { notes: [...bell(0, E5, 0.45), ...bell(0.13, B5, 0.6)] },
  // Points banked: a bright ding-ding.
  score: { notes: [...bell(0, A5, 0.14, 0.45), ...bell(0.09, E6, 0.45, 0.45)] },
  // Gotchas (or challenges) are open: a rising call to go.
  go: {
    soften: 3200,
    notes: [
      ...[C5, E5, G5].flatMap((freq, i) => brass(i * 0.08, freq, 0.14)),
      ...brass(0.24, C6, 0.55),
    ],
  },
  // You won or made the podium: a short fanfare.
  win: {
    soften: 2600,
    notes: [
      ...[G4, C5, E5, G5].flatMap((freq, i) => brass(i * 0.11, freq, 0.13, 0.35)),
      ...[C5, E5, G5, C6].flatMap((freq) => brass(0.46, freq, 1.1, 0.22)),
      ...bell(0.5, G6, 0.7, 0.12),
    ],
  },
  // The game ended and someone else won: a friendly "that's a wrap".
  gameOver: {
    notes: [
      ...bell(0, G5, 0.3, 0.4),
      ...bell(0.16, E5, 0.3, 0.4),
      ...bell(0.32, C5, 0.9, 0.45),
      { at: 0.32, freq: G4, dur: 0.9, wave: 'sine', level: 0.2 },
    ],
  },
  // Someone says they caught you mid-mission: a cartoon "uh-oh".
  busted: {
    soften: 1500,
    notes: [
      { at: 0, freq: A4, dur: 0.17, wave: 'square', level: 0.3 },
      { at: 0.2, freq: F4, slideTo: 300, dur: 0.42, wave: 'square', level: 0.3 },
    ],
  },
};

function readSetting(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

let enabled = readSetting();
const listeners = new Set<() => void>();
let context: AudioContext | null = null;
let listening = false;
let restTimer: ReturnType<typeof setTimeout> | undefined;
/** When the last scheduled sound has finished (ms since epoch). */
let quietAt = 0;
const lastPlayed = new Map<SoundName, number>();

export function soundsOn(): boolean {
  return enabled;
}

export function setSoundsOn(on: boolean): void {
  enabled = on;
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    // Private browsing: the choice lasts until the page closes.
  }
  if (!on) restNow();
  listeners.forEach((listener) => listener());
}

/** For useSyncExternalStore: re-render when sounds are turned on or off. */
export function subscribeToSounds(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function audioContext(): AudioContext | null {
  if (context) return context;
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext
    || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    context = new Ctor();
  } catch {
    return null;
  }
  return context;
}

/** Close the audio output between sounds, so a game left open all evening doesn't drain the battery. */
function restNow(): void {
  if (restTimer) clearTimeout(restTimer);
  restTimer = undefined;
  if (context?.state === 'running') void context.suspend().catch(() => undefined);
}

function restWhenQuiet(): void {
  if (restTimer) clearTimeout(restTimer);
  restTimer = setTimeout(() => {
    restTimer = undefined;
    if (Date.now() >= quietAt) restNow();
    else restWhenQuiet();
  }, Math.max(0, quietAt - Date.now()));
}

const UNLOCK_EVENTS = ['pointerdown', 'touchend', 'click', 'keydown'];

/**
 * Phones only let a page make sound after a tap. The first tap anywhere in
 * the app opens the audio, so a claim that arrives later can still chime.
 */
function unlock(): void {
  if (!enabled) return;
  const ctx = audioContext();
  if (!ctx) return;
  try {
    // Older iPhones only open Web Audio once a sound starts inside a tap.
    const blank = ctx.createBufferSource();
    blank.buffer = ctx.createBuffer(1, 1, 22050);
    blank.connect(ctx.destination);
    blank.start(0);
  } catch {
    // Not needed on newer browsers.
  }
  ctx.resume().then(() => {
    stopListening();
    restWhenQuiet();
  }, () => undefined);
}

function listenForUnlock(): void {
  if (listening || typeof document === 'undefined') return;
  listening = true;
  UNLOCK_EVENTS.forEach((type) => document.addEventListener(type, unlock, { capture: true, passive: true }));
}

function stopListening(): void {
  if (!listening) return;
  listening = false;
  UNLOCK_EVENTS.forEach((type) => document.removeEventListener(type, unlock, { capture: true }));
}

/** Call once at start-up. */
export function installSounds(): void {
  listenForUnlock();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') restNow();
  });
}

/** Schedules a sound on any audio context. Returns its length in seconds. */
export function scheduleSound(ctx: BaseAudioContext, destination: AudioNode, name: SoundName, start: number): number {
  const sound = SOUNDS[name];
  const out = ctx.createGain();
  out.gain.value = MASTER;
  out.connect(destination);
  let input: AudioNode = out;
  if (sound.soften) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = sound.soften;
    filter.connect(out);
    input = filter;
  }
  let end = 0;
  for (const note of sound.notes) {
    const t = start + note.at;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = note.wave || 'sine';
    osc.frequency.setValueAtTime(note.freq, t);
    if (note.slideTo) osc.frequency.exponentialRampToValueAtTime(note.slideTo, t + note.dur);
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(note.level ?? 0.5, t + Math.min(0.03, note.dur * 0.15));
    env.gain.exponentialRampToValueAtTime(0.0001, t + note.dur);
    osc.connect(env);
    env.connect(input);
    osc.start(t);
    osc.stop(t + note.dur + 0.05);
    end = Math.max(end, note.at + note.dur);
  }
  return end;
}

/** Plays a sound if sounds are on and the game is on screen. Never throws. */
export function playSound(name: SoundName): void {
  if (!enabled || typeof document === 'undefined' || document.visibilityState === 'hidden') return;
  const now = Date.now();
  const last = lastPlayed.get(name);
  if (last !== undefined && now - last < REPEAT_MS) return;
  lastPlayed.set(name, now);
  const ctx = audioContext();
  if (!ctx) return;
  const play = () => {
    // A sound that waited too long for the audio to open would arrive out of
    // the blue (e.g. on a later tap): drop it.
    if (!enabled || Date.now() - now > STALE_MS) return;
    try {
      const length = scheduleSound(ctx, ctx.destination, name, ctx.currentTime + 0.02);
      quietAt = Math.max(quietAt, Date.now() + (length + 0.4) * 1000);
      restWhenQuiet();
    } catch {
      // A sound is never worth an error.
    }
  };
  if (ctx.state === 'running') {
    play();
    return;
  }
  // If no tap has opened the audio yet, this sound is lost; the next tap opens it.
  ctx.resume().then(play, () => listenForUnlock());
}
