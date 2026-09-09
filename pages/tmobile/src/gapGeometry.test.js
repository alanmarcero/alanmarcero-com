import { areaUnder, gapPlot, nearestIndex, openRun, polyline } from './gapGeometry';
import { plotBox, weekIndexMap } from './chartGeometry';

const WEEKS = ['2025-01-06', '2025-01-13', '2025-01-20', '2025-01-27', '2025-02-03'];
const PRICES = WEEKS.map((week) => ({ week, close: 100 }));
const BOX = plotBox(500, 300, {
  top: 20, right: 20, bottom: 40, left: 40,
});
const INDEX = weekIndexMap(PRICES);

const points = [
  { week: '2025-01-13', days: 0, since: '2025-01-13' },
  { week: '2025-01-20', days: 7, since: '2025-01-13' },
  { week: '2025-01-27', days: 14, since: '2025-01-13' },
  { week: '2025-02-03', days: 21, since: '2025-01-13' },
];

describe('gapPlot', () => {
  const plot = gapPlot(points, INDEX, PRICES.length, BOX);

  it('snaps the domain outward to a round step above the peak', () => {
    expect(plot.domain.min).toBe(0);
    expect(plot.domain.max).toBeGreaterThanOrEqual(21);
    expect(plot.domain.max % plot.domain.step).toBe(0);
    expect(plot.ticks[0]).toBe(0);
  });

  it('places a point at the same x its week has in the price series', () => {
    const [first] = plot.coords;
    expect(first.x).toBeCloseTo(BOX.left + (1 / (PRICES.length - 1)) * BOX.width);
    expect(plot.coords[plot.coords.length - 1].x).toBeCloseTo(BOX.right);
  });

  it('puts zero days on the baseline and the peak up top', () => {
    expect(plot.coords[0].y).toBeCloseTo(BOX.bottom);
    expect(plot.coords[3].y).toBeLessThan(plot.coords[2].y);
  });

  it('drops a point whose week the price series has not got', () => {
    const stray = [...points, { week: '2030-01-07', days: 99, since: '2025-01-13' }];
    expect(gapPlot(stray, INDEX, PRICES.length, BOX).coords).toHaveLength(points.length);
  });

  it('survives an empty series without dividing by anything', () => {
    const empty = gapPlot([], INDEX, PRICES.length, BOX);
    expect(empty.coords).toEqual([]);
    expect(empty.line).toBe('');
    expect(empty.area).toBe('');
    expect(empty.domain.max).toBeGreaterThan(0);
  });
});

describe('polyline and areaUnder', () => {
  const coords = [{ x: 10, y: 20 }, { x: 30, y: 40 }];

  it('writes one x,y pair per point', () => {
    expect(polyline(coords)).toBe('10.00,20.00 30.00,40.00');
    expect(polyline([])).toBe('');
  });

  it('closes the wash along the baseline, under the trace only', () => {
    expect(areaUnder(coords, BOX))
      .toBe(`M10.00,20.00L30.00,40.00L30.00,${BOX.bottom.toFixed(2)}L10.00,${BOX.bottom.toFixed(2)}Z`);
    expect(areaUnder([], BOX)).toBe('');
  });
});

describe('nearestIndex', () => {
  const coords = [{ x: 0 }, { x: 100 }, { x: 200 }];

  it('finds the closest point to the pointer', () => {
    expect(nearestIndex(coords, 0)).toBe(0);
    expect(nearestIndex(coords, 90)).toBe(1);
    expect(nearestIndex(coords, 1000)).toBe(2);
    expect(nearestIndex(coords, -50)).toBe(0);
  });

  it('has nothing to find in an empty series', () => {
    expect(nearestIndex([], 10)).toBeNull();
  });
});

describe('openRun', () => {
  const mixed = [
    { week: 'a', since: '2025-01-01' },
    { week: 'b', since: '2025-02-01' },
    { week: 'c', since: '2025-02-01' },
  ];

  it('is the tail of the trace counting from the last sale', () => {
    expect(openRun(mixed, '2025-02-01').map((c) => c.week)).toEqual(['b', 'c']);
  });

  it('is empty when there is no open run to draw', () => {
    expect(openRun([], '2025-02-01')).toEqual([]);
    expect(openRun(mixed, null)).toEqual([]);
    expect(openRun(mixed, '2024-01-01')).toEqual([]);
  });
});
