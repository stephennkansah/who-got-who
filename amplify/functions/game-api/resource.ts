import { defineFunction, secret } from '@aws-amplify/backend';

// Lock-screen alerts in the iPhone app (Apple Push Notification service).
// Off until set up, so deploys keep working before the Apple key exists:
//   1. Amplify console → Hosting → Secrets: APNS_PRIVATE_KEY = the .p8 key's contents.
//   2. Hosting → Environment variables: APNS_KEY_ID = the key's 10-character ID,
//      and APNS_ENABLED = true. Then redeploy. See IOS_RELEASE.md.
// The key is a secret (read at runtime), never written into the deploy templates.
const apnsEnabled = process.env.APNS_ENABLED === 'true';

export const gameApi = defineFunction({
  name: 'who-got-who-game-api',
  entry: './handler.ts',
  runtime: 22,
  timeoutSeconds: 15,
  memoryMB: 512,
  environment: {
    // Passcode for the private /stats page. Set STATS_ADMIN_KEY in the Amplify
    // console (Hosting → Environment variables) and redeploy; empty means off.
    STATS_ADMIN_KEY: process.env.STATS_ADMIN_KEY ?? '',
    ...(apnsEnabled
      ? {
          APNS_KEY_ID: process.env.APNS_KEY_ID ?? '',
          APNS_PRIVATE_KEY: secret('APNS_PRIVATE_KEY'),
        }
      : {}),
  },
  logging: {
    format: 'json',
    level: 'info',
    retention: '1 month',
  },
});
