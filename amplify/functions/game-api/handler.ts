import type { AppSyncResolverHandler } from 'aws-lambda';
import { createHash } from 'node:crypto';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { ConditionalCheckFailedException, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { GetObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  applyAction,
  createGame,
  GameRuleError,
  INTERNAL_ACTIONS,
  projectGameView,
  rematchPlayerPayload,
  type GameActionName,
  type StoredGame,
} from './domain';
import { pushMessages } from './push';
import { generateVapidKeys, sendWebPush, type VapidKeys } from './webpush';

type ResolverArguments = {
  action?: string;
  gameId?: string;
  requestId?: string;
  payload?: unknown;
};

type ResolverEventShape = {
  arguments?: ResolverArguments;
  fieldName?: string;
  info?: { fieldName?: string };
};

type GameEvent = { gameId: string; revision: number };

const tableName = process.env.GAME_TABLE_NAME;
const rateLimitTableName = process.env.RATE_LIMIT_TABLE_NAME;
const bucketName = process.env.MEDIA_BUCKET_NAME;
if (!tableName) throw new Error('GAME_TABLE_NAME is not configured');
if (!rateLimitTableName) throw new Error('RATE_LIMIT_TABLE_NAME is not configured');
if (!bucketName) throw new Error('MEDIA_BUCKET_NAME is not configured');

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
const s3 = new S3Client({});
const GAME_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function deterministicGameCode(requestId: string, attempt: number): string {
  const bytes = createHash('sha256').update(`${requestId}:${attempt}`).digest();
  return Array.from(
    bytes.subarray(0, 6),
    (value) => GAME_CODE_ALPHABET[value % GAME_CODE_ALPHABET.length],
  ).join('');
}

function identityId(identity: unknown): string {
  const value = identity as
    | { cognitoIdentityId?: string; identityId?: string; sub?: string }
    | null
    | undefined;
  const id = value?.cognitoIdentityId || value?.identityId || value?.sub;
  if (!id) throw new GameRuleError('A Cognito guest identity is required');
  return id;
}

function gameCode(value: unknown): string {
  if (typeof value !== 'string') throw new GameRuleError('Game code is required');
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z2-9]{6}$/.test(normalized)) throw new GameRuleError('Invalid game code');
  return normalized;
}

function requestToken(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9-]{8,64}$/.test(value)) {
    throw new GameRuleError('Invalid request identifier');
  }
  return value;
}

function resolverOperation(event: ResolverEventShape): string {
  const explicitName = event.info?.fieldName || event.fieldName;
  if (explicitName) return explicitName;
  if (event.arguments?.action) return 'gameAction';
  if (event.arguments?.gameId) return 'getGameView';
  return 'unknown';
}

async function enforceRateLimit(
  ownerIdentity: string,
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const window = Math.floor(now / windowSeconds);
  try {
    await dynamo.send(
      new UpdateCommand({
        TableName: rateLimitTableName,
        Key: { key: `${ownerIdentity}:${bucket}:${window}` },
        UpdateExpression: 'SET expiresAt = :expires ADD #count :one',
        ConditionExpression: 'attribute_not_exists(#count) OR #count < :limit',
        ExpressionAttributeNames: { '#count': 'count' },
        ExpressionAttributeValues: {
          ':expires': now + windowSeconds * 2,
          ':one': 1,
          ':limit': limit,
        },
      }),
    );
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) {
      throw new GameRuleError('Too many requests; please wait a moment');
    }
    throw error;
  }
}

async function getStoredGame(id: string): Promise<StoredGame> {
  const result = await dynamo.send(
    new GetCommand({ TableName: tableName, Key: { gameId: id }, ConsistentRead: true }),
  );
  const game = result.Item as StoredGame | undefined;
  if (!game || game.expiresAt <= Math.floor(Date.now() / 1000)) {
    throw new GameRuleError('Game not found or expired');
  }
  return game;
}

