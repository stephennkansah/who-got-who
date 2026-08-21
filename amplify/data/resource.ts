import { a, defineData, type ClientSchema } from '@aws-amplify/backend';
import { gameApi } from '../functions/game-api/resource';

const schema = a.schema({
  GameView: a.customType({
    gameId: a.string().required(),
    revision: a.integer().required(),
    payload: a.json().required(),
  }),

  GameEvent: a.customType({
    gameId: a.string().required(),
    revision: a.integer().required(),
  }),

  getGameView: a
    .query()
    .arguments({ gameId: a.string().required() })
    .returns(a.ref('GameView'))
    .authorization((allow) => [allow.guest()])
    .handler(a.handler.function(gameApi)),

  gameAction: a
    .mutation()
    .arguments({
      action: a.string().required(),
      gameId: a.string(),
      requestId: a.string().required(),
      payload: a.json(),
    })
    .returns(a.ref('GameEvent'))
    .authorization((allow) => [allow.guest()])
    .handler(a.handler.function(gameApi)),

  onGameUpdated: a
    .subscription()
    .for(a.ref('gameAction'))
    .arguments({ gameId: a.string().required() })
    .handler(a.handler.custom({ entry: './game-updates.js' }))
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  name: 'WhoGotWhoData',
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'identityPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    },
  },
  logging: {
    fieldLogLevel: 'error',
    excludeVerboseContent: true,
  },
});
