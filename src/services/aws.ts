import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import { uploadData } from 'aws-amplify/storage';

let configurationPromise: Promise<void> | null = null;
let gameClient: ReturnType<typeof generateClient<any>> | null = null;

export function configureAws(): Promise<void> {
  if (!configurationPromise) {
    configurationPromise = (async () => {
      const outputPath = `${process.env.PUBLIC_URL || ''}/amplify_outputs.json`;
      const response = await fetch(outputPath, { cache: 'no-store' });
      if (!response.ok) throw new Error('AWS configuration could not be loaded');
      const outputs = await response.json();
      if (!outputs?.auth?.identity_pool_id || !outputs?.data?.url) {
        throw new Error('AWS backend is not deployed. Run npm run sandbox for local development.');
      }
      Amplify.configure(outputs);
      await fetchAuthSession();
    })().catch((error) => {
      configurationPromise = null;
      throw error;
    });
  }
  return configurationPromise;
}

export async function getAwsGameClient(): Promise<ReturnType<typeof generateClient<any>>> {
  await configureAws();
  if (!gameClient) gameClient = generateClient<any>();
  return gameClient;
}

export async function getIdentityId(): Promise<string> {
  await configureAws();
  const session = await fetchAuthSession();
  if (!session.identityId) throw new Error('Could not establish an AWS guest identity');
  return session.identityId;
}

export async function uploadPrivateImage(
  path: string,
  file: Blob,
  contentType: string,
): Promise<string> {
  await configureAws();
  await uploadData({
    path,
    data: file,
    options: { contentType },
  }).result;
  return path;
}
