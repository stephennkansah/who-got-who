import { Game, Player } from '../types';

const W = 1080;
const H = 1350;
const INK = '#12100c';
const PAPER = '#efe5c6';
const PAPER_INK = '#232014';
const AMBER = '#e8b554';
const RED = '#e5484d';
const MUTED = '#a8a190';

function scoreOf(game: Game, player: Player): number {
  return game.gameType === 'holiday-challenge' ? player.challengeScore || 0 : player.score;
}

function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut}…`;
}

/** Draws a shareable "final debrief" card for a finished game. */
export async function renderResultsImage(game: Game): Promise<Blob> {
  // Make sure the display fonts are ready before drawing with them.
  await Promise.all([
    document.fonts?.load('120px "Bebas Neue"'),
    document.fonts?.load('700 40px "Outfit"'),
    document.fonts?.load('32px "Special Elite"'),
  ].filter(Boolean)).catch(() => undefined);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image sharing is not supported on this device');

  const ranked = [...game.players].sort((a, b) => scoreOf(game, b) - scoreOf(game, a));
  const winner = ranked[0];
  const isHoliday = game.gameType === 'holiday-challenge';

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);

  // Paper dossier
  ctx.fillStyle = PAPER;
  ctx.fillRect(70, 70, W - 140, H - 140);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#5d5642';
  ctx.font = '30px "Special Elite", "Courier New", monospace';
  ctx.fillText('FINAL DEBRIEF · CASE CLOSED', W / 2, 160);

  ctx.fillStyle = PAPER_INK;
  ctx.font = '150px "Bebas Neue", "Arial Narrow", sans-serif';
  ctx.fillText(isHoliday ? 'YOU GOT WHO?' : 'WHO GOT WHO', W / 2, 310);

  // Winner stamp
  if (winner) {
    ctx.save();
    ctx.translate(W / 2, 450);
    ctx.rotate(-0.07);
    ctx.font = '96px "Bebas Neue", "Arial Narrow", sans-serif';
    const label = fit(ctx, `${winner.name.toUpperCase()} WINS`, 760);
    const width = ctx.measureText(label).width + 80;
    ctx.strokeStyle = '#3f9b5b';
    ctx.lineWidth = 10;
    ctx.strokeRect(-width / 2, -82, width, 120);
    ctx.fillStyle = '#3f9b5b';
    ctx.fillText(label, 0, 10);
    ctx.restore();
  }

  // Standings
  const rows = ranked.slice(0, 8);
  const rowHeight = 74;
  // Small groups sit in the middle of the card rather than hugging the stamp.
  const top = 600 + ((8 - rows.length) * rowHeight) / 2;
  rows.forEach((player, index) => {
    const y = top + index * rowHeight;
    ctx.fillStyle = index === 0 ? 'rgba(232, 181, 84, 0.25)' : 'rgba(35, 32, 20, 0.05)';
    ctx.fillRect(130, y - 50, W - 260, rowHeight - 12);

    ctx.textAlign = 'left';
    ctx.fillStyle = index === 0 ? RED : '#5d5642';
    ctx.font = '52px "Bebas Neue", "Arial Narrow", sans-serif';
    ctx.fillText(`${index + 1}.`, 160, y);

    ctx.fillStyle = PAPER_INK;
    ctx.font = '700 40px "Outfit", system-ui, sans-serif';
    const avatar = player.avatarType === 'photo' ? '' : `${player.avatar || ''} `;
    ctx.fillText(fit(ctx, `${avatar}${player.name}`, 600), 240, y - 4);

    ctx.textAlign = 'right';
    ctx.fillStyle = index === 0 ? '#b98c36' : PAPER_INK;
    ctx.font = '56px "Bebas Neue", "Arial Narrow", sans-serif';
    ctx.fillText(String(scoreOf(game, player)), W - 160, y);
  });
  if (ranked.length > rows.length) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#5d5642';
    ctx.font = '28px "Outfit", system-ui, sans-serif';
    ctx.fillText(`+ ${ranked.length - rows.length} more agents`, W / 2, top + rows.length * rowHeight - 10);
  }

  // Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = MUTED;
  ctx.font = '30px "Special Elite", "Courier New", monospace';
  ctx.fillText('secret tasks. stealth claims. plausible deniability.', W / 2, H - 170);
  ctx.fillStyle = AMBER;
  ctx.font = '64px "Bebas Neue", "Arial Narrow", sans-serif';
  ctx.fillText(window.location.host.toUpperCase(), W / 2, H - 100);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not create the image'))), 'image/png'),
  );
}
