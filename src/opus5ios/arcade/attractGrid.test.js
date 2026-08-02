import { convergingLines, recedingRows } from './attractGrid';

describe('convergingLines', () => {
  it('starts every line at the vanishing point', () => {
    const width = 1000;
    const horizon = 80;
    convergingLines({ width, horizon }).forEach((line) => {
      expect(line.x1).toBe(width / 2);
      expect(line.y1).toBe(horizon);
    });
  });

  it('ends every line on the bottom edge', () => {
    const height = 240;
    convergingLines({ height }).forEach((line) => {
      expect(line.y2).toBe(height);
    });
  });

  it('spaces the feet evenly across the bottom edge', () => {
    const lines = convergingLines({ count: 5 });
    const gaps = lines.slice(1).map((line, index) => line.x2 - lines[index].x2);
    gaps.forEach((gap) => expect(gap).toBeCloseTo(gaps[0], 6));
  });

  it('is symmetric about the vanishing point', () => {
    const width = 800;
    const lines = convergingLines({ width, count: 7 });
    const first = lines[0].x2 - width / 2;
    const last = lines[lines.length - 1].x2 - width / 2;
    expect(first).toBeCloseTo(-last, 6);
  });

  it('runs the fan wider than the frame so no line converges inside it', () => {
    const width = 600;
    const lines = convergingLines({ width, spread: 2.4 });
    expect(lines[0].x2).toBeLessThan(0);
    expect(lines[lines.length - 1].x2).toBeGreaterThan(width);
  });

  it('draws a single line straight down the middle', () => {
    const [only] = convergingLines({ width: 400, count: 1 });
    expect(only.x2).toBe(200);
  });
});

describe('recedingRows', () => {
  const height = 260;
  const horizon = 90;

  it('starts at the bottom edge', () => {
    expect(recedingRows({ height, horizon })[0]).toBe(height);
  });

  it('stays between the horizon and the bottom', () => {
    recedingRows({ height, horizon, count: 12 }).forEach((y) => {
      expect(y).toBeGreaterThanOrEqual(horizon - 0.001);
      expect(y).toBeLessThanOrEqual(height);
    });
  });

  it('tightens as it recedes', () => {
    const rows = recedingRows({ height, horizon, count: 8 });
    const gaps = rows.slice(1).map((y, index) => rows[index] - y);
    for (let index = 1; index < gaps.length; index += 1) {
      expect(gaps[index]).toBeLessThan(gaps[index - 1]);
    }
  });

  it('fills the depth: the last row lands on the horizon', () => {
    const rows = recedingRows({ height, horizon, count: 10 });
    expect(rows[rows.length - 1]).toBeGreaterThan(horizon);
    const nextGap = rows[rows.length - 2] - rows[rows.length - 1];
    expect(rows[rows.length - 1] - nextGap).toBeLessThan(horizon + 1);
  });
});
