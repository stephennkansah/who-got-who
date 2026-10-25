// Build and serve isolated, fictional fixtures for browser screenshot capture.
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = process.cwd();
const output = resolve(root, 'node_modules/.cache/store-preview');
await build({entryPoints:['assets/store/preview.tsx'],bundle:true,outdir:output,loader:{'.woff2':'file'},define:{'process.env.PUBLIC_URL':'""','process.env.NODE_ENV':'"production"'}});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'};
createServer(async(req,res)=>{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const base=path.startsWith('/preview.')&& !path.endsWith('.html') || path.endsWith('.woff2')&&!path.startsWith('/src/') ? output : path==='/preview.html'||path==='/feature.html' ? resolve(root,'assets/store') : path.startsWith('/src/') ? root : resolve(root,'public');
  const file=resolve(base, '.'+path);
  if(!file.startsWith(base+sep)){res.writeHead(403).end();return;}
  try{const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(bytes);}catch{res.writeHead(404).end();}
}).listen(4182,'127.0.0.1',()=>console.log('Store preview: http://127.0.0.1:4182/preview.html'));
