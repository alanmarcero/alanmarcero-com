/*
 * Where the orrery's bodies start, and the only source of scatter on either
 * route — which is not random.
 *
 * The figure has to come out the same on every render, every reload and in the
 * tests: a body that begins at a different point in its orbit each time is not
 * a diagram of anything. Rather than seed a PRNG, the phases walk a
 * low-discrepancy sequence — the kind used to place samples evenly without the
 * clumping a uniform generator produces. No state, no seeding, no hashing:
 * index in, position out.
 */

/** 1/phi, the golden ratio's reciprocal. The most irrational step there is. */
export const GOLDEN_INVERSE = 0.6180339887498949;

/** The fractional part, defined for negatives the way a chart wants it. */
export const frac = (value) => value - Math.floor(value);

/**
 * A position on a circle, in turns rather than radians, stepping by the
 * golden angle. Eleven of these are as far apart as eleven points on a
 * circle can be, which keeps the orrery's bodies from launching in a row.
 */
export const goldenAngleTurns = (index) => frac(GOLDEN_INVERSE * (index + 1));

/** Map a fraction in [0, 1] onto [min, max]. */
export const lerp = (min, max, fraction) => min + (max - min) * fraction;
