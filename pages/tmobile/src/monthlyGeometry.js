/* ==========================================================================
   monthlyGeometry.js — pure geometry for the monthly sell columns.
   No DOM, no React: every export takes plain values and returns plain values.
   ========================================================================== */

/** A column is capped rather than filling its band — the leftover is air. */
export const MAX_BAR = 24;

/** The 2px surface gap that separates one stacked segment from the next. */
export const SEGMENT_GAP = 2;

/**
 * A month with a sale never renders as nothing. Against a $150M month a
 * $250K month is a third of a pixel, so a non-zero column is floored at a
 * hairline — a deliberate distortion at the bottom of the scale, stated on
 * the page and undone in the table.
 */
export const MIN_BAR = 3;

/**
 * Equal bands across the plot, one per month, with a centred column in each.
 * The band is the hit target; the column is narrower than the band.
 */
export function bandScale(count, box, maxBar = MAX_BAR) {
  const step = count > 0 ? box.width / count : box.width;
  return {
    count,
    step,
    barWidth: Math.max(1, Math.min(maxBar, step * 0.62)),
    centerAt: (index) => box.left + step * (index + 0.5),
    leftAt: (index) => box.left + step * index,
  };
}

/** Nearest band for a pointer at `px`, clamped to the series. */
export function bandIndexAtX(px, count, box) {
  if (count <= 0) return 0;
  const step = box.width / count;
  const raw = Math.floor((px - box.left) / step);
  return Math.min(count - 1, Math.max(0, raw));
}

/**
 * A round axis step: the smallest of 1/2/2.5/4/5/10 x 10^k that fits `max`
 * inside `tickCount` steps. 4 is in the set so a $150M peak lands on a
 * $160M axis instead of being padded out to $200M.
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

/** Map an amount onto the plot's y range (zero sits on the baseline). */
export function yAt(amount, domain, box) {
  if (domain.max <= 0) return box.top + box.height;
  const fraction = Math.min(1, Math.max(0, amount / domain.max));
  return box.top + (1 - fraction) * box.height;
}

/**
 * One month's segments as rectangles, bottom-up from the baseline. Touching
 * segments are separated by a gap in the surface colour, never by a stroke,
 * and only the topmost segment carries the rounded data-end.
 */
export function stackRects(stack, domain, box, band, index) {
  const width = band.barWidth;
  const x = band.centerAt(index) - width / 2;
  const scale = box.height / (domain.max || 1);
  const drawn = [];
  let cursor = 0;

  stack.segments.forEach((segment, i) => {
    const isTop = i === stack.segments.length - 1;
    const raw = segment.amount * scale;
    // the floor applies to the whole column, so a one-segment sliver is still
    // visible without inflating a segment that sits on top of a tall one
    const height = Math.max(raw, drawn.length === 0 ? MIN_BAR : 1);
    const bottom = box.top + box.height - cursor;
    // the gap comes off the TOP of the lower segment, so every segment keeps
    // its own base and the whole column keeps its footing on the baseline
    const gap = isTop ? 0 : Math.min(SEGMENT_GAP, height - 1);
    drawn.push({
      group: segment.group,
      amount: segment.amount,
      x,
      width,
      y: bottom - height + gap,
      height: Math.max(1, height - gap),
      round: isTop,
    });
    cursor += height;
  });

  return drawn;
}

/**
 * A column path: square where it meets the baseline, `radius`-rounded at the
 * data end, and never rounded further than half its own height.
 */
export function columnPath({ x, y, width, height, round }, radius = 4) {
  const r = round ? Math.min(radius, width / 2, height / 2) : 0;
  const right = x + width;
  const bottom = y + height;
  if (r <= 0) return `M${x},${y}H${right}V${bottom}H${x}Z`;
  return `M${x},${bottom}V${y + r}Q${x},${y} ${x + r},${y}`
    + `H${right - r}Q${right},${y} ${right},${y + r}V${bottom}Z`;
}

/**
 * Which months get an x-axis label. Quarter starts carry the month name and
 * January carries the year, so a two-year axis reads as time without a label
 * under every column. The first band is always labelled, or the axis opens
 * with no year at all.
 */
export function monthTicks(months, quarterly = true) {
  const wanted = quarterly ? [1, 4, 7, 10] : [1, 7];
  return months.reduce((ticks, month, index) => {
    const number = Number(month.slice(5, 7));
    if (index !== 0 && !wanted.includes(number)) return ticks;
    ticks.push({
      index,
      month,
      year: number === 1 || index === 0 ? month.slice(0, 4) : null,
    });
    return ticks;
  }, []);
}
