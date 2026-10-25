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

async function actionAt(
  now: Date,
  game: StoredGame,
  name: Parameters<typeof applyAction>[1],
  identity: string,
  payload: Record<string, unknown> = {},
) {
  return (await applyAction(game, name, identity, payload, nextRequest(), now, async () => true)).game;
}

async function action(
  game: StoredGame,
  name: Parameters<typeof applyAction>[1],
  identity: string,
  payload: Record<string, unknown> = {},
) {
  return actionAt(new Date(), game, name, identity, payload);
}

async function liveGame(
  identities = ['device-host', 'device-guest', 'device-voter'],
  briefingMinutes = 0,
) {
  let game = createGame('ABC234', identities[0], playerPayload('Host'), nextRequest());
  for (let index = 1; index < identities.length; index += 1) {
    game = await action(game, 'JOIN', identities[index], playerPayload(`Player ${index + 1}`));
  }
  game = await action(game, 'SELECT_PACK', identities[0], { packId: 'core' });
  game = await action(game, 'UPDATE_SETTINGS', identities[0], { briefingMinutes });
  return action(game, 'START', identities[0]);
}

const minutesLater = (minutes: number) => new Date(Date.now() + minutes * 60 * 1000);

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
    game = await action(game, 'UPDATE_SETTINGS', identities[0], { briefingMinutes: 0 });
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

  {
    // The target and the jury see the claimed mission; others' pending missions stay secret.
    let game = await liveGame(['jury-host', 'jury-target', 'jury-voter']);
    const task = game.players[0].tasks[0];
    game = await action(game, 'CLAIM_GOTCHA', 'jury-host', {
      taskId: task.id,
      targetId: game.players[1].id,
      outcome: 'success',
    });
    const view = await projectGameView(game, 'jury-voter', async (key) => key);
    const payload = view.payload as { activeDisputes: Array<{ taskText?: string }> };
    assert.equal(payload.activeDisputes[0].taskText, task.text);
  }

  {
    // Nobody is left to vote in a two-player game, so a dispute cannot open.
    let game = await liveGame(['duo-host', 'duo-target']);
    const task = game.players[0].tasks[0];
    game = await action(game, 'CLAIM_GOTCHA', 'duo-host', {
      taskId: task.id,
      targetId: game.players[1].id,
      outcome: 'success',
    });
    await assert.rejects(
      () => action(game, 'DISPUTE_GOTCHA', 'duo-target', { taskId: task.id }),
      (error: unknown) => error instanceof GameRuleError && /nobody else to vote/.test(error.message),
    );
  }

  {
    // A voter leaving can complete the jury.
    let game = await liveGame(['vote-host', 'vote-target', 'vote-one', 'vote-two']);
    const task = game.players[0].tasks[0];
    game = await action(game, 'CLAIM_GOTCHA', 'vote-host', {
      taskId: task.id,
      targetId: game.players[1].id,
      outcome: 'success',
    });
    game = await action(game, 'DISPUTE_GOTCHA', 'vote-target', { taskId: task.id });
    game = await action(game, 'VOTE_DISPUTE', 'vote-one', {
      disputeId: game.disputes[0].id,
      vote: true,
    });
    assert.equal(game.disputes[0].result, 'pending');
    game = await action(game, 'LEAVE', 'vote-two');
    assert.equal(game.disputes[0].result, 'upheld');
    assert.equal(game.players[0].score, 1.5);
  }

  {
    // Late arrivals get a full hand; the host can remove a player.
    let game = await liveGame(['late-host', 'late-two']);
    assert.ok(game.startedAt, 'start time is recorded');
    game = await action(game, 'JOIN', 'late-three', playerPayload('Latecomer'));
    assert.equal(game.players[2].tasks.length, 7);
    await assert.rejects(
      () => action(game, 'KICK', 'late-two', { playerId: game.players[2].id }),
      (error: unknown) => error instanceof GameRuleError && /Only the host/.test(error.message),
    );
    game = await action(game, 'KICK', 'late-host', { playerId: game.players[2].id });
    assert.equal(game.players.length, 2);
  }

  {
    // Every dossier is revealed once the game ends, and the rematch link is shared.
    let game = await liveGame(['reveal-host', 'reveal-two']);
    await assert.rejects(
      () => action(game, 'LINK_REMATCH', 'reveal-host', { rematchGameId: 'NEW234' }),
      (error: unknown) => error instanceof GameRuleError && /must be ended/.test(error.message),
    );
    game = await action(game, 'END', 'reveal-host');
    assert.ok(game.endedAt, 'end time is recorded');
    game = await action(game, 'LINK_REMATCH', 'reveal-two', { rematchGameId: 'NEW234' });
    game = await action(game, 'LINK_REMATCH', 'reveal-host', { rematchGameId: 'OTH234' });
    assert.equal(game.rematchGameId, 'NEW234', 'the first rematch wins');
    const view = await projectGameView(game, 'reveal-two', async (key) => key);
    const payload = view.payload as {
      game: { rematchGameId?: string; players: Array<{ tasks: unknown[] }> };
    };
    assert.equal(payload.game.players[0].tasks.length, 7);
    assert.equal(payload.game.rematchGameId, 'NEW234');
    await assert.rejects(
      () => action(game, 'JOIN', 'reveal-late', playerPayload('Too Late')),
      (error: unknown) => error instanceof GameRuleError && /already ended/.test(error.message),
    );
  }

  {
    // Missions are dealt at the start, but gotchas wait for the settling-in period.
    let game = await liveGame(['brief-host', 'brief-two'], 10);
    const claim = { taskId: game.players[0].tasks[0].id, targetId: game.players[1].id, outcome: 'success' };
    assert.equal(game.players[1].tasks.length, 7, 'missions are readable during the briefing');
    await assert.rejects(
      () => action(game, 'CLAIM_GOTCHA', 'brief-host', claim),
      (error: unknown) => error instanceof GameRuleError && /open in 10 minutes/.test(error.message),
    );
    const later = await actionAt(minutesLater(11), game, 'CLAIM_GOTCHA', 'brief-host', claim);
    assert.equal(later.players[0].tasks[0].status, 'disputed', 'claims open once the briefing ends');
    await assert.rejects(
      () => action(game, 'OPEN_CLAIMS', 'brief-two'),
      (error: unknown) => error instanceof GameRuleError && /Only the host/.test(error.message),
    );
    game = await action(game, 'OPEN_CLAIMS', 'brief-host');
    game = await action(game, 'CLAIM_GOTCHA', 'brief-host', claim);
    assert.equal(game.players[0].tasks[0].status, 'disputed', 'the host can open play early');
  }

  {
    // Pausing blocks new claims, freezes running timers, and resuming shifts them forward.
    let game = await liveGame(['pause-host', 'pause-two', 'pause-three']);
    const task = game.players[0].tasks[0];
    game = await action(game, 'CLAIM_GOTCHA', 'pause-host', {
      taskId: task.id,
      targetId: game.players[1].id,
      outcome: 'success',
    });
    const closesAt = new Date(game.disputes[0].closesAt).getTime();
    game = await action(game, 'PAUSE', 'pause-host');
    await assert.rejects(
      () => action(game, 'CLAIM_GOTCHA', 'pause-host', {
        taskId: game.players[0].tasks[1].id,
        targetId: game.players[1].id,
        outcome: 'success',
      }),
      (error: unknown) => error instanceof GameRuleError && /paused/.test(error.message),
    );
    await assert.rejects(
      () => action(game, 'DISPUTE_GOTCHA', 'pause-two', { taskId: task.id }),
      (error: unknown) => error instanceof GameRuleError && /on hold/.test(error.message),
    );
    const overnight = await actionAt(minutesLater(8 * 60), game, 'RESOLVE_EXPIRED', 'pause-two');
    assert.equal(overnight.disputes[0].result, 'pending', 'timers do not run out while paused');
    game = await actionAt(minutesLater(60), game, 'RESUME', 'pause-host');
    assert.equal(game.pausedAt, undefined);
    const shifted = new Date(game.disputes[0].closesAt).getTime() - closesAt;
    assert.ok(Math.abs(shifted - 60 * 60 * 1000) < 5000, 'the claim timer is pushed back by the pause');
  }

  {
    // Lobby: ready check, profile edits, and handing the host role over.
    let game = createGame('LOB234', 'lobby-host', playerPayload('Host'), nextRequest());
    game = await action(game, 'JOIN', 'lobby-guest', playerPayload('Guest'));
    game = await action(game, 'SET_READY', 'lobby-guest', { ready: true });
    assert.equal(game.players[1].lockedIn, true);
    game = await action(game, 'UPDATE_NAME', 'lobby-guest', { name: 'Agent G', avatar: '🦊', avatarType: 'emoji' });
    assert.equal(game.players[1].name, 'Agent G');
    assert.equal(game.players[1].avatar, '🦊');
    await assert.rejects(
      () => action(game, 'UPDATE_NAME', 'lobby-guest', {
        name: 'Agent G',
        avatar: 'avatars/someone-else/x.jpg',
        avatarType: 'photo',
      }),
      (error: unknown) => error instanceof GameRuleError && /uploaded correctly/.test(error.message),
    );
    await assert.rejects(
      () => action(game, 'TRANSFER_HOST', 'lobby-guest', { playerId: game.players[0].id }),
      (error: unknown) => error instanceof GameRuleError && /Only the host/.test(error.message),
    );
    // Weekend settings: longer game and a longer window to answer claims.
    await assert.rejects(
      () => action(game, 'UPDATE_SETTINGS', 'lobby-host', { gameLength: 'forever' }),
      (error: unknown) => error instanceof GameRuleError && /game length/.test(error.message),
    );
    game = await action(game, 'UPDATE_SETTINGS', 'lobby-host', { gameLength: 'weekend', responseMinutes: 30 });
    assert.equal(game.settings.gameLength, 'weekend');
    assert.equal(game.settings.disputeTimeoutSeconds, 1800);
    game = await action(game, 'TRANSFER_HOST', 'lobby-host', { playerId: game.players[1].id });
    assert.equal(game.hostId, game.players[1].id);
    assert.equal(game.players[0].isHost, false);
    assert.equal(game.players[1].isHost, true);
    game = await action(game, 'SELECT_PACK', 'lobby-guest', { packId: 'core' });
    game = await action(game, 'START', 'lobby-guest');
    assert.equal(game.settings.targetScore, 12, 'a weekend game plays to 12 points');
  }

  console.log('AWS game domain checks passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
