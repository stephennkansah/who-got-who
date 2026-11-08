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

const byIdentity = (game: StoredGame, identity: string) =>
  game.players.find((player) => player.identityId === identity)!;

/** Four accepted gotchas on four different players: 6 points, past the winning score. */
async function reachFive(game: StoredGame, identity: string) {
  const targets = game.players.filter((player) => player.identityId !== identity).slice(0, 4);
  for (const target of targets) {
    const taskId = byIdentity(game, identity).tasks.find((task) => task.status === 'pending')!.id;
    game = await action(game, 'CLAIM_GOTCHA', identity, { taskId, targetId: target.id, outcome: 'success' });
    game = await action(game, 'ACCEPT_GOTCHA', target.identityId, { taskId });
  }
  return game;
}

async function run() {
  {
    const game = createGame('NEW234', 'new-host', playerPayload('Host'), nextRequest());
    assert.equal(game.settings.targetScore, 5, 'new lobbies start with a five-point target');
  }

  // Three gotchas cannot win, four spread across players can, and repeat
  // targets need a fifth. Exercise real claims instead of setting scores.
  for (const targets of [[1, 2, 3, 1], [1, 1, 2, 2], [1, 1, 1, 1, 1]]) {
    const identities = Array.from({ length: Math.max(...targets) + 1 }, (_, index) => `score-${index}`);
    let game = await liveGame(identities);
    const handSize = game.players[0].tasks.length;
    for (const [index, targetIndex] of targets.entries()) {
      const taskId = game.players[0].tasks[index].id;
      game = await action(game, 'CLAIM_GOTCHA', identities[0], {
        taskId,
        targetId: game.players[targetIndex].id,
        outcome: 'success',
      });
      assert.equal(game.status, 'live', 'a pending claim cannot win');
      game = await action(game, 'ACCEPT_GOTCHA', identities[targetIndex], { taskId });
      assert.equal(game.status, index === targets.length - 1 ? 'ended' : 'live');
    }
    assert.equal(game.players[0].score, targets.length + new Set(targets).size * 0.5);
    assert.equal(game.players[0].stats.gothcas, targets.length);
    assert.equal(game.players[0].tasks.length, handSize, 'completed missions are not replaced');
    assert.equal(game.players[0].tasks.filter((task) => task.status === 'completed').length, targets.length);
  }

  {
    // Obsolete stored targets cannot change the fixed rule or its display.
    let game = await liveGame();
    game.settings.targetScore = 12;
    const view = await projectGameView(game, 'device-host', async (key) => key);
    assert.equal((view.payload as { game: StoredGame }).game.settings.targetScore, 5);
    game = await action(game, 'PAUSE', 'device-host');
    assert.equal(game.settings.targetScore, 5);
  }

  {
    let game = await liveGame();
    assert.equal(game.settings.disputeTimeoutSeconds, 300);
    // A game saved with an old host-selected window must use the fixed rule too.
    game.settings.disputeTimeoutSeconds = 1800;
    const view = await projectGameView(game, 'device-host', async (key) => key);
    assert.equal((view.payload as { game: StoredGame }).game.settings.disputeTimeoutSeconds, 300);
    const now = new Date();
    const taskId = game.players[0].tasks[0].id;
    game = await actionAt(now, game, 'CLAIM_GOTCHA', 'device-host', {
      taskId,
      targetId: game.players[1].id,
      outcome: 'success',
    });
    assert.equal(new Date(game.disputes[0].closesAt).getTime() - now.getTime(), 300000);
    const beforeDeadline = await actionAt(new Date(now.getTime() + 299999), game, 'RESOLVE_EXPIRED', 'device-guest');
    assert.equal(beforeDeadline.disputes[0].result, 'pending');
    const atDeadline = await actionAt(new Date(now.getTime() + 300000), game, 'RESOLVE_EXPIRED', 'device-guest');
    assert.equal(atDeadline.disputes[0].result, 'upheld', 'an unanswered claim resolves at five minutes');
    assert.equal(atDeadline.players[0].score, 1.5);
    const votingAt = new Date(now.getTime() + 60000);
    const voting = await actionAt(votingAt, game, 'DISPUTE_GOTCHA', 'device-guest', { taskId });
    assert.equal(new Date(voting.disputes[0].closesAt).getTime() - votingAt.getTime(), 300000);
    // A deployment must not restart or shorten a claim that was already open.
    const existing = JSON.parse(JSON.stringify(game)) as StoredGame;
    existing.settings.disputeTimeoutSeconds = 120;
    existing.disputes[0].closesAt = new Date(now.getTime() + 120000).toISOString();
    const updated = await actionAt(new Date(now.getTime() + 30000), existing, 'PAUSE', 'device-host');
    assert.equal(updated.disputes[0].closesAt, existing.disputes[0].closesAt);
    assert.equal(updated.settings.disputeTimeoutSeconds, 300);
  }

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
    // The target's auto-accept lands just after the response timer: no error, and it still counts.
    let game = await liveGame(['late-accept-host', 'late-accept-target']);
    const task = game.players[0].tasks[0];
    game.players[0].score = 3.5;
    game = await action(game, 'CLAIM_GOTCHA', 'late-accept-host', {
      taskId: task.id,
      targetId: game.players[1].id,
      outcome: 'success',
    });
    const justAfter = new Date(new Date(game.disputes[0].closesAt).getTime() + 1000);
    game = await actionAt(justAfter, game, 'ACCEPT_GOTCHA', 'late-accept-target', { taskId: task.id });
    assert.equal(game.disputes[0].result, 'upheld');
    assert.equal(game.players[0].score, 5);
    assert.equal(game.status, 'ended', 'the expired claim can still win the game');
    game = await actionAt(justAfter, game, 'ACCEPT_GOTCHA', 'late-accept-target', { taskId: task.id });
    assert.equal(game.players[0].score, 5, 'a second tap does not score twice');
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

  // Bigger holiday groups get more challenges and a lower target, and the
  // lobby already shows both before the game starts.
  for (const [playerCount, challenges, target] of [
    [4, 10, 18],
    [9, 12, 12],
    [15, 15, 12],
  ] as const) {
    const label = `holiday with ${playerCount} players`;
    const identities = Array.from({ length: playerCount }, (_, index) => `${label}-${index}`);
    let game = createGame('HOL567', identities[0], playerPayload('Host'), nextRequest());
    game = await action(game, 'SELECT_PACK', identities[0], { packId: 'holiday-challenge' });
    for (let index = 1; index < identities.length; index += 1) {
      game = await action(game, 'JOIN', identities[index], playerPayload(`Player ${index + 1}`));
    }
    assert.equal(game.settings.holidayChallengeCount, challenges, label);
    assert.equal(game.settings.holidayChallengeWinCondition, target, label);
    game = await action(game, 'START', identities[0]);
    assert.equal(game.selectedChallenges.length, challenges, label);
    assert.equal(
      new Set(game.selectedChallenges.map((challenge) => challenge.id)).size,
      challenges,
      `${label}: a challenge repeated`,
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
    const dealt = game.players.flatMap((player) => player.tasks.map((task) => task.templateId));
    assert.equal(new Set(dealt).size, dealt.length, 'a late arrival never repeats a held mission');
    assert.equal(game.players[2].swapsLeft, game.settings.swapsAllowed);
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
    // Old saved lobbies and clients cannot restore configurable winning scores.
    game.settings.gameLength = 'weekend';
    game.settings.targetScore = 12;
    const lobbyView = await projectGameView(game, 'lobby-host', async (key) => key);
    assert.equal((lobbyView.payload as { game: StoredGame }).game.settings.targetScore, 5);
    game = await action(game, 'UPDATE_SETTINGS', 'lobby-host', {
      gameLength: 'long', targetScore: 12, responseMinutes: 30,
    });
    assert.equal(game.settings.gameLength, 'weekend');
    assert.equal(game.settings.targetScore, 5, 'old clients cannot change the five-point target');
    assert.equal(game.settings.disputeTimeoutSeconds, 300, 'old clients cannot change the five-minute deadline');
    game = await action(game, 'TRANSFER_HOST', 'lobby-host', { playerId: game.players[1].id });
    assert.equal(game.hostId, game.players[1].id);
    assert.equal(game.players[0].isHost, false);
    assert.equal(game.players[1].isHost, true);
    game = await action(game, 'SELECT_PACK', 'lobby-guest', { packId: 'core' });
    game = await action(game, 'START', 'lobby-guest');
    assert.equal(game.settings.targetScore, 5, 'legacy game length does not affect the winning score');
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
    assert.equal(game.settings.targetScore, 5, `${label} still plays to five points`);

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

  {
    // Bigger groups play on for more places: winner only, then top 2, then top 3.
    for (const [players, places] of [[2, 1], [6, 1], [7, 2], [11, 2], [12, 3], [18, 3]] as const) {
      const identities = Array.from({ length: players }, (_, index) => `tier-${players}-${index}`);
      const game = await liveGame(identities);
      assert.equal(game.settings.podiumSize, places, `${players} players play for ${places} place(s)`);
    }
  }

  {
    // Top 2: the winner takes 1st, play goes on, and the game ends when 2nd is taken.
    const identities = Array.from({ length: 7 }, (_, index) => `podium-${index}`);
    let game = await liveGame(identities);
    game = await reachFive(game, identities[0]);
    assert.equal(byIdentity(game, identities[0]).place, 1);
    assert.equal(game.status, 'live', 'a top-2 game goes on after the winner');

    // A finisher can't claim any more, but can still vote.
    const leftover = byIdentity(game, identities[0]).tasks.find((task) => task.status === 'pending')!;
    await assert.rejects(
      () => action(game, 'CLAIM_GOTCHA', identities[0], {
        taskId: leftover.id,
        targetId: byIdentity(game, identities[6]).id,
        outcome: 'success',
      }),
      (error: unknown) => error instanceof GameRuleError && /already finished 1st/.test(error.message),
    );
    const disputed = byIdentity(game, identities[5]).tasks[0].id;
    game = await action(game, 'CLAIM_GOTCHA', identities[5], {
      taskId: disputed,
      targetId: byIdentity(game, identities[6]).id,
      outcome: 'success',
    });
    game = await action(game, 'DISPUTE_GOTCHA', identities[6], { taskId: disputed });
    const dispute = game.disputes.find((candidate) => candidate.taskInstanceId === disputed)!;
    game = await action(game, 'VOTE_DISPUTE', identities[0], { disputeId: dispute.id, vote: true });
    assert.equal(game.disputes.find((candidate) => candidate.id === dispute.id)!.votes.length, 1);

    game = await reachFive(game, identities[1]);
    assert.equal(byIdentity(game, identities[1]).place, 2);
    assert.equal(game.status, 'ended', 'the game ends when the podium is full');
    assert.ok(game.endedAt);

    const view = await projectGameView(game, identities[3], async (key) => key);
    const shown = (view.payload as { game: StoredGame }).game;
    assert.equal(shown.settings.podiumSize, 2);
    assert.deepEqual(
      shown.players.filter((player) => player.place).map((player) => [player.name, player.place]),
      [['Host', 1], ['Player 2', 2]],
    );
  }

  {
    // A finisher who leaves gives up the place, and the next finisher takes it.
    const identities = Array.from({ length: 7 }, (_, index) => `leaver-${index}`);
    let game = await liveGame(identities);
    game = await reachFive(game, identities[1]);
    game = await action(game, 'LEAVE', identities[1]);
    assert.ok(game.players.every((player) => !player.place));
    game = await reachFive(game, identities[2]);
    assert.equal(byIdentity(game, identities[2]).place, 1);
    assert.equal(game.status, 'live');

    // Nobody left playing for a place: the game is over.
    for (const identity of identities.slice(3)) game = await action(game, 'LEAVE', identity);
    assert.equal(game.status, 'live', 'the host is still playing for 2nd');
    game = await action(game, 'LEAVE', identities[0]);
    assert.equal(game.status, 'ended', 'only finishers remain');
  }

  {
    // Games already running before the podium rule still end at the first finisher.
    const identities = Array.from({ length: 7 }, (_, index) => `legacy-${index}`);
    let game = await liveGame(identities);
    delete game.settings.podiumSize;
    game = await reachFive(game, identities[0]);
    assert.equal(game.status, 'ended');
    assert.equal(byIdentity(game, identities[0]).place, 1);
  }

  {
    // Holiday games keep their own target and never play for places.
    let game = createGame('HOL234', 'holiday-0', playerPayload('Host'), nextRequest());
    for (let index = 1; index < 12; index += 1) {
      game = await action(game, 'JOIN', `holiday-${index}`, playerPayload(`Traveller ${index}`));
    }
    game = await action(game, 'SELECT_PACK', 'holiday-0', { packId: 'core' });
    assert.equal(game.settings.podiumSize, 3);
    game = await action(game, 'SELECT_PACK', 'holiday-0', { packId: 'holiday-challenge' });
    assert.equal(game.settings.podiumSize, undefined);
  }

  {
    // Busts: the catcher names a player, who says which mission (or that it wasn't one).
    const ids = ['bust-0', 'bust-1', 'bust-2', 'bust-3'];
    let game = await liveGame(ids);
    const catcher = byIdentity(game, ids[0]);
    const suspect = byIdentity(game, ids[1]);
    game = await action(game, 'CALL_BUST', ids[0], { playerId: suspect.id });
    const bust = game.busts![0];
    assert.equal(bust.result, 'pending');
    const busted = (view: Awaited<ReturnType<typeof projectGameView>>) =>
      (view.payload as { activeBusts: unknown[] }).activeBusts.length;
    assert.equal(busted(await projectGameView(game, ids[1], async (key) => key)), 1, 'the busted player sees it');
    assert.equal(busted(await projectGameView(game, ids[0], async (key) => key)), 1, 'the catcher sees it');
    assert.equal(busted(await projectGameView(game, ids[2], async (key) => key)), 0, 'nobody else does');

    await assert.rejects(
      () => action(game, 'CALL_BUST', ids[0], { playerId: byIdentity(game, ids[2]).id }),
      (error: unknown) => error instanceof GameRuleError && /last bust/.test(error.message),
    );
    await assert.rejects(
      () => action(game, 'CALL_BUST', ids[2], { playerId: suspect.id }),
      (error: unknown) => error instanceof GameRuleError && /already busting/.test(error.message),
    );
    await assert.rejects(
      () => action(game, 'ANSWER_BUST', ids[2], { bustId: bust.id }),
      (error: unknown) => error instanceof GameRuleError && /already been settled/.test(error.message),
    );
    await assert.rejects(
      () => action(game, 'CALL_BUST', ids[0], { playerId: catcher.id }),
      (error: unknown) => error instanceof GameRuleError && /I Got Caught/.test(error.message),
    );

    const missionId = suspect.tasks[0].id;
    game = await action(game, 'ANSWER_BUST', ids[1], { bustId: bust.id, taskId: missionId });
    const caught = byIdentity(game, ids[1]).tasks.find((task) => task.id === missionId)!;
    assert.equal(caught.status, 'failed');
    assert.equal(caught.targetId, catcher.id, 'the catch is credited to the catcher (Detective award)');
    assert.equal(byIdentity(game, ids[1]).stats.failed, 1);
    assert.equal(game.busts![0].result, 'confirmed');
    await assert.rejects(
      () => action(game, 'CLAIM_GOTCHA', ids[1], { taskId: missionId, targetId: catcher.id, outcome: 'success' }),
      (error: unknown) => error instanceof GameRuleError && /already resolved/.test(error.message),
      'a caught mission cannot be tried again',
    );

    game = await action(game, 'CALL_BUST', ids[0], { playerId: suspect.id });
    const denied = game.busts!.find((candidate) => candidate.result === 'pending')!;
    game = await action(game, 'ANSWER_BUST', ids[1], { bustId: denied.id });
    assert.equal(game.busts!.find((candidate) => candidate.id === denied.id)!.result, 'denied');
    assert.equal(byIdentity(game, ids[1]).stats.failed, 1, 'a denied bust costs nothing');

    // An unanswered bust lapses after five minutes and frees the catcher.
    game = await action(game, 'CALL_BUST', ids[0], { playerId: byIdentity(game, ids[2]).id });
    game = await actionAt(minutesLater(6), game, 'RESOLVE_EXPIRED', ids[3]);
    assert.equal(game.busts![game.busts!.length - 1].result, 'expired');

    // Reporting "I Got Caught" by hand while a bust waits settles that bust.
    game = await actionAt(minutesLater(6), game, 'CALL_BUST', ids[0], { playerId: byIdentity(game, ids[3]).id });
    const waiting = game.busts!.find((candidate) => candidate.result === 'pending')!;
    const own = byIdentity(game, ids[3]).tasks[0].id;
    game = await actionAt(minutesLater(6), game, 'CLAIM_GOTCHA', ids[3], { taskId: own, targetId: catcher.id, outcome: 'caught' });
    assert.equal(game.busts!.find((candidate) => candidate.id === waiting.id)!.result, 'confirmed');
    assert.equal(byIdentity(game, ids[3]).stats.failed, 1);

    // A player who leaves mid-bust cancels it.
    game = await actionAt(minutesLater(6), game, 'CALL_BUST', ids[2], { playerId: byIdentity(game, ids[3]).id });
    game = await actionAt(minutesLater(6), game, 'LEAVE', ids[3]);
    assert.ok(game.busts!.every((candidate) => candidate.result !== 'pending'));
  }

  {
    // Players rate their own missions once the game is over; they can change or clear it.
    let game = await liveGame(['rate-0', 'rate-1', 'rate-2']);
    const taskId = byIdentity(game, 'rate-0').tasks[0].id;
    await assert.rejects(() => action(game, 'RATE_MISSION', 'rate-0', { taskId, rating: 'up' }));
    game = await action(game, 'END', 'rate-0');
    game = await action(game, 'RATE_MISSION', 'rate-0', { taskId, rating: 'up' });
    assert.equal(byIdentity(game, 'rate-0').tasks[0].rating, 'up');
    await assert.rejects(
      () => action(game, 'RATE_MISSION', 'rate-1', { taskId, rating: 'down' }),
      (error: unknown) => error instanceof GameRuleError && /Task not found/.test(error.message),
      "nobody rates someone else's mission",
    );
    await assert.rejects(() => action(game, 'RATE_MISSION', 'rate-0', { taskId, rating: 'meh' }));
    game = await action(game, 'RATE_MISSION', 'rate-0', { taskId, rating: null });
    assert.equal(byIdentity(game, 'rate-0').tasks[0].rating, undefined);
  }

  console.log('AWS game domain checks passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
