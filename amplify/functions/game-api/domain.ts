import { randomUUID } from 'node:crypto';
import {
  dealTasks,
  getAllHolidayChallenges,
  getHolidayChallengeCount,
  getHolidayChallengeWinCondition,
  getMaxPlayers,
  getRandomHolidayChallenges,
  getReplacementTask,
  getSwapsAllowed,
  isBonusTask,
  MAX_PLAYERS,
} from './packs';

export type GameActionName =
  | 'JOIN'
  | 'SELECT_PACK'
  | 'START'
  | 'END'
  | 'LEAVE'
  | 'UPDATE_NAME'
  | 'SWAP_TASK'
  | 'CLAIM_GOTCHA'
  | 'ACCEPT_GOTCHA'
  | 'DISPUTE_GOTCHA'
  | 'VOTE_DISPUTE'
  | 'COMPLETE_CHALLENGE'
  | 'RESOLVE_EXPIRED';

export type StoredTask = {
  id: string;
  templateId: string;
  gameId: string;
  playerId: string;
  text: string;
  tips?: string;
  status: 'pending' | 'completed' | 'failed' | 'disputed';
  targetId?: string;
  gotAt?: string;
  disputeId?: string;
};

export type StoredPlayer = {
  id: string;
  identityId: string;
  name: string;
  gameId: string;
  swapsLeft: number;
  score: number;
  lockedIn: boolean;
  isHost: boolean;
  tasks: StoredTask[];
  stats: {
    gothcas: number;
    failed: number;
    disputesLost: number;
    uniqueTargets: string[];
    firstTimeTargets: number;
  };
  avatar?: string;
  avatarType?: 'emoji' | 'photo';
  challengeScore?: number;
  challengeCompletions?: string[];
};

export type StoredDispute = {
  id: string;
  taskInstanceId: string;
  targetId: string;
  accuserId: string;
  openedAt: string;
  closesAt: string;
  phase: 'response' | 'voting';
  result: 'upheld' | 'overturned' | 'pending';
  votes: Array<{
    id: string;
    disputeId: string;
    voterId: string;
    vote: boolean;
    votedAt: string;
  }>;
  description?: string;
};

export type StoredGame = {
  gameId: string;
  revision: number;
  status: 'draft' | 'live' | 'ended';
  mode: 'casual';
  packId: string;
  gameType?: 'traditional' | 'holiday-challenge';
  createdBy: string;
  createdAt: string;
  hostId: string;
  players: StoredPlayer[];
  settings: {
    swapsAllowed: number;
    disputeTimeoutSeconds: number;
    hostDefaultOnTie: boolean;
    enableNegativeScoring: boolean;
    maxPlayers: number;
    targetScore: number;
    selectedPack?: 'core' | 'remote' | 'holiday-challenge' | null;
    tasksLoaded?: boolean;
    holidayChallengeCount?: number;
    holidayChallengeWinCondition?: number;
    holidayGoldPoints?: number;
    holidaySilverPoints?: number;
    holidayMaxSilverPerChallenge?: number;
  };
  currentPhase: 'draft' | 'play' | 'ended';
  challengeCompletions: Array<{
    id: string;
    challengeId: string;
    playerId: string;
    gameId: string;
    completedAt: string;
    points: number;
    type: 'gold' | 'silver';
    proofImageKey?: string;
  }>;
  selectedChallenges: Array<{
    id: string;
    text: string;
    requiresProof: boolean;
  }>;
  disputes: StoredDispute[];
  requestIds: string[];
  expiresAt: number;
};

export type ActionResult = {
  game: StoredGame;
  changed: boolean;
  deleteGame?: boolean;
};

const allowedPacks = new Set(['core', 'remote', 'holiday-challenge']);
const GAME_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export class GameRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GameRuleError';
  }
}

export function makeGameCode(random: () => number = Math.random): string {
  return Array.from({ length: 6 }, () =>
    GAME_CODE_ALPHABET[Math.floor(random() * GAME_CODE_ALPHABET.length)],
  ).join('');
}

function text(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== 'string') {
    throw new GameRuleError(`${label} is required`);
  }
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized) throw new GameRuleError(`${label} is required`);
  if (normalized.length > maxLength) {
    throw new GameRuleError(`${label} must be ${maxLength} characters or fewer`);
  }
  return normalized;
}

