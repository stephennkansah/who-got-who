// Renders assets/branding/og-card.html to public/og-image.png (1200×630) with
// headless Edge or Chrome, so link previews use the app's real fonts and logo.
import { spawnSync } from 'node:child_process';
import { existsSync, rmSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const source = pathToFileURL(join(root, 'assets/branding/og-card.html')).href;
const output = join(root, 'public/og-image.png');

const browsers = [
  process.env.BROWSER_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].filter(Boolean);
const browser = browsers.find((path) => existsSync(path));
if (!browser) {
  console.error('No Edge or Chrome found. Set BROWSER_PATH to a Chromium browser.');
  process.exit(1);
}

rmSync(output, { force: true });
const result = spawnSync(browser, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--allow-file-access-from-files',
  `--screenshot=${output}`,
  '--window-size=1200,630',
  source,
], { stdio: 'inherit' });

// Edge's launcher can exit before the screenshot lands, so give it a moment.
for (let waited = 0; !existsSync(output) && waited < 15000; waited += 250) {
  await new Promise((resolve) => setTimeout(resolve, 250));
}
if (result.status !== 0 || !existsSync(output)) {
  console.error('Export failed.');
  process.exit(1);
}
// WhatsApp drops preview images much over 300 KB.
if (statSync(output).size > 300 * 1024) console.warn('Warning: image is over 300 KB; WhatsApp may skip it.');
console.log(`Wrote ${output} (${Math.round(statSync(output).size / 1024)} KB)`);
