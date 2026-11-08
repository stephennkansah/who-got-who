import {
  BUST_RESPONSE_SECONDS,
  CLAIM_RESPONSE_SECONDS,
  ONE_AWAY_SCORE,
  ordinal,
  rankPlayers,
  type StoredGame,
  type StoredPlayer,
} from './domain';

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
  const claimWindow = CLAIM_RESPONSE_SECONDS;
  const placeBefore = new Map(before.players.map((player) => [player.id, player.place]));
  const newlyFinished = after.players.filter((player) => player.place && !placeBefore.get(player.id));

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
    // A claim that earned a podium place gets the "you finished" buzz instead.
    const finishedNow = newlyFinished.some((player) => player.id === dispute.accuserId);
    if (!finishedNow) {
      send(only(dispute.accuserId), {
        title: counted ? 'Gotcha confirmed' : 'Gotcha overturned',
        body: counted ? `Your gotcha on ${target} counts.` : `The group sided with ${target}.`,
        tag,
        ttlSeconds: 60 * 60,
        urgency: 'normal',
      });
    }
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

  // Busts: the player being busted says which mission; the catcher hears how it went.
  const bustsBefore = new Map((before.busts ?? []).map((bust) => [bust.id, bust]));
  for (const bust of after.busts ?? []) {
    const was = bustsBefore.get(bust.id);
    const catcher = nameOf(bust.catcherId);
    const suspect = nameOf(bust.playerId);
    if (!was && bust.result === 'pending') {
      send(only(bust.playerId), {
        title: 'Busted?',
        body: `${catcher} says they caught you trying a mission — open the game to say which one.`,
        tag: `bust-${bust.id}`,
        ttlSeconds: BUST_RESPONSE_SECONDS,
        urgency: 'high',
      });
    }
    if (was?.result === 'pending' && (bust.result === 'confirmed' || bust.result === 'denied')) {
      const mission = after.players
        .find((player) => player.id === bust.playerId)
        ?.tasks.find((task) => task.id === bust.taskInstanceId)?.text;
      send(only(bust.catcherId), {
        title: bust.result === 'confirmed' ? 'Bust confirmed' : 'Bust denied',
        body: bust.result === 'confirmed'
          ? `${suspect} was trying${mission ? `: "${mission}"` : ' a mission'}. Nice catch.`
          : `${suspect} says that wasn't a mission.`,
        tag: `bust-${bust.id}`,
        ttlSeconds: 60 * 60,
        urgency: 'normal',
      });
    }
  }

  // Someone could finish with their next gotcha: everyone else should watch them.
  if (!holiday && after.status === 'live') {
    const scoreBefore = new Map(before.players.map((player) => [player.id, player.score]));
    const finished = after.players.filter((player) => player.place).length;
    const prize = finished === 0 ? 'win' : `take ${ordinal(finished + 1)} place`;
    for (const player of after.players) {
      const was = scoreBefore.get(player.id);
      if (was === undefined || player.place || was >= ONE_AWAY_SCORE || player.score < ONE_AWAY_SCORE) continue;
      send(after.players.filter((other) => other.id !== player.id), {
        title: `${player.name} is close!`,
        body: `${player.name} could ${prize} with their next gotcha — watch them.`,
        tag: `close-${after.gameId}-${player.id}`,
        ttlSeconds: 30 * 60,
        urgency: 'normal',
      });
    }
  }

  // Someone took a podium place and the game goes on for the rest.
  if (!justEnded && after.status === 'live') {
    const places = after.settings.podiumSize ?? 1;
    const finished = after.players.filter((player) => player.place).length;
    const open = Array.from({ length: Math.max(0, places - finished) }, (_, index) => ordinal(finished + 1 + index));
    const onFor = `${open.join(' and ')} place`;
    for (const finisher of newlyFinished) {
      const place = finisher.place ?? 1;
      const tag = `finish-${after.gameId}-${place}`;
      send(only(finisher.id), {
        title: place === 1 ? 'You win!' : `You finished ${ordinal(place)}!`,
        body: `Your missions are done. Stay in to vote on disputes — the game goes on for ${onFor}.`,
        tag,
        ttlSeconds: 60 * 60,
        urgency: 'normal',
      });
      send(after.players.filter((player) => player.id !== finisher.id), {
        title: place === 1 ? `${finisher.name} wins!` : `${finisher.name} finished ${ordinal(place)}`,
        body: `The game goes on for ${onFor} — keep going.`,
        tag,
        ttlSeconds: 60 * 60,
        urgency: 'normal',
      });
    }
  }

  if (justEnded) {
    const goal = holiday ? after.settings.holidayChallengeWinCondition ?? 18 : after.settings.targetScore;
    const ranked = holiday
      ? [...after.players].sort((left, right) => right.score - left.score)
      : rankPlayers(after.players);
    const winner = ranked[0];
    const reached = !!winner && (!!winner.place || winner.score >= goal);
    const podium = ranked.filter((player) => player.place);
    for (const player of after.players) {
      let body = 'The host ended the game — see the results.';
      if (reached && podium.length > 1) {
        body = player.place === 1
          ? 'You won! See the final podium.'
          : player.place
            ? `You finished ${ordinal(player.place)} — ${winner.name} won. See the final podium.`
            : `${podium.map((finisher) => finisher.name).join(', ')} made the podium — see the results.`;
      } else if (reached) {
        body = `${winner.id === player.id ? 'You win' : `${winner.name} wins`} with ${winner.score} points — see the results.`;
      }
      messages.push({
        playerId: player.id,
        title: 'Game over',
        body,
        tag: `game-over-${after.gameId}`,
        ttlSeconds: 24 * 60 * 60,
        urgency: 'normal',
      });
    }
  }

  return messages;
}
