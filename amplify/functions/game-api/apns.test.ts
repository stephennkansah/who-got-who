import assert from 'node:assert/strict';
import { generateKeyPairSync, verify } from 'node:crypto';
import { apnsConfigFromEnv, apnsJwt, apnsKeyPem, apnsPayload, parseApnsToken } from './apns';
import { applyAction, createGame, GameRuleError, projectGameView, type StoredGame } from './domain';

let sequence = 0;
const request = () => `apns-${++sequence}`;

async function run() {
  // Device tokens: hex only, normalised to lower case.
  const token = 'A'.repeat(64);
  assert.equal(parseApnsToken(token), 'a'.repeat(64));
  assert.equal(parseApnsToken('xyz'), null);
  assert.equal(parseApnsToken('ab'.repeat(20)), null, 'too short');
  assert.equal(parseApnsToken(42), null);

  // The .p8 key works whether pasted as PEM, with literal \n, or as one base64 line.
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  const oneLine = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  for (const pasted of [pem, pem.replace(/\n/g, '\\n'), oneLine]) {
    assert.equal(apnsKeyPem(pasted).replace(/\s+/g, ''), pem.replace(/\s+/g, ''));
  }

  // Off until both settings exist; team and app default to Who Got Who's.
  assert.equal(apnsConfigFromEnv({}), null);
  assert.equal(apnsConfigFromEnv({ APNS_KEY_ID: 'ABC123DEFG' }), null);
  const config = apnsConfigFromEnv({ APNS_KEY_ID: 'ABC123DEFG', APNS_PRIVATE_KEY: oneLine })!;
  assert.equal(config.teamId, 'T3PAKNXT8A');
  assert.equal(config.topic, 'club.whogotwho.app');

  // The provider token is an ES256 JWT Apple can verify with the key.
  const now = Date.UTC(2026, 10, 8, 12);
  const jwt = apnsJwt(config, now);
  const [header, claims, signature] = jwt.split('.');
  assert.deepEqual(JSON.parse(Buffer.from(header, 'base64url').toString()), { alg: 'ES256', kid: 'ABC123DEFG' });
  assert.deepEqual(JSON.parse(Buffer.from(claims, 'base64url').toString()), { iss: 'T3PAKNXT8A', iat: now / 1000 });
  assert.ok(
    verify('sha256', Buffer.from(`${header}.${claims}`), { key: publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(signature, 'base64url')),
  );
  assert.equal(apnsJwt(config, now + 30 * 60 * 1000), jwt, 'reused for 40 minutes');
  assert.notEqual(apnsJwt(config, now + 41 * 60 * 1000), jwt, 'then renewed');

  const payload = JSON.parse(apnsPayload({ title: 'Busted?', body: 'Jordan says…', tag: 'bust-1', gameId: 'ABC234' }));
  assert.deepEqual(payload.aps.alert, { title: 'Busted?', body: 'Jordan says…' });
  assert.equal(payload.aps['thread-id'], 'game-ABC234');
  assert.equal(payload.aps.sound, 'default');

  // The game stores an iPhone's token, refuses junk, and never shows it to anyone.
  let game: StoredGame = createGame('APN234', 'phone-a', { name: 'A' }, request());
  game = (await applyAction(game, 'JOIN', 'phone-b', { name: 'B' }, request())).game;
  game = (await applyAction(game, 'SAVE_PUSH', 'phone-a', { apnsToken: token }, request())).game;
  assert.equal(game.players[0].apns, 'a'.repeat(64));
  await assert.rejects(
    () => applyAction(game, 'SAVE_PUSH', 'phone-a', { apnsToken: 'not-a-token' }, request()),
    (error: unknown) => error instanceof GameRuleError && /not supported/.test(error.message),
  );
  const same = await applyAction(game, 'SAVE_PUSH', 'phone-a', { apnsToken: token }, request());
  assert.equal(same.changed, false);
  for (const viewer of ['phone-a', 'phone-b']) {
    const view = await projectGameView(game, viewer, async (key) => key);
    assert.ok(!JSON.stringify(view).includes('a'.repeat(64)), 'tokens stay on the server');
  }
  game = (await applyAction(game, 'SAVE_PUSH', 'phone-a', { apnsToken: null }, request())).game;
  assert.equal(game.players[0].apns, undefined);

  console.log('Apple push checks passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
