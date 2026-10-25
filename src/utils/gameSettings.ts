import { Game, GameLength } from '../types';

// Mirrors GAME_LENGTH_TARGETS on the server: [groups under 7, groups of 7 or more].
const LENGTH_TARGETS: Record<GameLength, [number, number]> = {
  quick: [3, 4],
  standard: [4, 5],
  long: [8, 10],
  weekend: [12, 15],
};

export const GAME_LENGTH_OPTIONS: Array<{ id: GameLength; label: string }> = [
  { id: 'quick', label: 'Quick' },
  { id: 'standard', label: 'Party' },
  { id: 'long', label: 'Long' },
  { id: 'weekend', label: 'Weekend' },
];

export const RESPONSE_OPTIONS = [2, 10, 30];
export const BRIEFING_OPTIONS = [0, 5, 10, 15, 30];

export function targetScoreFor(length: GameLength | undefined, playerCount: number): number {
  const [small, large] = LENGTH_TARGETS[length ?? 'standard'];
  return playerCount >= 7 ? large : small;
}

export function missionsPerPlayer(playerCount: number): number {
  return playerCount >= 7 ? 8 : 7;
}

/** The numbers a lobby shows before the game starts. */
export function lobbySummary(game: Game) {
  const players = game.players.length;
  const isHoliday = game.gameType === 'holiday-challenge';
  return {
    isHoliday,
    missions: missionsPerPlayer(players),
    target: isHoliday
      ? game.settings.holidayChallengeWinCondition ?? 18
      : targetScoreFor(game.settings.gameLength, players),
    swaps: game.settings.swapsAllowed ?? 2,
    responseMinutes: Math.round((game.settings.disputeTimeoutSeconds ?? 120) / 60),
    briefingMinutes: game.settings.briefingMinutes ?? 0,
    challenges: game.settings.holidayChallengeCount ?? 10,
    length: game.settings.gameLength ?? 'standard',
  };
}
