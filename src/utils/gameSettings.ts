import { Game, Player } from '../types';

// Fixed winning score for secret missions, mirrored on the server.
export const WINNING_SCORE = 5;

// From here a player's next gotcha (on someone new) can finish them. Mirrors ONE_AWAY_SCORE.
export const ONE_AWAY_SCORE = WINNING_SCORE - 1.5;

/** "win", or "take 2nd place" once someone has finished. */
export function nextPrize(game: Game): string {
  const finished = game.players.filter((player) => player.place).length;
  return finished === 0 ? 'win' : `take ${ordinal(finished + 1)} place`;
}

// Fixed rule, mirrored by CLAIM_RESPONSE_SECONDS on the server.
export const CLAIM_RESPONSE_MINUTES = 5;
export const BRIEFING_OPTIONS = [0, 5, 10, 15, 30];

export function missionsPerPlayer(playerCount: number): number {
  return playerCount >= 7 ? 8 : 7;
}

/**
 * How many players must reach the winning score before this game ends.
 * The server sets it from the group size (PODIUM_TIERS): 1, then 2 from 7 players, 3 from 12.
 */
export function podiumPlaces(game: Game): number {
  if (game.gameType === 'holiday-challenge') return 1;
  return game.settings?.podiumSize ?? 1;
}

export function ordinal(place: number): string {
  const tens = place % 100;
  if (tens >= 11 && tens <= 13) return `${place}th`;
  return `${place}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[place % 10] ?? 'th'}`;
}

/** Podium places nobody has taken yet, e.g. "2nd and 3rd". Empty once the podium is full. */
export function openPlaces(game: Game): string {
  const finished = game.players.filter((player) => player.place).length;
  return Array.from({ length: Math.max(0, podiumPlaces(game) - finished) }, (_, index) =>
    ordinal(finished + 1 + index),
  ).join(' and ');
}

/** "first to 5 points", or "top 2 to reach 5 points" in bigger groups. */
export function winRule(places: number, target: number): string {
  return places > 1 ? `top ${places} to reach ${target} points` : `first to ${target} points`;
}

/**
 * Finishers in the order they finished, then everyone else by score
 * (fewer failed missions breaks a tie). Mirrors rankPlayers on the server.
 */
export function rankPlayers(players: Player[], scoreOf: (player: Player) => number = (player) => player.score): Player[] {
  return [...players].sort((left, right) => {
    if (left.place && right.place) return left.place - right.place;
    if (left.place) return -1;
    if (right.place) return 1;
    const diff = scoreOf(right) - scoreOf(left);
    if (diff !== 0) return diff;
    return (left.stats?.failed || 0) - (right.stats?.failed || 0);
  });
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
    places: podiumPlaces(game),
    swaps: game.settings.swapsAllowed ?? 2,
    responseMinutes: CLAIM_RESPONSE_MINUTES,
    briefingMinutes: game.settings.briefingMinutes ?? 0,
    challenges: game.settings.holidayChallengeCount ?? 10,
  };
}