function optionalText(value: unknown, maxLength: number): string | undefined {
  if (value == null || value === '') return undefined;
  return text(value, 'Text', maxLength);
}

function payloadObject(payload: unknown): Record<string, unknown> {
  if (payload == null) return {};
  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch {
      throw new GameRuleError('Invalid action payload');
    }
  }
  if (typeof payload === 'object' && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }
  throw new GameRuleError('Invalid action payload');
}

function avatarFromPayload(payload: Record<string, unknown>, identityId: string): {
  avatar: string;
  avatarType: 'emoji' | 'photo';
} {
  const avatarType = payload.avatarType === 'photo' ? 'photo' : 'emoji';
  const rawAvatar = optionalText(payload.avatar, avatarType === 'photo' ? 512 : 32);
  if (avatarType === 'photo') {
    if (!rawAvatar?.startsWith(`avatars/${identityId}/`)) {
      throw new GameRuleError('Photo avatar was not uploaded correctly');
    }
    return { avatar: rawAvatar, avatarType };
  }
  return { avatar: rawAvatar || '🎮', avatarType };
}

function newPlayer(
  identityId: string,
  gameId: string,
  payload: Record<string, unknown>,
  isHost: boolean,
): StoredPlayer {
  const { avatar, avatarType } = avatarFromPayload(payload, identityId);
  return {
    id: randomUUID(),
    identityId,
    name: text(payload.name, 'Name', 24),
    gameId,
    swapsLeft: 2,
    score: 0,
    lockedIn: false,
    isHost,
    tasks: [],
    stats: {
      gothcas: 0,
      failed: 0,
      disputesLost: 0,
      uniqueTargets: [],
      firstTimeTargets: 0,
    },
  avatar,
    avatarType,
  };
}

export function createGame(
  gameId: string,
  identityId: string,
  payload: unknown,
  requestId: string,
  now = new Date(),
): StoredGame {
  const body = payloadObject(payload);
  const host = newPlayer(identityId, gameId, body, true);
  return {
    gameId,
    revision: 1,
    status: 'draft',
    mode: 'casual',
    packId: '',
    createdBy: host.name,
    createdAt: now.toISOString(),
    hostId: host.id,
    players: [host],
    settings: {
      swapsAllowed: 2,
      disputeTimeoutSeconds: 120,
      hostDefaultOnTie: true,
      enableNegativeScoring: false,
      maxPlayers: MAX_PLAYERS,
      targetScore: 4,
      selectedPack: null,
      tasksLoaded: false,
    },
    currentPhase: 'draft',
    challengeCompletions: [],
    selectedChallenges: [],
    disputes: [],
    requestIds: [requestId],
    expiresAt: Math.floor(now.getTime() / 1000) + 7 * 24 * 60 * 60,
  };
}

function member(game: StoredGame, identityId: string): StoredPlayer {
  const player = game.players.find((candidate) => candidate.identityId === identityId);
  if (!player) throw new GameRuleError('You are not a member of this game');
  return player;
}

function host(game: StoredGame, identityId: string): StoredPlayer {
  const player = member(game, identityId);
  if (!player.isHost || game.hostId !== player.id) {
    throw new GameRuleError('Only the host can do that');
  }
  return player;
}

function requireStatus(game: StoredGame, status: StoredGame['status']): void {
  if (game.status !== status) throw new GameRuleError(`Game must be ${status}`);
}

function findTask(game: StoredGame, player: StoredPlayer, taskId: unknown): StoredTask {
  const id = text(taskId, 'Task', 64);
  const task = player.tasks.find((candidate) => candidate.id === id);
  if (!task) throw new GameRuleError('Task not found');
  return task;
}

function awardGotcha(game: StoredGame, dispute: StoredDispute): void {
  const claimant = game.players.find((player) => player.id === dispute.accuserId);
  const task = claimant?.tasks.find((candidate) => candidate.id === dispute.taskInstanceId);
  if (!claimant || !task || task.status !== 'disputed') return;

  const firstTarget = !claimant.stats.uniqueTargets.includes(dispute.targetId);
  claimant.score += firstTarget ? 1.5 : 1;
  claimant.stats.gothcas += 1;
  if (firstTarget) {
    claimant.stats.uniqueTargets.push(dispute.targetId);
    claimant.stats.firstTimeTargets += 1;
  }
  task.status = 'completed';
  dispute.result = 'upheld';
  if (claimant.score >= game.settings.targetScore) {
    game.status = 'ended';
    game.currentPhase = 'ended';
  }
}

