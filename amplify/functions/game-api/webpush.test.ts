import assert from 'node:assert/strict';
import { createPublicKey, verify } from 'node:crypto';
import {
  encryptPayload,
  generateVapidKeys,
  parsePushSubscription,
  sendWebPush,
  vapidAuthorization,
} from './webpush';

const unb64 = (value: string) => Buffer.from(value, 'base64url');

async function run() {
  {
    // RFC 8291 section 5 / appendix A: the exact bytes a conforming sender produces.
    const body = encryptPayload(
      Buffer.from('When I grow up, I want to be a watermelon'),
      unb64('BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4'),
      unb64('BTBZMqHH6r4Tts7J_aSIgg'),
      {
        senderPrivateKey: unb64('yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw'),
        salt: unb64('DGv6ra1nlYgDCS1FRnbzlw'),
      },
    );
    assert.equal(
      body.toString('base64url'),
      'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN',
    );
  }

  {
    // RFC 8292: a JWT the push service can verify with the public key we hand out.
    const keys = generateVapidKeys();
    const header = vapidAuthorization('https://fcm.googleapis.com/fcm/send/abc', keys, 'https://whogotwho.club', 0);
    const match = /^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/.exec(header);
    assert.ok(match, 'header has the vapid t=…, k=… shape');
    const [, jwtHeader, claims, signature, publicKey] = match;
    assert.equal(publicKey, keys.publicKey);
    assert.deepEqual(JSON.parse(unb64(claims).toString()), {
      aud: 'https://fcm.googleapis.com',
      exp: 12 * 60 * 60,
      sub: 'https://whogotwho.club',
    });
    const point = unb64(keys.publicKey);
    const verifier = createPublicKey({
      format: 'jwk',
      key: {
        kty: 'EC',
        crv: 'P-256',
        x: point.subarray(1, 33).toString('base64url'),
        y: point.subarray(33, 65).toString('base64url'),
      },
    });
    assert.ok(
      verify('sha256', Buffer.from(`${jwtHeader}.${claims}`), { key: verifier, dsaEncoding: 'ieee-p1363' }, unb64(signature)),
      'the signature verifies',
    );
  }

  {
    // Only real browser push services are accepted, with well-formed keys.
    const keys = { p256dh: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4', auth: 'BTBZMqHH6r4Tts7J_aSIgg' };
    for (const endpoint of [
      'https://fcm.googleapis.com/fcm/send/abc',
      'https://web.push.apple.com/QGcd',
      'https://updates.push.services.mozilla.com/wpush/v2/abc',
      'https://wns2-par02p.notify.windows.com/w/?token=abc',
    ]) {
      assert.ok(parsePushSubscription({ endpoint, keys }), endpoint);
    }
    for (const endpoint of [
      'http://fcm.googleapis.com/fcm/send/abc',
      'https://evil.example.com/push',
      'https://push.apple.com.evil.example/x',
      'https://169.254.169.254/latest/meta-data',
    ]) {
      assert.equal(parsePushSubscription({ endpoint, keys }), null, endpoint);
    }
    assert.equal(parsePushSubscription({ endpoint: 'https://fcm.googleapis.com/x', keys: { ...keys, auth: 'short' } }), null);
    assert.equal(parsePushSubscription(null), null);
  }

  {
    // The request carries what push services require.
    const keys = generateVapidKeys();
    let seen: { url: string; init: RequestInit } | undefined;
    const status = await sendWebPush(
      { endpoint: 'https://web.push.apple.com/abc', p256dh: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4', auth: 'BTBZMqHH6r4Tts7J_aSIgg' },
      { title: 'Gotcha claimed!' },
      keys,
      'https://whogotwho.club',
      { ttlSeconds: 120, urgency: 'high' },
      (async (url: string, init: RequestInit) => {
        seen = { url, init };
        return { status: 201 } as Response;
      }) as unknown as typeof fetch,
    );
    assert.equal(status, 201);
    assert.equal(seen?.url, 'https://web.push.apple.com/abc');
    const headers = seen?.init.headers as Record<string, string>;
    assert.equal(headers['Content-Encoding'], 'aes128gcm');
    assert.equal(headers.TTL, '120');
    assert.equal(headers.Urgency, 'high');
    assert.match(headers.Authorization, /^vapid t=.+, k=/);
  }

  console.log('Web push checks passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
