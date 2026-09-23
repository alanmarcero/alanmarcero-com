/**
 * Pure simulation behind the SignalMeter's fake spectrum. There is no audio:
 * each bar is a pair of slow sines plus random beat spikes. Randomness is
 * injected so the simulation can be tested deterministically.
 */

const TAU = Math.PI * 2;

export const BAR_FALL = 0.045; // bars drop fast (gravity)
export const PEAK_FALL = 0.015; // peak caps linger above, falling slower

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// colour band by height fraction: bottom green, mid yellow, top red
export const segmentBand = (frac) => {
  if (frac < 0.55) return 'green';
  if (frac < 0.8) return 'yellow';
  return 'red';
};

/** Per-bar oscillation speed and phase, fixed for the life of the meter. */
export const createBarParams = (count, random = Math.random) =>
  Array.from({ length: count }, () => ({
    speed: 1.4 + random() * 3.2,
    phase: random() * TAU,
  }));

/** The level bar `i` of `count` is pulled toward at time `t` (seconds), in [0, 1]. */
export function barTarget(t, i, count, { speed, phase }, random = Math.random) {
  const bass = 1 - (i / count) * 0.4; // low bars (bass) sit a touch higher
  const env = 0.55 + 0.45 * Math.sin(t * 0.6 + i * 0.5); // slow swell
  const osc = 0.5 + 0.5 * Math.sin(t * speed + phase);
  // boosted so bars regularly climb into the yellow/red, with beat spikes
  const beat = random() < 0.05 ? 0.5 : 0;
  const jitter = (random() - 0.5) * 0.15;
  return clamp01(osc * env * bass * 1.35 + beat + jitter);
}

/** A bar jumps straight up to its target and falls under gravity; its peak cap holds, then drifts down. */
export function stepBar({ level, peak }, target) {
  const nextLevel = Math.max(target, level - BAR_FALL);
  const nextPeak = nextLevel >= peak ? nextLevel : Math.max(0, peak - PEAK_FALL);
  return { level: nextLevel, peak: nextPeak };
}

/** The frozen frame shown under reduced motion: a spectrum with peaks resting above the bars. */
export const staticBars = (count) =>
  Array.from({ length: count }, (_, i) => {
    const level = 0.25 + 0.5 * Math.abs(Math.sin(i * 0.9));
    return { level, peak: Math.min(1, level + 0.18) };
  });
