import { Game } from '../types';
import { formatSeconds, useSecondsLeft } from './useCountdown';

export interface GamePhase {
  /** The host has paused play: no new claims, timers frozen. */
  paused: boolean;
  /** Missions are dealt but gotchas haven't opened yet. */
  briefing: boolean;
  secondsToOpen: number;
  /** Why claims are blocked right now, or null when play is open. */
  lockReason: string | null;
}

export function useGamePhase(game: Game | null): GamePhase {
  const secondsToOpen = useSecondsLeft(game?.claimsOpenAt, game?.pausedAt);
  const paused = game?.status === 'live' && !!game.pausedAt;
  const briefing = game?.status === 'live' && secondsToOpen > 0;
  const what = game?.gameType === 'holiday-challenge' ? 'Challenges' : 'Gotchas';
  const lockReason = paused
    ? 'Game paused'
    : briefing
      ? `${what} open in ${formatSeconds(secondsToOpen)}`
      : null;
  return { paused, briefing, secondsToOpen, lockReason };
}
