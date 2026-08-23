/**
 * Drawing for Pac-Man. No game state is owned or mutated here — every function
 * takes what it needs and paints.
 *
 * Colours are the arcade's, not the site's Outrun palette. That exception is
 * deliberate and recorded in CLAUDE.md: a blue-and-yellow Pac-Man is the point.
 */

import { COLS, ROWS, TILE_PX, TILE, tileAt } from './maze';

export const COLORS = {
  maze: '#2121ff',
  door: '#ffb8ff',
  dot: '#ffb897',
  pac: '#ffff00',
  blinky: '#ff0000',
  pinky: '#ffb8ff',
  inky: '#00ffff',
  clyde: '#ffb851',
  frightened: '#2121ff',
  frightenedFlash: '#ffffff',
  eyeWhite: '#ffffff',
  pupil: '#2121ff',
  text: '#ffffff',
  ready: '#ffff00',
  gameOver: '#ff0000',
};

export const GAME_W = COLS * TILE_PX;

/** A strip below the maze carries the spare lives and collected fruit. */
const STATUS_ROWS = 1.6;
export const GAME_H = (ROWS + STATUS_ROWS) * TILE_PX;
const STATUS_ROW = ROWS + 0.5;

const FRUIT_COLORS = {
  cherry: '#ff0000',
  strawberry: '#ff4d6d',
  orange: '#ffa500',
  apple: '#ff0000',
  melon: '#5aff5a',
  galaxian: '#4a7bff',
  bell: '#ffe14d',
  key: '#8fd7ff',
};

/** How far the wall outline sits inside its tile. Sets the pipe thickness. */
export const WALL_INSET = 1.5;

const segmentCache = new WeakMap();

/**
 * The maze as a set of line segments: every wall tile contributes a stroke on
 * each side that faces open space, which is what gives the arcade its hollow
 * pipes rather than a solid mass.
 *
 * The whole difficulty is where a segment should stop. Each end depends on the
 * neighbour it runs toward and the diagonal past that neighbour:
 *
 *   neighbour open              stop at the inset — the perpendicular edge of
 *                               this same tile terminates there too (convex corner)
 *   neighbour wall, diagonal open   run to the tile boundary; the neighbour
 *                               carries the same edge onward (straight run)
 *   both wall                   overrun by the inset, to land exactly on the
 *                               diagonal's perpendicular edge (concave corner)
 *
 * Get this wrong and every corner is two lines crossing past each other.
 */
export function wallSegments(grid) {
  const cached = segmentCache.get(grid);
  if (cached) return cached;

  const T = TILE_PX;
  const i = WALL_INSET;
  const solid = (c, r) => tileAt(grid, c, r) === TILE.WALL;
  const lead = (perp, diag) => (!perp ? i : (diag ? -i : 0));
  const trail = (perp, diag) => (!perp ? T - i : (diag ? T + i : T));

  const segments = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (!solid(col, row)) continue;
      const x = col * T;
      const y = row * T;

      const n = solid(col, row - 1), s = solid(col, row + 1);
      const w = solid(col - 1, row), e = solid(col + 1, row);
      const nw = solid(col - 1, row - 1), ne = solid(col + 1, row - 1);
      const sw = solid(col - 1, row + 1), se = solid(col + 1, row + 1);

      if (!n) segments.push([x + lead(w, nw), y + i, x + trail(e, ne), y + i]);
      if (!s) segments.push([x + lead(w, sw), y + T - i, x + trail(e, se), y + T - i]);
      if (!w) segments.push([x + i, y + lead(n, nw), x + i, y + trail(s, sw)]);
      if (!e) segments.push([x + T - i, y + lead(n, ne), x + T - i, y + trail(s, se)]);
    }
  }

  segmentCache.set(grid, segments);
  return segments;
}

export function drawMaze(ctx, grid, { flashWhite = false } = {}) {
  ctx.save();
  ctx.strokeStyle = flashWhite ? '#ffffff' : COLORS.maze;
  ctx.lineWidth = 1;
  // Round caps close the hairline notch where two edges meet at a corner.
  ctx.lineCap = 'round';
  ctx.beginPath();

  wallSegments(grid).forEach(([x1, y1, x2, y2]) => {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  });

  ctx.stroke();
  ctx.restore();

  drawDoor(ctx, grid);
}

function drawDoor(ctx, grid) {
  ctx.save();
  ctx.strokeStyle = COLORS.door;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (grid[row][col] !== TILE.DOOR) continue;
      const y = row * TILE_PX + TILE_PX / 2;
      ctx.moveTo(col * TILE_PX, y);
      ctx.lineTo(col * TILE_PX + TILE_PX, y);
    }
  }
  ctx.stroke();
  ctx.restore();
}

export function drawPellets(ctx, grid, energizerVisible) {
  ctx.fillStyle = COLORS.dot;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const tile = grid[row][col];
      const cx = col * TILE_PX + TILE_PX / 2;
      const cy = row * TILE_PX + TILE_PX / 2;

      if (tile === TILE.DOT) {
        ctx.fillRect(cx - 0.8, cy - 0.8, 1.6, 1.6);
      }
      if (tile === TILE.ENERGIZER && energizerVisible) {
        ctx.beginPath();
        ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

const MOUTH_BY_DIR = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };

/**
 * `mouth` runs 0 (closed) to 1 (widest). `dying` swaps in the death animation,
 * where the wedge opens all the way round until he vanishes.
 */
export function drawPac(ctx, { col, row, dir, mouth, dying = false, deathProgress = 0 }) {
  const cx = col * TILE_PX + TILE_PX / 2;
  const cy = row * TILE_PX + TILE_PX / 2;
  const radius = TILE_PX * 0.42;

  ctx.save();
  ctx.fillStyle = COLORS.pac;
  ctx.beginPath();

  if (dying) {
    const open = deathProgress * Math.PI;
    if (open >= Math.PI) { ctx.restore(); return; }
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, -Math.PI / 2 + open, Math.PI * 1.5 - open);
  } else {
    const half = mouth * 0.32 * Math.PI;
    const facing = MOUTH_BY_DIR[dir] ?? 0;
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, facing + half, facing - half + Math.PI * 2);
  }

  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

