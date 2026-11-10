import { Game, Player } from '../types';
import { BRAND_ICON_LARGE } from '../branding';
import { ordinal, rankPlayers } from './gameSettings';
import { NightStats } from './nightStats';

const W = 1080;
const H = 1350;
const INK = '#0d0c0a';
const CREAM = '#f4f0e4';
const SOFT = '#d2ccbb';
const MUTED = '#a39c8a';
const AMBER = '#e8b554';
const AMBER_INK = '#3a2b0c';
const UI = '"Outfit", system-ui, sans-serif';

function scoreOf(game: Game, player: Player): number {
  return game.gameType === 'holiday-challenge' ? player.challengeScore || 0 : player.score;
}

const pointsWord = (score: number) => (score === 1 ? 'point' : 'points');

function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut}…`;
}

/** Breaks text into at most `maxLines` lines that fit the width. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) {
      line = next;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = fit(ctx, `${kept[maxLines - 1]} ${lines.slice(maxLines).join(' ')}`, maxWidth);
  return kept;
}

/** Small capitals with space between the letters, where the browser can do it. */
function spaced(ctx: CanvasRenderingContext2D, spacing: string): void {
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = spacing;
}

/** A rounded rectangle path. Drawn by hand: iOS 15 has no canvas roundRect. */
function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number): void {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** The shared backdrop: the dark table, two soft lights, the app's mark and a footer. */
async function startCard(overline: string): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }> {
  const brand = new Image();
  brand.src = BRAND_ICON_LARGE;
  const brandReady = brand.decode().then(() => true).catch(() => false);
  // Make sure the lettering is ready before drawing with it.
  await Promise.all([
    document.fonts?.load(`700 40px ${UI}`),
    document.fonts?.load(`600 40px ${UI}`),
    document.fonts?.load(`400 40px ${UI}`),
  ].filter(Boolean)).catch(() => undefined);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image sharing is not supported on this device');

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);
  const lights: Array<[number, string]> = [[W, 'rgba(229, 72, 77, 0.26)'], [0, 'rgba(232, 181, 84, 0.2)']];
  lights.forEach(([x, colour]) => {
    const glow = ctx.createRadialGradient(x, 0, 0, x, 0, 820);
    glow.addColorStop(0, colour);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  });

  // Same mark as the installed app; sharing still works if the image is unavailable.
  if (await brandReady) {
    ctx.save();
    panel(ctx, W / 2 - 60, 84, 120, 120, 27);
    ctx.clip();
    ctx.drawImage(brand, W / 2 - 60, 84, 120, 120);
    ctx.restore();
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = MUTED;
  ctx.font = `700 26px ${UI}`;
  spaced(ctx, '5px');
  ctx.fillText(overline.toUpperCase(), W / 2, 262);
  spaced(ctx, '0px');

  // Footer
  ctx.fillStyle = MUTED;
  ctx.font = `400 30px ${UI}`;
  ctx.fillText('The party game of secret missions', W / 2, H - 148);
  ctx.fillStyle = AMBER;
  ctx.font = `700 44px ${UI}`;
  ctx.fillText(window.location.host, W / 2, H - 88);

  return { canvas, ctx };
}

function finish(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not create the image'))), 'image/png'),
  );
}

const face = (player: Player) => (player.avatarType === 'photo' ? '' : player.avatar || '');

/** Draws a shareable picture of the final standings for a finished game. */
export async function renderResultsImage(game: Game): Promise<Blob> {
  const { canvas, ctx } = await startCard('Final results');
  const ranked = rankPlayers(game.players, (player) => scoreOf(game, player));
  const winner = ranked[0];
  const isHoliday = game.gameType === 'holiday-challenge';

  ctx.textAlign = 'center';
  ctx.fillStyle = CREAM;
  ctx.font = `700 100px ${UI}`;
  ctx.fillText(isHoliday ? 'You Got Who?' : 'Who Got Who', W / 2, 372);

  // The winner, on gold
  if (winner) {
    const gold = ctx.createLinearGradient(0, 430, 0, 630);
    gold.addColorStop(0, '#f2c268');
    gold.addColorStop(1, '#dda441');
    ctx.fillStyle = gold;
    panel(ctx, 110, 430, W - 220, 200, 40);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(58, 43, 12, 0.72)';
    ctx.font = `700 26px ${UI}`;
    spaced(ctx, '5px');
    ctx.fillText('WINNER', 160, 492);
    spaced(ctx, '0px');
    ctx.fillStyle = AMBER_INK;
    ctx.font = `700 78px ${UI}`;
    ctx.fillText(fit(ctx, `${face(winner)} ${winner.name}`.trim(), 560), 160, 580);

    ctx.textAlign = 'right';
    ctx.font = `700 92px ${UI}`;
    ctx.fillText(String(scoreOf(game, winner)), W - 160, 560);
    ctx.fillStyle = 'rgba(58, 43, 12, 0.72)';
    ctx.font = `600 28px ${UI}`;
    ctx.fillText(pointsWord(scoreOf(game, winner)), W - 160, 600);
  }

  // Everyone else
  // Seven fit; with more, one row gives way to a "+ more players" line.
  const rows = ranked.slice(1, ranked.length > 7 ? 6 : 7);
  const rowHeight = 86;
  const top = 668;
  rows.forEach((player, index) => {
    const y = top + index * rowHeight;
    ctx.fillStyle = 'rgba(241, 237, 224, 0.06)';
    panel(ctx, 110, y, W - 220, rowHeight - 14, 24);
    ctx.fill();

    const baseline = y + 49;
    ctx.textAlign = 'left';
    ctx.fillStyle = MUTED;
    ctx.font = `700 32px ${UI}`;
    ctx.fillText(ordinal(index + 2), 150, baseline);

    ctx.fillStyle = CREAM;
    ctx.font = `600 38px ${UI}`;
    ctx.fillText(fit(ctx, `${face(player)} ${player.name}`.trim(), 560), 250, baseline);

    ctx.textAlign = 'right';
    ctx.fillStyle = AMBER;
    ctx.font = `700 40px ${UI}`;
    ctx.fillText(String(scoreOf(game, player)), W - 150, baseline);
  });
  if (ranked.length > rows.length + 1) {
    ctx.textAlign = 'center';
    ctx.fillStyle = MUTED;
    ctx.font = `400 28px ${UI}`;
    ctx.fillText(`+ ${ranked.length - rows.length - 1} more players`, W / 2, top + rows.length * rowHeight + 24);
  }

  return finish(canvas);
}

/** Draws one player's "My Night" picture: their verdict and four numbers. */
export async function renderNightImage(player: Player, rank: number, score: number, stats: NightStats): Promise<Blob> {
  const { canvas, ctx } = await startCard('My night · Who Got Who');

  ctx.textAlign = 'center';
  const emoji = face(player);
  if (emoji) {
    ctx.font = `400 110px ${UI}`;
    ctx.fillStyle = CREAM;
    ctx.fillText(emoji, W / 2, 400);
  }
  ctx.fillStyle = AMBER;
  ctx.font = `700 118px ${UI}`;
  ctx.fillText(fit(ctx, stats.title, W - 160), W / 2, emoji ? 530 : 440);
  ctx.fillStyle = SOFT;
  ctx.font = `600 36px ${UI}`;
  ctx.fillText(
    fit(ctx, `${player.name} · ${ordinal(rank)} place · ${score} ${pointsWord(score)}`, W - 220),
    W / 2,
    emoji ? 592 : 502,
  );

  // Four tiles, two by two
  const gap = 30;
  const tileW = (W - 220 - gap) / 2;
  const tileH = 198;
  const top = 646;
  stats.tiles.slice(0, 4).forEach((tile, index) => {
    const x = 110 + (index % 2) * (tileW + gap);
    const y = top + Math.floor(index / 2) * (tileH + gap);
    const fill = ctx.createLinearGradient(0, y, 0, y + tileH);
    fill.addColorStop(0, '#242019');
    fill.addColorStop(1, '#191713');
    ctx.fillStyle = fill;
    panel(ctx, x, y, tileW, tileH, 36);
    ctx.fill();
    ctx.strokeStyle = 'rgba(241, 237, 224, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = CREAM;
    ctx.font = `700 68px ${UI}`;
    ctx.fillText(fit(ctx, tile.value, tileW - 76), x + 38, y + 90);
    ctx.fillStyle = MUTED;
    ctx.font = `400 29px ${UI}`;
    wrap(ctx, tile.label, tileW - 76, 2).forEach((line, lineIndex) => {
      ctx.fillText(line, x + 38, y + 136 + lineIndex * 36);
    });
  });

  // Awards, if any
  if (stats.awards.length > 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = AMBER;
    ctx.font = `700 32px ${UI}`;
    ctx.fillText(fit(ctx, stats.awards.map((award) => `★ ${award.name}`).join('   '), W - 220), W / 2, top + 2 * tileH + gap + 64);
  }

  return finish(canvas);
}
