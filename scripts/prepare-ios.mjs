import { writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// This is the same PUBLIC client configuration downloaded by the website.
// Signing credentials never belong in this file or in the application bundle.
const response = await fetch('https://whogotwho.club/amplify_outputs.json', {
  signal: AbortSignal.timeout(30_000),
});
if (!response.ok) throw new Error(`Public backend configuration returned ${response.status}`);
const config = await response.json();
if (!config?.auth?.identity_pool_id || !config?.data?.url?.startsWith('https://')) {
  throw new Error('Live client configuration is incomplete; refusing to build an unusable app');
}
const json = JSON.stringify(config, null, 2) + '\n';
await writeFile(new URL('../public/amplify_outputs.json', import.meta.url), json);
console.log(`Public client configuration prepared (SHA-256 ${createHash('sha256').update(json).digest('hex')})`);
