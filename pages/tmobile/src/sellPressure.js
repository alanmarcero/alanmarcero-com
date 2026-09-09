/* ==========================================================================
   sellPressure.js — pure timing arithmetic for the insider-selling view.

   Everything here answers one question: how often are insiders selling, and
   is that rate changing? The dollar total cannot answer it — a single block
   trade by one director can hold a year's total up while every other insider
   goes quiet — so the figures here count DAYS and FILINGS as well as dollars,
   and the page shows all three side by side rather than picking the flattering
   one.

   Gaps are measured between TRADE DATES, never between the Mondays the price
   chart plots, or a Friday sale and the following Monday sale would read as a
   three-day pause.
   ========================================================================== */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days from one ISO date to another; negative if `to` is earlier. */
export function daysBetween(from, to) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

/** An ISO date `days` before another. */
export function isoBefore(iso, days) {
  return new Date(Date.parse(`${iso}T00:00:00Z`) - days * DAY_MS).toISOString().slice(0, 10);
}

/** The sale-day records a seller selection keeps. */
export function selectDays(days, show) {
  return days.filter((day) => show[day.group]);
}

/** Every distinct day somebody in the selection sold, oldest first. */
export function saleDates(days) {
  return [...new Set(days.map((day) => day.date))].sort();
}

/**
 * The pauses between sales: one closed run per pair of consecutive sale days,
 * then the open run from the last sale to the read date. `open` marks the one
 * that has not ended yet — the only run that can still get longer.
 */
export function gapRuns(dates, asOf) {
  if (!dates.length) return [];
  const runs = dates.slice(1).map((to, i) => ({
    from: dates[i], to, days: daysBetween(dates[i], to), open: false,
  }));
  const last = dates[dates.length - 1];
  runs.push({ from: last, to: asOf, days: daysBetween(last, asOf), open: true });
  return runs;
}

/** The open run — how long the current quiet has lasted. */
export function currentGap(runs) {
  return runs.find((run) => run.open) || null;
}

/** The longest run that has already ended: the record the current quiet beats or does not. */
export function longestClosedGap(runs) {
  return runs
    .filter((run) => !run.open)
    .reduce((best, run) => (best && best.days >= run.days ? best : run), null);
}

/**
 * A pause shorter than this is INSIDE a spell of selling, not between two.
 * Insiders file over several consecutive days for what is one decision — a
 * 10b5-1 tranche fills across a Monday and a Tuesday — so counting those as
 * pauses would report the CEO, who sells one quarter in four, as selling
 * every four days.
 */
export const SPELL_BREAK = 7;

/**
 * The typical pause between spells of selling, closed runs only. `longerThan`
 * is what separates a spell from a pause; at 0 every filing-to-filing gap
 * counts, which measures how tightly one spell is filed rather than how often
 * anybody sells.
 */
export function medianGap(runs, { longerThan = 0 } = {}) {
  const closed = runs
    .filter((run) => !run.open && run.days > longerThan)
    .map((run) => run.days)
    .sort((a, b) => a - b);
  if (!closed.length) return 0;
  const middle = Math.floor(closed.length / 2);
  if (closed.length % 2) return closed[middle];
  return Math.round((closed[middle - 1] + closed[middle]) / 2);
}

/** Every figure for the sales inside a half-open date window [start, end]. */
export function totalsBetween(days, start, end) {
  const rows = days.filter((day) => day.date >= start && day.date <= end);
  const sellers = new Set();
  rows.forEach((row) => row.people.forEach((person) => sellers.add(person.name)));
  return {
    value: rows.reduce((sum, row) => sum + row.value, 0),
    shares: rows.reduce((sum, row) => sum + row.shares, 0),
    txns: rows.reduce((sum, row) => sum + row.txns, 0),
    days: rows.length,
    sellers: sellers.size,
  };
}

/** Change from one figure to another as a signed fraction; null if nothing to divide by. */
export function change(prior, recent) {
  if (!prior) return null;
  return (recent - prior) / prior;
}

/**
 * The last `span` days against the `span` days before them — the comparison
 * that says whether selling slowed, on all four figures at once.
 */
