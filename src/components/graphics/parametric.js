/**
 * Pure parametric-curve geometry for the XY-oscilloscope halo.
 *
 * A parametric equation traces a 2D figure from a single parameter `t`
 * (see https://en.wikipedia.org/wiki/Parametric_equation). Each builder here
 * returns a point function `t → {x, y}` on the normalized range `t ∈ [0, 1)`,
 * mapped into the unit box `[-1, 1]²`. `buildParametricPath` samples one of
 * those functions on a fixed grid and emits an SVG `d` string.
 *
 * Two properties the animation relies on:
 *   1. Closed — every figure uses integer periods, so `t = 0` and `t = 1`
 *      coincide and the trace joins back on itself.
 *   2. Morphable — every figure is sampled on the same grid with the same
 *      point count, so SVG `d` interpolation morphs one figure into another.
 */

const TAU = Math.PI * 2;

// Samples per closed curve. Higher = smoother figure, crisper petals, but SMIL
// morphs interpolate every point each frame on the main thread, so keep it just
// high enough to read smoothly (150 segments around a closed curve is plenty).
export const CURVE_SAMPLES = 150;

/**
 * Lissajous figure: `x = sin(a·2π·t + δ)`, `y = sin(b·2π·t)`.
 * Integer `a`/`b` keep it closed over `t ∈ [0, 1]`.
 *
 * @param {number} a  horizontal frequency
 * @param {number} b  vertical frequency
 * @param {number} delta  phase offset (radians)
 * @returns {(t: number) => {x: number, y: number}}
 */
export const lissajous = (a, b, delta) => (t) => ({
  x: Math.sin(a * TAU * t + delta),
  y: Math.sin(b * TAU * t),
});

/**
 * Rose (rhodonea) curve: `r = cos(k·2π·t)` in polar form, converted to
 * Cartesian. Integer `k` keeps it closed and confined to the unit disk.
 *
 * @param {number} k  petal frequency
 * @returns {(t: number) => {x: number, y: number}}
 */
export const rose = (k) => (t) => {
  const theta = TAU * t;
  const r = Math.cos(k * theta);
  return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
};

/**
 * Sample a point function into a tileable, morphable SVG path `d`.
 *
 * @param {(t: number) => {x: number, y: number}} pointFn  unit-box curve
 * @param {object} [opts]
 * @param {number} [opts.cx=0]       center x (viewBox units)
 * @param {number} [opts.cy=0]       center y (viewBox units)
 * @param {number} [opts.radius=1]   scale from the unit box to viewBox units
 * @param {number} [opts.samples=CURVE_SAMPLES]  segments around the curve
 * @returns {string} an SVG path `d` with `samples + 1` points (first === last)
 */
export function buildParametricPath(
  pointFn,
  { cx = 0, cy = 0, radius = 1, samples = CURVE_SAMPLES } = {}
) {
  const segments = [];
  for (let i = 0; i <= samples; i++) {
    const { x, y } = pointFn(i / samples);
    const px = cx + radius * x;
    const py = cy + radius * y;
    segments.push(`${i === 0 ? "M" : "L"}${px.toFixed(2)} ${py.toFixed(2)}`);
  }
  return segments.join(" ");
}
