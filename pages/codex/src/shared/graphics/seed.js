/*
 * Deterministic randomness.
 *
 * Every drawing on this page is generated from a string — a bank name, a
 * track title, a game id — and it has to come out the same on every render,
 * every reload, and in the tests. `Math.random()` would give a different
 * instrument a different face on every paint, which reads as noise rather
 * than as a plate of a specific machine.
 */

/** FNV-1a, 32-bit. Small, well-distributed, and no dependencies. */
export const hashSeed = (text) => {
  let hash = 0x811c9dc5;
  const value = String(text ?? '');
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    // The FNV prime, 16777619, applied without overflowing into float
    // territory: Math.imul keeps the whole thing in int32.
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

/**
 * mulberry32 — a 32-bit PRNG that is tiny, fast and has a long enough
 * period for a few hundred draws per figure. Returns a function yielding
 * numbers in [0, 1).
 */
export const makeRandom = (seed) => {
  let state = (typeof seed === 'number' ? seed : hashSeed(seed)) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

/** A random number in [min, max). */
export const between = (random, min, max) => min + random() * (max - min);

/** A random integer in [min, max] — both ends inclusive. */
export const intBetween = (random, min, max) =>
  min + Math.floor(random() * (max - min + 1));

/** Pick one item. Returns undefined for an empty list rather than throwing. */
export const pick = (random, items) =>
  items.length ? items[Math.floor(random() * items.length)] : undefined;
