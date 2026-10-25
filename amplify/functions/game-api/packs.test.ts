import assert from 'node:assert/strict';
import { EXAMPLE_ONLY_KEYWORDS, gamePacks, getAllHolidayChallenges } from './packs';

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

console.log('Mission pack checks passed');
