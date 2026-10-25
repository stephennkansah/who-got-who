import type { StoredGame } from './domain';

/**
 * Anonymous play statistics. Each action is turned into counter increments by
 * comparing the game before and after it — no names, mission text, photos or
 * device ids are stored, only counts per day and per mission/challenge id.
 */

export type StatIncrement = { key: string; counts: Record<string, number> };

export function dayKey(now: Date): string {
  return `day#${now.toISOString().slice(0, 10)}`;
}

class Tally {
  private items = new Map<string, Record<string, number>>();

  add(key: string, field: string, by = 1) {
    if (!by) return;
    const counts = this.items.get(key) ?? {};
    counts[field] = (counts[field] ?? 0) + by;
    this.items.set(key, counts);
  }

  list(): StatIncrement[] {
    return Array.from(this.items, ([key, counts]) => ({ key, counts }));
  }
}

function minutesBetween(start?: string, end?: string): number {
  if (!start || !end) return 0;
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
}

export function statsForChange(before: StoredGame | null, after: StoredGame, now: Date): StatIncrement[] {
  const tally = new Tally();
  const day = dayKey(now);

  if (!before) {
    tally.add(day, 'gamesCreated');
    return tally.list();
  }

  // Lobby → live
  if (before.status === 'draft' && after.status === 'live') {
    const players = after.players.length;
    tally.add(day, 'gamesStarted');
    tally.add(day, 'playersAtStart', players);
    if (players >= 7) tally.add(day, 'bigGamesStarted');
    tally.add(day, `pack_${after.settings.selectedPack ?? 'unknown'}`);
    if (after.gameType !== 'holiday-challenge') {
      tally.add(day, `length_${after.settings.gameLength ?? 'standard'}`);
      for (const player of after.players) {
        for (const task of player.tasks) tally.add(`mission#${task.templateId}`, 'dealt');
      }
    } else {
      for (const challenge of after.selectedChallenges) tally.add(`challenge#${challenge.id}`, 'dealt');
    }
    if ((after.settings.briefingMinutes ?? 0) > 0) tally.add(day, 'startedWithBriefing');
  }

  // → ended
  if (before.status !== 'ended' && after.status === 'ended' && before.status === 'live') {
    const holiday = after.gameType === 'holiday-challenge';
    const target = holiday ? after.settings.holidayChallengeWinCondition ?? 18 : after.settings.targetScore;
    const best = Math.max(0, ...after.players.map((player) => (holiday ? player.challengeScore ?? 0 : player.score)));
    tally.add(day, best >= target ? 'gamesWon' : 'gamesEndedByHost');
    tally.add(day, 'minutesPlayed', minutesBetween(after.startedAt, after.endedAt));
  }

  // People arriving and leaving
  const beforeIds = new Set(before.players.map((player) => player.id));
  const afterIds = new Set(after.players.map((player) => player.id));
  const joined = after.players.filter((player) => !beforeIds.has(player.id)).length;
  const left = before.players.filter((player) => !afterIds.has(player.id)).length;
  if (joined) tally.add(day, before.status === 'live' ? 'lateJoins' : 'joins', joined);
  if (left && before.status === 'live') tally.add(day, 'leftMidGame', left);

  if (!before.rematchGameId && after.rematchGameId) tally.add(day, 'rematches');
  if (!before.pausedAt && after.pausedAt) tally.add(day, 'pauses');

  // Missions: claims, catches, swaps
  const previous = new Map(before.players.flatMap((player) => player.tasks.map((task) => [task.id, task])));
  for (const player of after.players) {
    for (const task of player.tasks) {
      const was = previous.get(task.id);
      if (!was) continue;
      const mission = `mission#${task.templateId}`;
      if (was.templateId !== task.templateId) {
        tally.add(`mission#${was.templateId}`, 'swappedAway');
        tally.add(mission, 'dealt');
        tally.add(day, 'swaps');
        continue;
      }
      if (was.status === task.status) continue;
      if (was.status === 'pending' && task.status === 'disputed') tally.add(day, 'gotchasClaimed');
      if (was.status === 'pending' && task.status === 'failed') {
        tally.add(day, 'caughtReports');
        tally.add(mission, 'caught');
      }
      if (was.status === 'disputed' && task.status === 'completed') {
        tally.add(day, 'gotchasConfirmed');
        tally.add(mission, 'completed');
      }
      if (was.status === 'disputed' && task.status === 'failed') {
        tally.add(day, 'gotchasOverturned');
        tally.add(mission, 'overturned');
      }
    }
  }

  const previousPhase = new Map(before.disputes.map((dispute) => [dispute.id, dispute.phase]));
  for (const dispute of after.disputes) {
    if (previousPhase.get(dispute.id) === 'response' && dispute.phase === 'voting') tally.add(day, 'disputes');
  }

  // Holiday challenges
  const seenCompletions = new Set(before.challengeCompletions.map((completion) => completion.id));
  for (const completion of after.challengeCompletions) {
    if (seenCompletions.has(completion.id)) continue;
    tally.add(day, 'challengeClaims');
    tally.add(`challenge#${completion.challengeId}`, completion.type === 'gold' ? 'gold' : 'silver');
    if (completion.proofImageKey) tally.add(day, 'proofPhotos');
  }

  return tally.list();
}
