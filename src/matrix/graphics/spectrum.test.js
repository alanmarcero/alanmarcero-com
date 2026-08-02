import { buildSpectrum } from './spectrum';

/**
 * The catalogue's envelope fields are tested next door. This is the other
 * generator on the page, and it makes the same promise: a title always
 * draws the same spectrum, and two titles draw different ones.
 *
 * It also encodes one claim the code makes in prose — "low bins are tall
 * and steady, high bins are short and jumpy" — because that sentence is
 * the reason the section reads as music rather than noise.
 */

const spectrum = (overrides = {}) => buildSpectrum({
  seed: 'Patchwork EP',
  bars: 24,
  width: 240,
  height: 48,
  ...overrides,
});

const heights = (bars) => bars.map((bar) => bar.height);

describe('buildSpectrum', () => {
  it('returns one bar per requested bin', () => {
    expect(spectrum({ bars: 24 })).toHaveLength(24);
    expect(spectrum({ bars: 1 })).toHaveLength(1);
  });

  it('is deterministic for a given seed', () => {
    expect(spectrum()).toEqual(spectrum());
  });

  it('gives two titles different spectra', () => {
    const a = heights(spectrum({ seed: 'Patchwork EP' }));
    const b = heights(spectrum({ seed: 'Night Shift' }));
    expect(a).not.toEqual(b);

    const moved = a.filter((height, i) => height !== b[i]).length;
    expect(moved / a.length).toBeGreaterThan(0.8);
  });

  it('fits the box exactly, including the gaps', () => {
    const bars = spectrum({ bars: 8, width: 240, gap: 2 });
    const last = bars[bars.length - 1];
    expect(round(last.x + last.width)).toBe(240);
  });

  it('gives every bar the same width', () => {
    const widths = new Set(spectrum().map((bar) => bar.width));
    expect(widths.size).toBe(1);
  });

  it('lays bars out left to right without overlap', () => {
    const bars = spectrum({ bars: 12 });
    bars.slice(1).forEach((bar, i) => {
      expect(bar.x).toBeGreaterThan(bars[i].x + bars[i].width - 0.01);
    });
  });

  it('keeps every bar inside the box height', () => {
    ['a', 'Long Player', 'ø', '2026 mix'].forEach((seed) => {
      spectrum({ seed }).forEach((bar) => {
        expect(bar.height).toBeGreaterThan(0);
        expect(bar.height).toBeLessThanOrEqual(48);
      });
    });
  });

  it('never emits a bar too short to see', () => {
    // The generator floors magnitude at 0.06 so no bin disappears.
    spectrum({ bars: 64 }).forEach((bar) => {
      expect(bar.height).toBeGreaterThanOrEqual(round(0.06 * 48));
    });
  });

  it('tilts energy down as frequency rises', () => {
    // The prose claim, tested: average the bottom third against the top
    // third across many seeds so one jumpy spectrum cannot carry it.
    const seeds = Array.from({ length: 40 }, (_, i) => `release ${i}`);
    const mean = (values) => values.reduce((a, b) => a + b, 0) / values.length;

    const lows = [];
    const highs = [];
    seeds.forEach((seed) => {
      const bars = heights(spectrum({ seed, bars: 24 }));
      lows.push(mean(bars.slice(0, 8)));
      highs.push(mean(bars.slice(-8)));
    });

    expect(mean(lows)).toBeGreaterThan(mean(highs) * 1.5);
  });

  it('makes high bins jumpier than low bins', () => {
    // "steady" vs "jumpy" — spread, not level. Measured as mean absolute
    // difference between neighbours within each third.
    const mean = (values) => values.reduce((a, b) => a + b, 0) / values.length;
    const roughness = (values) => mean(
      values.slice(1).map((value, i) => Math.abs(value - values[i])),
    );

    const lowRough = [];
    const highRough = [];
    Array.from({ length: 40 }, (_, i) => `track ${i}`).forEach((seed) => {
      const bars = heights(spectrum({ seed, bars: 24 }));
      lowRough.push(roughness(bars.slice(0, 8)));
      highRough.push(roughness(bars.slice(-8)));
    });

    expect(mean(highRough)).toBeLessThan(mean(lowRough));
  });

  it('honours a custom gap', () => {
    const tight = spectrum({ bars: 6, width: 120, gap: 0 });
    expect(tight[0].width).toBe(20);
    expect(tight[1].x).toBe(20);
  });

  it('handles a single bar spanning the full width', () => {
    const [only] = spectrum({ bars: 1, width: 100 });
    expect(only.x).toBe(0);
    expect(only.width).toBe(100);
  });

  it('never emits NaN', () => {
    const values = spectrum({ bars: 32 }).flatMap(
      (bar) => [bar.x, bar.width, bar.height],
    );
    values.forEach((value) => expect(Number.isNaN(value)).toBe(false));
  });
});

function round(value) {
  return Math.round(value * 100) / 100;
}
