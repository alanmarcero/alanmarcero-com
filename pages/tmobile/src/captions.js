/* ==========================================================================
   captions.js — the prose under the quiet-stretch and monthly charts, derived
   from what is plotted rather than written down, so a caption can never go
   stale against its own chart. Pure: plain values in, one string out.
   ========================================================================== */

import { formatDate, formatUSD } from './insiderFilters';
import { formatAmount, formatMonth, formatPercent } from './monthlySeries';
import { describeChange, formatDays, spanLabel } from './sellPressure';

/** A day this large a share of the trailing year's dollars gets named in the caption. */
export const LEANING_DAY_SHARE = 0.4;

/**
 * Past this ratio of tallest to shortest month, the small months survive only
 * as the hairline floor, and the caption owns up to it.
 */
export const HAIRLINE_SPREAD = 20;

function leaningDayNote({ topDay, year }) {
  if (!topDay || topDay.share < LEANING_DAY_SHARE) return '';
  return `The trailing year's dollar figure leans on a single day — `
    + `${formatDate(topDay.date)} is ${formatPercent(topDay.share)} of it `
    + `(${topDay.people[0].name}, ${formatUSD(topDay.value)}) — which is why the filing `
    + `count, ${describeChange(year.change.txns)} on the year, `
    + 'is the honest read on how often anyone is selling.';
}

/** The caption under the quiet-stretch chart, from a `pressureReport`. */
export function quietCaption(pressure, asOf) {
  const {
    current, record, median, halfYear,
  } = pressure;
  if (!current) return 'Nobody in this selection sold in the window, so there is no stretch to measure.';
  const against = record
    ? `, against a previous longest of ${formatDays(record.days)} `
      + `and a typical ${formatDays(median)} between spells of selling`
    : '';
  const span = spanLabel(halfYear.span);
  return 'Each tooth falls to the floor on a sale and climbs while nobody sells, '
    + 'so a wide tooth is a quiet stretch. The one on the right is still open: '
    + `${formatDays(current.days)} as of ${formatDate(asOf)}${against}. `
    + `Over the last ${span} this selection sold `
    + `${formatUSD(halfYear.recent.value)} across ${halfYear.recent.txns} filings, `
    + `${describeChange(halfYear.change.value)} on the `
    + `${formatUSD(halfYear.prior.value)} of the ${span} before. `
    + leaningDayNote(pressure);
}

/**
 * The caption under the monthly chart. `quietLead` is the selection's own
 * wording for a month nobody in it sold ("Mike Sievert did not sell in").
 */
export function monthlyCaption({
  summary, measure, seller, quietLead,
}) {
  if (!summary.peak) return 'Nobody in this selection sold during the window.';
  const mostly = seller ? `, mostly ${seller.name}` : '';
  const hairline = summary.spread >= HAIRLINE_SPREAD
    ? ', and a month with a sale is drawn at least a hairline tall so '
      + 'it cannot disappear next to a month like that'
    : '';
  return `${formatMonth(summary.peak.month)} is ${formatPercent(summary.peakShare)} of `
    + `the ${formatAmount(measure, summary.total)} in this window${mostly}. `
    + `${quietLead} ${summary.quietCount} of the ${summary.monthCount} months${hairline}. `
    + 'The table below has every figure at full precision.';
}
