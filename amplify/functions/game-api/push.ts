import type { StoredGame, StoredPlayer } from './domain';

export type PushMessage = {
  playerId: string;
  title: string;
  body: string;
  /** Same tag as the in-app notification, so a phone shows one entry per event. */
  tag: string;
  ttlSeconds: number;
  urgency: 'normal' | 'high';
};

type Draft = Omit<PushMessage, 'playerId'>;

/**
 * What each player should be buzzed about after one change to the game:
 * a claim on them, a vote that needs them, their claim being decided, the start and the end.
 * Pushes reach phones that are locked or have the game in the background.
 */
export function pushMessages(before: StoredGame, after: StoredGame): PushMessage[] {
  const messages: PushMessage[] = [];
  const nameOf = (id: string) =>
    (after.players.find((player) => player.id === id) || before.players.find((player) => player.id === id))
      ?.name || 'Someone';
  const send = (players: StoredPlayer[], draft: Draft) =>
    players.forEach((player) => messages.push({ playerId: player.id, ...draft }));
  const only = (id: string) => after.players.filter((player) => player.id === id);
  const holiday = after.gameType === 'holiday-challenge';
  const justEnded = before.status === 'live' && after.status === 'ended';
  const claimWindow = Math.max(60, after.settings.disputeTimeoutSeconds);

  if (before.status === 'draft' && after.status === 'live') {
    send(after.players.filter((player) => player.id !== after.hostId), {
      title: 'The game has started',
      body: holiday
        ? 'Your challenges are in — open the game to see them.'
        : 'Your missions are in — open the game to read them.',
      tag: `game-started-${after.gameId}`,
      ttlSeconds: 60 * 60,
      urgency: 'high',
    });
  }

  const earlier = new Map(before.disputes.map((dispute) => [dispute.id, dispute]));
  for (const dispute of after.disputes) {
    const was = earlier.get(dispute.id);
    const accuser = nameOf(dispute.accuserId);
    const target = nameOf(dispute.targetId);

    if (!was && dispute.result === 'pending' && dispute.phase === 'response') {
      send(only(dispute.targetId), {
        title: 'Gotcha claimed!',
        body: `${accuser} says they got you — open the game to accept or dispute.`,
        tag: `claim-${dispute.id}`,
        ttlSeconds: claimWindow,
        urgency: 'high',
      });
    }

    if (was?.phase === 'response' && dispute.phase === 'voting' && dispute.result === 'pending') {
      send(
        after.players.filter((player) => player.id !== dispute.accuserId && player.id !== dispute.targetId),
        {
          title: 'Your vote is needed',
          body: `${target} disputes ${accuser}'s gotcha — open the game to vote.`,
          tag: `vote-${dispute.id}`,
          ttlSeconds: claimWindow,
          urgency: 'high',
        },
      );
    }

    // The game-over buzz already covers a claim that won the game.
    if (was?.result !== 'pending' || dispute.result === 'pending' || justEnded) continue;
    const task = after.players
      .find((player) => player.id === dispute.accuserId)
      ?.tasks.find((candidate) => candidate.id === dispute.taskInstanceId);
    // A claim settled because someone left resets to pending: nothing to report.
    if (task?.status !== 'completed' && task?.status !== 'failed') continue;
    const counted = task.status === 'completed';
    const tag = `result-${dispute.id}`;
    send(only(dispute.accuserId), {
      title: counted ? 'Gotcha confirmed' : 'Gotcha overturned',
      body: counted ? `Your gotcha on ${target} counts.` : `The group sided with ${target}.`,
      tag,
      ttlSeconds: 60 * 60,
      urgency: 'normal',
    });
    if (was.phase === 'voting') {
      send(only(dispute.targetId), {
        title: 'The vote is in',
        body: counted ? `The group backed ${accuser}'s gotcha on you.` : `The group sided with you against ${accuser}.`,
        tag,
        ttlSeconds: 60 * 60,
        urgency: 'normal',
      });
    }
  }

  if (justEnded) {
    const goal = holiday ? after.settings.holidayChallengeWinCondition ?? 18 : after.settings.targetScore;
    const winner = [...after.players].sort((left, right) => right.score - left.score)[0];
    const reached = !!winner && winner.score >= goal;
    for (const player of after.players) {
      messages.push({
        playerId: player.id,
        title: 'Game over',
        body: reached
          ? `${winner.id === player.id ? 'You win' : `${winner.name} wins`} with ${winner.score} points — see the results.`
          : 'The host ended the game — see the results.',
        tag: `game-over-${after.gameId}`,
        ttlSeconds: 24 * 60 * 60,
        urgency: 'normal',
      });
    }
  }

  return messages;
}
