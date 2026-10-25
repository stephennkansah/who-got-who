// Web Push with Node's own crypto: message encryption (RFC 8291) and
// VAPID sender identification (RFC 8292). No push SDK or paid service needed.
import {
  createCipheriv,
  createECDH,
  createHmac,
  createPrivateKey,
  randomBytes,
  sign,
} from 'node:crypto';

export type PushSubscriptionKeys = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

/** The app's own sender key pair, base64url: 65-byte public point, 32-byte private scalar. */
export type VapidKeys = { publicKey: string; privateKey: string };

export type PushOptions = { ttlSeconds: number; urgency?: 'normal' | 'high' };

const RECORD_SIZE = 4096;

/** Browsers' push services. The Lambda only ever posts to these hosts. */
const PUSH_HOSTS = [
  /^fcm\.googleapis\.com$/,
  /^android\.googleapis\.com$/,
  /(^|\.)push\.apple\.com$/,
  /(^|\.)push\.services\.mozilla\.com$/,
  /(^|\.)notify\.windows\.com$/,
];

const b64 = (value: Buffer) => value.toString('base64url');
const unb64 = (value: string) => Buffer.from(value, 'base64url');

/** HKDF-SHA-256 for outputs of at most one hash block, as RFC 8291 uses it. */
function hkdf(salt: Buffer, ikm: Buffer, info: Buffer, length: number): Buffer {
  const prk = createHmac('sha256', salt).update(ikm).digest();
  return createHmac('sha256', prk).update(Buffer.concat([info, Buffer.from([1])])).digest().subarray(0, length);
}

/** A browser's PushSubscription JSON, checked before it is stored. */
export function parsePushSubscription(value: unknown): PushSubscriptionKeys | null {
  const raw = value as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null;
  const endpoint = raw?.endpoint;
  const p256dh = raw?.keys?.p256dh;
  const auth = raw?.keys?.auth;
  if (typeof endpoint !== 'string' || typeof p256dh !== 'string' || typeof auth !== 'string') return null;
  if (endpoint.length > 1024 || p256dh.length > 128 || auth.length > 64) return null;
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || !PUSH_HOSTS.some((host) => host.test(url.hostname))) return null;
  const publicKey = unb64(p256dh);
  if (publicKey.length !== 65 || publicKey[0] !== 4 || unb64(auth).length !== 16) return null;
  return { endpoint, p256dh, auth };
}

export function generateVapidKeys(): VapidKeys {
  const ecdh = createECDH('prime256v1');
  ecdh.generateKeys();
  return { publicKey: b64(ecdh.getPublicKey()), privateKey: b64(ecdh.getPrivateKey()) };
}

/** Encrypts one push message for a subscription (aes128gcm, single record). */
export function encryptPayload(
  plaintext: Buffer,
  subscriberPublicKey: Buffer,
  authSecret: Buffer,
  fixed: { senderPrivateKey?: Buffer; salt?: Buffer } = {},
): Buffer {
  const ecdh = createECDH('prime256v1');
  if (fixed.senderPrivateKey) ecdh.setPrivateKey(fixed.senderPrivateKey);
  else ecdh.generateKeys();
  const senderPublicKey = ecdh.getPublicKey();
  const salt = fixed.salt ?? randomBytes(16);
  const sharedSecret = ecdh.computeSecret(subscriberPublicKey);
  const keyInfo = Buffer.concat([Buffer.from('WebPush: info\0'), subscriberPublicKey, senderPublicKey]);
  const ikm = hkdf(authSecret, sharedSecret, keyInfo, 32);
  const contentKey = hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
  const nonce = hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
  if (plaintext.length + 1 + 16 > RECORD_SIZE) throw new Error('Push message is too long');

  const cipher = createCipheriv('aes-128-gcm', contentKey, nonce);
  const ciphertext = Buffer.concat([
    cipher.update(Buffer.concat([plaintext, Buffer.from([2])])), // 0x02 marks the last record
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  const header = Buffer.alloc(21);
  salt.copy(header, 0);
  header.writeUInt32BE(RECORD_SIZE, 16);
  header.writeUInt8(senderPublicKey.length, 20);
  return Buffer.concat([header, senderPublicKey, ciphertext]);
}

/** `Authorization` header value identifying this app to the push service. */
export function vapidAuthorization(
  endpoint: string,
  keys: VapidKeys,
  subject: string,
  now = Date.now(),
): string {
  const publicKey = unb64(keys.publicKey);
  const privateScalar = unb64(keys.privateKey);
  const signingKey = createPrivateKey({
    format: 'jwk',
    key: {
      kty: 'EC',
      crv: 'P-256',
      d: b64(Buffer.concat([Buffer.alloc(32 - privateScalar.length), privateScalar])),
      x: b64(publicKey.subarray(1, 33)),
      y: b64(publicKey.subarray(33, 65)),
    },
  });
  const header = b64(Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = b64(
    Buffer.from(
      JSON.stringify({
        aud: new URL(endpoint).origin,
        exp: Math.floor(now / 1000) + 12 * 60 * 60,
        sub: subject,
      }),
    ),
  );
  const signature = sign('sha256', Buffer.from(`${header}.${claims}`), {
    key: signingKey,
    dsaEncoding: 'ieee-p1363',
  });
  return `vapid t=${header}.${claims}.${b64(signature)}, k=${keys.publicKey}`;
}

/** Sends one push. Resolves with the push service's HTTP status (201 = accepted). */
export async function sendWebPush(
  subscription: PushSubscriptionKeys,
  message: Record<string, unknown>,
  keys: VapidKeys,
  subject: string,
  options: PushOptions,
  post: typeof fetch = fetch,
): Promise<number> {
  const body = encryptPayload(
    Buffer.from(JSON.stringify(message)),
    unb64(subscription.p256dh),
    unb64(subscription.auth),
  );
  const response = await post(subscription.endpoint, {
    method: 'POST',
    headers: {
      Authorization: vapidAuthorization(subscription.endpoint, keys, subject),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(options.ttlSeconds),
      Urgency: options.urgency ?? 'normal',
    },
    // Same bytes; a plain Uint8Array satisfies fetch's BodyInit type where Buffer doesn't.
    body: new Uint8Array(body),
    signal: AbortSignal.timeout(3000),
  });
  return response.status;
}
