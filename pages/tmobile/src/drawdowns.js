/* ==========================================================================
   drawdowns.js — peak-to-trough arithmetic for the daily closes.
   No DOM, no React: every export takes plain values and returns plain values.

   A drawdown starts on an all-time closing high and ends on the first close
   above it. Its depth is the lowest close in between, against that peak. How
   long the top "held" is the calendar days from the peak to that recovery —
   or to the last close, for a drawdown nobody has climbed out of yet.
   ========================================================================== */

import { daysBetween } from './sellPressure';

/** How long a top has to stand before its drawdown counts. */
export const TOP_HOLDS = [
  { id: 'any', days: 0, label: 'Any top' },
  { id: '1m', days: 30, label: '1 month' },
  { id: '3m', days: 90, label: '3 months' },
  { id: '6m', days: 180, label: '6 months' },
  { id: '1y', days: 365, label: '1 year' },
];

export const DEFAULT_TOP_HOLD = '1m';

export function topHoldById(id) {
  return TOP_HOLDS.find((h) => h.id === id) || TOP_HOLDS[0];
}

/**
 * Every close against the highest close up to and including it. `depth` is
 * zero on a record close and negative below one.
 */
export function underwater(closes) {
  let peak = null;
  return closes.map(([date, close]) => {
    if (!peak || close > peak.close) peak = { date, close };
    return {
      date,
      close,
      peak: peak.close,
      peakDate: peak.date,
      depth: close / peak.close - 1,
    };
  });
}

/**
 * One record per stretch between two all-time closing highs that dipped at
 * all. The last one is `open` when the series ends below its peak.
 */
export function drawdownEpisodes(closes) {
  if (!closes.length) return [];
  const [firstDate, firstClose] = closes[0];
  const episodes = [];
  let peak = { date: firstDate, close: firstClose };
  let trough = peak;

  const close = (recovery) => {
    if (trough.close >= peak.close) return;
    episodes.push(episode(peak, trough, recovery, closes[closes.length - 1][0]));
  };

  closes.slice(1).forEach(([date, price]) => {
    if (price > peak.close) {
      close(date);
      peak = { date, close: price };
      trough = peak;
      return;
    }
    if (price < trough.close) trough = { date, close: price };
  });
  close(null);
  return episodes;
}

function episode(peak, trough, recoveryDate, lastDate) {
  return {
    peakDate: peak.date,
    peak: peak.close,
    troughDate: trough.date,
    trough: trough.close,
    depth: trough.close / peak.close - 1,
    recoveryDate,
    open: recoveryDate === null,
    toBottomDays: daysBetween(peak.date, trough.date),
    topDays: daysBetween(peak.date, recoveryDate || lastDate),
  };
}

/** The drawdowns whose top stood at least `minDays`. */
export function heldAtLeast(episodes, minDays) {
  return episodes.filter((e) => e.topDays >= minDays);
}

/** The `count` deepest drawdowns, deepest first. */
export function deepest(episodes, count) {
  return [...episodes].sort((a, b) => a.depth - b.depth).slice(0, count);
}

/** Headline figures for the caption; null when nothing qualifies. */
export function summarizeDrawdowns(episodes) {
  if (!episodes.length) return null;
  const depths = episodes.map((e) => e.depth).sort((a, b) => a - b);
  const mid = Math.floor(depths.length / 2);
  const median = depths.length % 2 ? depths[mid] : (depths[mid - 1] + depths[mid]) / 2;
  return {
    count: episodes.length,
    deepest: deepest(episodes, 1)[0],
    median,
    open: episodes.find((e) => e.open) || null,
  };
}

/** A signed one-decimal percentage for a depth: `−40.5%`. */
export function formatDepth(depth) {
  const percent = Math.abs(depth * 100).toFixed(1);
  return depth < 0 ? `−${percent}%` : `${percent}%`;
}

/** Long spans read in years, short ones in days. */
export function formatSpan(days) {
  if (days >= 730) return `${(days / 365.25).toFixed(1)} years`;
  return `${days} day${days === 1 ? '' : 's'}`;
}