export function periodComparison(days, asOf, span) {
  const recentStart = isoBefore(asOf, span - 1);
  const priorStart = isoBefore(asOf, span * 2 - 1);
  const recent = totalsBetween(days, recentStart, asOf);
  const prior = totalsBetween(days, priorStart, isoBefore(recentStart, 1));
  return {
    span,
    recent,
    prior,
    recentStart,
    priorStart,
    change: {
      value: change(prior.value, recent.value),
      shares: change(prior.shares, recent.shares),
      txns: change(prior.txns, recent.txns),
      sellers: change(prior.sellers, recent.sellers),
    },
  };
}

/**
 * Days-since-the-last-sale at every week in the price series — the quiet drawn
 * as a sawtooth, where each tooth falls to zero on a sale and climbs while
 * nobody sells. Weeks before the selection's first sale carry no point at all,
 * because "nobody had sold yet" is not a gap.
 *
 * The final point is read at `asOf` rather than at its Monday, so the height
 * of the open tooth is the same number the tiles quote.
 */
export function gapSeries(weeks, dates, asOf) {
  if (!dates.length) return [];
  let next = 0;
  let last = null;
  return weeks.reduce((points, week, index) => {
    const at = index === weeks.length - 1 ? asOf : week;
    while (next < dates.length && dates[next] <= at) {
      last = dates[next];
      next += 1;
    }
    if (last) points.push({ week, days: daysBetween(last, at), since: last });
    return points;
  }, []);
}

/** The tallest point a gap series reaches — what the y axis has to hold. */
export function peakGap(series) {
  return series.reduce((most, point) => Math.max(most, point.days), 0);
}

/** Who sold, biggest first, with the last date each of them sold on. */
export function sellerRoll(days) {
  const totals = new Map();
  days.forEach((day) => {
    day.people.forEach((person) => {
      const prior = totals.get(person.name)
        || { name: person.name, shares: 0, value: 0, txns: 0, last: day.date, first: day.date };
      totals.set(person.name, {
        name: person.name,
        shares: prior.shares + person.shares,
        value: prior.value + person.value,
        txns: prior.txns + 1,
        first: day.date < prior.first ? day.date : prior.first,
        last: day.date > prior.last ? day.date : prior.last,
      });
    });
  });
  return [...totals.values()].sort((a, b) => b.value - a.value);
}

/**
 * The single biggest day of selling in a window, and how much of the window's
 * dollars it is. A share near 1 means the window's total is one trade wearing
 * a year's clothes, which the caption has to say out loud rather than let the
 * dollar figure imply steady selling.
 */
export function biggestDay(days, start, end) {
  const rows = days.filter((day) => day.date >= start && day.date <= end);
  if (!rows.length) return null;
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const top = rows.reduce((best, row) => (row.value > best.value ? row : best), rows[0]);
  return { ...top, share: total ? top.value / total : 0 };
}

/** How many of the sellers have not sold since `cutoff`. */
export function dormantSellers(roll, cutoff) {
  return roll.filter((seller) => seller.last < cutoff);
}

/* -- formatting ---------------------------------------------------------- */

/** `112` -> `112 days`, and a lone day is not "1 days". */
export function formatDays(days) {
  return `${days} day${days === 1 ? '' : 's'}`;
}

/** A signed whole-percent change: `-64%`, `+12%`, or `—` when there is no base. */
export function formatChange(fraction) {
  if (fraction === null || !Number.isFinite(fraction)) return '—';
  const percent = Math.round(fraction * 100);
  return `${percent > 0 ? '+' : ''}${percent}%`;
}

/** How a change reads in a sentence: down 64%, up 12%, unchanged. */
export function describeChange(fraction) {
  if (fraction === null || !Number.isFinite(fraction)) return 'not comparable';
  const percent = Math.round(Math.abs(fraction) * 100);
  if (!percent) return 'unchanged';
  return `${fraction < 0 ? 'down' : 'up'} ${percent}%`;
}

/** Months, when a span in days is easier read as one: `182` -> `6 months`. */
export function spanLabel(days) {
  const months = Math.round(days / 30.44);
  if (months >= 12 && months % 12 === 0) {
    const years = months / 12;
    return `${years} year${years === 1 ? '' : 's'}`;
  }
  return `${months} months`;
}
