/*
 * The interval orrery — the page's one figure that is also its argument.
 *
 * Kepler's Harmonices Mundi (1619) claimed the planets' orbital periods
 * stand in musical ratios to one another. A catalogue of tuned sounds
 * plotted as orbits is therefore not a costume borrowed from astronomy; it
 * is the oldest version of the same idea.
 *
 * Be exact about which parts of this are measurements and which are labels,
 * because a figure that implies more than it knows is worse than no figure:
 *
 *   The interval is a DESIGNATION, assigned by catalogue position, exactly as
 *   the roman numeral is. It is not derived from the bank. No field in
 *   patchBanks.js can rank eleven banks distinctly — `count` has five distinct
 *   values, `audioDemo.length` three — so a scale of eleven cannot be earned
 *   from the data, and pretending otherwise would be decoration wearing a
 *   costume. The interval sets the ring and the period; that is all it does.
 *
 *   The patch count is the one MEASUREMENT, and it sets how large and bright a
 *   body is. Seven of the eleven banks hold 128 patches, so seven bodies come
 *   out the same size — which is itself worth seeing.
 *
 * Both facts are printed in the figure's caption, in those words.
 *
 * Pure. Same banks in, same diagram out — no PRNG, no clock.
 */

import { goldenAngleTurns, lerp } from './quasirandom';

const TAU = Math.PI * 2;

/** One revolution of the unison, in seconds. Everything else is faster. */
export const BASE_PERIOD = 96;

/** The innermost and outermost orbit, as a fraction of the field radius. */
export const RADIUS_RANGE = [0.2, 1];

/**
 * A body's core, in units of the 100-unit field.
 *
 * Small on purpose. Kepler crowds two of the eleven pairs to 1.85 units
 * apart at the field radius the page draws, so anything above 0.9 puts
 * neighbouring bodies permanently on top of each other. A test asserts the
 * clearance rather than trusting this comment. What carries a bank's size to
 * the eye is the halo below, which is allowed to overlap — two glows
 * blending is what a conjunction looks like.
 */
export const BODY_RADIUS_RANGE = [0.4, 0.8];

/** The soft disc drawn behind a body. Decorative, and free to overlap. */
export const HALO_RADIUS_RANGE = [2.2, 4.2];

/** The faintest a body gets — the magnitude of a bank with no patch count. */
export const FAINTEST_MAGNITUDE = 6;

/** The brightest — a bank at the largest patch count in the catalogue. */
export const BRIGHTEST_MAGNITUDE = 2;

/**
 * The just-intonation scale, ascending: unison, minor second, major second,
 * minor third, major third, fourth, fifth, minor sixth, major sixth, major
 * seventh, octave. The tritone is left out, as it is in the ratios anyone
 * actually tunes.
 */
export const INTERVALS = [
  [1, 1],
  [16, 15],
  [9, 8],
  [6, 5],
  [5, 4],
  [4, 3],
  [3, 2],
  [8, 5],
  [5, 3],
  [15, 8],
  [2, 1],
];

export const ROMAN = [
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI',
  'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
];

/** A roman designation, falling back to the arabic figure past XX. */
export const designationFor = (index) => ROMAN[index] ?? String(index + 1);

/**
 * The interval at a position in the catalogue. Past the octave it keeps
 * going into the next one, so a twelfth bank would sit an octave above the
 * first rather than sharing its ring.
 */
export const intervalAt = (index) => {
  const octave = Math.floor(index / INTERVALS.length);
  const [num, den] = INTERVALS[index % INTERVALS.length];
  const numerator = num * 2 ** octave;
  return {
    num: numerator,
    den,
    label: `${numerator}:${den}`,
    value: numerator / den,
    cents: Math.round(1200 * Math.log2(numerator / den)),
  };
};

/**
 * Kepler's third law: the square of the period goes as the cube of the
 * semi-major axis, so a ∝ T^(2/3). Period goes as den/num, which makes the
 * unison the slowest and outermost body and the octave the fastest and
 * innermost.
 */
const semiMajorAxis = (interval) => (interval.den / interval.num) ** (2 / 3);

/**
 * Every body in the diagram, one per bank.
 *
 * The axes come out of Kepler; the range they are normalised into is the
 * only concession to the page — eleven true axes span 0.63 to 1.00 of the
 * field and would draw as one thick smudge at the rim. The normalisation
 * changes the scale and nothing else: the ordering and the relative spacing
 * are what the law gives.
 */
export const orbitsFor = (banks = []) => {
  if (!banks.length) return [];

  const counts = banks.map((bank) => bank.count || 0);
  const maxCount = Math.max(...counts, 1);

  const intervals = banks.map((_bank, index) => intervalAt(index));
  const axes = intervals.map(semiMajorAxis);
  const minAxis = Math.min(...axes);
  const maxAxis = Math.max(...axes);
  const axisSpan = maxAxis - minAxis;

  return banks.map((bank, index) => {
    const interval = intervals[index];
    const count = bank.count || 0;
    const brightness = count / maxCount;
    // One ring only: without a span there is nothing to normalise against,
    // so it sits at the rim rather than dividing by zero.
    const spread = axisSpan === 0 ? 1 : (axes[index] - minAxis) / axisSpan;

    return {
      bank,
      index,
      designation: designationFor(index),
      interval,
      radius: lerp(RADIUS_RANGE[0], RADIUS_RANGE[1], spread),
      period: (BASE_PERIOD * interval.den) / interval.num,
      phase: TAU * goldenAngleTurns(index),
      magnitude: Number(
        (FAINTEST_MAGNITUDE - (FAINTEST_MAGNITUDE - BRIGHTEST_MAGNITUDE) * brightness).toFixed(1),
      ),
      bodyRadius: lerp(BODY_RADIUS_RANGE[0], BODY_RADIUS_RANGE[1], brightness),
      haloRadius: lerp(HALO_RADIUS_RANGE[0], HALO_RADIUS_RANGE[1], brightness),
      unlisted: !bank.count,
    };
  });
};

/**
 * The tightest space between two neighbouring orbits, in field units.
 *
 * Exists so a test can hold the body scale to it: Kepler decides the spacing,
 * and if a later change to the scale or the interval table closes a gap, the
 * assertion fails rather than the diagram quietly turning to mush.
 */
export const closestApproach = (bodies, fieldRadius = 44) => {
  const radii = bodies.map((body) => body.radius * fieldRadius).sort((a, b) => a - b);
  if (radii.length < 2) return Infinity;
  return Math.min(...radii.slice(1).map((value, index) => value - radii[index]));
};

/**
 * The three rings that get a printed ratio, spread across the field rather
 * than crowded at one edge. Eleven labels would be a thicket; three are a
 * key to the other eight.
 */
export const labelledOrbits = (bodies, wanted = 3) => {
  if (bodies.length <= wanted) return bodies;
  const step = (bodies.length - 1) / (wanted - 1);
  return Array.from({ length: wanted }, (_unused, slot) => bodies[Math.round(slot * step)]);
};

/** Where a body sits at its epoch, in the 100-unit field. */
export const bodyPoint = (body, fieldRadius = 46) => ({
  x: Math.cos(body.phase) * body.radius * fieldRadius,
  y: Math.sin(body.phase) * body.radius * fieldRadius,
});
