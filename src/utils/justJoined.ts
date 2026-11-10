// Remembers, for one hop from the home screen to the lobby, that this phone
// has just joined a game — so the lobby can say "You're In!" once.
const KEY = 'wgw-just-joined';

export function markJustJoined(gameId: string): void {
  try {
    sessionStorage.setItem(KEY, gameId);
  } catch {
    // Storage blocked (private mode): the welcome is simply skipped.
  }
}

export function clearJustJoined(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}

/** True once, for the game this phone just joined. */
export function takeJustJoined(gameId: string): boolean {
  try {
    if (sessionStorage.getItem(KEY) !== gameId) return false;
    sessionStorage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}
