/*
 * Oscillator traces.
 *
 * One cycle of a summed harmonic series, plotted the way a scope screenshot
 * gets printed in a service manual: a single stroke on a ruled grid. The
 * harmonic weights come from the bank's own name, so the Prophet plate and
 * the Virus plate carry visibly different waves and the same bank always
 * draws the same one.
 *
 * Everything here is pure geometry — no React, no DOM — so the shapes can
 * be asserted directly.
 */

import { makeRandom, between, intBetween } from './seed';

/**
 * The harmonic recipe for a seed: partials 1..n with decaying amplitudes
 * and scattered phases.
 *
 * Amplitude decays as 1/harmonic^falloff, which is what actually separates
 * the classic waveshapes from each other — a saw is 1/n, a square is 1/n
 * over odd partials only, and anything steeper rounds off toward a sine.
 * Drawing from that family rather than from uniform noise is why these read
 * as oscillator waves rather than as squiggles.
 */
export const harmonics = (seed, count = 7) => {
  const random = makeRandom(seed);
  const falloff = between(random, 0.9, 1.9);
  const oddOnly = random() < 0.4;

  const partials = [];
  for (let index = 0; index < count; index += 1) {
    const harmonic = oddOnly ? index * 2 + 1 : index + 1;
    partials.push({
      harmonic,
      amplitude: 1 / harmonic ** falloff,
      // Phases are quantised to eighths of a cycle. Free phases make the
      // wave wander off the vertical centre in a way that looks like a
      // plotting bug; eighths keep it symmetric enough to read as a signal.
      phase: (intBetween(random, 0, 7) / 8) * Math.PI * 2,
    });
  }
  return partials;
};

/** Sample value of a harmonic series at phase `t` (0..1 of one cycle). */
export const sampleAt = (partials, t) => partials.reduce(
  (sum, { harmonic, amplitude, phase }) =>
    sum + amplitude * Math.sin(2 * Math.PI * harmonic * t + phase),
  0,
);

/**
 * One cycle of the wave, sampled across `width` and normalised to fill
 * `height`.
 *
 * `cycles` > 1 repeats the same period rather than sampling further along
 * it, so the trace tiles seamlessly however wide the plate gets.
 */
export const wavePoints = ({
  seed,
  width = 240,
  height = 60,
  samples = 128,
  cycles = 1,
  partials = harmonics(seed),
}) => {
  const raw = [];
  for (let index = 0; index <= samples; index += 1) {
    raw.push(sampleAt(partials, ((index / samples) * cycles) % 1));
  }

  // Normalise against the extreme this particular series actually reached.
  // Scaling by the theoretical maximum instead would leave every trace but
  // the saw sitting as a flat line in the middle of its plate.
  const peak = raw.reduce((max, value) => Math.max(max, Math.abs(value)), 0) || 1;
  const midline = height / 2;

  return raw.map((value, index) => ({
    x: (index / samples) * width,
    y: midline - (value / peak) * midline,
  }));
};

/** An SVG path `d` through the points. */
export const linePath = (points) => points
  .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`)
  .join(' ');

/**
 * The same trace closed against the midline and mirrored below it — the
 * printed-waveform silhouette a release gets, rather than the single-stroke
 * scope trace an instrument gets.
 */
export const silhouettePath = (points, height) => {
  const midline = height / 2;
  const top = points
    .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`);
  const bottom = [...points]
    .reverse()
    .map(({ x, y }) => `L${x.toFixed(2)} ${(2 * midline - y).toFixed(2)}`);
  return `${top.join(' ')} ${bottom.join(' ')} Z`;
};
