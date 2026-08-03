import { frac, goldenAngleTurns, lerp, GOLDEN_INVERSE } from './quasirandom';

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

describe('the constant', () => {
  it('carries the golden ratio to its definition', () => {
    // phi^2 = phi + 1, so 1/phi = phi - 1.
    const phi = 1 / GOLDEN_INVERSE;
    expect(phi - 1).toBeCloseTo(GOLDEN_INVERSE, 9);
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
