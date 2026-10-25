// Screenshot-only rendering of the shipping React components with fictional data.
// These assets replace a copy of the simulator app's web folder, never a release build.
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve(process.argv[2]);
await mkdir(output, { recursive: true });
await build({
  entryPoints: ['assets/store/preview.tsx'],
  bundle: true,
  outdir: output,
  loader: { '.woff2': 'file' },
  define: { 'process.env.PUBLIC_URL': '""', 'process.env.NODE_ENV': '"production"' },
});
for (const screen of ['lobby', 'missions', 'mission']) {
  await writeFile(resolve(output, `${screen}.html`), `<!doctype html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Who Got Who</title><link rel="stylesheet" href="preview.css">
<style>*,*::before,*::after{animation:none!important;transition:none!important}</style>
</head><body><div id="root"></div>
<script>history.replaceState(null,'','/?screen=${screen}')</script>
<script src="preview.js"></script></body></html>`);
}
