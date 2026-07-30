import {
  plotBox, xAt, yAt, indexAtX, priceDomain, priceTicks, yearTicks,
  linePoints, areaPath, sellMarkers, weekIndexMap,
} from './chartGeometry';

const MARGIN = { top: 10, right: 20, bottom: 30, left: 40 };

describe('plotBox', () => {
  it('subtracts the gutters from the outer size', () => {
    const box = plotBox(200, 100, MARGIN);
    expect(box).toEqual({
      left: 40, top: 10, width: 140, height: 60, right: 180, bottom: 70,
    });
  });

  it('never returns a negative extent when the margins exceed the canvas', () => {
    const box = plotBox(30, 20, MARGIN);
    expect(box.width).toBe(0);
    expect(box.height).toBe(0);
  });
});

describe('xAt', () => {
  const box = plotBox(200, 100, MARGIN);

  it('spreads the first and last index across the plot', () => {
    expect(xAt(0, 5, box)).toBe(40);
    expect(xAt(4, 5, box)).toBe(180);
  });

  it('places the midpoint halfway', () => {
    expect(xAt(2, 5, box)).toBe(110);
  });

  it('pins a single point to the left edge instead of dividing by zero', () => {
    expect(xAt(0, 1, box)).toBe(40);
  });
});

describe('yAt', () => {
  const box = plotBox(200, 100, MARGIN);
  const domain = { min: 100, max: 200 };

  it('puts the domain max at the top and the min at the bottom', () => {
    expect(yAt(200, domain, box)).toBe(10);
    expect(yAt(100, domain, box)).toBe(70);
  });

  it('is linear in between', () => {
    expect(yAt(150, domain, box)).toBe(40);
  });

  it('centres the value when the domain has no span', () => {
    expect(yAt(5, { min: 5, max: 5 }, box)).toBe(40);
  });
});

describe('indexAtX', () => {
  const box = plotBox(200, 100, MARGIN);

  it('snaps to the nearest index', () => {
    expect(indexAtX(40, 5, box)).toBe(0);
    expect(indexAtX(112, 5, box)).toBe(2);
    expect(indexAtX(180, 5, box)).toBe(4);
  });

  it('clamps outside the plot', () => {
    expect(indexAtX(-500, 5, box)).toBe(0);
    expect(indexAtX(9999, 5, box)).toBe(4);
  });

  it('returns 0 for a single-point series', () => {
    expect(indexAtX(150, 1, box)).toBe(0);
  });
});

describe('priceDomain', () => {
  it('pads the extremes and snaps outward to the step', () => {
    const domain = priceDomain([120, 180], { padFraction: 0.1, step: 20 });
    expect(domain.min).toBeLessThanOrEqual(120);
    expect(domain.max).toBeGreaterThanOrEqual(180);
    expect(domain.min % 20).toBe(0);
    expect(domain.max % 20).toBe(0);
  });

  it('never goes below zero', () => {
    expect(priceDomain([1, 2], { step: 20 }).min).toBe(0);
  });

  it('ignores non-finite values', () => {
    const domain = priceDomain([100, NaN, undefined, 200], { step: 20 });
    expect(Number.isFinite(domain.min)).toBe(true);
    expect(Number.isFinite(domain.max)).toBe(true);
  });

  it('falls back to a usable domain when there is no data', () => {
    expect(priceDomain([])).toEqual({ min: 0, max: 1 });
  });
});

describe('priceTicks', () => {
  it('emits round steps inside the domain', () => {
    expect(priceTicks({ min: 80, max: 200 }, 40)).toEqual([80, 120, 160, 200]);
  });

  it('starts at the first step at or above the minimum', () => {
    expect(priceTicks({ min: 90, max: 200 }, 40)).toEqual([120, 160, 200]);
  });
});

describe('yearTicks', () => {
  it('returns the first index of each distinct year', () => {
    expect(yearTicks(['2021-12-27', '2022-01-03', '2022-06-06', '2023-01-02'])).toEqual([
      { index: 0, year: '2021' },
      { index: 1, year: '2022' },
      { index: 3, year: '2023' },
    ]);
  });

  it('handles an empty series', () => {
    expect(yearTicks([])).toEqual([]);
  });
});

describe('linePoints', () => {
  it('emits one x,y pair per price', () => {
    const box = plotBox(200, 100, MARGIN);
    const points = linePoints(
      [{ week: 'a', close: 100 }, { week: 'b', close: 200 }],
      { min: 100, max: 200 },
      box,
    );
    expect(points).toBe('40.00,70.00 180.00,10.00');
  });
});

describe('areaPath', () => {
  it('closes the path down to the baseline', () => {
    const box = plotBox(200, 100, MARGIN);
    const path = areaPath(
      [{ week: 'a', close: 100 }, { week: 'b', close: 200 }],
      { min: 100, max: 200 },
      box,
    );
    expect(path.startsWith('M40.00,70.00')).toBe(true);
    expect(path.endsWith('L180.00,70.00L40.00,70.00Z')).toBe(true);
  });

  it('returns an empty path with no data', () => {
    expect(areaPath([], { min: 0, max: 1 }, plotBox(200, 100, MARGIN))).toBe('');
  });
});

describe('weekIndexMap', () => {
  it('maps each week to its position', () => {
    const map = weekIndexMap([{ week: 'a' }, { week: 'b' }]);
    expect(map.get('a')).toBe(0);
    expect(map.get('b')).toBe(1);
  });
});

describe('sellMarkers', () => {
  const prices = [
    { week: '2021-07-26', close: 100 },
    { week: '2021-08-02', close: 150 },
    { week: '2021-08-09', close: 200 },
  ];
  const box = plotBox(200, 100, MARGIN);
  const domain = { min: 100, max: 200 };
  const weekIndex = weekIndexMap(prices);

  it('positions a marker at its week and price', () => {
    const [marker] = sellMarkers(
      [{ week: '2021-08-02', close: 150, shares: 10 }], weekIndex, prices, domain, box,
    );
    expect(marker.index).toBe(1);
    expect(marker.x).toBe(110);
    expect(marker.y).toBe(40);
    expect(marker.shares).toBe(10);
  });

  it('drops sell weeks that are not in the price series', () => {
    expect(sellMarkers(
      [{ week: '1999-01-04', close: 1 }], weekIndex, prices, domain, box,
    )).toEqual([]);
  });

  it('applies a vertical offset when asked', () => {
    const [marker] = sellMarkers(
      [{ week: '2021-08-02', close: 150 }], weekIndex, prices, domain, box, -8,
    );
    expect(marker.y).toBe(32);
  });
});
