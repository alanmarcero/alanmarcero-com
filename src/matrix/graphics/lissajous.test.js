import { buildLissajous, packetDash } from './lissajous';

const base = { seed: 'alan-marcero-catalog', width: 300, height: 300 };

describe('buildLissajous', () => {
  it('is deterministic for the same seed', () => {
    expect(buildLissajous(base).d).toBe(buildLissajous(base).d);
  });

  it('separates seeds that differ by one character', () => {
    const a = buildLissajous({ ...base, seed: 'field-a' });
    const b = buildLissajous({ ...base, seed: 'field-b' });
    expect(a.d).not.toBe(b.d);
  });

  /*
   * The entire reason this module exists. A dash pattern restarts at every
   * subpath — verified by rasterising a three-subpath path, which produced
   * three dashes, not one. So a packet can only ride a curve with exactly
   * one moveto. If this assertion ever fails, the beam silently becomes N
   * simultaneous packets instead of one travelling highlight.
   */
  it('emits exactly one subpath', () => {
    const { d } = buildLissajous(base);
    expect((d.match(/M/g) || []).length).toBe(1);
  });

  it('closes the loop, so the packet has no seam to jump', () => {
    expect(buildLissajous(base).closed).toBe(true);
  });

  it('picks commensurate frequencies, which is what makes it close', () => {
    const seeds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    seeds.forEach((seed) => {
      const { ratio, closed } = buildLissajous({ ...base, seed });
      const [a, b] = ratio;
      expect(Number.isInteger(a) && Number.isInteger(b)).toBe(true);
      expect(closed).toBe(true);
    });
  });

  it('keeps every point inside the box, inset included', () => {
    const { d } = buildLissajous({ ...base, inset: 6 });
    const nums = d.match(/-?\d+(\.\d+)?/g).map(Number);
    const xs = nums.filter((_, i) => i % 2 === 0);
    const ys = nums.filter((_, i) => i % 2 === 1);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(5.9);
    expect(Math.max(...xs)).toBeLessThanOrEqual(294.1);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(5.9);
    expect(Math.max(...ys)).toBeLessThanOrEqual(294.1);
  });

  it('scales with the box it is given', () => {
    const small = buildLissajous({ ...base, width: 100, height: 100 });
    const large = buildLissajous({ ...base, width: 400, height: 400 });
    const maxOf = (d) => Math.max(...d.match(/-?\d+(\.\d+)?/g).map(Number));
    expect(maxOf(large.d)).toBeGreaterThan(maxOf(small.d));
  });

  it('honours the sample count', () => {
    const coarse = buildLissajous({ ...base, samples: 12 });
    const fine = buildLissajous({ ...base, samples: 200 });
    expect((coarse.d.match(/L/g) || []).length).toBe(12);
    expect((fine.d.match(/L/g) || []).length).toBe(200);
  });
});

describe('packetDash', () => {
  it('expresses the packet as a fraction of the path, resolution-independent', () => {
    expect(packetDash(0.05)).toEqual({ dashArray: '0.05 0.95', pathLength: 1 });
  });

  it('clamps a packet that would swallow the curve or vanish', () => {
    expect(packetDash(0.9).dashArray).toBe('0.5 0.5');
    expect(packetDash(0).dashArray).toBe('0.01 0.99');
    expect(packetDash(-5).dashArray).toBe('0.01 0.99');
  });

  it('always sums to the whole path', () => {
    [0.005, 0.05, 0.2, 0.5].forEach((f) => {
      const [on, off] = packetDash(f).dashArray.split(' ').map(Number);
      expect(on + off).toBeCloseTo(1, 5);
    });
  });
});
