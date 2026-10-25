// Phones' clocks drift; countdowns use the game server's clock so everyone
// sees gotchas open (and claim timers run out) at the same moment.
let offsetMs = 0;

export function syncServerClock(serverTime?: string): void {
  if (!serverTime) return;
  const parsed = Date.parse(serverTime);
  if (!Number.isNaN(parsed)) offsetMs = parsed - Date.now();
}

export function serverNow(): number {
  return Date.now() + offsetMs;
}
