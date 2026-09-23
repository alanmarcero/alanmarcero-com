import { synthImages, imageFor, photoBrightnessFor } from './synthImages';

describe('photoBrightnessFor', () => {
  /*
   * The contract with the shared surface. The consumer spreads this into a
   * style object as a custom property; React omits `undefined` but emits
   * empty text for `null`, which produces `brightness(calc(0.86 * ))` —
   * invalid CSS, which drops the whole `filter` declaration and renders the
   * photo completely unfiltered. So this must be `undefined` specifically,
   * and asserting "falsy" would let `null` through.
   */
  it('returns undefined, not null, for a bank with no photograph', () => {
    expect(photoBrightnessFor('Roland SH-01A')).toBeUndefined();
    expect(photoBrightnessFor('Waves CODEX')).toBeUndefined();
    expect(photoBrightnessFor('Audio Demo MIDIs')).toBeUndefined();
    expect(photoBrightnessFor('a bank that does not exist')).toBeUndefined();
  });

  // A photograph without a measured correction renders at the shared default,
  // which is the 3.4x contrast spread the corrections exist to remove. The
  // generator carries measurements forward, so a new photo arrives without one.
  it('returns a measured correction for every photographed bank', () => {
    Object.keys(synthImages).forEach((bank) => {
      expect(photoBrightnessFor(bank)).toEqual(expect.any(Number));
    });
  });

  it('never returns null for any key, present or absent', () => {
    const keys = [...Object.keys(synthImages), 'absent', '', 'null'];
    keys.forEach((k) => expect(photoBrightnessFor(k)).not.toBeNull());
  });
});

describe('the measured corrections', () => {
  const measured = Object.values(synthImages)
    .map((i) => i.brightness)
    .filter((b) => typeof b === 'number');

  /*
   * These multiply a base brightness of 0.86 and then pass through a
   * contrast stage. Outside roughly 0.5-1.6 the result either crushes to
   * black or blows the highlights, so a value beyond that range means the
   * measurement was taken against the wrong ground rather than that the
   * photograph is unusual.
   */
  it('all sit inside the sane multiplier range', () => {
    measured.forEach((b) => {
      expect(b).toBeGreaterThanOrEqual(0.5);
      expect(b).toBeLessThanOrEqual(1.6);
    });
  });

  it('spans a real range — a uniform value would mean the work was not done', () => {
    const spread = Math.max(...measured) / Math.min(...measured);
    expect(spread).toBeGreaterThan(2);
  });
});

describe('existing exports still hold', () => {
  it('imageFor still returns null for an absent bank', () => {
    expect(imageFor('nope')).toBeNull();
  });
});
