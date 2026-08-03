/*
 * The only source of scatter on either route — and it is not random.
 *
 * Every figure on this page has to come out the same on every render, every
 * reload, and in the tests: a star field that reshuffles on each paint reads
 * as noise, and a body that starts at a different point in its orbit each
 * time is not a diagram of anything.
 *
 * Rather than seed a PRNG, both figures walk a low-discrepancy sequence.
 * These are the sequences used to place samples evenly without the clumping
 * a uniform random generator produces, which is exactly what a plausible
 * star field needs and exactly what evenly-spread orbital phases need. No
 * state, no seeding, no hashing — index in, point out.
 */

/** 1/rho, where rho is the plastic number — the R2 sequence's first basis. */
export const PLASTIC_INVERSE = 0.7548776662466927;

/** 1/rho squared — its second. */
export const PLASTIC_INVERSE_SQUARED = 0.5698402909980532;

/** 1/phi, the golden ratio's reciprocal. The most irrational step there is. */
export const GOLDEN_INVERSE = 0.6180339887498949;

/** The fractional part, defined for negatives the way a chart wants it. */
export const frac = (value) => value - Math.floor(value);

/**
 * Roberts' R2 sequence: the two-dimensional generalisation of the golden
 * ratio. Successive points fill the unit square evenly at every count,
 * which a uniform random generator only manages on average.
 */
export const r2Point = (index) => ({
  x: frac(0.5 + PLASTIC_INVERSE * (index + 1)),
  y: frac(0.5 + PLASTIC_INVERSE_SQUARED * (index + 1)),
});

/**
 * A position on a circle, in turns rather than radians, stepping by the
 * golden angle. Eleven of these are as far apart as eleven points on a
 * circle can be, which keeps the orrery's bodies from launching in a row.
 */
export const goldenAngleTurns = (index) => frac(GOLDEN_INVERSE * (index + 1));

/** Map a fraction in [0, 1] onto [min, max]. */
export const lerp = (min, max, fraction) => min + (max - min) * fraction;
