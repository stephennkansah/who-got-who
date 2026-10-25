import assert from 'node:assert/strict';
import { applyAction, createGame, GameRuleError, projectGameView, type StoredGame } from './domain';
import { pushMessages } from './push';

let sequence = 0;
const nextRequest = () => `push-request-${++sequence}`;
const phone = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/device-token',
  keys: {
    p256dh: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
    auth: 'BTBZMqHH6r4Tts7J_aSIgg',
  },
};

async function act(
  game: StoredGame,
  name: Parameters<typeof applyAction>[1],
  identity: string,
  payload: Record<string, unknown> = {},
  now = new Date(),
) {
  return (await applyAction(game, name, identity, payload, nextRequest(), now, async () => true)).game;
}

const to = (game: StoredGame, messages: ReturnType<typeof pushMessages>, title: string) =>
  messages
    .filter((message) => message.title === title)
    .map((message) => game.players.find((player) => player.id === message.playerId)?.identityId)
    .sort();

async function run() {
  const people = ['host', 'target', 'voter-one', 'voter-two'];
  let draft = createGame('PSH234', people[0], { name: 'Host' }, nextRequest());
  for (const person of people.slice(1)) draft = await act(draft, 'JOIN', person, { name: person });
  draft = await act(draft, 'SELECT_PACK', 'host', { packId: 'core' });
  draft = await act(draft, 'UPDATE_SETTINGS', 'host', { briefingMinutes: 0 });

  {
    // Each phone stores its own subscription; bad ones are refused; others never see it.
    const saved = await act(draft, 'SAVE_PUSH', 'target', { subscription: phone });
    assert.equal(saved.players[1].push?.endpoint, phone.endpoint);
    assert.equal(saved.revision, draft.revision + 1);
    const again = await applyAction(saved, 'SAVE_PUSH', 'target', { subscription: phone }, nextRequest());
    assert.equal(again.changed, false, 'saving the same phone twice changes nothing');
    await assert.rejects(
      () => act(draft, 'SAVE_PUSH', 'target', { subscription: { ...phone, endpoint: 'https://evil.example.com/x' } }),
      (error: unknown) => error instanceof GameRuleError && /not supported/.test(error.message),
    );
    for (const viewer of ['host', 'target']) {
      const view = await projectGameView(saved, viewer, async (key) => key);
      assert.ok(!JSON.stringify(view.payload).includes('device-token'), `${viewer}'s view holds no push subscription`);
    }
    const cleared = await act(saved, 'SAVE_PUSH', 'target', { subscription: null });
    assert.equal(cleared.players[1].push, undefined);
  }

  const live = await act(draft, 'START', 'host');
  {
    const messages = pushMessages(draft, live);
    assert.deepEqual(to(live, messages, 'The game has started'), ['target', 'voter-one', 'voter-two'], 'everyone but the host who pressed start');
  }

  const [host, target] = live.players;
  const task = host.tasks[0];
  const claimed = await act(live, 'CLAIM_GOTCHA', 'host', { taskId: task.id, targetId: target.id, outcome: 'success' });
  {
    const messages = pushMessages(live, claimed);
    assert.deepEqual(to(claimed, messages, 'Gotcha claimed!'), ['target']);
    assert.match(messages[0].body, /Host says they got you/);
    assert.equal(messages[0].tag, `claim-${claimed.disputes[0].id}`, 'same tag as the in-app notification');
    assert.equal(messages[0].urgency, 'high');
  }

  const disputed = await act(claimed, 'DISPUTE_GOTCHA', 'target', { taskId: task.id });
  {
    const messages = pushMessages(claimed, disputed);
    assert.deepEqual(to(disputed, messages, 'Your vote is needed'), ['voter-one', 'voter-two']);
  }

  let voted = await act(disputed, 'VOTE_DISPUTE', 'voter-one', { disputeId: disputed.disputes[0].id, vote: false });
  assert.equal(pushMessages(disputed, voted).length, 0, 'a vote that settles nothing buzzes nobody');
  const decided = await act(voted, 'VOTE_DISPUTE', 'voter-two', { disputeId: disputed.disputes[0].id, vote: false });
  {
    const messages = pushMessages(voted, decided);
    assert.deepEqual(to(decided, messages, 'Gotcha overturned'), ['host']);
    assert.deepEqual(to(decided, messages, 'The vote is in'), ['target']);
    assert.match(messages.find((message) => message.title === 'The vote is in')!.body, /sided with you/);
  }

  {
    // An accepted claim tells the claimant only.
    const second = decided.players[0].tasks[1];
    const open = await act(decided, 'CLAIM_GOTCHA', 'host', { taskId: second.id, targetId: target.id, outcome: 'success' });
    const accepted = await act(open, 'ACCEPT_GOTCHA', 'target', { taskId: second.id });
    const messages = pushMessages(open, accepted);
    assert.deepEqual(messages.map((message) => message.title), ['Gotcha confirmed']);
    assert.match(messages[0].body, /gotcha on target counts/);
  }

  {
    // A claim settled because the target left reports nothing.
    const third = decided.players[0].tasks[2];
    const open = await act(decided, 'CLAIM_GOTCHA', 'host', { taskId: third.id, targetId: target.id, outcome: 'success' });
    const left = await act(open, 'LEAVE', 'target');
    assert.equal(pushMessages(open, left).length, 0);
  }

  {
    // The end reaches everyone, winner named, and replaces the claim-result buzz.
    const nearly = JSON.parse(JSON.stringify(decided)) as StoredGame;
    nearly.players[0].score = 4;
    const winning = nearly.players[0].tasks[3];
    const open = await act(nearly, 'CLAIM_GOTCHA', 'host', { taskId: winning.id, targetId: nearly.players[2].id, outcome: 'success' });
    const won = await act(open, 'ACCEPT_GOTCHA', 'voter-one', { taskId: winning.id });
    assert.equal(won.status, 'ended');
    const messages = pushMessages(open, won);
    assert.deepEqual(messages.map((message) => message.title), Array(4).fill('Game over'));
    const forHost = messages.find((message) => message.playerId === won.players[0].id)!;
    assert.match(forHost.body, /^You win with 5\.5 points/);
    const forTarget = messages.find((message) => message.playerId === won.players[1].id)!;
    assert.match(forTarget.body, /^Host wins with 5\.5 points/);
    const ended = await act(decided, 'END', 'host');
    assert.match(pushMessages(decided, ended)[0].body, /host ended the game/);
  }

  console.log('Push message checks passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
