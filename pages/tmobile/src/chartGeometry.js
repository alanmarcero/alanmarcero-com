/* ==========================================================================
   chartGeometry.js — pure geometry for the TMUS price chart.
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
export function yAt(value, domain, box) {
  const span = domain.max - domain.min;
  if (span <= 0) return box.top + box.height / 2;
  const fraction = (value - domain.min) / span;
  return box.top + (1 - fraction) * box.height;
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
 */
export function yearTicks(weeks) {
  const seen = new Set();
  const ticks = [];
  weeks.forEach((week, index) => {
    const year = week.slice(0, 4);
    if (seen.has(year)) return;
    seen.add(year);
    ticks.push({ index, year });
  });
  return ticks;
}

/** An SVG polyline `points` string for the price series. */
export function linePoints(prices, domain, box) {
  return prices
    .map((p, i) => `${xAt(i, prices.length, box).toFixed(2)},${yAt(p.close, domain, box).toFixed(2)}`)
    .join(' ');
}

/** A closed path for the soft wash under the price line. */
export function areaPath(prices, domain, box) {
  if (!prices.length) return '';
  const top = prices
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xAt(i, prices.length, box).toFixed(2)},${yAt(p.close, domain, box).toFixed(2)}`)
    .join('');
  const lastX = xAt(prices.length - 1, prices.length, box).toFixed(2);
  return `${top}L${lastX},${box.bottom.toFixed(2)}L${box.left.toFixed(2)},${box.bottom.toFixed(2)}Z`;
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
      y: yAt(sell.close, domain, box) + offset,
    });
    return acc;
  }, []);
}

/** week -> index lookup for the price series. */
export function weekIndexMap(prices) {
  return new Map(prices.map((p, i) => [p.week, i]));
}
