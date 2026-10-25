import { defineFunction } from '@aws-amplify/backend';

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
  },
  logging: {
    format: 'json',
    level: 'info',
    retention: '1 month',
  },
});
