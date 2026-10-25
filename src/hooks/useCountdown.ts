import { useEffect, useState } from 'react';
import { serverNow } from '../utils/serverClock';

type When = Date | string | undefined;

function secondsBetween(deadline: When, from: number): number {
  if (!deadline) return 0;
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - from) / 1000));
}

export function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = String(seconds % 60).padStart(2, '0');
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${secs}` : `${minutes}:${secs}`;
}

/**
 * Seconds left until a deadline on the game server's clock. While `frozenAt`
 * is set (the game is paused) the count holds still at what was left then.
 */
export function useSecondsLeft(deadline: When, frozenAt?: When): number {
  const frozenFrom = frozenAt ? new Date(frozenAt).getTime() : null;
  const [seconds, setSeconds] = useState(() => secondsBetween(deadline, frozenFrom ?? serverNow()));

  useEffect(() => {
    if (frozenFrom !== null) {
      setSeconds(secondsBetween(deadline, frozenFrom));
      return undefined;
    }
    setSeconds(secondsBetween(deadline, serverNow()));
    const interval = window.setInterval(() => setSeconds(secondsBetween(deadline, serverNow())), 1000);
    return () => window.clearInterval(interval);
  }, [deadline, frozenFrom]);

  return seconds;
}

/** Live "m:ss" label counting down to a deadline. */
export function useCountdown(deadline: When, frozenAt?: When): string {
  return formatSeconds(useSecondsLeft(deadline, frozenAt));
}
