/* ==========================================================================
   instruments.js — ordering and naming for the instrument list.
   Pure: no DOM, no React.
   ========================================================================== */

/**
 * Alphabetical by the label the page files each one under, ignoring case —
 * so Bitcoin sits before BRK-B, as it would in an index.
 */
export function byLabel(instruments) {
  return [...instruments].sort((a, b) => a.label.localeCompare(b.label, 'en', { sensitivity: 'base' }));
}

/** A URL fragment for an instrument: `#btc-usd`. */
export function anchorOf(instrument) {
  return instrument.symbol.toLowerCase();
}

/** The panel heading: a coin by name, a fund by ticker and what it tracks. */
export function titleOf(instrument) {
  if (instrument.label === instrument.symbol) return `${instrument.label} — ${instrument.blurb}`;
  return `${instrument.label} (${instrument.symbol})`;
}
