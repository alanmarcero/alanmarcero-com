/* ==========================================================================
   chartGeometry.js — the plot box, traces, axes and cursor arithmetic the
   drawdown chart is built on.
   No DOM, no React: every export takes plain values and returns plain values,
   so the chart's maths can be unit-tested without rendering anything.
   ========================================================================== */

/** Inner plot box for a chart of `width` x `height` given its axis gutters. */
export function plotBox(width, height, margin) {
  return {
    left: margin.left,
    top: margin.top,
    width: Math.max(0, width - margin.left - margin.right),
    height: Math.max(0, height - margin.top - margin.bottom),
    right: width - margin.right,
    bottom: height - margin.bottom,
  };
}

/**
 * Map an index in [0, count-1] onto the plot's x range.
 * A single point sits at the left edge rather than dividing by zero.
 */
export function xAt(index, count, box) {
  if (count <= 1) return box.left;
  return box.left + (index / (count - 1)) * box.width;
}

/**
 * Where a tooltip goes for a cursor at `x` in a `width`-wide viewBox: beside
 * the cursor line, never over it, on whichever side has more room — so the
 * point being read stays visible. `left` is a percentage of the chart.
 */
export function tipPlacement(x, width) {
  const percent = width > 0 ? (x / width) * 100 : 0;
  return {
    left: `${percent}%`,
    side: percent < 50 ? 'right' : 'left',
  };
}

/** A pointer's client x in the chart's viewBox units. */
export function viewBoxX(clientX, rect, viewWidth) {
  return ((clientX - rect.left) / rect.width) * viewWidth;
}

/** -1, +1 or 0 for a key: only the left and right arrows move a cursor. */
export function arrowStep(key) {
  if (key === 'ArrowLeft') return -1;
  if (key === 'ArrowRight') return 1;
  return 0;
}

/** `from` moved by `step`, clamped to a series of `count`. */
export function stepIndex(from, step, count) {
  return Math.min(count - 1, Math.max(0, from + step));
}

/** An axis year, shortened to `’24` where the compact axis has no room for four digits. */
export function yearLabel(year, compact) {
  return compact ? `’${year.slice(2)}` : year;
}

/** Nearest data index for a pointer at `px`, clamped to the series. */
export function indexAtX(px, count, box) {
  if (count <= 1) return 0;
  const fraction = (px - box.left) / box.width;
  const raw = Math.round(fraction * (count - 1));
  return Math.min(count - 1, Math.max(0, raw));
}

/**
 * One tick per January in the series — the x axis reads as years, which is
 * what a five-year window is actually scanned by.
 *
 * A rolling five-year window opens partway through its first year, so that
 * year's tick can sit a few pixels from the next one. `minWeeks` drops a year
 * with too little of itself on screen to be worth labelling; at phone width
 * that is the difference between an axis and "’21’22".
 */
export function yearTicks(weeks, { minWeeks = 0 } = {}) {
  const counts = weeks.reduce((tally, week) => {
    const year = week.slice(0, 4);
    tally.set(year, (tally.get(year) || 0) + 1);
    return tally;
  }, new Map());

  const seen = new Set();
  return weeks.reduce((ticks, week, index) => {
    const year = week.slice(0, 4);
    if (seen.has(year)) return ticks;
    seen.add(year);
    if (counts.get(year) >= minWeeks) ticks.push({ index, year });
    return ticks;
  }, []);
}

/** An SVG polyline `points` string through plotted points. */
export function polyline(coords) {
  return coords.map((c) => `${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(' ');
}

/** The wash below a trace, closed along `box.bottom`. */
export function areaUnder(coords, box) {
  if (!coords.length) return '';
  const top = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(2)},${c.y.toFixed(2)}`)
    .join('');
  const first = coords[0].x.toFixed(2);
  const last = coords[coords.length - 1].x.toFixed(2);
  return `${top}L${last},${box.bottom.toFixed(2)}L${first},${box.bottom.toFixed(2)}Z`;
}

/**
 * A round axis step: the smallest of 1/2/2.5/4/5/10 x 10^k that fits `max`
 * inside `tickCount` steps. 4 is in the set so a peak of 15 lands on a 16
 * axis instead of being padded out to 20.
 */
export function niceStep(max, tickCount = 4) {
  if (!(max > 0)) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max / tickCount));
  const candidates = [1, 2, 2.5, 4, 5, 10].map((m) => m * magnitude);
  return candidates.find((c) => c * tickCount >= max) || candidates[candidates.length - 1];
}

/** A zero-based domain snapped outward to a round step. */
export function stackDomain(totals, tickCount = 4) {
  const peak = Math.max(0, ...totals.filter((t) => Number.isFinite(t)));
  if (peak <= 0) return { min: 0, max: 1, step: 1 };
  const step = niceStep(peak, tickCount);
  return { min: 0, max: Math.ceil(peak / step) * step, step };
}

/** Round tick values across a zero-based domain, the baseline included. */
export function stackTicks(domain) {
  const ticks = [];
  for (let v = 0; v <= domain.max + domain.step / 2; v += domain.step) {
    ticks.push(Math.round(v * 1e6) / 1e6);
  }
  return ticks;
}
