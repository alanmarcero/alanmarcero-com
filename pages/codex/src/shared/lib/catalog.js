/**
 * Catalog arithmetic — pure, exported, and tested, because the hero renders
 * these numbers as factual claims about the product.
 *
 * The count that motivated this module: the hero said "N patches across N
 * instruments" while N was computed by counting BANKS. Ten banks cover
 * twenty-four instruments — the Prophet 08 bank alone covers five — so the
 * most prominent claim on the page understated the catalog by more than half.
 *
 * `src/App.jsx` computes the same expression and names it PATCH_BANK_COUNT,
 * which is correct. The rename to INSTRUMENT_COUNT is what made a true number
 * false, so the lesson is kept here rather than in a commit message: a count
 * is only as true as the noun beside it.
 */

/** Total patches across every bank. Banks with no `count` contribute nothing. */
export const totalPatches = (banks) =>
  banks.reduce((sum, bank) => sum + (bank.count || 0), 0);

/** Banks that ship patches. Not the same thing as instruments — see below. */
export const patchBankCount = (banks) =>
  banks.filter((bank) => bank.count).length;

/**
 * Distinct instruments covered, de-duplicated across banks.
 *
 * Reads the explicit `instruments` array rather than parsing bank names.
 * Parsing is tempting and wrong: "Slim Phatty and Little Phatty" is two
 * machines, "Prophet 08 and Rev2" is two of five, and "JP-8000, JP-8080,
 * JE-8086, and Airwave" is four — no split rule survives all three.
 */
export const instrumentCount = (banks) =>
  new Set(banks.flatMap((bank) => bank.instruments || [])).size;

/**
 * Case-insensitive substring match across the given fields.
 * An empty query matches everything, which is what a search box wants.
 */
export const matchesQuery = (query, ...fields) => {
  if (!query) return true;
  const needle = query.toLowerCase();
  return fields.some((field) => (field || '').toLowerCase().includes(needle));
};
