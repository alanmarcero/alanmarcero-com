import { hashString, seededRandom } from './envelope';

/*
 * A release is not a bank.
 *
 * The catalogue draws envelopes because a bank genuinely is 128 of them.
 * A track is not — it is energy over time, so it gets a spectrum instead.
 * Same seeded-from-its-own-name idea, different truth being told, and the
 * two sections stop looking like each other.
 */

const round = (value) => Math.round(value * 100) / 100;

/**
 * A bar spectrum as a list of {x, width, height} in a `width` x `height`
 * box, seeded by a title. Low bins are tall and steady, high bins are
 * short and jumpy — the shape of most recorded music.
 */
export function buildSpectrum({ seed, bars, width, height, gap = 2 }) {
  const random = seededRandom(hashString(seed));
  const barWidth = (width - gap * (bars - 1)) / bars;

  return Array.from({ length: bars }, (_, index) => {
    const position = index / Math.max(1, bars - 1);
    const tilt = 1 - position ** 0.7;           // energy falls with frequency
    const jitter = 0.45 + random() * 0.55;
    const magnitude = Math.max(0.06, Math.min(1, tilt * jitter + 0.05));

    return {
      x: round(index * (barWidth + gap)),
      width: round(barWidth),
      height: round(magnitude * height),
    };
  });
}
