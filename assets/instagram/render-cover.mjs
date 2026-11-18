// Renders cover.html to cover.jpg (1640 x 720, the Facebook Page cover) with
// headless Edge, the same way render.mjs does the posts.
//
//   node assets/instagram/render-cover.mjs
import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FFMPEG = process.env.FFMPEG ?? "C:/ffmpeg/bin/ffmpeg.exe";
const EDGE = process.env.EDGE ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const TEMP = process.env.TEMP ?? HERE;
const wait = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

const raw = path.join(TEMP, "wgw-cover.png");
if (existsSync(raw)) rmSync(raw);
for (let attempt = 1; !existsSync(raw); attempt += 1) {
  if (attempt > 4) throw new Error("Edge did not write the cover");
  execFileSync(EDGE, [
    "--headless=new", "--hide-scrollbars", "--force-device-scale-factor=1",
    `--user-data-dir=${path.join(TEMP, `wgw-cover-${Date.now()}`)}`,
    "--window-size=1640,820", "--virtual-time-budget=4000", `--screenshot=${raw}`,
    pathToFileURL(path.join(HERE, "cover.html")).href,
  ], { stdio: "ignore" });
  for (let k = 0; k < 20 && !existsSync(raw); k += 1) wait(500);
}
execFileSync(FFMPEG, ["-v", "error", "-y", "-i", raw, "-vf", "crop=1640:720:0:0", "-q:v", "2", path.join(HERE, "cover.jpg")]);
console.log("Wrote cover.jpg");
