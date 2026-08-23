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

  // Per-track character, drawn once before the bins.
  //
  // MEASURED, because the claim that used to sit here overstated itself. It
  // said that without these "every spectrum shared one falling contour and
  // the tracklist read as a repeating texture". Not so: per-bar jitter alone
  // already separates the nine works by 5.18px mean pairwise bar-height
  // difference (8.1% of this 64px box). These three params raise that to
  // 7.01px — real, and 35% more separation, not the difference between one
  // texture and nine pieces of music.
  //
  // The context that matters more: at the opacity `.work__spectrum` currently
  // renders (0.14 on --panel-2, giving 1.23:1) a 1.83px difference is not
  // visible at all. So this generator is differentiating carefully inside a
  // mark nobody can see. The work is correct and currently spent.
  const rolloff = 0.62 + random() * 0.36;   // how fast energy falls
  const humpAt = 0.08 + random() * 0.34;    // where the track's body sits
  const humpSize = 0.12 + random() * 0.22;

  return Array.from({ length: bars }, (_, index) => {
    const position = index / Math.max(1, bars - 1);
    const tilt = 1 - position ** rolloff;                  // falls with frequency
    const hump = humpSize * Math.exp(-((position - humpAt) ** 2) / 0.014);
    const jitter = 0.45 + random() * 0.55;
    const magnitude = Math.max(0.06, Math.min(1, tilt * jitter + hump + 0.05));

    return {
      x: round(index * (barWidth + gap)),
      width: round(barWidth),
      height: round(magnitude * height),
    };
  });
}
