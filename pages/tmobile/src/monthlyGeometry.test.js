import {
  MAX_BAR, MIN_BAR, SEGMENT_GAP, bandIndexAtX, bandScale, columnPath,
  monthTicks, niceStep, stackDomain, stackRects, stackTicks, yAt,
} from './monthlyGeometry';

const BOX = { left: 100, top: 0, width: 900, height: 400, right: 1000, bottom: 400 };

describe('bandScale', () => {
  it('divides the plot into one band per month', () => {
    const band = bandScale(25, BOX);
    expect(band.step).toBeCloseTo(36);
    expect(band.leftAt(0)).toBe(100);
    expect(band.centerAt(0)).toBeCloseTo(118);
    expect(band.centerAt(24)).toBeCloseTo(BOX.right - 18);
  });

  it('caps the column rather than filling its band', () => {
    expect(bandScale(4, BOX).barWidth).toBe(MAX_BAR);
    expect(bandScale(100, BOX).barWidth).toBeLessThan(MAX_BAR);
  });

  it('never returns a zero-width column', () => {
    expect(bandScale(4000, BOX).barWidth).toBeGreaterThan(0);
  });

  it('survives an empty series', () => {
    expect(bandScale(0, BOX).step).toBe(BOX.width);
  });
});

describe('bandIndexAtX', () => {
  it('reads the band the pointer is inside', () => {
    expect(bandIndexAtX(101, 25, BOX)).toBe(0);
    expect(bandIndexAtX(100 + 36 * 3 + 1, 25, BOX)).toBe(3);
  });

  it('clamps outside the plot instead of going out of range', () => {
    expect(bandIndexAtX(-500, 25, BOX)).toBe(0);
    expect(bandIndexAtX(9999, 25, BOX)).toBe(24);
  });
});

describe('niceStep', () => {
  it('keeps a $150M peak on a $160M axis rather than padding to $200M', () => {
    expect(niceStep(150_120_159, 4)).toBe(40_000_000);
  });

  it('picks round steps on the other measures', () => {
    expect(niceStep(690_843, 4)).toBe(200_000);
    expect(niceStep(16, 4)).toBe(4);
    expect(niceStep(1, 4)).toBe(0.25);
  });

  it('does not divide by a zero or negative peak', () => {
    expect(niceStep(0)).toBe(1);
    expect(niceStep(-5)).toBe(1);
  });
});

describe('stackDomain', () => {
  it('is always zero-based and snapped outward to the step', () => {
    const domain = stackDomain([150_120_159, 47_787_578, 0]);
    expect(domain).toEqual({ min: 0, max: 160_000_000, step: 40_000_000 });
  });

  it('falls back to a unit domain when nothing sold', () => {
    expect(stackDomain([0, 0])).toEqual({ min: 0, max: 1, step: 1 });
  });

  it('ignores values that are not finite', () => {
    expect(stackDomain([16, NaN, undefined]).max).toBe(16);
  });
});

describe('stackTicks', () => {
  it('includes the baseline and the top of the domain', () => {
    expect(stackTicks({ min: 0, max: 16, step: 4 })).toEqual([0, 4, 8, 12, 16]);
  });

  it('does not drop the top tick to floating-point drift', () => {
    const ticks = stackTicks({ min: 0, max: 800_000, step: 200_000 });
    expect(ticks[ticks.length - 1]).toBe(800_000);
  });
});

describe('yAt', () => {
  it('puts zero on the baseline and the domain max at the top', () => {
    const domain = { min: 0, max: 100, step: 25 };
    expect(yAt(0, domain, BOX)).toBe(400);
    expect(yAt(100, domain, BOX)).toBe(0);
    expect(yAt(50, domain, BOX)).toBe(200);
  });

  it('clamps rather than drawing outside the plot', () => {
    const domain = { min: 0, max: 100, step: 25 };
    expect(yAt(500, domain, BOX)).toBe(0);
    expect(yAt(-20, domain, BOX)).toBe(400);
  });
});

describe('stackRects', () => {
  const domain = { min: 0, max: 100, step: 25 };
  const band = bandScale(4, BOX);

  it('stacks segments bottom-up from the baseline', () => {
    const stack = {
      month: '2025-02',
      segments: [{ group: 'sievert', amount: 25 }, { group: 'others', amount: 50 }],
      total: 75,
    };
    const [lower, upper] = stackRects(stack, domain, BOX, band, 0);

    expect(lower.group).toBe('sievert');
    expect(lower.y + lower.height).toBeCloseTo(BOX.bottom);
    expect(upper.y).toBeCloseTo(BOX.bottom - 300);
    expect(upper.height).toBeCloseTo(200);
  });

  it('separates touching segments with a gap, and rounds only the data end', () => {
    const stack = {
      month: '2025-02',
      segments: [{ group: 'sievert', amount: 50 }, { group: 'others', amount: 50 }],
      total: 100,
    };
    const [lower, upper] = stackRects(stack, domain, BOX, band, 0);

    expect(lower.height).toBeCloseTo(200 - SEGMENT_GAP);
    expect(lower.round).toBe(false);
    expect(upper.round).toBe(true);
    expect(lower.y - (upper.y + upper.height)).toBeCloseTo(SEGMENT_GAP);
  });

  it('floors a tiny column so a month with a sale cannot vanish', () => {
    const stack = {
      month: '2024-12',
      segments: [{ group: 'others', amount: 0.05 }],
      total: 0.05,
    };
    expect(stackRects(stack, domain, BOX, band, 0)[0].height).toBe(MIN_BAR);
  });

  it('draws nothing for a month with no sale', () => {
    expect(stackRects({ month: '2025-01', segments: [], total: 0 }, domain, BOX, band, 0))
      .toEqual([]);
  });

  it('centres the column in its band', () => {
    const stack = { month: '2025-02', segments: [{ group: 'others', amount: 50 }], total: 50 };
    const [rect] = stackRects(stack, domain, BOX, band, 2);
    expect(rect.x + rect.width / 2).toBeCloseTo(band.centerAt(2));
  });
});

describe('columnPath', () => {
  it('is square at the baseline and rounded at the data end', () => {
    const d = columnPath({ x: 10, y: 100, width: 20, height: 200, round: true });
    expect(d).toContain('Q');
    expect(d.endsWith('Z')).toBe(true);
  });

  it('draws a plain rectangle for an interior segment', () => {
    expect(columnPath({ x: 10, y: 100, width: 20, height: 200, round: false }))
      .toBe('M10,100H30V300H10Z');
  });

  it('never rounds further than half its own height', () => {
    const d = columnPath({ x: 0, y: 0, width: 20, height: 3, round: true });
    expect(d).toContain('Q0,0 1.5,0');
  });
});

describe('monthTicks', () => {
  const months = ['2024-08', '2024-09', '2024-10', '2024-11', '2024-12',
    '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07'];

  it('labels quarter starts and always the first band', () => {
    expect(monthTicks(months).map((t) => t.month))
      .toEqual(['2024-08', '2024-10', '2025-01', '2025-04', '2025-07']);
  });

  it('carries the year on January and on the opening band only', () => {
    const ticks = monthTicks(months);
    expect(ticks.filter((t) => t.year).map((t) => t.month))
      .toEqual(['2024-08', '2025-01']);
  });

  it('thins out to January and July for a narrow axis', () => {
    expect(monthTicks(months, false).map((t) => t.month))
      .toEqual(['2024-08', '2025-01', '2025-07']);
  });
});
