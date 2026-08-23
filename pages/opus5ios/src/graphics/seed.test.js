import { hashSeed, makeRandom, between, intBetween, pick } from './seed';

describe('hashSeed', () => {
  it('is stable for the same string', () => {
    expect(hashSeed('Roland JP-08')).toBe(hashSeed('Roland JP-08'));
  });

  it('separates strings that differ by one character', () => {
    expect(hashSeed('Nord Lead 2')).not.toBe(hashSeed('Nord Lead 3'));
  });

  it('stays inside unsigned 32-bit range', () => {
    ['', 'a', 'Sequential Prophet 08 and Rev2', 'éèê'].forEach((text) => {
      const hash = hashSeed(text);
      expect(Number.isInteger(hash)).toBe(true);
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThanOrEqual(0xffffffff);
    });
  });

  it('treats null and undefined as the empty string rather than throwing', () => {
    expect(hashSeed(null)).toBe(hashSeed(''));
    expect(hashSeed(undefined)).toBe(hashSeed(''));
  });
});

describe('makeRandom', () => {
  it('replays the same sequence for the same seed', () => {
    const first = makeRandom('Alesis A6 Andromeda');
    const second = makeRandom('Alesis A6 Andromeda');
    const draw = (random) => Array.from({ length: 12 }, () => random());
    expect(draw(first)).toEqual(draw(second));
  });

  it('gives different seeds different sequences', () => {
    const a = makeRandom('Access Virus TI');
    const b = makeRandom('Moog Little Phatty');
    expect(a()).not.toBe(b());
  });

  it('stays within [0, 1)', () => {
    const random = makeRandom(12345);
    for (let index = 0; index < 500; index += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('accepts a numeric seed as well as a string', () => {
    expect(makeRandom(7)()).toBe(makeRandom(7)());
  });
});

describe('between / intBetween', () => {
  it('keeps floats inside the range', () => {
    const random = makeRandom('range');
    for (let index = 0; index < 200; index += 1) {
      const value = between(random, -3, 5);
      expect(value).toBeGreaterThanOrEqual(-3);
      expect(value).toBeLessThan(5);
    }
  });

  it('includes both integer endpoints', () => {
    const random = makeRandom('endpoints');
    const seen = new Set();
    for (let index = 0; index < 400; index += 1) seen.add(intBetween(random, 1, 3));
    expect([...seen].sort()).toEqual([1, 2, 3]);
  });
});

describe('pick', () => {
  it('returns a member of the list', () => {
    const items = ['a', 'b', 'c'];
    const random = makeRandom('pick');
    for (let index = 0; index < 50; index += 1) {
      expect(items).toContain(pick(random, items));
    }
  });

  it('returns undefined for an empty list instead of throwing', () => {
    expect(pick(makeRandom('empty'), [])).toBeUndefined();
  });
});