const GHOST_COLOR_BY_NAME = {
  blinky: COLORS.blinky,
  pinky: COLORS.pinky,
  inky: COLORS.inky,
  clyde: COLORS.clyde,
};

export function drawGhost(ctx, ghost, { flashing = false, footPhase = 0 }) {
  const cx = ghost.col * TILE_PX + TILE_PX / 2;
  const cy = ghost.row * TILE_PX + TILE_PX / 2;
  const r = TILE_PX * 0.45;

  // Eaten ghosts are eyes only — the body comes back when they reach the house.
  if (ghost.state !== 'eaten') {
    const frightened = ghost.state === 'frightened';
    ctx.fillStyle = frightened
      ? (flashing ? COLORS.frightenedFlash : COLORS.frightened)
      : GHOST_COLOR_BY_NAME[ghost.name];
    drawGhostBody(ctx, cx, cy, r, footPhase);

    if (frightened) {
      drawFrightenedFace(ctx, cx, cy, r, flashing);
      return;
    }
  }

  drawEyes(ctx, cx, cy, r, ghost.dir);
}

function drawGhostBody(ctx, cx, cy, r, footPhase) {
  const top = cy - r;
  const bottom = cy + r * 0.95;

  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.15, r, Math.PI, 0);
  ctx.lineTo(cx + r, bottom);

  // Three scalloped feet that swap phase as the ghost walks.
  const feet = 3;
  const width = (r * 2) / feet;
  const lift = footPhase < 0.5 ? 1 : -1;
  for (let i = 0; i < feet; i++) {
    const x0 = cx + r - i * width;
    const x1 = x0 - width;
    const dip = (i % 2 === 0 ? lift : -lift) * r * 0.28;
    ctx.quadraticCurveTo((x0 + x1) / 2, bottom + dip, x1, bottom);
  }

  ctx.lineTo(cx - r, top);
  ctx.closePath();
  ctx.fill();
}

const EYE_OFFSET = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };

function drawEyes(ctx, cx, cy, r, dir) {
  const look = EYE_OFFSET[dir] ?? EYE_OFFSET.left;
  const eyeR = r * 0.34;
  const pupilR = r * 0.17;
  const dx = r * 0.36;
  const eyeY = cy - r * 0.22;

  [-1, 1].forEach((side) => {
    const ex = cx + side * dx;
    ctx.fillStyle = COLORS.eyeWhite;
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, eyeR, eyeR * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.pupil;
    ctx.beginPath();
    ctx.arc(ex + look.x * eyeR * 0.5, eyeY + look.y * eyeR * 0.6, pupilR, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawFrightenedFace(ctx, cx, cy, r, flashing) {
  const ink = flashing ? COLORS.blinky : COLORS.frightenedFlash;
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1;

  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.arc(cx + side * r * 0.34, cy - r * 0.2, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  });

  // Zig-zag mouth.
  ctx.beginPath();
  const y = cy + r * 0.38;
  const w = r * 1.1;
  const steps = 6;
  for (let i = 0; i <= steps; i++) {
    const x = cx - w / 2 + (w / steps) * i;
    const yy = y + (i % 2 === 0 ? -r * 0.14 : r * 0.14);
    if (i === 0) ctx.moveTo(x, yy);
    else ctx.lineTo(x, yy);
  }
  ctx.stroke();
}

export function drawFruit(ctx, { col, row, name }) {
  const cx = col * TILE_PX + TILE_PX / 2;
  const cy = row * TILE_PX + TILE_PX / 2;

  ctx.fillStyle = FRUIT_COLORS[name] ?? COLORS.blinky;
  ctx.beginPath();
  ctx.arc(cx, cy + 1, TILE_PX * 0.34, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#4dff4d';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy - TILE_PX * 0.3);
  ctx.lineTo(cx + TILE_PX * 0.28, cy - TILE_PX * 0.62);
  ctx.stroke();
}

export function drawCenteredText(ctx, text, row, color, size = 8) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px "Press Start 2P", "Space Grotesk", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, GAME_W / 2, row * TILE_PX + TILE_PX / 2);
  ctx.restore();
}

export function drawScorePopup(ctx, { col, row, value }) {
  ctx.save();
  ctx.fillStyle = COLORS.inky;
  ctx.font = 'bold 7px "Space Grotesk", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(value), col * TILE_PX + TILE_PX / 2, row * TILE_PX + TILE_PX / 2);
  ctx.restore();
}

/** The remaining-lives row and collected fruit, drawn under the maze. */
export function drawStatusRow(ctx, { lives, fruitHistory }) {
  for (let i = 0; i < lives - 1; i++) {
    drawPac(ctx, { col: 2 + i * 1.6, row: STATUS_ROW, dir: 'right', mouth: 0.6 });
  }
  fruitHistory.slice(-7).forEach((name, i) => {
    drawFruit(ctx, { col: COLS - 3 - i * 1.6, row: STATUS_ROW, name });
  });
}
