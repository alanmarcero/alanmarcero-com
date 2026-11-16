/* ==========================================================================
   yearOverlay.js — 2018 vs 2026 relative percentage series & chart geometry.
   No DOM, no React: every export takes plain values and returns plain values.
   ========================================================================== */

import { niceStep, polyline, xAt } from '../drawdown/chartGeometry';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Both 2018 and 2026 are non-leap years of 365 calendar days. */
export const DAYS_IN_YEAR = 365;

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

/** Zero-based calendar day of year (`0` for Jan 1, `364` for Dec 31 in non-leap years). */
export function dayOfYear(isoDate) {
  const jan1 = Date.parse(`${isoDate.slice(0, 4)}-01-01T00:00:00Z`);
  return Math.round((Date.parse(`${isoDate}T00:00:00Z`) - jan1) / DAY_MS);
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
export function overlayPlot(series2018, series2026, box, tickCount = 5) {
  const allPcts = [
    ...series2018.map((p) => p.pct),
    ...series2026.map((p) => p.pct),
  ];
  const domain = percentDomain(allPcts, tickCount);
  const yOf = (pct) => percentY(pct, domain, box);

  const mapCoords = (series) => series.map((p) => ({
    ...p,
    x: xAt(p.day, DAYS_IN_YEAR, box),
    y: yOf(p.pct),
  }));

  const coords2018 = mapCoords(series2018);
  const coords2026 = mapCoords(series2026);

  return {
    domain,
    ticks: domain.ticks,
    yOf,
    coords2018,
    coords2026,
    line2018: polyline(coords2018),
    line2026: polyline(coords2026),
  };
}

/**
 * Build a 365-day lookup table aligning 2018 and 2026 by calendar day of year.
 * Each day carries the latest session on or before that day for 2018, and for
 * 2026 up through 2026's final recorded day.
 */
export function buildDayLookup(series2018, series2026) {
  const byDay18 = new Map(series2018.map((p) => [p.day, p]));
  const byDay26 = new Map(series2026.map((p) => [p.day, p]));
  const lastDay26 = series2026.length ? series2026[series2026.length - 1].day : -1;

  let latest18 = null;
  let latest26 = null;
  const days = [];

  for (let d = 0; d < DAYS_IN_YEAR; d += 1) {
    if (byDay18.has(d)) latest18 = byDay18.get(d);
    if (byDay26.has(d)) latest26 = byDay26.get(d);
    days.push({
      day: d,
      label: formatDayOfYear(d),
      p2018: latest18,
      p2026: d <= lastDay26 ? latest26 : null,
    });
  }

  return days;
}
