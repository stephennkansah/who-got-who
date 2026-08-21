import { defineFunction } from '@aws-amplify/backend';

export const gameApi = defineFunction({
  name: 'who-got-who-game-api',
  entry: './handler.ts',
  runtime: 22,
  timeoutSeconds: 15,
  memoryMB: 512,
  logging: {
    format: 'json',
    level: 'info',
    retention: '1 month',
  },
});
