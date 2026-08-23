/*
 * What the instrument draws when there is no photograph.
 *
 * Three banks in the catalogue have none and must never be handed a
 * substitute: the Roland SH-01A, because no freely-licensed photograph of one
 * exists anywhere (re-checked 2026-08-03); Waves CODEX, because a plugin has
 * no hardware to photograph; and the Audio Demo MIDIs, because they are not
 * an instrument. A drawn faceplate would be the wrong answer — draw a machine
 * carefully enough and it reads as a picture of that machine, which is a claim
 * this page cannot support.
 *
 * So they get the picture a real telescope makes of a source it cannot
 * resolve. No aperture focuses a point to a point: diffraction spreads it
 * into a bright core surrounded by fainter rings, and across that pattern the
 * intensity is
 *
 *     I(x) = (2·J₁(x) / x)²,     x = π·D·sin θ / λ
 *
 * which is Airy's 1835 result. Nobody mistakes it for a product shot, and it
 * is the honest image of an unresolved thing.
 *
 * This module is that function and the rings it implies — real physics, not a
 * decorative curve fitted to look like it. Pure: same arguments in, same
 * numbers out, no PRNG and no clock.
 */

import { lerp } from './quasirandom';

/**
 * Bessel function of the first kind, order one.
 *
 * Abramowitz & Stegun (1964) 9.4.4 below |x| = 3 — a polynomial in (x/3)²
 * giving J₁(x)/x, stated accuracy |ε| < 1.3·10⁻⁸ — and 9.4.6 at and above it,
 * the large-argument form J₁(x) = x^(−1/2)·f₁·cos θ₁ where f₁ and θ₁ are each
 * polynomials in 3/x, stated |ε| < 4·10⁻⁸ and |ε| < 9·10⁻⁸. The handbook's
 * own coefficients, unaltered. Checked against the defining power series, the
 * worst error over the range this module uses is 3.5·10⁻⁸ near x = 2.91, and
 * the two branches meet at x = 3 within 4·10⁻⁸ of each other.
 *
 * J₁ is odd, so the negative half is the positive half reflected.
 */
export const besselJ1 = (x) => {
  if (x < 0) return -besselJ1(-x);

  if (x < 3) {
    const t = x / 3;
    const t2 = t * t;
    // 9.4.4 approximates J₁(x)/x rather than J₁(x), which is why the origin
    // comes back as exactly zero and why airyIntensity can divide by x again
    // without losing its leading digits.
    const quotient =
      0.5 +
      t2 *
        (-0.56249985 +
          t2 *
            (0.21093573 +
              t2 *
                (-0.03954289 + t2 * (0.00443319 + t2 * (-0.00031761 + t2 * 0.00001109)))));
    return x * quotient;
  }

  const t = 3 / x;
  const amplitude =
    0.79788456 +
    t *
      (0.00000156 +
        t *
          (0.01659667 +
            t * (0.00017105 + t * (-0.00249511 + t * (0.00113653 + t * -0.00020033)))));
  const phase =
    x -
    2.35619449 +
    t *
      (0.12499612 +
        t *
          (0.0000565 +
            t * (-0.00637879 + t * (0.00074348 + t * (0.00079824 + t * -0.00029166)))));

  return (amplitude * Math.cos(phase)) / Math.sqrt(x);
};

/**
 * The Airy intensity, normalised so the centre of the core is 1.
 *
 * 2·J₁(x)/x is 0/0 at the origin and 1 in the limit, so the centre is stated
 * rather than computed. Even in x, like the pattern it describes.
 */
export const airyIntensity = (x) => {
  if (x === 0) return 1;
  const quotient = (2 * besselJ1(x)) / x;
  return quotient * quotient;
};

/**
 * The zeros of J₁ past the origin, to four places (A&S table 9.5). These are
 * the dark rings: in the aperture's own units they fall at 1.220, 2.233, 3.238
 * and 4.241 λ/D, the first of which is the Rayleigh criterion — the reason
 * this figure means "unresolved" and not merely "out of focus".
 */
export const AIRY_ZEROS = [3.8317, 7.0156, 10.1735, 13.3237];

/** The lightest and heaviest a ring is drawn, in user units of the field. */
export const WIDTH_RANGE = [0.15, 0.9];

/**
 * How much dynamic range the width covers. The first bright ring is 1.75% of
 * the core and the third is 0.16%, so a linear map would put every ring but the
 * core on the floor; three decades is the photometric span an eye at an
 * eyepiece actually separates.
 */
export const WIDTH_DECADES = 3;

const clamp01 = (value) => Math.min(1, Math.max(0, value));

/** Brighter draws heavier, on a log scale, because brightness is logarithmic. */
const widthFor = (intensity) =>
  Number(
    lerp(
      WIDTH_RANGE[0],
      WIDTH_RANGE[1],
      clamp01(1 + Math.log10(intensity) / WIDTH_DECADES),
    ).toFixed(3),
  );

const PEAK_TOLERANCE = 1e-9;

/**
 * Where the bright ring between two dark ones peaks.
 *
 * Between consecutive zeros of J₁ the intensity leaves zero, reaches exactly
 * one maximum and returns to zero, so it is unimodal there and a ternary
 * search cannot be led astray. Solved numerically rather than tabulated
 * because the maxima are the zeros of J₂ and belong to a different table;
 * this way the module only has to be trusted about J₁.
 */
const brightPeakBetween = (lower, upper) => {
  let low = lower;
  let high = upper;
  while (high - low > PEAK_TOLERANCE) {
    const third = (high - low) / 3;
    const left = low + third;
    const right = high - third;
    if (airyIntensity(left) < airyIntensity(right)) {
      low = left;
      continue;
    }
    high = right;
  }
  return (low + high) / 2;
};

/**
 * The pattern as a list of rings, scaled so the outermost dark ring requested
 * lands on the edge of the field.
 *
 * `radius` is the dark ring itself; `peak` is where the bright ring inside it
 * is brightest and `intensity` is how bright, both of which the caller needs
 * because the rings are what gets drawn but the light between them is what
 * gets measured. Ring 0 is the exception and says so: inside the first dark
 * ring the pattern falls monotonically from the centre, so there is no ring in
 * there to find — the brightest point in that bracket is the core, at 0.
 */
export const airyRings = (count = 4, fieldRadius = 44) => {
  const zeros = AIRY_ZEROS.slice(0, count);
  if (!zeros.length) return [];

  const scale = fieldRadius / zeros[zeros.length - 1];

  return zeros.map((zero, index) => {
    const peak = index === 0 ? 0 : brightPeakBetween(zeros[index - 1], zero);
    const intensity = airyIntensity(peak);

    return {
      index,
      radius: zero * scale,
      peak: peak * scale,
      intensity,
      width: widthFor(intensity),
    };
  });
};
