/* ==========================================================================
   format.js — date and price formatting for the drawdown charts and tables.
   ========================================================================== */

const MONTH_ABBREVIATIONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `2024-03-11` -> `Mar 11, 2024` without pulling in a date library. */
export function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  const month = MONTH_ABBREVIATIONS[Number(m) - 1];
  if (!month) return iso;
  return `${month} ${Number(d)}, ${y}`;
}

/** A close to the cent, with separators: a bitcoin trades in six figures. */
export function formatPrice(close) {
  return `$${close.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
