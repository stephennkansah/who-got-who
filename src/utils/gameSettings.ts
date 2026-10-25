import { Game } from '../types';

// Fixed winning score for secret missions, mirrored on the server.
export const WINNING_SCORE = 5;

// Fixed rule, mirrored by CLAIM_RESPONSE_SECONDS on the server.
export const CLAIM_RESPONSE_MINUTES = 5;
export const BRIEFING_OPTIONS = [0, 5, 10, 15, 30];

export function missionsPerPlayer(playerCount: number): number {
  return playerCount >= 7 ? 8 : 7;
}

/** Rules shown in the lobby and in-game help. */
export function lobbySummary(game: Game) {
  const players = game.players.length;
  const isHoliday = game.gameType === 'holiday-challenge';
  return {
    isHoliday,
    missions: missionsPerPlayer(players),
    target: isHoliday
      ? game.settings.holidayChallengeWinCondition ?? 18
      : WINNING_SCORE,
    swaps: game.settings.swapsAllowed ?? 2,
    responseMinutes: CLAIM_RESPONSE_MINUTES,
    briefingMinutes: game.settings.briefingMinutes ?? 0,
    challenges: game.settings.holidayChallengeCount ?? 10,
  };
}
