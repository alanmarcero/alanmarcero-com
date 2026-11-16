import { plotBox } from '../drawdown/chartGeometry';
import {
  DAYS_IN_YEAR,
  buildDayLookup,
  dayOfYear,
  extractYearRelative,
  formatAxisPct,
  formatDayOfYear,
  formatSignedPct,
  overlayPlot,
  percentDomain,
  percentY,
} from './yearOverlay';

describe('dayOfYear and formatDayOfYear', () => {
  it('maps Jan 1 to 0 and Dec 31 to 364 across both leap and non-leap years', () => {
    expect(dayOfYear('2018-01-01')).toBe(0);
    expect(dayOfYear('2018-12-31')).toBe(364);
    expect(dayOfYear('2020-02-28')).toBe(58);
    expect(dayOfYear('2020-02-29')).toBe(58);
    expect(dayOfYear('2020-03-01')).toBe(59);
    expect(dayOfYear('2020-12-31')).toBe(364);
    expect(dayOfYear('2026-01-02')).toBe(1);
    expect(dayOfYear('2026-11-13')).toBe(316);
  });

  it('formats day indices back to month and day', () => {
    expect(formatDayOfYear(0)).toBe('Jan 1');
    expect(formatDayOfYear(31)).toBe('Feb 1');
    expect(formatDayOfYear(316)).toBe('Nov 13');
    expect(formatDayOfYear(364)).toBe('Dec 31');
  });
});

describe('extractYearRelative', () => {
  const closes = [
    ['2017-12-29', 200],
    ['2018-01-02', 100],
    ['2018-06-01', 110],
    ['2018-12-31', 90],
    ['2026-01-02', 500],
    ['2026-06-01', 550],
  ];

  it('normalizes each year to 0% at its first close of that year', () => {
    const s18 = extractYearRelative(closes, 2018);
    expect(s18).toHaveLength(3);
    expect(s18[0]).toEqual({
      date: '2018-01-02', close: 100, pct: 0, day: 1,
    });
    expect(s18[1].pct).toBeCloseTo(0.1);
    expect(s18[2].pct).toBeCloseTo(-0.1);

    const s26 = extractYearRelative(closes, 2026);
    expect(s26).toHaveLength(2);
    expect(s26[0].pct).toBe(0);
    expect(s26[1].pct).toBeCloseTo(0.1);
  });

  it('returns an empty array when the year has no closes', () => {
    expect(extractYearRelative(closes, 2020)).toEqual([]);
  });
});

describe('formatting', () => {
  it('formats signed percentages with typographic minus', () => {
    expect(formatSignedPct(0.1042)).toBe('+10.4%');
    expect(formatSignedPct(-0.0324)).toBe('−3.2%');
    expect(formatSignedPct(0)).toBe('0.0%');
    expect(formatSignedPct(-0.0001)).toBe('0.0%');
  });

  it('formats axis tick percentages', () => {
    expect(formatAxisPct(0)).toBe('0%');
    expect(formatAxisPct(0.2)).toBe('+20%');
    expect(formatAxisPct(-0.1)).toBe('−10%');
  });
});

describe('percentDomain and percentY', () => {
  it('always includes 0 in the domain and ticks', () => {
    const d1 = percentDomain([0.05, 0.18], 4);
    expect(d1.min).toBe(0);
    expect(d1.max).toBeGreaterThanOrEqual(0.18);
    expect(d1.ticks).toContain(0);

    const d2 = percentDomain([-0.15, 0.12], 5);
    expect(d2.min).toBeLessThanOrEqual(-0.15);
    expect(d2.max).toBeGreaterThanOrEqual(0.12);
    expect(d2.ticks).toContain(0);
  });

  it('maps domain.max to box.top and domain.min to box.bottom', () => {
    const box = plotBox(1000, 300, {
      top: 20, right: 60, bottom: 40, left: 60,
    });
    const domain = { min: -0.2, max: 0.2, step: 0.1 };
    expect(percentY(0.2, domain, box)).toBeCloseTo(box.top);
    expect(percentY(-0.2, domain, box)).toBeCloseTo(box.bottom);
    expect(percentY(0, domain, box)).toBeCloseTo(box.top + box.height / 2);
  });
});

describe('overlayPlot and buildDayLookup', () => {
  const box = plotBox(1000, 300, {
    top: 20, right: 60, bottom: 40, left: 60,
  });
  const s18 = [
    {
      date: '2018-01-02', close: 100, pct: 0, day: 1,
    },
    {
      date: '2018-12-31', close: 90, pct: -0.1, day: 364,
    },
  ];
  const s26 = [
    {
      date: '2026-01-02', close: 200, pct: 0, day: 1,
    },
    {
      date: '2026-07-01', close: 220, pct: 0.1, day: 181,
    },
  ];

  it('produces polylines and coordinates aligned by calendar day', () => {
    const plot = overlayPlot(s18, s26, box, 4);
    expect(plot.coordsBase).toHaveLength(2);
    expect(plot.coordsCurrent).toHaveLength(2);
    expect(plot.coordsBase[0].x).toBeCloseTo(plot.coordsCurrent[0].x);
    expect(plot.coordsBase[1].x).toBeCloseTo(box.right);
    expect(plot.lineBase).toContain(',');
    expect(plot.lineCurrent).toContain(',');
  });

  it('builds a 365-day lookup carrying forward prior sessions and stopping current at its last day', () => {
    const lookup = buildDayLookup(s18, s26);
    expect(lookup).toHaveLength(DAYS_IN_YEAR);
    expect(lookup[0].base).toBeNull();
    expect(lookup[1].base.pct).toBe(0);
    expect(lookup[100].base.pct).toBe(0);
    expect(lookup[181].current.pct).toBeCloseTo(0.1);
    expect(lookup[200].current).toBeNull();
    expect(lookup[364].base.pct).toBeCloseTo(-0.1);
  });
});
