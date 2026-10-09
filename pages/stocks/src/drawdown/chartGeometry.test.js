import {
  plotBox, xAt, indexAtX, yearTicks, polyline, areaUnder, tipPlacement,
  viewBoxX, arrowStep, stepIndex, yearLabel, niceStep, stackDomain, stackTicks,
} from './chartGeometry';

const MARGIN = { top: 10, right: 20, bottom: 30, left: 40 };

describe('tipPlacement', () => {
  it('sits right of a cursor in the left half and left of one in the right', () => {
    expect(tipPlacement(100, 1000)).toEqual({ left: '10%', side: 'right' });
    expect(tipPlacement(900, 1000)).toEqual({ left: '90%', side: 'left' });
    expect(tipPlacement(500, 1000).side).toBe('left');
  });

  it('survives a zero-width chart', () => {
    expect(tipPlacement(10, 0)).toEqual({ left: '0%', side: 'right' });
  });
});

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

describe('yearTicks', () => {
  it('returns the first index of each distinct year', () => {
    expect(yearTicks(['2021-12-27', '2022-01-03', '2022-06-06', '2023-01-02'])).toEqual([
      { index: 0, year: '2021' },
      { index: 1, year: '2022' },
      { index: 3, year: '2023' },
    ]);
  });

  it('drops a year with too little of itself on screen to label', () => {
    const weeks = ['2021-12-27', '2022-01-03', '2022-06-06', '2022-09-05', '2023-01-02'];
    expect(yearTicks(weeks, { minWeeks: 3 }).map((t) => t.year)).toEqual(['2022']);
  });

  it('keeps the index of a year it keeps, whatever it drops before it', () => {
    const weeks = ['2021-12-27', '2022-01-03', '2022-06-06', '2022-09-05'];
    expect(yearTicks(weeks, { minWeeks: 2 })).toEqual([{ index: 1, year: '2022' }]);
  });

  it('handles an empty series', () => {
    expect(yearTicks([])).toEqual([]);
  });
});

describe('cursor arithmetic', () => {
  it('converts a client x into viewBox units', () => {
    expect(viewBoxX(150, { left: 50, width: 500 }, 1000)).toBe(200);
  });

  it('moves only on the left and right arrows', () => {
    expect(arrowStep('ArrowLeft')).toBe(-1);
    expect(arrowStep('ArrowRight')).toBe(1);
    expect(arrowStep('ArrowUp')).toBe(0);
    expect(arrowStep('Enter')).toBe(0);
  });

  it('clamps a step to the series', () => {
    expect(stepIndex(3, 1, 10)).toBe(4);
    expect(stepIndex(0, -1, 10)).toBe(0);
    expect(stepIndex(8, 5, 10)).toBe(9);
  });
});

describe('yearLabel', () => {
  it('shortens a year only on the compact axis', () => {
    expect(yearLabel('2024', false)).toBe('2024');
    expect(yearLabel('2024', true)).toBe('’24');
  });
});

describe('polyline', () => {
  it('emits one x,y pair per point', () => {
    expect(polyline([{ x: 40, y: 70 }, { x: 180, y: 10 }])).toBe('40.00,70.00 180.00,10.00');
  });
});

describe('areaUnder', () => {
  it('closes the path down to the baseline', () => {
    const box = plotBox(200, 100, MARGIN);
    const path = areaUnder([{ x: 40, y: 70 }, { x: 180, y: 10 }], box);
    expect(path.startsWith('M40.00,70.00')).toBe(true);
    expect(path.endsWith('L180.00,70.00L40.00,70.00Z')).toBe(true);
  });

  it('returns an empty path with no data', () => {
    expect(areaUnder([], plotBox(200, 100, MARGIN))).toBe('');
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