async function create(payload: unknown, ownerIdentity: string, requestId: string): Promise<GameEvent> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const id = deterministicGameCode(requestId, attempt);
    const game = createGame(id, ownerIdentity, payload, requestId);
    try {
      await dynamo.send(
        new PutCommand({
          TableName: tableName,
          Item: game,
          ConditionExpression: 'attribute_not_exists(gameId)',
        }),
      );
      return { gameId: id, revision: game.revision };
    } catch (error) {
      if (!(error instanceof ConditionalCheckFailedException)) throw error;
      const existing = await dynamo.send(
        new GetCommand({ TableName: tableName, Key: { gameId: id }, ConsistentRead: true }),
      );
      const prior = existing.Item as StoredGame | undefined;
      if (prior?.requestIds.includes(requestId)) {
        return { gameId: id, revision: prior.revision };
      }
    }
  }
  throw new Error('Could not allocate a unique game code');
}

async function proofExists(key: string): Promise<boolean> {
  try {
    const result = await s3.send(
      new HeadObjectCommand({ Bucket: bucketName, Key: key }),
    );
    return Boolean(result.ContentLength && result.ContentLength <= 5 * 1024 * 1024) &&
      Boolean(result.ContentType?.startsWith('image/'));
  } catch {
    return false;
  }
}

/** Not a valid game code, so no client can ever read this row. It has no TTL. */
const VAPID_ROW = '#vapid-keys';
const VAPID_SUBJECT = 'https://whogotwho.club';
let vapidKeysPromise: Promise<VapidKeys> | null = null;

/** The app's push sender keys: made once on first use and kept in the game table. */
function vapidKeys(): Promise<VapidKeys> {
  if (!vapidKeysPromise) {
    vapidKeysPromise = (async () => {
      const read = async () =>
        (await dynamo.send(new GetCommand({ TableName: tableName, Key: { gameId: VAPID_ROW }, ConsistentRead: true })))
          .Item as (VapidKeys & { gameId: string }) | undefined;
      const existing = await read();
      if (existing?.publicKey && existing.privateKey) return existing;
      const created = generateVapidKeys();
      try {
        await dynamo.send(
          new PutCommand({
            TableName: tableName,
            Item: { gameId: VAPID_ROW, ...created },
            ConditionExpression: 'attribute_not_exists(gameId)',
          }),
        );
        return created;
      } catch (error) {
        if (!(error instanceof ConditionalCheckFailedException)) throw error;
        const winner = await read(); // another Lambda made them first
        if (!winner) throw error;
        return winner;
      }
    })().catch((error) => {
      vapidKeysPromise = null;
      throw error;
    });
  }
  return vapidKeysPromise;
}

/** Buzzes the phones this change concerns. Never fails the action that caused it. */
async function deliverPushes(before: StoredGame, after: StoredGame): Promise<void> {
  try {
    const messages = pushMessages(before, after).filter(
      (message) => after.players.find((player) => player.id === message.playerId)?.push,
    );
    if (!messages.length) return;
    const keys = await vapidKeys();
    const results = await Promise.allSettled(
      messages.map(({ playerId, title, body, tag, ttlSeconds, urgency }) =>
        sendWebPush(
          after.players.find((player) => player.id === playerId)!.push!,
          { title, body, tag, gameId: after.gameId },
          keys,
          VAPID_SUBJECT,
          { ttlSeconds, urgency },
        ),
      ),
    );
    const failed = results.filter((result) => result.status === 'rejected' || result.value >= 400).length;
    if (failed) console.warn('Some push notifications were not delivered', { failed, total: results.length });
  } catch (error) {
    console.error('Push notifications failed', { errorName: error instanceof Error ? error.name : 'UnknownError' });
  }
}

