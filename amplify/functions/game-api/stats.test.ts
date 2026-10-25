import assert from 'node:assert/strict';
import { applyAction, createGame, type StoredGame } from './domain';
import { statsForChange, type StatIncrement } from './stats';

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
  ({ stats } = await step(game, 'LINK_REMATCH', 'b', { rematchGameId: 'NEW234' }));
  assert.equal(count(stats, day, 'rematches'), 1);

  // Nothing personal is ever recorded
  const keys = stats.map((item) => item.key).join(' ');
  assert.ok(!/A|B|C/.test(keys.replace(/day#|mission#|challenge#/g, '')), 'no names in stat keys');

  console.log('Game stats checks passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
