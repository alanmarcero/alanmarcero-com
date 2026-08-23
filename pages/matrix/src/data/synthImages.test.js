import { synthImages, imageFor, photoBrightnessFor, credits } from './synthImages';

describe('photoBrightnessFor', () => {
  it('returns the measured correction for a photographed bank', () => {
    const name = Object.keys(synthImages)[0];
    expect(typeof photoBrightnessFor(name)).toBe('number');
  });

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

  it('returns undefined for an entry that has no measurement', () => {
    // An image added later by someone who never read the header.
    const unmeasured = { slug: 'x', alt: 'x', author: 'x', licence: 'x' };
    expect(typeof unmeasured.brightness).toBe('undefined');
    expect(photoBrightnessFor('a bank that does not exist')).toBeUndefined();
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

  it('covers every photographed bank', () => {
    expect(measured).toHaveLength(Object.keys(synthImages).length);
  });

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

  it('every credited image still carries its attribution', () => {
    credits.forEach((c) => {
      expect(c.author).toBeTruthy();
      expect(c.licence).toBeTruthy();
    });
  });
});
