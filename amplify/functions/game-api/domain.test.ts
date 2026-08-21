import assert from 'node:assert/strict';
import {
  applyAction,
  createGame,
  GameRuleError,
  projectGameView,
  type StoredGame,
} from './domain';

let sequence = 0;
const nextRequest = () => `request-${++sequence}`;
const playerPayload = (name: string) => ({ name, avatar: '🎮', avatarType: 'emoji' });

async function action(
  game: StoredGame,
  name: Parameters<typeof applyAction>[1],
  identity: string,
  payload: Record<string, unknown> = {},
) {
  return (
    await applyAction(game, name, identity, payload, nextRequest(), new Date(), async () => true)
  ).game;
}

async function liveGame(identities = ['device-host', 'device-guest', 'device-voter']) {
  let game = createGame('ABC234', identities[0], playerPayload('Host'), nextRequest());
  for (let index = 1; index < identities.length; index += 1) {
    game = await action(game, 'JOIN', identities[index], playerPayload(`Player ${index + 1}`));
  }
  game = await action(game, 'SELECT_PACK', identities[0], { packId: 'core' });
  return action(game, 'START', identities[0]);
}

async function run() {
  assert.throws(
    () =>
      createGame(
        'AVT234',
        'avatar-owner',
        {
          name: 'Avatar Owner',
          avatarType: 'photo',
          avatar: 'avatars/someone-else/photo.jpg',
        },
        nextRequest(),
      ),
    (error: unknown) =>
      error instanceof GameRuleError && /uploaded correctly/.test(error.message),
  );

  {
    const game = await liveGame();
    const view = await projectGameView(game, 'device-guest', async (key) => key);
    const payload = view.payload as { game: StoredGame; currentPlayer: { id: string } };
    const currentId = payload.currentPlayer.id;
    assert.equal(payload.game.players.find((player) => player.id === currentId)?.tasks.length, 7);
    assert.equal(
      payload.game.players.find((player) => player.id !== currentId)?.tasks.length,
      0,
      'another player must not receive pending secret tasks',
    );
  }

  {
    let game = await liveGame();
    const host = game.players[0];
    const target = game.players[1];
    const task = host.tasks[0];
    game = await action(game, 'CLAIM_GOTCHA', 'device-host', {
      taskId: task.id,
      targetId: target.id,
      outcome: 'success',
    });
    assert.equal(game.players[0].score, 0, 'a pending claim must not score immediately');
    assert.equal(game.players[0].tasks[0].status, 'disputed');
    game = await action(game, 'DISPUTE_GOTCHA', 'device-guest', {
      taskId: task.id,
      reason: 'Caught before Gotcha',
    });
    const dispute = game.disputes[0];
    game = await action(game, 'VOTE_DISPUTE', 'device-voter', {
      disputeId: dispute.id,
      vote: false,
    });
    assert.equal(game.disputes[0].result, 'overturned');
    assert.equal(game.players[0].tasks[0].status, 'failed');
    assert.equal(game.players[0].score, 0);
  }

  {
    let game = await liveGame(['accept-host', 'accept-target']);
    const host = game.players[0];
    const target = game.players[1];
    game = await action(game, 'CLAIM_GOTCHA', 'accept-host', {
      taskId: host.tasks[0].id,
      targetId: target.id,
      outcome: 'success',
    });
    game = await action(game, 'ACCEPT_GOTCHA', 'accept-target', {
      taskId: host.tasks[0].id,
    });
    assert.equal(game.players[0].score, 1.5);
    assert.equal(game.players[0].tasks[0].status, 'completed');
  }

  {
    const identities = ['holiday-host', 'holiday-two', 'holiday-three', 'holiday-four'];
    let game = createGame('HOL234', identities[0], playerPayload('Host'), nextRequest());
    for (let index = 1; index < identities.length; index += 1) {
      game = await action(game, 'JOIN', identities[index], playerPayload(`Holiday ${index}`));
    }
    game = await action(game, 'SELECT_PACK', identities[0], { packId: 'holiday-challenge' });
    game = await action(game, 'START', identities[0]);
    assert.equal(game.selectedChallenges.length, 10);
    const challenge = game.selectedChallenges[0];
    for (let index = 0; index < 3; index += 1) {
      game = await action(game, 'COMPLETE_CHALLENGE', identities[index], {
        challengeId: challenge.id,
        proofImageKey: challenge.requiresProof
          ? `proofs/${identities[index]}/proof.jpg`
          : undefined,
      });
    }
    await assert.rejects(
      () =>
        action(game, 'COMPLETE_CHALLENGE', identities[3], {
          challengeId: challenge.id,
          proofImageKey: challenge.requiresProof
            ? `proofs/${identities[3]}/proof.jpg`
            : undefined,
        }),
      (error: unknown) =>
        error instanceof GameRuleError && /point awards/.test(error.message),
    );
  }

  {
    let game = createGame('HOST23', 'leaving-host', playerPayload('Host'), nextRequest());
    game = await action(game, 'JOIN', 'new-host', playerPayload('Next Host'));
    game = await action(game, 'LEAVE', 'leaving-host');
    assert.equal(game.players.length, 1);
    assert.equal(game.players[0].identityId, 'new-host');
    assert.equal(game.players[0].isHost, true);
    assert.equal(game.hostId, game.players[0].id);
  }

  console.log('AWS game domain checks passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
