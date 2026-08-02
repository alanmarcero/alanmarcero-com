/*
 * Envelope fields.
 *
 * Every synthesizer patch is, at bottom, an ADSR envelope. So every bank on
 * this site is drawn as a field of tiny envelope glyphs — one per patch it
 * contains — generated deterministically from the bank's own name, so no
 * two instruments produce the same texture.
 *
 * A whole field is emitted as a SINGLE path `d` string made of many
 * subpaths. One DOM node for 1,500 envelopes; the hero depends on that.
 *
 * Pure. No React, no DOM, no randomness.
 */

/** FNV-1a. Small, fast, good enough spread for visual variation. */
export function hashString(input) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/**
 * Deterministic [0,1) sequence seeded by a hash. Mulberry32 — one line of
 * state, well-distributed, and stable across engines.
 */
export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (value) => Math.round(value * 100) / 100;

/**
 * One ADSR glyph as a polyline, in a cell of `width` x `height`.
 * Baseline is the bottom of the cell; the peak touches the top.
 *
 *        peak
 *         /\__________
 *        /            \
 *   ____/              \____
 *   atk  dec  sustain   rel
 */
export function envelopePoints(random, width, height) {
  const attack = 0.06 + random() * 0.3;
  const decay = attack + 0.08 + random() * 0.32;
  const sustain = 0.18 + random() * 0.66;
  const release = Math.min(0.97, decay + 0.14 + random() * 0.42);

  const sustainY = height - sustain * height;

  return [
    [0, height],
    [attack * width, 0],
    [decay * width, sustainY],
    [release * width, sustainY],
    [width, height],
  ];
}

/**
 * A field of `count` envelopes laid out in a grid, as one path string.
 *
 * @param {object} options
 * @param {string} options.seed      any string; same seed → same field
 * @param {number} options.count     how many envelopes to draw
 * @param {number} options.columns   glyphs per row
 * @param {number} options.cellWidth
 * @param {number} options.cellHeight
 * @param {number} [options.gap]     space between cells
 * @returns {{ d: string, width: number, height: number, rows: number }}
 */
export function buildFieldPath({
  seed,
  count,
  columns,
  cellWidth,
  cellHeight,
  gap = 2,
}) {
  const random = seededRandom(hashString(seed));
  const rows = Math.ceil(count / columns);
  const stepX = cellWidth + gap;
  const stepY = cellHeight + gap;
  const segments = [];

  for (let index = 0; index < count; index += 1) {
    const originX = (index % columns) * stepX;
    const originY = Math.floor(index / columns) * stepY;
    const points = envelopePoints(random, cellWidth, cellHeight);

    const [first, ...rest] = points.map(
      ([x, y]) => [round(originX + x), round(originY + y)],
    );

    segments.push(
      `M${first[0]} ${first[1]}${rest.map(([x, y]) => `L${x} ${y}`).join('')}`,
    );
  }

  return {
    d: segments.join(''),
    width: columns * stepX - gap,
    height: rows * stepY - gap,
    rows,
  };
}

/**
 * How many columns a field needs so that its own aspect ratio matches the
 * box it will be drawn into.
 *
 * Without this the SVG is scaled to cover its container, and a field that
 * is much wider than its box gets magnified until the glyphs read as
 * wallpaper instead of as data. Deriving columns from the target aspect
 * keeps every glyph at roughly its natural size, whatever the count.
 */
export function columnsForAspect({ count, aspect, cellWidth, cellHeight, gap = 2 }) {
  const stepX = cellWidth + gap;
  const stepY = cellHeight + gap;
  const columns = Math.sqrt((count * aspect * stepY) / stepX);
  return Math.max(1, Math.round(columns));
}
