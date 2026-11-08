import assert from 'node:assert/strict';
import { applyAction, createGame, type StoredGame } from './domain';
import { groupSize, statsForChange, type StatIncrement } from './stats';
import { buildStatsReport } from './statsReport';

let sequence = 0;
const request = () => `stats-${++sequence}`;
const player = (name: string) => ({ name, avatar: '🎮', avatarType: 'emoji' });
const now = new Date('2026-10-25T20:00:00Z');

async function step(game: StoredGame, action: Parameters<typeof applyAction>[1], identity: string, payload = {}) {
  const after = (await applyAction(game, action, identity, payload, request(), now, async () => true)).game;
  return { after, stats: statsForChange(game, after, now) };
}

function count(stats: StatIncrement[], key: string, field: string): number {
  return stats.find((item) => item.key === key)?.counts[field] ?? 0;
}

async function run() {
  const day = 'day#2026-10-25';
  assert.equal(count(statsForChange(null, createGame('STA234', 'a', player('A'), request()), now), day, 'gamesCreated'), 1);

  let game = createGame('STA234', 'a', player('A'), request());
  ({ after: game } = await step(game, 'JOIN', 'b', player('B')));
  ({ after: game } = await step(game, 'JOIN', 'c', player('C')));
  ({ after: game } = await step(game, 'SELECT_PACK', 'a', { packId: 'core' }));
  ({ after: game } = await step(game, 'UPDATE_SETTINGS', 'a', { briefingMinutes: 0 }));
  let stats: StatIncrement[];
  ({ after: game, stats } = await step(game, 'START', 'a'));
  assert.equal(count(stats, day, 'gamesStarted'), 1);
  assert.equal(count(stats, day, 'playersAtStart'), 3);
  assert.equal(count(stats, day, 'pack_core'), 1);
  const firstMission = game.players[0].tasks[0];
  assert.equal(count(stats, `mission#${firstMission.templateId}`, 'dealt'), 1);

  // Swap: the old mission is counted as swapped away, the new one as dealt
  ({ after: game, stats } = await step(game, 'SWAP_TASK', 'a', { taskId: firstMission.id }));
  assert.equal(count(stats, `mission#${firstMission.templateId}`, 'swappedAway'), 1);
  assert.equal(count(stats, day, 'swaps'), 1);

  // Claim, dispute, overturn
  const claimed = game.players[0].tasks[1];
  ({ after: game, stats } = await step(game, 'CLAIM_GOTCHA', 'a', {
    taskId: claimed.id, targetId: game.players[1].id, outcome: 'success',
  }));
  assert.equal(count(stats, day, 'gotchasClaimed'), 1);
  ({ after: game, stats } = await step(game, 'DISPUTE_GOTCHA', 'b', { taskId: claimed.id }));
  assert.equal(count(stats, day, 'disputes'), 1);
  ({ after: game, stats } = await step(game, 'VOTE_DISPUTE', 'c', { disputeId: game.disputes[0].id, vote: false }));
  assert.equal(count(stats, day, 'gotchasOverturned'), 1);
  assert.equal(count(stats, `mission#${claimed.templateId}`, 'overturned'), 1);

  // Ending and the rematch link
  ({ after: game, stats } = await step(game, 'END', 'a'));
  assert.equal(count(stats, day, 'gamesEndedByHost'), 1);
  // Finished games are also counted by group size, so big-group lengths can be checked.
  assert.equal(count(stats, day, 'ended_2to6'), 1);
  assert.equal(count(stats, day, 'minutes_2to6'), 0);
  ({ stats } = await step(game, 'LINK_REMATCH', 'b', { rematchGameId: 'NEW234' }));
  assert.equal(count(stats, day, 'rematches'), 1);

  // Nothing personal is ever recorded
  const keys = stats.map((item) => item.key).join(' ');
  assert.ok(!/A|B|C/.test(keys.replace(/day#|mission#|challenge#/g, '')), 'no names in stat keys');

  {
    // Busts and end-of-game mission ratings are counted, with no names.
    let played = createGame('BUS234', 'a', player('A'), request());
    ({ after: played } = await step(played, 'JOIN', 'b', player('B')));
    ({ after: played } = await step(played, 'SELECT_PACK', 'a', { packId: 'core' }));
    ({ after: played } = await step(played, 'UPDATE_SETTINGS', 'a', { briefingMinutes: 0 }));
    ({ after: played } = await step(played, 'START', 'a'));
    const suspect = played.players[1];
    let counted: StatIncrement[];
    ({ after: played, stats: counted } = await step(played, 'CALL_BUST', 'a', { playerId: suspect.id }));
    assert.equal(count(counted, day, 'bustsCalled'), 1);
    const mission = suspect.tasks[0];
    ({ after: played, stats: counted } = await step(played, 'ANSWER_BUST', 'b', { bustId: played.busts![0].id, taskId: mission.id }));
    assert.equal(count(counted, day, 'bustsConfirmed'), 1);
    assert.equal(count(counted, `mission#${mission.templateId}`, 'caught'), 1);

    ({ after: played } = await step(played, 'END', 'a'));
    const rated = played.players[0].tasks[0];
    ({ after: played, stats: counted } = await step(played, 'RATE_MISSION', 'a', { taskId: rated.id, rating: 'up' }));
    assert.equal(count(counted, `mission#${rated.templateId}`, 'ratedUp'), 1);
    ({ after: played, stats: counted } = await step(played, 'RATE_MISSION', 'a', { taskId: rated.id, rating: 'down' }));
    assert.equal(count(counted, `mission#${rated.templateId}`, 'ratedUp'), -1, 'a changed mind moves the vote');
    assert.equal(count(counted, `mission#${rated.templateId}`, 'ratedDown'), 1);

    const report = buildStatsReport([
      { key: 'mission#core-1', dealt: 10, ratedUp: 4, ratedDown: 0 },
      { key: 'mission#core-2', dealt: 10, ratedUp: 0, ratedDown: 3 },
      { key: 'mission#core-3', dealt: 10, ratedUp: 1, ratedDown: 0 },
    ], 7, now);
    assert.deepEqual(report.missions.mostLiked.map((row) => [row.id, row.rate]), [['core-1', 1]]);
    assert.deepEqual(report.missions.mostDisliked.map((row) => [row.id, row.rate]), [['core-2', 0]]);
  }

  {
    assert.equal(groupSize(7), '7to11');
    assert.equal(groupSize(12), '12plus');
    const report = buildStatsReport([{ key: day, ended_7to11: 2, minutes_7to11: 90 }], 7, now);
    assert.deepEqual(report.bySize, [
      { size: '2–6', games: 0, avgMinutes: null },
      { size: '7–11', games: 2, avgMinutes: 45 },
      { size: '12+', games: 0, avgMinutes: null },
    ]);
  }

  console.log('Game stats checks passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