function overturnGotcha(game: StoredGame, dispute: StoredDispute): void {
  const claimant = game.players.find((player) => player.id === dispute.accuserId);
  const task = claimant?.tasks.find((candidate) => candidate.id === dispute.taskInstanceId);
  if (!claimant || !task || task.status !== 'disputed') return;
  task.status = 'failed';
  claimant.stats.failed += 1;
  claimant.stats.disputesLost += 1;
  if (game.settings.enableNegativeScoring) claimant.score = Math.max(0, claimant.score - 1);
  dispute.result = 'overturned';
}

function resolveVote(game: StoredGame, dispute: StoredDispute): void {
  const uphold = dispute.votes.filter((vote) => vote.vote).length;
  const overturn = dispute.votes.length - uphold;
  if (uphold > overturn || (uphold === overturn && game.settings.hostDefaultOnTie)) {
    awardGotcha(game, dispute);
  } else {
    overturnGotcha(game, dispute);
  }
}

function resolveExpired(game: StoredGame, now: Date): boolean {
  let changed = false;
  for (const dispute of game.disputes) {
    if (dispute.result !== 'pending' || new Date(dispute.closesAt) > now) continue;
    if (dispute.phase === 'response') awardGotcha(game, dispute);
    else resolveVote(game, dispute);
    changed = true;
  }
  return changed;
}

function handSize(playerCount: number): number {
  return playerCount >= 7 ? 8 : 7;
}

// Rules that depend on group size. Kept current while the lobby fills up so
// the rules screen shows the real numbers before the game starts.
function updateGroupRules(game: StoredGame): void {
  if (!game.packId) return;
  const playerCount = game.players.length;
  if (game.gameType === 'holiday-challenge') {
    // Bigger groups get more challenges and a lower target.
    game.settings.holidayChallengeCount = getHolidayChallengeCount(playerCount);
    game.settings.holidayChallengeWinCondition = getHolidayChallengeWinCondition(playerCount);
    return;
  }
  // Bigger groups get fewer swaps, so a swap never repeats another player's task.
  game.settings.swapsAllowed = getSwapsAllowed(game.packId, playerCount, handSize(playerCount));
}

function makeTasks(
  game: StoredGame,
  player: StoredPlayer,
  hand: Array<{ id: string; text: string; tips?: string }>,
): StoredTask[] {
  return hand.map((task) => ({
    id: randomUUID(),
    templateId: task.id,
    gameId: game.gameId,
    playerId: player.id,
    text: task.text,
    tips: task.tips,
    status: 'pending',
  }));
}

