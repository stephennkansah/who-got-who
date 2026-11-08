// Apple Push Notification service for the iPhone app, with Node's own HTTP/2
// and crypto: a token-signed (ES256 JWT) POST per alert. No push SDK needed.
import { connect, type ClientHttp2Session } from 'node:http2';
import { createPrivateKey, sign } from 'node:crypto';

export type ApnsConfig = {
  /** The 10-character ID of the APNs auth key (developer.apple.com → Keys). */
  keyId: string;
  /** The Apple developer team that owns the key and the app. */
  teamId: string;
  /** The key itself, as PEM. */
  privateKey: string;
  /** The app's bundle ID. */
  topic: string;
  host?: string;
};

export type ApnsAlert = { title: string; body: string; tag: string; gameId: string };
export type ApnsOptions = { ttlSeconds: number; urgency?: 'normal' | 'high' };

const PRODUCTION_HOST = 'api.push.apple.com';

/** An iPhone's device token as the Capacitor plugin reports it: hex. */
export function parseApnsToken(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const token = value.trim().toLowerCase();
  return /^[0-9a-f]{64,200}$/.test(token) ? token : null;
}

/**
 * Accepts the .p8 key however it was pasted into the console: whole PEM, PEM with
 * literal "\n", or just the base64 body on one line.
 */
export function apnsKeyPem(raw: string): string {
  const body = raw
    .replace(/\\n/g, '\n')
    .replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  const lines = body.match(/.{1,64}/g) ?? [];
  return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----\n`;
}

/** Reads APNS_* settings; null (alerts off) until the key is set up. */
export function apnsConfigFromEnv(env: NodeJS.ProcessEnv): ApnsConfig | null {
  const keyId = env.APNS_KEY_ID?.trim();
  const raw = env.APNS_PRIVATE_KEY?.trim();
  if (!keyId || !raw) return null;
  return {
    keyId,
    teamId: env.APNS_TEAM_ID?.trim() || 'T3PAKNXT8A',
    privateKey: apnsKeyPem(raw),
    topic: env.APNS_TOPIC?.trim() || 'club.whogotwho.app',
  };
}

const b64 = (value: Buffer | string) => Buffer.from(value).toString('base64url');

let cachedJwt: { key: string; token: string; issuedAt: number } | null = null;

/**
 * The provider token Apple expects: refreshed every 40 minutes (Apple rejects ones
 * older than an hour, and throttles ones renewed more often than every 20).
 */
export function apnsJwt(config: ApnsConfig, now = Date.now()): string {
  const cacheKey = `${config.teamId}:${config.keyId}`;
  if (cachedJwt && cachedJwt.key === cacheKey && now - cachedJwt.issuedAt < 40 * 60 * 1000) return cachedJwt.token;
  const issuedAt = Math.floor(now / 1000);
  const unsigned = `${b64(JSON.stringify({ alg: 'ES256', kid: config.keyId }))}.${b64(JSON.stringify({ iss: config.teamId, iat: issuedAt }))}`;
  const signature = sign('sha256', Buffer.from(unsigned), {
    key: createPrivateKey(config.privateKey),
    dsaEncoding: 'ieee-p1363',
  });
  const token = `${unsigned}.${b64(signature)}`;
  cachedJwt = { key: cacheKey, token, issuedAt: now };
  return token;
}

/** The notification as Apple wants it; alerts from one game group together. */
export function apnsPayload(alert: ApnsAlert): string {
  return JSON.stringify({
    aps: { alert: { title: alert.title, body: alert.body }, sound: 'default', 'thread-id': `game-${alert.gameId}` },
    gameId: alert.gameId,
    tag: alert.tag,
  });
}

function post(session: ClientHttp2Session, token: string, alert: ApnsAlert, jwt: string, config: ApnsConfig, options: ApnsOptions): Promise<number> {
  return new Promise((resolve, reject) => {
    const request = session.request({
      ':method': 'POST',
      ':path': `/3/device/${token}`,
      authorization: `bearer ${jwt}`,
      'apns-topic': config.topic,
      'apns-push-type': 'alert',
      'apns-priority': options.urgency === 'high' ? '10' : '5',
      'apns-expiration': String(Math.floor(Date.now() / 1000) + options.ttlSeconds),
      // Same tag as the in-app and web alerts, so a phone shows one entry per event.
      'apns-collapse-id': alert.tag.slice(0, 64),
      'content-type': 'application/json',
    });
    let status = 0;
    request.setTimeout(8000, () => request.close());
    request.on('response', (headers) => {
      status = Number(headers[':status']) || 0;
    });
    request.on('data', () => undefined);
    request.on('end', () => resolve(status));
    request.on('close', () => resolve(status));
    request.on('error', reject);
    request.end(apnsPayload(alert));
  });
}

/** Sends a batch of alerts over one connection. Resolves with each HTTP status (0 = no answer). */
export async function sendApns(
  items: Array<{ token: string; alert: ApnsAlert; options: ApnsOptions }>,
  config: ApnsConfig,
): Promise<number[]> {
  if (!items.length) return [];
  const jwt = apnsJwt(config);
  const session = connect(`https://${config.host ?? PRODUCTION_HOST}`);
  session.on('error', () => undefined); // each request reports its own failure
  try {
    const results = await Promise.allSettled(items.map((item) => post(session, item.token, item.alert, jwt, config, item.options)));
    return results.map((result) => (result.status === 'fulfilled' ? result.value : 0));
  } finally {
    session.close();
  }
}
