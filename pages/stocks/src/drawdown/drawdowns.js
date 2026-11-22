/* ==========================================================================
   drawdowns.js — peak-to-trough arithmetic for the daily closes.
   No DOM, no React: every export takes plain values and returns plain values.

   A drawdown starts on an all-time closing high and ends on the first close
   above it. Its depth is the lowest close in between, against that peak. How
   long the top "held" is the calendar days from the peak to that recovery —
   or to the last close, for a drawdown nobody has climbed out of yet.
   ========================================================================== */

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_52_DAYS = 365;

function epochDay(isoDate) {
  return Math.round(Date.parse(`${isoDate}T00:00:00Z`) / DAY_MS);
}

/** Whole days from one ISO date to another; negative if `to` is earlier. */
export function daysBetween(from, to) {
  return epochDay(to) - epochDay(from);
}

/** `112` -> `112 days`, and a lone day is not "1 days". */
export function formatDays(days) {
  return `${days} day${days === 1 ? '' : 's'}`;
}

/** Sensitivity levels for drawdown detection; lower depth thresholds highlight more drawdowns. */
export const TOP_HOLDS = [
  { id: 'any', minDepth: 0.03, label: 'Highest' },
  { id: '1m', minDepth: 0.05, label: 'High' },
  { id: '3m', minDepth: 0.10, label: 'Medium' },
  { id: '6m', minDepth: 0.15, label: 'Low' },
  { id: '1y', minDepth: 0.20, label: 'Lowest' },
];

export const DEFAULT_TOP_HOLD = '3m';

export function topHoldById(id) {
  return TOP_HOLDS.find((h) => h.id === id) || TOP_HOLDS[0];
}

/**
 * Every close against the highest close in the trailing 52 weeks (365 days).
 * `depth` is zero on a 52-week high and negative below one.
 */
export function underwater(closes) {
  const dq = [];
  return closes.map(([date, close]) => {
    const day = epochDay(date);
    while (dq.length && day - dq[0].day > WEEK_52_DAYS) dq.shift();
    while (dq.length && dq[dq.length - 1].close < close) dq.pop();
    dq.push({ date, close, day });
    const peak = dq[0];
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
 * One record per stretch between two 52-week closing highs that dipped below
 * zero. The last one is `open` when the series ends below its 52-week high.
 */
export function drawdownEpisodes(closes) {
  if (!closes.length) return [];
  const points = underwater(closes);
  const lastDate = closes[closes.length - 1][0];
  const episodes = [];
  let trough = null;

  for (const point of points) {
    if (point.depth === 0) {
      if (trough) {
        episodes.push(episode(trough, point.date, lastDate));
        trough = null;
      }
    } else if (!trough || point.depth < trough.depth) {
      trough = point;
    }
  }
  if (trough) episodes.push(episode(trough, null, lastDate));
  return episodes;
}

function episode(trough, recoveryDate, lastDate) {
  return {
    peakDate: trough.peakDate,
    peak: trough.peak,
    troughDate: trough.date,
    trough: trough.close,
    depth: trough.depth,
    recoveryDate,
    open: recoveryDate === null,
    toBottomDays: daysBetween(trough.peakDate, trough.date),
    topDays: daysBetween(trough.peakDate, recoveryDate || lastDate),
  };
}

/** The drawdowns whose top stood at least `minDays`. */
export function heldAtLeast(episodes, minDays) {
  return episodes.filter((e) => e.topDays >= minDays);
}

/** The drawdowns that fell at least `minDepth` (e.g. `0.10` for 10%). */
export function deepestAtLeast(episodes, minDepth) {
  return episodes.filter((e) => -e.depth >= minDepth);
}

/** The `count` deepest drawdowns, deepest first. */
export function deepest(episodes, count) {
  return [...episodes].sort((a, b) => a.depth - b.depth).slice(0, count);
}

/**
 * The deepest drawdown to bottom in each calendar year, deepest first, at
 * most `limit` of them. A drawdown is filed under the year it bottomed —
 * 2007's top that fell until March 2009 is 2009's drop.
 */
export function worstByYear(episodes, limit = 10) {
  const byYear = episodes.reduce((years, episode) => {
    const year = episode.troughDate.slice(0, 4);
    const held = years.get(year);
    if (!held || episode.depth < held.depth) years.set(year, episode);
    return years;
  }, new Map());
  return deepest([...byYear.values()], limit)
    .map((episode) => ({ ...episode, year: episode.troughDate.slice(0, 4) }));
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

/** The filter in words: `at least 10%`, or `any depth`. */
export function describeHold(hold) {
  return hold.minDepth ? `at least ${Math.round(hold.minDepth * 100)}%` : 'any depth';
}

/**
 * The caption under a drawdown chart, derived entirely from what is plotted.
 * `formatDate` and `formatPrice` are passed in so this module stays free of
 * the page's display helpers.
 */
export function describeDrawdowns(summary, holdLabel, { formatDate, formatPrice }) {
  if (!summary) return `No drawdown from a 52-week high reached ${holdLabel}.`;
  const { count, deepest: worst, median, open } = summary;
  const recovery = worst.open
    ? ', and it has not recovered'
    : `, and it took ${formatSpan(worst.topDays)} to set a new 52-week high`;
  const still = open
    ? `The one still open topped out at ${formatPrice(open.peak)} on `
      + `${formatDate(open.peakDate)} and is ${formatDepth(open.depth)} at its lowest `
      + `close so far, ${formatSpan(open.topDays)} on. `
    : '';
  return `${count} drawdown${count === 1 ? '' : 's'} from a 52-week high reached ${holdLabel}. `
    + `The deepest fell ${formatDepth(worst.depth)}, from ${formatDate(worst.peakDate)} to its bottom on `
    + `${formatDate(worst.troughDate)}${recovery}; the median is ${formatDepth(median)}. `
    + `${still}A dot marks each bottom; the deepest are labelled.`;
}

/** A signed one-decimal percentage for a depth: `−40.5%`. */
export function formatDepth(depth) {
  const percent = Math.abs(depth * 100).toFixed(1);
  return depth < 0 ? `−${percent}%` : `${percent}%`;
}

/** Long spans read in years, short ones in days. */
export function formatSpan(days) {
  if (days >= 730) return `${(days / 365.25).toFixed(1)} years`;
  return formatDays(days);
}
