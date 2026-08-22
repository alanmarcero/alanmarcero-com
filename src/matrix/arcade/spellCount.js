/*
 * Spell a small count as a word.
 *
 * This exists because the arcade's lead paragraph said "Twelve arcade
 * machines" as a literal while the registry it describes is a list. The
 * sentence was true on the day it was written and nothing in the repo would
 * have noticed when it stopped being true — no test asserted it, and a
 * thirteenth game is a one-line change in a file this slice does not own.
 *
 * A numeral would have been the smaller fix. The lead is written prose
 * ("no emulator, no ROM"), so it gets a word, and the word gets derived.
 */

const WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
  'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
  'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
];

const capitalize = (word) => `${word[0].toUpperCase()}${word.slice(1)}`;

/**
 * @param {number} count
 * @param {{ capitalized?: boolean }} [options]
 * @returns {string} the count as a word, or as digits past the word list
 */
export function spellCount(count, { capitalized = false } = {}) {
  if (!Number.isInteger(count) || count < 0 || count >= WORDS.length) {
    return String(count);
  }
  return capitalized ? capitalize(WORDS[count]) : WORDS[count];
}

export default spellCount;