export async function applyAction(
  source: StoredGame,
  action: GameActionName,
  identityId: string,
  payload: unknown,
  requestId: string,
  now = new Date(),
  proofExists: (key: string) => Promise<boolean> = async () => true,
): Promise<ActionResult> {
  if (source.requestIds.includes(requestId)) return { game: source, changed: false };

  const game: StoredGame = JSON.parse(JSON.stringify(source)) as StoredGame;
  const body = payloadObject(payload);
  const expiredChanged = resolveExpired(game, now);
  let changed = expiredChanged;
  let deleteGame = false;

  switch (action) {
    case 'JOIN': {
      requireStatus(game, 'draft');
      const existing = game.players.find((player) => player.identityId === identityId);
      if (existing) break;
      if (game.players.length >= game.settings.maxPlayers) {
        throw new GameRuleError('This game is full');
      }
      const joining = newPlayer(identityId, game.gameId, body, false);
      if (game.players.some((player) => player.name.toLowerCase() === joining.name.toLowerCase())) {
        throw new GameRuleError('That name is already in use');
      }
      game.players.push(joining);
      updateGroupRules(game);
      changed = true;
      break;
    }

    case 'SELECT_PACK': {
      host(game, identityId);
      requireStatus(game, 'draft');
      const packId = text(body.packId, 'Pack', 32);
      if (!allowedPacks.has(packId)) throw new GameRuleError('Unknown game pack');
      const maxPlayers = getMaxPlayers(packId);
      if (game.players.length > maxPlayers) {
        throw new GameRuleError(`This pack fits up to ${maxPlayers} players`);
      }
      game.settings.maxPlayers = maxPlayers;
      game.packId = packId;
      game.gameType = packId === 'holiday-challenge' ? 'holiday-challenge' : 'traditional';
      game.settings.selectedPack = packId as StoredGame['settings']['selectedPack'];
      updateGroupRules(game);
      game.settings.tasksLoaded = false;
      game.challengeCompletions = [];
      game.selectedChallenges = [];
      changed = true;
      break;
    }

    case 'START': {
      host(game, identityId);
      requireStatus(game, 'draft');
      if (game.players.length < 2) throw new GameRuleError('At least two players are required');
      if (!game.settings.selectedPack || !allowedPacks.has(game.settings.selectedPack)) {
        throw new GameRuleError('Choose a pack before starting');
      }
      const largeGame = game.players.length >= 7;
      game.settings.targetScore = largeGame ? 5 : 4;
      updateGroupRules(game);
      if (game.gameType === 'holiday-challenge') {
        game.selectedChallenges = getRandomHolidayChallenges(
          game.settings.holidayChallengeCount ?? 10,
        );
        game.settings.holidayGoldPoints = 3;
        game.settings.holidaySilverPoints = 1;
        game.settings.holidayMaxSilverPerChallenge = 2;
        for (const player of game.players) {
          player.tasks = [];
          player.challengeScore = 0;
          player.challengeCompletions = [];
        }
      } else {
        const hands = dealTasks(game.packId, game.players.length, handSize(game.players.length));
        game.players.forEach((player, index) => {
          player.tasks = makeTasks(game, player, hands[index]);
          player.swapsLeft = game.settings.swapsAllowed;
        });
      }
      game.settings.tasksLoaded = true;
      game.status = 'live';
      game.currentPhase = 'play';
      changed = true;
      break;
    }

    case 'END': {
      host(game, identityId);
      if (game.status === 'ended') break;
      game.status = 'ended';
      game.currentPhase = 'ended';
      changed = true;
      break;
    }

    case 'LEAVE': {
      const leaving = member(game, identityId);
      if (game.status === 'ended') break;
      game.players = game.players.filter((player) => player.id !== leaving.id);
      if (game.status === 'draft') updateGroupRules(game);
      for (const dispute of game.disputes) {
        if (dispute.result !== 'pending') continue;
        if (dispute.accuserId === leaving.id || dispute.targetId === leaving.id) {
          const claimant = game.players.find((player) => player.id === dispute.accuserId);
          const task = claimant?.tasks.find((candidate) => candidate.id === dispute.taskInstanceId);
          if (task?.status === 'disputed') {
            task.status = 'pending';
            delete task.targetId;
            delete task.disputeId;
            delete task.gotAt;
          }
          dispute.result = 'overturned';
        }
      }
      if (game.players.length === 0) {
        deleteGame = true;
      } else if (leaving.isHost) {
        game.players.forEach((player, index) => {
          player.isHost = index === 0;
        });
        game.hostId = game.players[0].id;
      }
      changed = true;
      break;
    }

    case 'UPDATE_NAME': {
      requireStatus(game, 'draft');
      const player = member(game, identityId);
      const name = text(body.name, 'Name', 24);
      if (
        game.players.some(
          (candidate) =>
            candidate.id !== player.id && candidate.name.toLowerCase() === name.toLowerCase(),
        )
      ) {
        throw new GameRuleError('That name is already in use');
      }
      player.name = name;
      if (player.isHost) game.createdBy = name;
      changed = true;
      break;
    }

    case 'SWAP_TASK': {
      requireStatus(game, 'live');
      if (game.gameType === 'holiday-challenge') {
        throw new GameRuleError('Holiday challenges cannot be swapped');
      }
      const player = member(game, identityId);
      if (player.swapsLeft <= 0) throw new GameRuleError('No swaps remaining');
      const task = findTask(game, player, body.taskId);
      if (task.status !== 'pending') throw new GameRuleError('Only pending tasks can be swapped');
      const templates = player.tasks.map((candidate) => ({
        id: candidate.templateId,
        text: candidate.text,
        tips: candidate.tips,
      }));
      // Never hand out a task another player already holds.
      const takenIds = game.players.flatMap((other) =>
        other.tasks.map((candidate) => candidate.templateId),
      );
      const replacement = getReplacementTask(
        game.packId,
        templates,
        isBonusTask(game.packId, {
          id: task.templateId,
          text: task.text,
          tips: task.tips,
        }),
        takenIds,
      );
      if (!replacement) throw new GameRuleError('No replacement task is available');
      task.templateId = replacement.id;
      task.text = replacement.text;
      task.tips = replacement.tips;
      player.swapsLeft -= 1;
      changed = true;
      break;
    }

    case 'CLAIM_GOTCHA': {
      requireStatus(game, 'live');
      if (game.gameType === 'holiday-challenge') throw new GameRuleError('Use challenges in this game');
      const player = member(game, identityId);
      const task = findTask(game, player, body.taskId);
      if (task.status !== 'pending') throw new GameRuleError('That task is already resolved');
      const outcome = body.outcome === 'caught' || body.outcome === 'failed' ? body.outcome : 'success';
      const targetId = text(body.targetId, 'Target', 64);
      if (targetId === player.id) throw new GameRuleError('You cannot target yourself');
      if (!game.players.some((candidate) => candidate.id === targetId)) {
        throw new GameRuleError('Target player not found');
      }
      task.targetId = targetId;
      task.gotAt = now.toISOString();
      if (outcome !== 'success') {
        task.status = 'failed';
        player.stats.failed += 1;
      } else {
        const disputeId = randomUUID();
        task.status = 'disputed';
        task.disputeId = disputeId;
        game.disputes.push({
          id: disputeId,
          taskInstanceId: task.id,
          targetId,
          accuserId: player.id,
          openedAt: now.toISOString(),
          closesAt: new Date(
            now.getTime() + game.settings.disputeTimeoutSeconds * 1000,
          ).toISOString(),
          phase: 'response',
          result: 'pending',
          votes: [],
        });
      }
      changed = true;
      break;
    }

    case 'ACCEPT_GOTCHA': {
      requireStatus(game, 'live');
      const target = member(game, identityId);
      const taskId = text(body.taskId, 'Task', 64);
      const dispute = game.disputes.find(
        (candidate) =>
          candidate.taskInstanceId === taskId &&
          candidate.targetId === target.id &&
          candidate.phase === 'response' &&
          candidate.result === 'pending',
      );
      if (!dispute) throw new GameRuleError('Pending claim not found');
      awardGotcha(game, dispute);
      changed = true;
      break;
    }

    case 'DISPUTE_GOTCHA': {
      requireStatus(game, 'live');
      const target = member(game, identityId);
      const taskId = text(body.taskId, 'Task', 64);
      const dispute = game.disputes.find(
        (candidate) =>
          candidate.taskInstanceId === taskId &&
          candidate.targetId === target.id &&
          candidate.phase === 'response' &&
          candidate.result === 'pending',
      );
      if (!dispute) throw new GameRuleError('Pending claim not found');
      dispute.phase = 'voting';
      dispute.description = optionalText(body.reason, 100);
      dispute.closesAt = new Date(
        now.getTime() + game.settings.disputeTimeoutSeconds * 1000,
      ).toISOString();
      changed = true;
      break;
    }

    case 'VOTE_DISPUTE': {
      requireStatus(game, 'live');
      const voter = member(game, identityId);
      const disputeId = text(body.disputeId, 'Dispute', 64);
      const dispute = game.disputes.find(
        (candidate) => candidate.id === disputeId && candidate.result === 'pending',
      );
      if (!dispute || dispute.phase !== 'voting') {
        throw new GameRuleError('This dispute is not open for voting');
      }
      if (voter.id === dispute.accuserId || voter.id === dispute.targetId) {
        throw new GameRuleError('Players involved in a claim cannot vote');
      }
      if (dispute.votes.some((vote) => vote.voterId === voter.id)) {
        throw new GameRuleError('You have already voted');
      }
      if (typeof body.vote !== 'boolean') throw new GameRuleError('Vote is required');
      dispute.votes.push({
        id: randomUUID(),
        disputeId,
        voterId: voter.id,
        vote: body.vote,
        votedAt: now.toISOString(),
      });
      const eligibleVoters = game.players.filter(
        (player) => player.id !== dispute.accuserId && player.id !== dispute.targetId,
      ).length;
      if (dispute.votes.length >= eligibleVoters) resolveVote(game, dispute);
      changed = true;
      break;
    }

    case 'COMPLETE_CHALLENGE': {
      requireStatus(game, 'live');
      if (game.gameType !== 'holiday-challenge') {
        throw new GameRuleError('This is not a Holiday Challenge game');
      }
      const player = member(game, identityId);
      const challengeId = text(body.challengeId, 'Challenge', 32);
      const challenge = game.selectedChallenges.find((item) => item.id === challengeId);
      if (!challenge) throw new GameRuleError('That challenge is not part of this game');
      if (player.challengeCompletions?.includes(challengeId)) {
        throw new GameRuleError('You have already completed this challenge');
      }
      const existing = game.challengeCompletions.filter(
        (completion) => completion.challengeId === challengeId,
      );
      const hasGold = existing.some((completion) => completion.type === 'gold');
      const silverCount = existing.filter((completion) => completion.type === 'silver').length;
      const maxSilver = game.settings.holidayMaxSilverPerChallenge ?? 2;
      if (hasGold && silverCount >= maxSilver) {
        throw new GameRuleError('All point awards for this challenge have been claimed');
      }
      let proofImageKey: string | undefined;
      if (challenge.requiresProof) {
        proofImageKey = text(body.proofImageKey, 'Photo proof', 512);
        if (!proofImageKey.startsWith(`proofs/${identityId}/`)) {
          throw new GameRuleError('Photo proof does not belong to this player');
        }
        if (!(await proofExists(proofImageKey))) {
          throw new GameRuleError('Photo proof could not be verified');
        }
      }
      const type = hasGold ? 'silver' : 'gold';
      const points =
        type === 'gold'
          ? game.settings.holidayGoldPoints ?? 3
          : game.settings.holidaySilverPoints ?? 1;
      game.challengeCompletions.push({
        id: randomUUID(),
        challengeId,
        playerId: player.id,
        gameId: game.gameId,
        completedAt: now.toISOString(),
        points,
        type,
        proofImageKey,
      });
      const updatedChallengeScore = (player.challengeScore ?? 0) + points;
      player.challengeScore = updatedChallengeScore;
      player.score = updatedChallengeScore;
      player.challengeCompletions = [...(player.challengeCompletions ?? []), challengeId];
      if (updatedChallengeScore >= (game.settings.holidayChallengeWinCondition ?? 18)) {
        game.status = 'ended';
        game.currentPhase = 'ended';
      }
      changed = true;
      break;
    }

    case 'RESOLVE_EXPIRED': {
      member(game, identityId);
      break;
    }

    default:
      throw new GameRuleError('Unknown game action');
  }

  if (changed) {
    game.revision = source.revision + 1;
    game.requestIds = [...source.requestIds, requestId].slice(-50);
    game.expiresAt =
      Math.floor(now.getTime() / 1000) + (game.status === 'ended' ? 24 : 7 * 24) * 60 * 60;
  }
  return { game, changed, deleteGame };
}

