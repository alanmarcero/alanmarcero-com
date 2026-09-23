/**
 * Text formatting shared by every section that states a number in prose.
 *
 * Noun agreement is split from number formatting so a layout that shows the
 * two apart (the hero puts the figure at display scale and the noun beneath
 * it) uses the SAME rule as one that shows them together. One rule, two
 * presentations — the alternative is a second implementation, which is how
 * "1 releases" shipped: the spoken readout pluralized and the visible one
 * did not, so a search matching exactly one release showed "1 releases" on
 * screen while the live region said "1 release".
 */
export const pluralize = (n, singular, plural = `${singular}s`) =>
  (n === 1 ? singular : plural);

export const count = (n, singular, plural) =>
  `${n.toLocaleString()} ${pluralize(n, singular, plural)}`;

/** A zero-based list position as the two-digit ordinal a catalogue prints: 0 → "01". */
export const ordinal = (index) => String(index + 1).padStart(2, '0');

/**
 * The cue and accessible names for one of a bank's audio demos.
 *
 * `cue` is the visible text and `label` becomes aria-label, which OVERRIDES
 * it — so every label begins with its own cue verbatim (WCAG 2.5.3 Label in
 * Name). The earlier pair ("Hear it" / "Hear <name>") dropped the word "it"
 * from the accessible name and failed on every single-demo bank.
 */
export const demoCopy = (bankName, demoIndex, demoTotal) => {
  if (demoTotal > 1) {
    const position = demoIndex + 1;
    return {
      cue: `Demo ${position}`,
      label: `Demo ${position} of ${demoTotal} — ${bankName}`,
      stopLabel: `Stop demo ${position} — ${bankName}`,
    };
  }
  return {
    cue: 'Hear it',
    label: `Hear it — ${bankName}`,
    stopLabel: `Stop demo — ${bankName}`,
  };
};
