import { AwardType, Game, Player } from '../types';

export const AWARDS: Record<AwardType, { name: string; description: string }> = {
  sneakiest: { name: 'Sneakiest', description: 'Most successful Gotchas' },
  social: { name: 'Social Butterfly', description: 'Got the most different people' },
  detective: { name: 'Detective', description: 'Caught the most people in the act' },
  untouchable: { name: 'Untouchable', description: 'Scored without ever getting caught' },
  jester: { name: 'Court Jester', description: 'Most failed attempts' },
};

/** The order awards are handed out in on the results screens. */
const AWARD_ORDER: AwardType[] = ['sneakiest', 'detective', 'social', 'untouchable', 'jester'];

/** Up to two awards per player. Holiday games have none. */
export function awardsByPlayer(game: Game): Map<string, AwardType[]> {
  const result = new Map<string, AwardType[]>();
  if (game.gameType === 'holiday-challenge') return result;
  const all = game.players;
  if (all.length === 0) return result;
  const catches = (player: Player) =>
    all.flatMap((other) => other.tasks).filter((task) => task.status === 'failed' && task.targetId === player.id).length;
  const max = (value: (player: Player) => number) => Math.max(...all.map(value));
  const maxGotchas = max((p) => p.stats?.gothcas || 0);
  const maxTargets = max((p) => p.stats?.uniqueTargets?.length || 0);
  const maxCatches = max(catches);
  const maxFailed = max((p) => p.stats?.failed || 0);

  for (const player of all) {
    const awards: AwardType[] = [];
    const gotchas = player.stats?.gothcas || 0;
    const failed = player.stats?.failed || 0;
    if (gotchas > 0 && gotchas === maxGotchas) awards.push('sneakiest');
    if (maxCatches > 0 && catches(player) === maxCatches) awards.push('detective');
    if (maxTargets > 1 && (player.stats?.uniqueTargets?.length || 0) === maxTargets) awards.push('social');
    if (all.length > 2 && gotchas > 0 && failed === 0) awards.push('untouchable');
    if (maxFailed > 2 && failed === maxFailed) awards.push('jester');
    result.set(player.id, awards.slice(0, 2));
  }
  return result;
}

export interface AwardGiven {
  type: AwardType;
  name: string;
  description: string;
  winners: Player[];
}

/** Each award that somebody won, with everyone who shares it. */
export function awardList(game: Game): AwardGiven[] {
  const byPlayer = awardsByPlayer(game);
  return AWARD_ORDER
    .map((type) => ({
      type,
      ...AWARDS[type],
      winners: game.players.filter((player) => byPlayer.get(player.id)?.includes(type)),
    }))
    .filter((award) => award.winners.length > 0);
}
