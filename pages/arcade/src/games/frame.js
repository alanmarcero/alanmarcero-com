import { BG } from './palette';

/** How long the between-levels flash holds the board, in seconds. */
export const LEVEL_TRANSITION_SECONDS = 1.0;

/**
 * The uniform scale and centring offsets that fit a fixed-size game world
 * into a canvas of any shape without distorting it. The unused band on the
 * long axis is split evenly, so the world sits in the middle.
 */
export function letterbox(canvasW, canvasH, gameW, gameH) {
  const scale = Math.min(canvasW / gameW, canvasH / gameH);
  return {
    scale,
    offsetX: (canvasW - gameW * scale) / 2,
    offsetY: (canvasH - gameH * scale) / 2,
  };
}

/**
 * Paint one frame of a letterboxed game: clear the whole canvas to the
 * background, then run `drawWorld` in world units, clipped to the world, so
 * nothing a game draws can spill into the bars.
 */
export function drawLetterboxed(ctx, { canvasW, canvasH, viewport, gameW, gameH }, drawWorld) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, canvasW, canvasH);

  ctx.save();
  ctx.translate(viewport.offsetX, viewport.offsetY);
  ctx.scale(viewport.scale, viewport.scale);
  ctx.beginPath();
  ctx.rect(0, 0, gameW, gameH);
  ctx.clip();

  drawWorld();

  ctx.restore();
}

/** The pulsing cyan wash that covers the board while the next level loads. */
export function drawLevelFlash(ctx, timer, gameW, gameH) {
  const alpha = 0.15 + 0.1 * Math.sin(timer * 12);
  ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
  ctx.fillRect(0, 0, gameW, gameH);
}
