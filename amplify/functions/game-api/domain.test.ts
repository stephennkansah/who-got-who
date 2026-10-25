import assert from 'node:assert/strict';
import {
  applyAction,
  createGame,
  GameRuleError,
  projectGameView,
  type StoredGame,
} from './domain';
import { isBonusTask } from './packs';

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

  // No task may repeat across players, even after everyone uses every swap.
  // Swaps shrink as the group grows so they can never run out.
  for (const [packId, playerCount, swaps, isFull] of [
    ['core', 6, 2, false],
    ['core', 15, 2, false],
    ['core', 16, 1, false],
    ['core', 18, 0, true],
    ['remote', 10, 2, false],
    ['remote', 12, 1, false],
    ['remote', 13, 0, true],
  ] as const) {
    const label = `${packId} with ${playerCount} players`;
    const identities = Array.from({ length: playerCount }, (_, index) => `${label}-${index}`);
    let game = createGame('BIG234', identities[0], playerPayload('Host'), nextRequest());
    game = await action(game, 'SELECT_PACK', identities[0], { packId });
    for (let index = 1; index < identities.length; index += 1) {
      game = await action(game, 'JOIN', identities[index], playerPayload(`Player ${index + 1}`));
    }
    if (isFull) {
      await assert.rejects(
        () => action(game, 'JOIN', `${label}-overflow`, playerPayload('Overflow')),
        (error: unknown) => error instanceof GameRuleError && /full/.test(error.message),
      );
    }
    assert.equal(game.settings.swapsAllowed, swaps, label);
    game = await action(game, 'START', identities[0]);

    const bonusCounts = game.players.map(
      (player) =>
        player.tasks.filter((task) =>
          isBonusTask(packId, { id: task.templateId, text: task.text }),
        ).length,
    );
    assert.ok(bonusCounts.every((count) => count <= 1), label);
    assert.equal(
      bonusCounts.reduce((sum, count) => sum + count, 0),
      packId === 'core' ? Math.min(playerCount, 15) : 0,
      label,
    );

    for (const [index, identity] of identities.entries()) {
      assert.equal(game.players[index].swapsLeft, swaps, label);
      for (let swap = 0; swap < swaps; swap += 1) {
        game = await action(game, 'SWAP_TASK', identity, {
          taskId: game.players[index].tasks[swap].id,
        });
      }
    }
    if (swaps === 0) {
      await assert.rejects(
        () => action(game, 'SWAP_TASK', identities[0], { taskId: game.players[0].tasks[0].id }),
        (error: unknown) => error instanceof GameRuleError && /No swaps/.test(error.message),
      );
    }
    const templateIds = game.players.flatMap((player) =>
      player.tasks.map((task) => task.templateId),
    );
    assert.equal(templateIds.length, playerCount * (playerCount >= 7 ? 8 : 7), label);
    assert.equal(new Set(templateIds).size, templateIds.length, `${label}: a task repeated`);
  }

  {
    // A group that is too big for a pack cannot pick it.
    let game = createGame('REM234', 'remote-0', playerPayload('Host'), nextRequest());
    for (let index = 1; index < 14; index += 1) {
      game = await action(game, 'JOIN', `remote-${index}`, playerPayload(`Remote ${index}`));
    }
    await assert.rejects(
      () => action(game, 'SELECT_PACK', 'remote-0', { packId: 'remote' }),
      (error: unknown) => error instanceof GameRuleError && /up to 13 players/.test(error.message),
    );
  }

  console.log('AWS game domain checks passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
