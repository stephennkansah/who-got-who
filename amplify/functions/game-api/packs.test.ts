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
  // A mission nobody in the group has had beats one that is only new to this player.
  assert.equal(getReplacementTask('remote', [], false, taken, [], [all[50]])?.id, all[5]);
  assert.equal(getReplacementTask('remote', [], false, taken, [all[5]], [all[50]])?.id, all[50], 'but their own repeat comes last');
}

// Two regulars from different parties join four new players: while the pack is
// big enough, nobody is dealt a mission either regular has held.
{
  const played = (games: number) => {
    let mine: string[] = [];
    for (let game = 0; game < games; game += 1) {
      mine = [...mine, ...dealTasks('core', 6, 7, [mine])[0].map((task) => task.id)];
    }
    return mine;
  };
  const sam = played(4);
  const jo = played(4);
  const seen = new Set([...sam, ...jo]);
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const hands = dealTasks('core', 6, 7, [[], sam, [], jo, [], []]);
    assert.deepEqual(hands.flat().filter((task) => seen.has(task.id)), []);
    assert.equal(new Set(hands.flat().map((task) => task.id)).size, 42);
  }
}

console.log('Mission pack checks passed');
