/* ==========================================================================
   chartGeometry.js — pure geometry for the TMUS price chart, and the plot
   box, traces and cursor arithmetic every chart on the page shares.
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

/** Map a price onto the plot's y range (inverted: high prices sit up top). */
export function priceY(value, domain, box) {
  const span = domain.max - domain.min;
  if (span <= 0) return box.top + box.height / 2;
  const fraction = (value - domain.min) / span;
  return box.top + (1 - fraction) * box.height;
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
 * Price domain padded by `padFraction` of its span and snapped outward to
 * `step` so the axis lands on round numbers.
 */
export function priceDomain(values, { padFraction = 0.08, step = 20 } = {}) {
  const finite = values.filter((v) => Number.isFinite(v));
  if (!finite.length) return { min: 0, max: 1 };
  const lo = Math.min(...finite);
  const hi = Math.max(...finite);
  const pad = (hi - lo) * padFraction || Math.abs(hi) * 0.1 || 1;
  return {
    min: Math.max(0, Math.floor((lo - pad) / step) * step),
    max: Math.ceil((hi + pad) / step) * step,
  };
}

/** Round tick values across a domain at `step` intervals. */
export function priceTicks(domain, step = 40) {
  const ticks = [];
  const first = Math.ceil(domain.min / step) * step;
  for (let v = first; v <= domain.max; v += step) ticks.push(v);
  return ticks;
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

/** Every weekly close as a plotted point. */
export function priceCoords(prices, domain, box) {
  return prices.map((p, i) => ({
    x: xAt(i, prices.length, box),
    y: priceY(p.close, domain, box),
  }));
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

/** An SVG polyline `points` string for the price series. */
export function linePoints(prices, domain, box) {
  return polyline(priceCoords(prices, domain, box));
}

/** A closed path for the soft wash under the price line. */
export function areaPath(prices, domain, box) {
  return areaUnder(priceCoords(prices, domain, box), box);
}

/**
 * Place a sell marker for every week in `sells` that exists in the price
 * series. `offset` nudges a group off the line so two groups that sold in the
 * same week stay separately readable.
 */
export function sellMarkers(sells, weekIndex, prices, domain, box, offset = 0) {
  return sells.reduce((acc, sell) => {
    const index = weekIndex.get(sell.week);
    if (index === undefined) return acc;
    acc.push({
      ...sell,
      index,
      x: xAt(index, prices.length, box),
      y: priceY(sell.close, domain, box) + offset,
    });
    return acc;
  }, []);
}

/** week -> index lookup for the price series. */
export function weekIndexMap(prices) {
  return new Map(prices.map((p, i) => [p.week, i]));
}
