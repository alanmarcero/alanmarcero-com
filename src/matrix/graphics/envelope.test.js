import {
  hashString,
  seededRandom,
  envelopePoints,
  buildFieldPath,
} from './envelope';

/**
 * The whole module exists to make one promise: the same content always
 * draws the same texture, and different content draws different texture.
 * Everything below is that promise, taken apart.
 */

const field = (overrides = {}) => buildFieldPath({
  seed: 'Prophet-5',
  count: 12,
  columns: 4,
  cellWidth: 12,
  cellHeight: 9,
  ...overrides,
});

const subpathCount = (d) => (d.match(/M/g) || []).length;

const coordsOf = (d) => (d.match(/-?\d+(\.\d+)?/g) || []).map(Number);

describe('hashString', () => {
  it('is deterministic', () => {
    expect(hashString('Jupiter-8')).toBe(hashString('Jupiter-8'));
  });

  it('separates names that differ by one character', () => {
    expect(hashString('CS-80')).not.toBe(hashString('CS-81'));
  });

  it('separates anagrams', () => {
    expect(hashString('abc')).not.toBe(hashString('cba'));
  });

  it('returns an unsigned 32-bit integer', () => {
    ['', 'a', 'Oberheim OB-Xa', '——unicode ✳'].forEach((input) => {
      const hash = hashString(input);
      expect(Number.isInteger(hash)).toBe(true);
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThanOrEqual(0xffffffff);
    });
  });

  it('handles the empty string without throwing', () => {
    expect(() => hashString('')).not.toThrow();
  });
});

