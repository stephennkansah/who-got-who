import assert from 'node:assert/strict';
import { dealTasks, EXAMPLE_ONLY_KEYWORDS, gamePacks, getAllHolidayChallenges, getReplacementTask } from './packs';

// The app's example missions are invented; a real mission that matches one
// would be spoiled for whoever gets it.
const texts = [
  ...Object.values(gamePacks).flatMap((pack) => pack.tasks.map((task) => `${task.id}: ${task.text}`)),
  ...getAllHolidayChallenges().map((challenge) => `${challenge.id}: ${challenge.text}`),
];
for (const keyword of EXAMPLE_ONLY_KEYWORDS) {
  const clash = texts.filter((text) => text.toLowerCase().includes(keyword));
  assert.deepEqual(clash, [], `"${keyword}" is an app example and must not be a real mission`);
}

// A full table playing Core twice: nearly every mission is in play both times,
// yet nobody holds one they held before, and no mission is dealt twice.
{
  const ids = (hands: Array<Array<{ id: string }>>) => hands.map((hand) => hand.map((task) => task.id));
  let had: string[][] = [];
  for (let game = 1; game <= 4; game += 1) {
    const hands = ids(dealTasks('core', 18, 8, had));
    assert.equal(new Set(hands.flat()).size, 18 * 8, 'no mission is dealt twice in a game');
    hands.forEach((hand, player) => {
      const repeats = hand.filter((id) => had[player]?.includes(id));
      assert.deepEqual(repeats, [], `game ${game}: player ${player} holds only missions new to them`);
    });
    had = hands.map((hand, player) => [...(had[player] ?? []), ...hand]);
  }
}

// Once someone has had every mission, they get back the one they had longest ago.
{
  const all = gamePacks.remote.tasks.map((task) => task.id);
  const spare = [all[50], all[5]];
  const taken = all.filter((id) => !spare.includes(id));
  assert.equal(getReplacementTask('remote', [], false, taken, all)?.id, all[5]);
  assert.equal(getReplacementTask('remote', [], false, taken, [all[5]])?.id, all[50], 'a mission never had comes first');
}

console.log('Mission pack checks passed');