async function mutate(
  id: string,
  action: GameActionName,
  ownerIdentity: string,
  payload: unknown,
  requestId: string,
): Promise<GameEvent> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const existing = await getStoredGame(id);
    const result = await applyAction(
      existing,
      action,
      ownerIdentity,
      payload,
      requestId,
      new Date(),
      proofExists,
    );
    if (!result.changed) return { gameId: id, revision: existing.revision };
    try {
      if (result.deleteGame) {
        await dynamo.send(
          new DeleteCommand({
            TableName: tableName,
            Key: { gameId: id },
            ConditionExpression: '#revision = :revision',
            ExpressionAttributeNames: { '#revision': 'revision' },
            ExpressionAttributeValues: { ':revision': existing.revision },
          }),
        );
      } else {
        await dynamo.send(
          new PutCommand({
            TableName: tableName,
            Item: result.game,
            ConditionExpression: '#revision = :revision',
            ExpressionAttributeNames: { '#revision': 'revision' },
            ExpressionAttributeValues: { ':revision': existing.revision },
          }),
        );
        await deliverPushes(existing, result.game);
      }
      return { gameId: id, revision: result.game.revision };
    } catch (error) {
      if (!(error instanceof ConditionalCheckFailedException)) throw error;
    }
  }
  throw new GameRuleError('The game changed too quickly; please try again');
}

/**
 * Opens a fresh lobby for the same group and links it from the finished game.
 * Returns the finished game's event so everyone still on the results screen is
 * notified and can join with one tap.
 */
async function rematch(oldId: string, ownerIdentity: string, requestId: string): Promise<GameEvent> {
  const old = await getStoredGame(oldId);
  const { packId, ...player } = rematchPlayerPayload(old, ownerIdentity);
  if (old.rematchGameId) return { gameId: oldId, revision: old.revision };

  const created = await create(player, ownerIdentity, requestId);
  if (packId) {
    await mutate(created.gameId, 'SELECT_PACK', ownerIdentity, { packId }, `${requestId}-pack`);
  }
  const linked = await mutate(
    oldId,
    'LINK_REMATCH',
    ownerIdentity,
    { rematchGameId: created.gameId },
    requestId,
  );
  const after = await getStoredGame(oldId);
  if (after.rematchGameId !== created.gameId) {
    // Another player linked their rematch first; drop ours and let the client join theirs.
    await dynamo
      .send(new DeleteCommand({ TableName: tableName, Key: { gameId: created.gameId } }))
      .catch(() => undefined);
  }
  return linked;
}

function mediaUrl(key: string): Promise<string> {
  if (!key.startsWith('avatars/') && !key.startsWith('proofs/')) return Promise.resolve('');
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucketName, Key: key }), {
    expiresIn: 60 * 60,
  });
}

export const handler: AppSyncResolverHandler<ResolverArguments, unknown> = async (event) => {
  const operation = resolverOperation(event);
  try {
    const ownerIdentity = identityId(event.identity);
    if (operation === 'getGameView') {
      await enforceRateLimit(ownerIdentity, 'read', 180, 60);
      const id = gameCode(event.arguments.gameId);
      const game = await getStoredGame(id);
      const view = await projectGameView(game, ownerIdentity, mediaUrl);
      // Phones need the public sender key to subscribe; play goes on without it.
      const pushKey = await vapidKeys().then((keys) => keys.publicKey).catch(() => undefined);
      return { ...view, payload: { ...(view.payload as Record<string, unknown>), pushKey } };
    }

    if (operation !== 'gameAction') throw new GameRuleError('Unknown operation');
    await enforceRateLimit(ownerIdentity, 'action', 120, 60);
    const action = event.arguments.action;
    const requestId = requestToken(event.arguments.requestId);
    if (action === 'CREATE') {
      await enforceRateLimit(ownerIdentity, 'create', 10, 60 * 60);
      return create(event.arguments.payload, ownerIdentity, requestId);
    }
    if (!action || INTERNAL_ACTIONS.has(action)) throw new GameRuleError('Unknown game action');
    const id = gameCode(event.arguments.gameId);
    if (action === 'REMATCH') {
      await enforceRateLimit(ownerIdentity, 'create', 10, 60 * 60);
      return rematch(id, ownerIdentity, requestId);
    }
    return mutate(
      id,
      action as GameActionName,
      ownerIdentity,
      event.arguments.payload,
      requestId,
    );
  } catch (error) {
    if (error instanceof GameRuleError) throw error;
    console.error('Unexpected game API failure', {
      operation,
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    throw new Error('The game service is temporarily unavailable');
  }
};