describe('seededRandom', () => {
  it('replays the same sequence for the same seed', () => {
    const take = () => {
      const next = seededRandom(12345);
      return [next(), next(), next(), next()];
    };
    expect(take()).toEqual(take());
  });

  it('produces a different sequence for a different seed', () => {
    const a = seededRandom(1);
    const b = seededRandom(2);
    expect(a()).not.toBe(b());
  });

  it('stays within [0, 1)', () => {
    const next = seededRandom(hashString('Minimoog'));
    for (let i = 0; i < 500; i += 1) {
      const value = next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('does not immediately repeat itself', () => {
    const next = seededRandom(99);
    const seen = new Set();
    for (let i = 0; i < 200; i += 1) seen.add(next());
    // A stuck generator would collapse to a handful of values.
    expect(seen.size).toBeGreaterThan(190);
  });
});

describe('envelopePoints', () => {
  const points = (seed = 7) => envelopePoints(seededRandom(seed), 100, 40);

  it('draws the five ADSR vertices', () => {
    expect(points()).toHaveLength(5);
  });

  it('starts and ends on the baseline', () => {
    const [first, , , , last] = points();
    expect(first).toEqual([0, 40]);
    expect(last).toEqual([100, 40]);
  });

  it('peaks at the top of the cell', () => {
    const [, peak] = points();
    expect(peak[1]).toBe(0);
  });

  it('advances left to right', () => {
    const xs = points().map(([x]) => x);
    const sorted = [...xs].sort((a, b) => a - b);
    expect(xs).toEqual(sorted);
  });

  it('keeps every vertex inside the cell', () => {
    for (let seed = 0; seed < 60; seed += 1) {
      points(seed).forEach(([x, y]) => {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(100);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(40);
      });
    }
  });

  it('holds the sustain level flat between decay and release', () => {
    const [, , decay, release] = points();
    expect(decay[1]).toBe(release[1]);
  });

  it('scales with the cell it is given', () => {
    const [, , , , last] = envelopePoints(seededRandom(3), 7, 3);
    expect(last).toEqual([7, 3]);
  });
});

describe('buildFieldPath', () => {
  it('is deterministic for a given seed', () => {
    expect(field().d).toBe(field().d);
  });

  it('gives two different banks obviously different textures', () => {
    const a = field({ seed: 'Prophet-5' });
    const b = field({ seed: 'Juno-106' });
    expect(a.d).not.toBe(b.d);

    // Not merely unequal — the shape should actually move, not drift in
    // one vertex. Half of each glyph's ten coordinates are grid-derived
    // and CANNOT move: both baseline vertices (4) and the peak's y (1).
    // So 50% is the structural ceiling here, not a floor to clear.
    const [xs, ys] = [coordsOf(a.d), coordsOf(b.d)];
    const moved = xs.filter((value, i) => value !== ys[i]).length;
    expect(moved / xs.length).toBeGreaterThan(0.4);
  });

  it('varies every free parameter, not just one', () => {
    // The five movable coordinates per glyph are attack-x, decay-x,
    // decay-y, release-x, release-y. If a future refactor froze one of
    // them, the test above would still pass on the strength of the rest.
    // One glyph emits: M0 40 L attackX 0 L decayX sustainY
    //                  L releaseX sustainY L 100 40
    // Indices 2, 4, 5, 6, 7 are the movable ones.
    const cell = { count: 1, columns: 1, cellWidth: 100, cellHeight: 40 };
    const free = (seed) => {
      const all = coordsOf(buildFieldPath({ seed, ...cell }).d);
      return [2, 4, 5, 6, 7].map((i) => all[i]);
    };
    const a = free('Prophet-5');
    const b = free('Juno-106');
    a.forEach((value, i) => expect(value).not.toBe(b[i]));
  });

  it('emits one subpath per envelope', () => {
    expect(subpathCount(field({ count: 37, columns: 6 }).d)).toBe(37);
  });

  it('emits the whole field as a single path string', () => {
    const { d } = field({ count: 1500, columns: 50 });
    expect(typeof d).toBe('string');
    expect(subpathCount(d)).toBe(1500);
  });

  it('reports the rows it used', () => {
    expect(field({ count: 12, columns: 4 }).rows).toBe(3);
    expect(field({ count: 13, columns: 4 }).rows).toBe(4);
  });

  it('sizes the viewBox to the grid without a trailing gap', () => {
    const { width, height } = field({
      count: 8, columns: 4, cellWidth: 10, cellHeight: 6, gap: 2,
    });
    expect(width).toBe(4 * 12 - 2);
    expect(height).toBe(2 * 8 - 2);
  });

  it('defaults the gap when none is given', () => {
    const { width } = buildFieldPath({
      seed: 'x', count: 2, columns: 2, cellWidth: 10, cellHeight: 5,
    });
    expect(width).toBe(2 * 12 - 2);
  });

  it('rounds coordinates to two decimals so the string stays small', () => {
    coordsOf(field().d).forEach((value) => {
      expect(Number(value.toFixed(2))).toBe(value);
    });
  });

  it('lays glyphs out in row-major order', () => {
    const { d } = field({
      count: 4, columns: 2, cellWidth: 10, cellHeight: 10, gap: 0,
    });
    const originYs = [...d.matchAll(/M-?\d+(?:\.\d+)? (-?\d+(?:\.\d+)?)/g)]
      .map((match) => Number(match[1]));
    // Baselines: first row bottoms at y=10, second row at y=20.
    expect(originYs).toEqual([10, 10, 20, 20]);
  });

  it('handles a single-envelope field', () => {
    const { d, rows } = field({ count: 1, columns: 4 });
    expect(subpathCount(d)).toBe(1);
    expect(rows).toBe(1);
  });

  it('produces an empty path for an empty bank', () => {
    const { d, rows } = field({ count: 0, columns: 4 });
    expect(d).toBe('');
    expect(rows).toBe(0);
  });

  it('never emits NaN', () => {
    expect(field({ count: 25, columns: 5 }).d).not.toMatch(/NaN/);
  });
});

describe('buildFieldPath grouping', () => {
  const base = {
    seed: 'grouping', count: 12, columns: 4, cellWidth: 8, cellHeight: 6, gap: 2,
  };

  it('returns no bands when no groups are given', () => {
    expect(buildFieldPath(base).bands).toBeNull();
    expect(buildFieldPath({ ...base, groups: [] }).bands).toBeNull();
  });

  /*
   * The default must be byte-identical, not merely equivalent. Hero and every
   * catalogue row render the ungrouped path, and a field that shifted by a
   * rounding step would change 12 rendered surfaces silently.
   */
  it('leaves the single path untouched when grouping is off', () => {
    const before = buildFieldPath(base).d;
    const after = buildFieldPath({ ...base, groups: null }).d;
    expect(after).toBe(before);
  });

  it('splits into one path per group, and the bands reconstruct the whole field', () => {
    const field = buildFieldPath({ ...base, groups: [5, 4, 3] });
    expect(field.bands).toHaveLength(3);
    expect(field.bands.join('')).toBe(field.d);
  });

  it('gives each band exactly its group size in glyphs', () => {
    const field = buildFieldPath({ ...base, groups: [5, 4, 3] });
    const counts = field.bands.map((d) => (d.match(/M/g) || []).length);
    expect(counts).toEqual([5, 4, 3]);
  });

  /*
   * A caller whose data drifted gets a partial banding and a whole field.
   * Losing glyphs would be worse than losing the banding: the field is the
   * portrait of the collection, and a short group array must not silently
   * shrink it.
   */
  it('keeps every glyph when the groups undercount', () => {
    const field = buildFieldPath({ ...base, groups: [2, 2] });
    expect(field.bands.join('')).toBe(field.d);
    expect((field.d.match(/M/g) || []).length).toBe(12);
  });

  it('ignores non-positive and non-integer group sizes without throwing', () => {
    const field = buildFieldPath({ ...base, groups: [4, 0, -3, 2.5, 4] });
    expect(field.bands.join('')).toBe(field.d);
    expect((field.bands[0].match(/M/g) || []).length).toBe(4);
  });

  it('is still deterministic for the same seed when grouped', () => {
    const a = buildFieldPath({ ...base, groups: [6, 6] });
    const b = buildFieldPath({ ...base, groups: [6, 6] });
    expect(a.bands).toEqual(b.bands);
  });
});
