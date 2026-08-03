import {
  frac,
  r2Point,
  goldenAngleTurns,
  lerp,
  PLASTIC_INVERSE,
  PLASTIC_INVERSE_SQUARED,
  GOLDEN_INVERSE,
} from './quasirandom';

describe('frac', () => {
  it('keeps only the fractional part', () => {
    expect(frac(3.25)).toBeCloseTo(0.25, 10);
    expect(frac(0.5)).toBeCloseTo(0.5, 10);
    expect(frac(7)).toBe(0);
  });

  it('returns a positive fraction for negative input', () => {
    expect(frac(-0.25)).toBeCloseTo(0.75, 10);
  });
});

describe('the constants', () => {
  it('carries the plastic number and the golden ratio to their definitions', () => {
    // rho is the real root of x^3 = x + 1, so 1/rho satisfies the same
    // relation in reverse: rho^3 - rho - 1 = 0.
    const rho = 1 / PLASTIC_INVERSE;
    expect(rho ** 3 - rho - 1).toBeCloseTo(0, 9);
    expect(PLASTIC_INVERSE_SQUARED).toBeCloseTo(PLASTIC_INVERSE ** 2, 12);

    // phi^2 = phi + 1, so 1/phi = phi - 1.
    const phi = 1 / GOLDEN_INVERSE;
    expect(phi - 1).toBeCloseTo(GOLDEN_INVERSE, 9);
  });
});

describe('r2Point', () => {
  it('stays inside the unit square', () => {
    for (let index = 0; index < 500; index += 1) {
      const { x, y } = r2Point(index);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThan(1);
    }
  });

  it('returns the same point for the same index', () => {
    expect(r2Point(42)).toEqual(r2Point(42));
    expect(r2Point(0)).not.toEqual(r2Point(1));
  });

  it('reaches all four quadrants within the first sixteen points', () => {
    const quadrants = new Set();
    for (let index = 0; index < 16; index += 1) {
      const { x, y } = r2Point(index);
      quadrants.add(`${x < 0.5 ? 'l' : 'r'}${y < 0.5 ? 't' : 'b'}`);
    }
    expect(quadrants.size).toBe(4);
  });

  it('spreads more evenly than it clumps — no two of the first 64 coincide', () => {
    const points = Array.from({ length: 64 }, (_unused, index) => r2Point(index));
    let closest = Infinity;

    for (let a = 0; a < points.length; a += 1) {
      for (let b = a + 1; b < points.length; b += 1) {
        const distance = Math.hypot(points[a].x - points[b].x, points[a].y - points[b].y);
        closest = Math.min(closest, distance);
      }
    }

    // A uniform random draw of 64 points routinely puts a pair within 0.01
    // of each other. A low-discrepancy sequence does not.
    expect(closest).toBeGreaterThan(0.03);
  });
});

describe('goldenAngleTurns', () => {
  it('stays inside one turn', () => {
    for (let index = 0; index < 200; index += 1) {
      const turns = goldenAngleTurns(index);
      expect(turns).toBeGreaterThanOrEqual(0);
      expect(turns).toBeLessThan(1);
    }
  });

  it('keeps eleven phases well apart', () => {
    const turns = Array.from({ length: 11 }, (_unused, index) => goldenAngleTurns(index)).sort(
      (a, b) => a - b,
    );
    const gaps = turns.slice(1).map((value, index) => value - turns[index]);

    // Eleven points spread perfectly would sit 1/11 = 0.0909 apart. The
    // golden angle gets within a factor of two of that at every gap, which
    // is the property being relied on.
    expect(Math.min(...gaps)).toBeGreaterThan(0.045);
  });

  it('is deterministic', () => {
    expect(goldenAngleTurns(7)).toBe(goldenAngleTurns(7));
  });
});

describe('lerp', () => {
  it('maps the ends and the middle', () => {
    expect(lerp(0.2, 1, 0)).toBeCloseTo(0.2, 10);
    expect(lerp(0.2, 1, 1)).toBeCloseTo(1, 10);
    expect(lerp(0.2, 1, 0.5)).toBeCloseTo(0.6, 10);
  });
});
