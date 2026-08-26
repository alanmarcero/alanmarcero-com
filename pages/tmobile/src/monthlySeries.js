/* ==========================================================================
   monthlySeries.js — pure selection + formatting for the monthly sell view.
   The chart, the caption and the table all read from here, so no two of them
   can disagree about a number.
   ========================================================================== */

import { formatShares, formatUSD } from './insiderFilters';

/**
 * The three ways to measure a month of selling. They are three different
 * scales, so they are three views of one chart rather than three series on
 * one plot — a second y-axis would invent a relationship the data has not got.
 */
export const MEASURES = [
  { id: 'value', label: 'Dollars sold', noun: 'sold' },
  { id: 'shares', label: 'Shares sold', noun: 'shares' },
  { id: 'txns', label: 'Sale filings', noun: 'filings' },
];

export const DEFAULT_MEASURE = 'value';

export const GROUPS = ['sievert', 'others'];

export const GROUP_LABEL = {
  sievert: 'Mike Sievert',
  others: 'Other insiders',
};

export function measureById(id) {
  return MEASURES.find((m) => m.id === id) || MEASURES[0];
}

/** One group's figure for one month, on the chosen measure. */
export function groupAmount(record, group, measureId) {
  const bucket = record[group];
  if (!bucket) return 0;
  return bucket[measureId] || 0;
}

/**
 * A month as a stack: the visible groups bottom-up, zero groups dropped so a
 * segment is only ever drawn for a group that actually sold.
 */
export function monthStack(record, measureId, show) {
  const segments = GROUPS
    .filter((group) => show[group])
    .map((group) => ({ group, amount: groupAmount(record, group, measureId) }))
    .filter((segment) => segment.amount > 0);
  return {
    month: record.month,
    segments,
    total: segments.reduce((sum, s) => sum + s.amount, 0),
  };
}

/** Every month as a stack, in order — months with no sale keep their slot. */
export function monthStacks(records, measureId, show) {
  return records.map((record) => monthStack(record, measureId, show));
}

/** Headline figures for the selection, so the caption never hand-waves. */
export function summarizeMonths(stacks) {
  const active = stacks.filter((s) => s.total > 0);
  const peak = active.reduce(
    (best, s) => (best && best.total >= s.total ? best : s),
    null,
  );
  const floor = active.reduce(
    (least, s) => (least && least.total <= s.total ? least : s),
    null,
  );
  const total = stacks.reduce((sum, s) => sum + s.total, 0);
  return {
    total,
    peak,
    peakShare: peak && total ? peak.total / total : 0,
    // how far the tallest column is above the shortest: past ~20x, the small
    // months only survive as the hairline floor, and the page owns up to it
    spread: peak && floor && floor.total > 0 ? peak.total / floor.total : 1,
    activeCount: active.length,
    quietCount: stacks.length - active.length,
    monthCount: stacks.length,
  };
}

/**
 * The one seller a month can fairly be attributed to — over half of it on the
 * measure being plotted. Filings are not attributable this way: the roll-up
 * counts them per month, not per person, so this returns nothing for them.
 */
export function dominantSeller(record, show, measureId) {
  if (measureId !== 'value' && measureId !== 'shares') return null;
  const total = monthTotals(record, show)[measureId];
  if (!total) return null;
  const [top] = monthSellers(record, show)
    .slice()
    .sort((a, b) => b[measureId] - a[measureId]);
  if (!top || top[measureId] / total <= 0.5) return null;
  return { name: top.name, share: top[measureId] / total };
}

/** Every seller in a month, both groups merged, biggest first. */
export function monthSellers(record, show) {
  return GROUPS
    .filter((group) => show[group])
    .flatMap((group) => (record[group]?.people || []).map((p) => ({ ...p, group })))
    .sort((a, b) => b.shares - a.shares);
}

/** One month on every measure at once, for the visible groups only. */
export function monthTotals(record, show) {
  const visible = GROUPS.filter((group) => show[group]);
  const sum = (measureId) => visible
    .reduce((total, group) => total + groupAmount(record, group, measureId), 0);
  return { shares: sum('shares'), value: sum('value'), txns: sum('txns') };
}

/** The rows the table view renders: only the months that had a sale. */
export function monthRows(records, show) {
  return records
    .map((record) => ({
      month: record.month,
      ...monthTotals(record, show),
      sellers: monthSellers(record, show),
    }))
    .filter((row) => row.txns > 0);
}

/* -- formatting ---------------------------------------------------------- */

/** Compact dollars with no dead decimal: $160M, $2.5M, $250K. */
export function compactUSD(value) {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `$${trim(value / 1e9)}B`;
  if (abs >= 1e6) return `$${trim(value / 1e6)}M`;
  if (abs >= 1e3) return `$${trim(value / 1e3)}K`;
  return `$${Math.round(value)}`;
}

/** Compact share counts: 800K, 47.5K, 730. */
export function compactShares(shares) {
  const abs = Math.abs(shares);
  if (abs >= 1e6) return `${trim(shares / 1e6)}M`;
  if (abs >= 1e3) return `${trim(shares / 1e3)}K`;
  return `${Math.round(shares)}`;
}

function trim(n) {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}

/** An axis tick on the chosen measure. */
export function formatTick(measureId, amount) {
  if (measureId === 'value') return compactUSD(amount);
  if (measureId === 'shares') return compactShares(amount);
  return `${Math.round(amount)}`;
}

/** A value in running text or a tooltip, spelled out further than a tick. */
export function formatAmount(measureId, amount) {
  if (measureId === 'value') return formatUSD(amount);
  if (measureId === 'shares') return formatShares(amount);
  const n = Math.round(amount);
  return `${n} filing${n === 1 ? '' : 's'}`;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `2025-02` -> `Feb 2025`. */
export function formatMonth(iso) {
  const name = MONTH_NAMES[Number(iso.slice(5, 7)) - 1];
  if (!name) return iso;
  return `${name} ${iso.slice(0, 4)}`;
}

/** `2025-02` -> `Feb`. */
export function shortMonth(iso) {
  return MONTH_NAMES[Number(iso.slice(5, 7)) - 1] || iso;
}

/** A whole-number percentage, for the one share figure the caption quotes. */
export function formatPercent(fraction) {
  return `${Math.round(fraction * 100)}%`;
}
