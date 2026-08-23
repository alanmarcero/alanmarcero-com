/* ==========================================================================
   insiderFilters.js — pure selection + formatting for the insider-sell view.
   The chart, the stat tiles and the table all read from these, so the numbers
   on screen can never disagree with each other.
   ========================================================================== */

export const SELLER_FILTERS = [
  { id: 'all', label: 'All insiders', hint: 'Mike Sievert and everyone else' },
  { id: 'sievert', label: 'Mike Sievert only', hint: 'The CEO’s own sales' },
  { id: 'others', label: 'Everyone else', hint: 'Every insider except the CEO' },
];

export const DEFAULT_FILTER = 'all';

/** Which of the two dot series a filter shows. */
export function visibleSeries(filterId) {
  return {
    sievert: filterId === 'all' || filterId === 'sievert',
    others: filterId === 'all' || filterId === 'others',
  };
}

/** The sell weeks a filter selects, as one flat list tagged by group. */
export function selectedWeeks(filterId, sievertWeeks, otherWeeks) {
  const show = visibleSeries(filterId);
  const rows = [];
  if (show.sievert) rows.push(...sievertWeeks.map((w) => ({ ...w, group: 'sievert' })));
  if (show.others) rows.push(...otherWeeks.map((w) => ({ ...w, group: 'others' })));
  return rows.sort((a, b) => a.week.localeCompare(b.week) || a.group.localeCompare(b.group));
}

/** Roll a list of sell weeks up into the headline numbers. */
export function summarize(rows) {
  const weeks = new Set();
  let shares = 0;
  let value = 0;
  let txns = 0;
  rows.forEach((r) => {
    weeks.add(r.week);
    shares += r.shares;
    value += r.value;
    txns += r.txns;
  });
  return { weekCount: weeks.size, shares, value, txns };
}

/** Every distinct seller in a set of weeks, ordered by shares sold. */
export function sellerTotals(rows) {
  const totals = new Map();
  rows.forEach((row) => {
    row.people.forEach((p) => {
      const prev = totals.get(p.name) || { name: p.name, shares: 0, value: 0 };
      totals.set(p.name, {
        name: p.name,
        shares: prev.shares + p.shares,
        value: prev.value + p.value,
      });
    });
  });
  return [...totals.values()].sort((a, b) => b.shares - a.shares);
}

/* -- formatting ---------------------------------------------------------- */

/** Compact dollars: $4.2M, $912K, $840. */
export function formatUSD(value) {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${Math.round(value / 1e3)}K`;
  return `$${Math.round(value)}`;
}

/** Thousands-separated share counts. */
export function formatShares(shares) {
  return Math.round(shares).toLocaleString('en-US');
}

/** Exact dollars with separators, for the table view. */
export function formatExactUSD(value) {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

/** `2024-03-11` -> `Mar 11, 2024` without pulling in a date library. */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatWeek(iso) {
  const [y, m, d] = iso.split('-');
  const month = MONTHS[Number(m) - 1];
  if (!month) return iso;
  return `${month} ${Number(d)}, ${y}`;
}

export function formatPrice(close) {
  return `$${close.toFixed(2)}`;
}
