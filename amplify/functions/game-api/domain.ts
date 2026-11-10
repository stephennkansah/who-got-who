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
import { parsePushSubscription, type PushSubscriptionKeys } from './webpush';
import { parseApnsToken } from './apns';

export type GameActionName =
  | 'JOIN'
  | 'SELECT_PACK'
  | 'START'
  | 'END'
  | 'LEAVE'
  | 'KICK'
  | 'UPDATE_NAME'
  | 'SWAP_TASK'
  | 'CLAIM_GOTCHA'
  | 'ACCEPT_GOTCHA'
  | 'DISPUTE_GOTCHA'
  | 'VOTE_DISPUTE'
  | 'COMPLETE_CHALLENGE'
  | 'RESOLVE_EXPIRED'
  | 'LINK_REMATCH'
  | 'UPDATE_SETTINGS'
  | 'OPEN_CLAIMS'
  | 'PAUSE'
  | 'RESUME'
  | 'SET_READY'
  | 'TRANSFER_HOST'
  | 'SAVE_PUSH'
  | 'CALL_BUST'
  | 'ANSWER_BUST'
  | 'RATE_MISSION';

/** Minutes between dealing missions and opening gotchas that a host may choose. */
export const BRIEFING_OPTIONS = [0, 5, 10, 15, 30];
export const DEFAULT_BRIEFING_MINUTES = 10;

/** Fixed winning score for secret missions, regardless of group size. */
export const WINNING_SCORE = 5;

/**
 * In bigger groups, one player reaching the winning score doesn't end it for
 * everyone: play carries on until this many players have reached it.
 * Largest groups first; smaller groups stop at the first finisher.
 */
export const PODIUM_TIERS: ReadonlyArray<{ minPlayers: number; places: number }> = [
  { minPlayers: 12, places: 3 },
  { minPlayers: 7, places: 2 },
];

/** How many players must reach the winning score before a secret-missions game ends. */
export function podiumSize(playerCount: number): number {
  return PODIUM_TIERS.find((tier) => playerCount >= tier.minPlayers)?.places ?? 1;
}

export function ordinal(place: number): string {
  const tens = place % 100;
  if (tens >= 11 && tens <= 13) return `${place}th`;
  return `${place}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[place % 10] ?? 'th'}`;
}

/** Finishers in the order they finished, then everyone else by score. */
export function rankPlayers<T extends { place?: number; score: number }>(players: T[]): T[] {
  return [...players].sort((left, right) => {
    if (left.place && right.place) return left.place - right.place;
    if (left.place) return -1;
    if (right.place) return 1;
    return right.score - left.score;
  });
}

/** Fixed response and voting window; hosts cannot change it. */
export const CLAIM_RESPONSE_SECONDS = 5 * 60;

/** How long a busted player has to say which mission they were caught trying. */
export const BUST_RESPONSE_SECONDS = 5 * 60;

/** From this score a player's next gotcha (on someone new) can finish them. */
export const ONE_AWAY_SCORE = WINNING_SCORE - 1.5;

/** Actions only the Lambda itself may apply; clients cannot send them directly. */
export const INTERNAL_ACTIONS: ReadonlySet<string> = new Set(['LINK_REMATCH']);

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
  /** The holder's verdict on this mission once the game is over. */
  rating?: 'up' | 'down';
};

/** Someone says they caught a player trying a mission; that player says which one. */
export type StoredBust = {
  id: string;
  catcherId: string;
  playerId: string;
  openedAt: string;
  closesAt: string;
  result: 'pending' | 'confirmed' | 'denied' | 'expired';
  settledAt?: string;
  taskInstanceId?: string;
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
  /** Set when this player reaches the winning score: 1 for the winner, then 2 and 3 in big groups. */
  place?: number;
  /** This player's phone, for buzzes while it is locked. Never sent to other players. */
  push?: PushSubscriptionKeys;
  /** Apple's device token when playing in the iPhone app. Never sent to other players. */
  apns?: string;
  /** How this player is playing, for the anonymous stats. Never sent to other players. */
  device?: PlayerDevice;
};

