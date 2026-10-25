import { defineBackend } from '@aws-amplify/backend';
import { AttributeType, BillingMode, Table, TableEncryption } from 'aws-cdk-lib/aws-dynamodb';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Function as LambdaFunction } from 'aws-cdk-lib/aws-lambda';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { gameApi } from './functions/game-api/resource';
import { storage } from './storage/resource';

const backend = defineBackend({
  auth,
  data,
  gameApi,
  storage,
});

const stateStack = backend.createStack('game-state');
const gameTable = new Table(stateStack, 'Games', {
  partitionKey: { name: 'gameId', type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
  encryption: TableEncryption.AWS_MANAGED,
  pointInTimeRecoverySpecification: {
    pointInTimeRecoveryEnabled: true,
  },
  timeToLiveAttribute: 'expiresAt',
  removalPolicy: RemovalPolicy.RETAIN,
});
const rateLimitTable = new Table(stateStack, 'RateLimits', {
  partitionKey: { name: 'key', type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
  encryption: TableEncryption.AWS_MANAGED,
  timeToLiveAttribute: 'expiresAt',
  removalPolicy: RemovalPolicy.DESTROY,
});

const lambda = backend.gameApi.resources.lambda;
const mutableLambda = lambda as LambdaFunction;
gameTable.grantReadWriteData(lambda);
rateLimitTable.grantReadWriteData(lambda);
mutableLambda.addEnvironment('GAME_TABLE_NAME', gameTable.tableName);
mutableLambda.addEnvironment('RATE_LIMIT_TABLE_NAME', rateLimitTable.tableName);

backend.storage.resources.bucket.grantRead(lambda, 'avatars/*');
backend.storage.resources.bucket.grantRead(lambda, 'proofs/*');
mutableLambda.addEnvironment(
  'MEDIA_BUCKET_NAME',
  backend.storage.resources.bucket.bucketName,
);

// Every player is a Cognito guest, but `allow.entity('identity')` in storage/resource.ts
// only grants the signed-in role. Give the guest role the same per-identity folders so
// photo avatars and challenge proofs can upload — each guest can only touch their own.
const mediaBucketArn = backend.storage.resources.bucket.bucketArn;
backend.auth.resources.unauthenticatedUserIamRole.addToPrincipalPolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
    resources: [
      `${mediaBucketArn}/avatars/\${cognito-identity.amazonaws.com:sub}/*`,
      `${mediaBucketArn}/proofs/\${cognito-identity.amazonaws.com:sub}/*`,
    ],
  }),
);

(backend.storage.resources.bucket as Bucket).addLifecycleRule({
  id: 'delete-expired-game-media',
  expiration: Duration.days(30),
  abortIncompleteMultipartUploadAfter: Duration.days(1),
});
