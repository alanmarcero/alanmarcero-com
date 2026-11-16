/* ==========================================================================
   yearOverlay.js — year-vs-year relative percentage series & chart geometry.
   No DOM, no React: every export takes plain values and returns plain values.
   ========================================================================== */

import { niceStep, polyline, xAt } from '../drawdown/chartGeometry';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Calendar slots in a non-leap reference year (`0` = Jan 1 .. `364` = Dec 31). */
export const DAYS_IN_YEAR = 365;

export const CURRENT_YEAR = 2026;

export const OVERLAY_YEARS = [
  2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
];

const MONTH_ABBREVIATIONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const MONTH_STARTS = [
  { label: 'Jan', day: 0 },
  { label: 'Feb', day: 31 },
  { label: 'Mar', day: 59 },
  { label: 'Apr', day: 90 },
  { label: 'May', day: 120 },
  { label: 'Jun', day: 151 },
  { label: 'Jul', day: 181 },
  { label: 'Aug', day: 212 },
  { label: 'Sep', day: 243 },
  { label: 'Oct', day: 273 },
  { label: 'Nov', day: 304 },
  { label: 'Dec', day: 334 },
];

const REF_JAN1 = Date.UTC(2026, 0, 1);

/**
 * Zero-based calendar day in a 365-day reference year (`0` for Jan 1, `364`
 * for Dec 31). Leap-day Feb 29 maps onto Feb 28 (`58`) so Mar 1–Dec 31 align
 * across leap and non-leap years.
 */
export function dayOfYear(isoDate) {
  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  if (month === 2 && day === 29) return 58;
  return Math.round((Date.UTC(2026, month - 1, day) - REF_JAN1) / DAY_MS);
}

/** Calendar label for a 0-based day of a non-leap year, e.g. `0` -> `Jan 1`. */
export function formatDayOfYear(day) {
  const d = new Date(Date.UTC(2026, 0, 1 + day));
  return `${MONTH_ABBREVIATIONS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/**
 * Filter `closes` to `year` and express each close as a relative percentage
 * change from the first close of that year: `(close - base) / base`.
 */
export function extractYearRelative(closes, year) {
  const prefix = `${year}-`;
  const rows = closes.filter(([date]) => date.startsWith(prefix));
  if (!rows.length) return [];
  const base = rows[0][1];
  if (!(base > 0)) return [];
  return rows.map(([date, close]) => ({
    date,
    close,
    pct: (close - base) / base,
    day: dayOfYear(date),
  }));
}

/** Format a decimal return as a signed percentage, e.g. `+10.4%`, `−3.2%`, `0.0%`. */
export function formatSignedPct(pct) {
  const abs = Math.abs(pct) * 100;
  if (abs < 0.05) return '0.0%';
  return `${pct > 0 ? '+' : '−'}${abs.toFixed(1)}%`;
}

/** Format an axis tick percentage, e.g. `+20%`, `0%`, `−20%`. */
export function formatAxisPct(pct) {
  if (pct === 0) return '0%';
  const rounded = Math.round(pct * 100);
  if (rounded === 0) return '0%';
  return rounded > 0 ? `+${rounded}%` : `−${Math.abs(rounded)}%`;
}

/**
 * A round percentage domain that always includes `0` so the baseline sits on
 * a gridline.
 */
export function percentDomain(values, tickCount = 5) {
  const finite = values.filter((v) => Number.isFinite(v));
  const rawMin = Math.min(0, ...finite);
  const rawMax = Math.max(0, ...finite);
  const span = Math.max(rawMax - rawMin, 0.02);
  const step = niceStep(span, tickCount);
  const min = Math.floor(rawMin / step) * step || 0;
  const max = Math.ceil(rawMax / step) * step || 0;

  const ticks = [];
  for (let v = min; v <= max + step / 2; v += step) {
    const rounded = Math.round(v * 1e6) / 1e6;
    ticks.push(rounded === 0 ? 0 : rounded);
  }
  return { min, max, step, ticks };
}

/** Map a decimal percentage onto the plot's vertical pixel coordinate. */
export function percentY(pct, domain, box) {
  const span = domain.max - domain.min || 1;
  return box.bottom - ((pct - domain.min) / span) * box.height;
}

/** Compute coordinates, SVG polylines, and y-axis geometry for both years. */
export function overlayPlot(baseSeries, currentSeries, box, tickCount = 5) {
  const allPcts = [
    ...baseSeries.map((p) => p.pct),
    ...currentSeries.map((p) => p.pct),
  ];
  const domain = percentDomain(allPcts, tickCount);
  const yOf = (pct) => percentY(pct, domain, box);

  const mapCoords = (series) => series.map((p) => ({
    ...p,
    x: xAt(p.day, DAYS_IN_YEAR, box),
    y: yOf(p.pct),
  }));

  const coordsBase = mapCoords(baseSeries);
  const coordsCurrent = mapCoords(currentSeries);

  return {
    domain,
    ticks: domain.ticks,
    yOf,
    coordsBase,
    coordsCurrent,
    lineBase: polyline(coordsBase),
    lineCurrent: polyline(coordsCurrent),
  };
}

/**
 * Build a 365-day lookup table aligning `baseSeries` and `currentSeries` by
 * calendar day of year. Each day carries the latest session on or before that
 * day for `baseSeries`, and for `currentSeries` up through its final day.
 */
export function buildDayLookup(baseSeries, currentSeries) {
  const byDayBase = new Map();
  for (const p of baseSeries) byDayBase.set(p.day, p);

  const byDayCurrent = new Map();
  for (const p of currentSeries) byDayCurrent.set(p.day, p);

  const lastDayCurrent = currentSeries.length ? currentSeries[currentSeries.length - 1].day : -1;

  let latestBase = null;
  let latestCurrent = null;
  const days = [];

  for (let d = 0; d < DAYS_IN_YEAR; d += 1) {
    if (byDayBase.has(d)) latestBase = byDayBase.get(d);
    if (byDayCurrent.has(d)) latestCurrent = byDayCurrent.get(d);
    days.push({
      day: d,
      label: formatDayOfYear(d),
      base: latestBase,
      current: d <= lastDayCurrent ? latestCurrent : null,
    });
  }

  return days;
}

/**
 * Pearson correlation coefficient `r` between `baseSeries` and `currentSeries`
 * relative-percentage curves over their overlapping calendar days.
 * Returns `null` when fewer than 2 overlapping days exist or variance is zero.
 */
export function overlayCorrelation(baseSeries, currentSeries) {
  const pairs = buildDayLookup(baseSeries, currentSeries)
    .filter((d) => d.base && d.current);
  const n = pairs.length;
  if (n < 2) return null;

  let sumX = 0;
  let sumY = 0;
  for (const { base, current } of pairs) {
    sumX += base.pct;
    sumY += current.pct;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let num = 0;
  let denX = 0;
  let denY = 0;
  for (const { base, current } of pairs) {
    const dx = base.pct - meanX;
    const dy = current.pct - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const denom = Math.sqrt(denX * denY);
  if (denom === 0) return null;
  return Math.max(-1, Math.min(1, num / denom));
}

/** Format a Pearson correlation coefficient `r`, e.g. `+0.84`, `−0.42`, `0.00`. */
export function formatCorrelation(r) {
  if (r === null || !Number.isFinite(r)) return 'n/a';
  const abs = Math.abs(r);
  if (abs < 0.005) return '0.00';
  return `${r > 0 ? '+' : '−'}${abs.toFixed(2)}`;
}