export const PLAYER_DEVICES = ['iphone-app', 'android-app', 'website'] as const;
export type PlayerDevice = (typeof PLAYER_DEVICES)[number];

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
    briefingMinutes?: number;
    /** Players who must reach the winning score before the game ends; missing means 1. */
    podiumSize?: number;
    // Legacy metadata only; no longer configurable or used to choose a target.
    gameLength?: 'quick' | 'standard' | 'long' | 'weekend';
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
  /** Bust calls, newest last; only the latest few settled ones are kept. */
  busts?: StoredBust[];
  requestIds: string[];
  expiresAt: number;
  startedAt?: string;
  endedAt?: string;
  rematchGameId?: string;
  /** Missions are dealt at the start; gotchas only count from this moment. */
  claimsOpenAt?: string;
  /** Set while the host has paused play; claim timers are frozen. */
  pausedAt?: string;
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

/** The app reports how it is being played; anything else (older iPhone apps send nothing) is left unset. */
function deviceFromPayload(payload: Record<string, unknown>): { device?: PlayerDevice } {
  const device = PLAYER_DEVICES.find((known) => known === payload.device);
  return device ? { device } : {};
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
    ...deviceFromPayload(payload),
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
      disputeTimeoutSeconds: CLAIM_RESPONSE_SECONDS,
      hostDefaultOnTie: true,
      enableNegativeScoring: false,
      maxPlayers: MAX_PLAYERS,
      targetScore: WINNING_SCORE,
      selectedPack: null,
      tasksLoaded: false,
      briefingMinutes: DEFAULT_BRIEFING_MINUTES,
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

/** New gotchas and challenge claims only count after the briefing and while play isn't paused. */
function requirePlayable(game: StoredGame, now: Date): void {
  const what = game.gameType === 'holiday-challenge' ? 'challenges' : 'gotchas';
  if (game.pausedAt) throw new GameRuleError(`The game is paused — no ${what} until the host resumes`);
  if (game.claimsOpenAt && new Date(game.claimsOpenAt) > now) {
    const minutes = Math.ceil((new Date(game.claimsOpenAt).getTime() - now.getTime()) / 60000);
    throw new GameRuleError(
      `${what[0].toUpperCase()}${what.slice(1)} open in ${minutes} minute${minutes === 1 ? '' : 's'} — read your missions and settle in`,
    );
  }
}

function requireNotPaused(game: StoredGame, message: string): void {
  if (game.pausedAt) throw new GameRuleError(message);
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
  recordFinish(game, claimant);
}

/** Reaching the winning score earns the next podium place. */
function recordFinish(game: StoredGame, player: StoredPlayer): void {
  if (game.status !== 'live' || player.place || player.score < WINNING_SCORE) return;
  player.place = game.players.filter((other) => other.place).length + 1;
  settlePodium(game);
}

/** The game ends once the podium is full, or nobody is left still playing for a place. */
function settlePodium(game: StoredGame): void {
  if (game.status !== 'live') return;
  const finished = game.players.filter((player) => player.place).length;
  if (!finished) return;
  if (finished >= (game.settings.podiumSize ?? 1) || game.players.every((player) => player.place)) {
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

function eligibleVoterCount(game: StoredGame, dispute: StoredDispute): number {
  return game.players.filter(
    (player) => player.id !== dispute.accuserId && player.id !== dispute.targetId,
  ).length;
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
  // Claim timers are frozen while the game is paused.
  if (game.pausedAt) return false;
  let changed = false;
  for (const dispute of game.disputes) {
    if (dispute.result !== 'pending' || new Date(dispute.closesAt) > now) continue;
    if (dispute.phase === 'response') awardGotcha(game, dispute);
    else resolveVote(game, dispute);
    changed = true;
  }
  // An unanswered bust simply lapses: the honour system can't settle it without the player.
  for (const bust of game.busts ?? []) {
    if (bust.result !== 'pending' || new Date(bust.closesAt) > now) continue;
    bust.result = 'expired';
    bust.settledAt = now.toISOString();
    changed = true;
  }
  return changed;
}

/** Settles a bust: the named mission is filed as caught, credited to the catcher. */
function confirmBust(bust: StoredBust, player: StoredPlayer, task: StoredTask, now: Date): void {
  task.status = 'failed';
  task.targetId = bust.catcherId;
  task.gotAt = now.toISOString();
  player.stats.failed += 1;
  bust.result = 'confirmed';
  bust.taskInstanceId = task.id;
  bust.settledAt = now.toISOString();
}

/** Keeps every open bust and only the latest settled ones, so the stored game stays small. */
function trimBusts(game: StoredGame): void {
  const busts = game.busts ?? [];
  const settled = busts.filter((bust) => bust.result !== 'pending');
  if (settled.length <= 20) return;
  const keep = new Set(settled.slice(-20));
  game.busts = busts.filter((bust) => bust.result === 'pending' || keep.has(bust));
}

/** Drops a player and settles any claims that can no longer be decided without them. */
function removePlayer(game: StoredGame, leaving: StoredPlayer): void {
  game.players = game.players.filter((player) => player.id !== leaving.id);
  if (game.status === 'draft') updateGroupRules(game);
  // Busts can't be answered without both players.
  for (const bust of game.busts ?? []) {
    if (bust.result === 'pending' && (bust.catcherId === leaving.id || bust.playerId === leaving.id)) {
      bust.result = 'expired';
    }
  }
  // A finisher who leaves gives up their place; everyone behind moves up.
  if (leaving.place) {
    game.players
      .filter((player) => player.place)
      .sort((left, right) => (left.place ?? 0) - (right.place ?? 0))
      .forEach((player, index) => {
        player.place = index + 1;
      });
  }
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
    } else if (dispute.phase === 'voting') {
      // A departing voter may have been the last vote outstanding.
      dispute.votes = dispute.votes.filter((vote) => vote.voterId !== leaving.id);
      if (dispute.votes.length >= eligibleVoterCount(game, dispute)) resolveVote(game, dispute);
    }
  }
  if (game.players.length > 0 && leaving.isHost) {
    game.players.forEach((player, index) => {
      player.isHost = index === 0;
    });
    game.hostId = game.players[0].id;
  }
  settlePodium(game);
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
    delete game.settings.podiumSize;
    return;
  }
  // Bigger groups get fewer swaps, so a swap never repeats another player's task.
  game.settings.swapsAllowed = getSwapsAllowed(game.packId, playerCount, handSize(playerCount));
  // Bigger groups play on for 2nd and 3rd instead of stopping at the first finisher.
  game.settings.podiumSize = podiumSize(playerCount);
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

/** A hand for someone joining mid-game: never a task another player already holds. */
function lateArrivalHand(game: StoredGame, count: number): Array<{ id: string; text: string; tips?: string }> {
  const taken = game.players.flatMap((player) => player.tasks.map((task) => task.templateId));
  const hand: Array<{ id: string; text: string; tips?: string }> = [];
  while (hand.length < count) {
    const next = getReplacementTask(game.packId, hand, false, taken);
    if (!next) break;
    hand.push(next);
  }
  return hand;
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
      const existing = game.players.find((player) => player.identityId === identityId);
      if (existing) break;
      if (game.status === 'ended') throw new GameRuleError('That game has already ended');
      if (game.players.length >= game.settings.maxPlayers) {
        throw new GameRuleError('This game is full');
      }
      const joining = newPlayer(identityId, game.gameId, body, false);
      if (game.players.some((player) => player.name.toLowerCase() === joining.name.toLowerCase())) {
        throw new GameRuleError('That name is already in use');
      }
      // Late arrivals jump straight into a live game with a full hand.
      if (game.status === 'live') {
        if (game.gameType === 'holiday-challenge') {
          joining.challengeScore = 0;
          joining.challengeCompletions = [];
        } else {
          const size = game.players[0]?.tasks.length || handSize(game.players.length + 1);
          joining.tasks = makeTasks(game, joining, lateArrivalHand(game, size));
          joining.swapsLeft = game.settings.swapsAllowed;
        }
      }
      game.players.push(joining);
      // Group-size rules settle at the start; a late arrival doesn't change them mid-game.
      if (game.status === 'draft') updateGroupRules(game);
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
      game.settings.targetScore = WINNING_SCORE;
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
      game.startedAt = now.toISOString();
      game.claimsOpenAt = new Date(
        now.getTime() + (game.settings.briefingMinutes ?? 0) * 60 * 1000,
      ).toISOString();
      changed = true;
      break;
    }

    case 'UPDATE_SETTINGS': {
      host(game, identityId);
      requireStatus(game, 'draft');
      const next = {
        ...game.settings,
        targetScore: WINNING_SCORE,
        disputeTimeoutSeconds: CLAIM_RESPONSE_SECONDS,
      };
      if (body.briefingMinutes !== undefined) {
        const briefing = Number(body.briefingMinutes);
        if (!BRIEFING_OPTIONS.includes(briefing)) throw new GameRuleError('Choose a listed settling-in time');
        next.briefingMinutes = briefing;
      }
      // Ignore obsolete score, length, and response choices from older clients.
      if (JSON.stringify(next) === JSON.stringify(game.settings)) break;
      game.settings = next;
      changed = true;
      break;
    }

    case 'OPEN_CLAIMS': {
      host(game, identityId);
      requireStatus(game, 'live');
      if (!game.claimsOpenAt || new Date(game.claimsOpenAt) <= now) break;
      game.claimsOpenAt = now.toISOString();
      changed = true;
      break;
    }

    case 'PAUSE': {
      host(game, identityId);
      requireStatus(game, 'live');
      if (game.pausedAt) break;
      game.pausedAt = now.toISOString();
      changed = true;
      break;
    }

    case 'RESUME': {
      host(game, identityId);
      requireStatus(game, 'live');
      if (!game.pausedAt) break;
      // Push every running clock forward by however long play was paused.
      const pausedFor = Math.max(0, now.getTime() - new Date(game.pausedAt).getTime());
      const shift = (iso: string) => new Date(new Date(iso).getTime() + pausedFor).toISOString();
      for (const dispute of game.disputes) {
        if (dispute.result === 'pending') dispute.closesAt = shift(dispute.closesAt);
      }
      for (const bust of game.busts ?? []) {
        if (bust.result === 'pending') bust.closesAt = shift(bust.closesAt);
      }
      if (game.claimsOpenAt && new Date(game.claimsOpenAt) > new Date(game.pausedAt)) {
        game.claimsOpenAt = shift(game.claimsOpenAt);
      }
      delete game.pausedAt;
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
      removePlayer(game, leaving);
      if (game.players.length === 0) deleteGame = true;
      changed = true;
      break;
    }

    case 'KICK': {
      const hostPlayer = host(game, identityId);
      if (game.status === 'ended') throw new GameRuleError('That game has already ended');
      const playerId = text(body.playerId, 'Player', 64);
      if (playerId === hostPlayer.id) throw new GameRuleError('Use Leave to remove yourself');
      const kicked = game.players.find((player) => player.id === playerId);
      if (!kicked) throw new GameRuleError('Player not found');
      removePlayer(game, kicked);
      changed = true;
      break;
    }

    case 'LINK_REMATCH': {
      member(game, identityId);
      requireStatus(game, 'ended');
      if (game.rematchGameId) break;
      game.rematchGameId = text(body.rematchGameId, 'Rematch', 6);
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
      // The lobby's profile editor can change the avatar at the same time.
      if (body.avatar !== undefined || body.avatarType !== undefined) {
        const { avatar, avatarType } = avatarFromPayload(body, identityId);
        player.avatar = avatar;
        player.avatarType = avatarType;
      }
      changed = true;
      break;
    }

    case 'SET_READY': {
      requireStatus(game, 'draft');
      const player = member(game, identityId);
      const ready = body.ready === true;
      if (player.lockedIn === ready) break;
      player.lockedIn = ready;
      changed = true;
      break;
    }

    case 'TRANSFER_HOST': {
      const current = host(game, identityId);
      if (game.status === 'ended') throw new GameRuleError('That game has already ended');
      const playerId = text(body.playerId, 'Player', 64);
      const next = game.players.find((player) => player.id === playerId);
      if (!next) throw new GameRuleError('Player not found');
      if (next.id === current.id) break;
      current.isHost = false;
      next.isHost = true;
      game.hostId = next.id;
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
      if (player.place) {
        throw new GameRuleError(
          `You've already finished ${ordinal(player.place)} — no more claims. You can still vote on disputes.`,
        );
      }
      requirePlayable(game, now);
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
      const openBust = game.busts?.find(
        (bust) => bust.result === 'pending' && bust.playerId === player.id && bust.catcherId === targetId,
      );
      if (outcome !== 'success' && openBust) {
        // Reported by hand while that player's bust was waiting: it's the same catch.
        confirmBust(openBust, player, task, now);
      } else if (outcome !== 'success') {
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
            now.getTime() + CLAIM_RESPONSE_SECONDS * 1000,
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
      const target = member(game, identityId);
      const taskId = text(body.taskId, 'Task', 64);
      const claims = game.disputes.filter(
        (candidate) => candidate.taskInstanceId === taskId && candidate.targetId === target.id,
      );
      // The timer ran out (or another tap landed) first: the claim already stands.
      if (claims.some((candidate) => candidate.phase === 'response' && candidate.result === 'upheld')) {
        break;
      }
      requireStatus(game, 'live');
      const dispute = claims.find(
        (candidate) => candidate.phase === 'response' && candidate.result === 'pending',
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
      requireNotPaused(game, 'Disputes are on hold while the game is paused — you can still accept');
      if (eligibleVoterCount(game, dispute) === 0) {
        throw new GameRuleError('There is nobody else to vote — settle this one out loud');
      }
      dispute.phase = 'voting';
      dispute.description = optionalText(body.reason, 100);
      dispute.closesAt = new Date(
        now.getTime() + CLAIM_RESPONSE_SECONDS * 1000,
      ).toISOString();
      changed = true;
      break;
    }

    case 'VOTE_DISPUTE': {
      requireStatus(game, 'live');
      const voter = member(game, identityId);
      requireNotPaused(game, 'Voting is on hold while the game is paused');
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
      if (dispute.votes.length >= eligibleVoterCount(game, dispute)) resolveVote(game, dispute);
      changed = true;
      break;
    }

    case 'COMPLETE_CHALLENGE': {
      requireStatus(game, 'live');
      if (game.gameType !== 'holiday-challenge') {
        throw new GameRuleError('This is not a Holiday Challenge game');
      }
      const player = member(game, identityId);
      requirePlayable(game, now);
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

    case 'SAVE_PUSH': {
      const player = member(game, identityId);
      // The iPhone app registers with Apple instead of a browser push service.
      if ('apnsToken' in body) {
        if (body.apnsToken == null) {
          if (!player.apns) break;
          delete player.apns;
        } else {
          const token = parseApnsToken(body.apnsToken);
          if (!token) throw new GameRuleError('Notifications from this phone are not supported');
          if (player.apns === token) break;
          player.apns = token;
        }
        changed = true;
        break;
      }
      if (body.subscription == null) {
        if (!player.push) break;
        delete player.push;
      } else {
        const subscription = parsePushSubscription(body.subscription);
        if (!subscription) throw new GameRuleError('Notifications from this browser are not supported');
        if (
          player.push?.endpoint === subscription.endpoint &&
          player.push.p256dh === subscription.p256dh &&
          player.push.auth === subscription.auth
        ) {
          break;
        }
        player.push = subscription;
      }
      changed = true;
      break;
    }

    case 'CALL_BUST': {
      requireStatus(game, 'live');
      if (game.gameType === 'holiday-challenge') {
        throw new GameRuleError('There are no secret missions to bust in this game');
      }
      const catcher = member(game, identityId);
      requirePlayable(game, now);
      const playerId = text(body.playerId, 'Player', 64);
      if (playerId === catcher.id) {
        throw new GameRuleError('Caught yourself? Tap the mission and I Got Caught instead');
      }
      const suspect = game.players.find((player) => player.id === playerId);
      if (!suspect) throw new GameRuleError('Player not found');
      if (suspect.place) throw new GameRuleError(`${suspect.name} has already finished — no missions left to bust`);
      if (!suspect.tasks.some((task) => task.status === 'pending')) {
        throw new GameRuleError(`${suspect.name} has no open missions left to bust`);
      }
      const busts = game.busts ?? [];
      if (busts.some((bust) => bust.result === 'pending' && bust.catcherId === catcher.id)) {
        throw new GameRuleError('Wait for your last bust to be answered first');
      }
      if (busts.some((bust) => bust.result === 'pending' && bust.playerId === suspect.id)) {
        throw new GameRuleError(`Someone's already busting ${suspect.name} — wait for their answer`);
      }
      busts.push({
        id: randomUUID(),
        catcherId: catcher.id,
        playerId: suspect.id,
        openedAt: now.toISOString(),
        closesAt: new Date(now.getTime() + BUST_RESPONSE_SECONDS * 1000).toISOString(),
        result: 'pending',
      });
      game.busts = busts;
      trimBusts(game);
      changed = true;
      break;
    }

    case 'ANSWER_BUST': {
      requireStatus(game, 'live');
      const suspect = member(game, identityId);
      const bustId = text(body.bustId, 'Bust', 64);
      const bust = game.busts?.find((candidate) => candidate.id === bustId && candidate.playerId === suspect.id);
      if (!bust || bust.result !== 'pending') throw new GameRuleError('That bust has already been settled');
      if (body.taskId == null) {
        bust.result = 'denied';
        bust.settledAt = now.toISOString();
      } else {
        const task = findTask(game, suspect, body.taskId);
        if (task.status !== 'pending') throw new GameRuleError('Pick one of your open missions');
        confirmBust(bust, suspect, task, now);
      }
      changed = true;
      break;
    }

    case 'RATE_MISSION': {
      requireStatus(game, 'ended');
      const player = member(game, identityId);
      const task = findTask(game, player, body.taskId);
      if (body.rating != null && body.rating !== 'up' && body.rating !== 'down') {
        throw new GameRuleError('Rate a mission up or down');
      }
      const rating = body.rating as 'up' | 'down' | null | undefined;
      if ((task.rating ?? null) === (rating ?? null)) break;
      if (rating) task.rating = rating;
      else delete task.rating;
      changed = true;
      break;
    }

    default:
      throw new GameRuleError('Unknown game action');
  }

  if (game.status === 'ended' && source.status !== 'ended') game.endedAt = now.toISOString();

  if (changed) {
    // Older stored settings cannot change new claim deadlines. Existing open
    // claims retain their recorded closesAt, including any pause adjustment.
    game.settings.disputeTimeoutSeconds = CLAIM_RESPONSE_SECONDS;
    game.settings.targetScore = WINNING_SCORE;
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
  mediaUrl: (key: string) => Promise<string>,
  now = new Date(),
): Promise<{ gameId: string; revision: number; payload: unknown }> {
  const current = member(game, identityId);
  // Once the game is over every dossier is declassified for the reveal.
  const revealAll = game.status === 'ended';
  const publicPlayers = await Promise.all(
    game.players.map(async (player) => {
      const visibleTasks =
        player.id === current.id || revealAll
          ? player.tasks
          : player.tasks.filter(
              (task) => task.status === 'completed' || task.status === 'failed',
            );
      const avatar =
        player.avatarType === 'photo' && player.avatar
          ? await mediaUrl(player.avatar)
          : player.avatar;
      const { identityId: _identityId, push: _push, apns: _apns, device: _device, ...safePlayer } = player;
      return {
        ...safePlayer,
        avatar,
        // Only your own avatar key is needed (to carry a photo into a rematch).
        avatarKey: player.id === current.id && player.avatarType === 'photo' ? player.avatar : undefined,
        token: '',
        tasks: visibleTasks,
      };
    }),
  );
  const claimedTaskText = (dispute: StoredDispute) =>
    game.players
      .find((player) => player.id === dispute.accuserId)
      ?.tasks.find((task) => task.id === dispute.taskInstanceId)?.text;
  const challengeCompletions = await Promise.all(
    game.challengeCompletions.map(async ({ proofImageKey, ...completion }) => ({
      ...completion,
      proofUrl: proofImageKey ? await mediaUrl(proofImageKey) : undefined,
    })),
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
    settings: {
      ...game.settings,
      targetScore: WINNING_SCORE,
      disputeTimeoutSeconds: CLAIM_RESPONSE_SECONDS,
    },
    currentPhase: game.currentPhase,
    challengeCompletions,
    selectedChallenges: game.selectedChallenges,
    startedAt: game.startedAt,
    endedAt: game.endedAt,
    rematchGameId: game.rematchGameId,
    claimsOpenAt: game.claimsOpenAt,
    pausedAt: game.pausedAt,
  };
  return {
    gameId: game.gameId,
    revision: game.revision,
    payload: {
      // Lets every phone count down against the same clock.
      serverTime: now.toISOString(),
      game: gameView,
      currentPlayer: publicPlayers.find((player) => player.id === current.id),
      // A claimed mission is no longer secret: the target and jury need to see it.
      activeDisputes: game.disputes
        .filter((dispute) => dispute.result === 'pending')
        .map((dispute) => ({ ...dispute, taskText: claimedTaskText(dispute) })),
      // Only the two players involved see a bust: open ones, and ones settled in the
      // last few minutes so the catcher hears how it went.
      activeBusts: (game.busts ?? [])
        .filter((bust) => bust.catcherId === current.id || bust.playerId === current.id)
        .filter((bust) =>
          bust.result === 'pending'
            ? new Date(bust.closesAt) > now
            : !!bust.settledAt && now.getTime() - new Date(bust.settledAt).getTime() < 5 * 60 * 1000,
        )
        .map(({ id, catcherId, playerId, openedAt, closesAt, result, taskInstanceId }) => ({
          id,
          catcherId,
          playerId,
          openedAt,
          closesAt,
          result,
          taskInstanceId,
        })),
    },
  };
}

/** Name and avatar to carry from a finished game into its rematch. */
export function rematchPlayerPayload(game: StoredGame, identityId: string): {
  name: string;
  avatar?: string;
  avatarType?: 'emoji' | 'photo';
  device?: PlayerDevice;
  packId?: string;
} {
  const player = member(game, identityId);
  requireStatus(game, 'ended');
  return {
    name: player.name,
    avatar: player.avatar,
    avatarType: player.avatarType,
    device: player.device,
    packId: game.settings.selectedPack || undefined,
  };
}

export function challengeNeedsProof(challengeId: string): boolean {
  return Boolean(
    getAllHolidayChallenges().find((challenge) => challenge.id === challengeId)?.requiresProof,
  );
}