export async function projectGameView(
  game: StoredGame,
  identityId: string,
  avatarUrl: (key: string) => Promise<string>,
): Promise<{ gameId: string; revision: number; payload: unknown }> {
  const current = member(game, identityId);
  const publicPlayers = await Promise.all(
    game.players.map(async (player) => {
      const visibleTasks =
        player.id === current.id
          ? player.tasks
          : player.tasks.filter(
              (task) => task.status === 'completed' || task.status === 'failed',
            );
      const avatar =
        player.avatarType === 'photo' && player.avatar
          ? await avatarUrl(player.avatar)
          : player.avatar;
      const { identityId: _identityId, ...safePlayer } = player;
      return { ...safePlayer, avatar, token: '', tasks: visibleTasks };
    }),
  );
  const gameView = {
    id: game.gameId,
    status: game.status,
    mode: game.mode,
    packId: game.packId,
    gameType: game.gameType,
    createdBy: game.createdBy,
    createdAt: game.createdAt,
    hostId: game.hostId,
    players: publicPlayers,
    settings: game.settings,
    currentPhase: game.currentPhase,
    challengeCompletions: game.challengeCompletions.map(
      ({ proofImageKey: _proofImageKey, ...completion }) => completion,
    ),
    selectedChallenges: game.selectedChallenges,
  };
  return {
    gameId: game.gameId,
    revision: game.revision,
    payload: {
      game: gameView,
      currentPlayer: publicPlayers.find((player) => player.id === current.id),
      activeDisputes: game.disputes.filter((dispute) => dispute.result === 'pending'),
    },
  };
}

export function challengeNeedsProof(challengeId: string): boolean {
  return Boolean(
    getAllHolidayChallenges().find((challenge) => challenge.id === challengeId)?.requiresProof,
  );
}
