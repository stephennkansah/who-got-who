// Renders the Instagram posts in posts.html to posts/*.png (1080 x 1350) with
// headless Edge. Edge's viewport is a few pixels shorter than its window, so
// each shot is taken taller and cropped with ffmpeg.
//
//   node assets/instagram/render.mjs
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FFMPEG = process.env.FFMPEG ?? "C:/ffmpeg/bin/ffmpeg.exe";
const EDGE = process.env.EDGE ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const TEMP = process.env.TEMP ?? HERE;
const POSTS = ["christmas-dinner", "family-meal", "work-party", "gotcha-dave", "phones-away", "download"];
const url = (file, query) => `${pathToFileURL(path.join(HERE, file)).href}?${query}`;
const SHOTS = POSTS.map((name, i) => ({ out: `posts/${i + 1}-${name}.png`, page: url("posts.html", `p=${i + 1}`), width: 1080, height: 1350 }));
const wait = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

SHOTS.forEach(({ out, page, width, height }, i) => {
  const file = path.join(HERE, out);
  mkdirSync(path.dirname(file), { recursive: true });
  const raw = path.join(TEMP, `wgw-instagram-${i}.png`);
  if (existsSync(raw)) rmSync(raw);
  // Edge can exit before the file lands, and writes nothing while an earlier
  // run still holds its profile: a fresh profile each try, then wait.
  for (let attempt = 1; !existsSync(raw); attempt += 1) {
    if (attempt > 4) throw new Error(`Edge did not write ${out}`);
    execFileSync(EDGE, [
      "--headless=new", "--hide-scrollbars", "--force-device-scale-factor=1",
      `--user-data-dir=${path.join(TEMP, `wgw-instagram-${Date.now()}`)}`,
      `--window-size=${width},${height + 100}`, "--virtual-time-budget=4000", `--screenshot=${raw}`, page,
    ], { stdio: "ignore" });
    for (let k = 0; k < 20 && !existsSync(raw); k += 1) wait(500);
  }
  execFileSync(FFMPEG, ["-v", "error", "-y", "-i", raw, "-vf", `crop=${width}:${height}:0:0`, file]);
  console.log(`Wrote ${out}`);
});
