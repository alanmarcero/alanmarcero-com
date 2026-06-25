/**
 * Pure waveform geometry shared by every "live signal" graphic.
 *
 * Each path is sampled on a fixed grid aligned to the wave's period, which
 * buys two properties the animations rely on:
 *   1. Tileable — the path is drawn one extra period past each edge, so a
 *      `translateX` of exactly one period scrolls it seamlessly (a wave that
 *      "moves like a sound wave").
 *   2. Morphable — every shape uses the same x positions and point count, so
 *      SVG `d` interpolation morphs one shape smoothly into another.
 */

const TAU = Math.PI * 2;

// Number of samples per period. Higher = smoother sine, crisper square/saw.
export const SAMPLES_PER_PERIOD = 24;

// Shape value over a normalized period t ∈ [0, 1), output in [-1, 1].
export const WAVE_SHAPES = {
  sine: (t) => Math.sin(TAU * t),
  square: (t) => (t < 0.5 ? 1 : -1),
  saw: (t) => 1 - 2 * t,
};

const phaseAt = (x, period) => (((x / period) % 1) + 1) % 1;

/**
 * Build a tileable waveform path string.
 *
 * @param {keyof WAVE_SHAPES} shape
 * @param {object} opts
 * @param {number} opts.width      visible width (viewBox units)
 * @param {number} opts.mid        vertical center line
 * @param {number} opts.amplitude  peak deviation from the center line
 * @param {number} opts.period     wavelength in viewBox units (should divide width)
 * @returns {string} an SVG path `d` spanning [-period, width + period]
 */
export function buildWavePath(shape, { width, mid, amplitude, period }) {
  const fn = WAVE_SHAPES[shape] ?? WAVE_SHAPES.sine;
  const step = period / SAMPLES_PER_PERIOD;
  const start = -period;
  const count = Math.round((width + 2 * period) / step);
  const segments = [];
  for (let i = 0; i <= count; i++) {
    const x = start + i * step;
    const y = mid - amplitude * fn(phaseAt(x, period));
    segments.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(2)}`);
  }
  return segments.join(" ");
}
