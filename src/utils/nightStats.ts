import { Game, Player } from '../types';
import { AwardGiven, awardList } from './awards';

export interface NightStats {
  /** A one-line verdict on how your game went, e.g. "Eagle Eyes". */
  title: string;
  /** Four numbers or names that sum it up. */
  tiles: Array<{ value: string; label: string }>;
  awards: AwardGiven[];
}

/** Whoever turns up most often in a list of player ids. */
function mostOften(ids: string[]): { id: string; times: number } | null {
  const counts = new Map<string, number>();
  ids.forEach((id) => counts.set(id, (counts.get(id) || 0) + 1));
  let best: { id: string; times: number } | null = null;
  counts.forEach((times, id) => {
    if (!best || times > best.times) best = { id, times };
  });
  return best;
}

const timesWord = (times: number) => (times === 1 ? 'once' : times === 2 ? 'twice' : `${times} times`);

/** One player's own game, for the "Your Night" screen and its shareable picture. */
export function nightStats(
  game: Game,
  player: Player,
  rank: number,
  nameOf: (id?: string) => string,
  awards: AwardGiven[] = awardList(game),
): NightStats {
  const done = player.tasks.filter((task) => task.status === 'completed');
  const failed = player.tasks.filter((task) => task.status === 'failed');
  const others = game.players.filter((other) => other.id !== player.id).flatMap((other) => other.tasks);
  const caught = others.filter((task) => task.status === 'failed' && task.targetId === player.id).length;
  const favourite = mostOften(done.map((task) => task.targetId).filter((id): id is string => !!id));
  const nemesis = mostOften(
    others.filter((task) => task.status === 'completed' && task.targetId === player.id).map((task) => task.playerId),
  );

  let title = 'Good Game';
  if (rank === 1) title = 'Champion';
  else if (done.length > 0 && failed.length === 0) title = 'Never Caught';
  else if (caught >= 2) title = 'Eagle Eyes';
  else if (done.length >= 3) title = 'Smooth Operator';
  else if (failed.length >= 3) title = 'Loveable Chaos';

  return {
    title,
    tiles: [
      { value: `${done.length}/${player.tasks.length}`, label: 'missions pulled off' },
      favourite
        ? { value: nameOf(favourite.id), label: `favourite target — got them ${timesWord(favourite.times)}` }
        : { value: '—', label: 'no gotchas this time' },
      { value: String(caught), label: caught === 1 ? 'player caught in the act' : 'players caught in the act' },
      nemesis
        ? { value: nameOf(nemesis.id), label: `got me ${timesWord(nemesis.times)}` }
        : { value: 'Nobody', label: 'managed to get me' },
    ],
    awards: awards.filter((award) => award.winners.some((winner) => winner.id === player.id)),
  };
}
