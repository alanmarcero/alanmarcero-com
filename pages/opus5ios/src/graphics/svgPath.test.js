import { polylinePath } from './svgPath';

describe('polylinePath', () => {
  it('moves to the first point and draws a line to each one after it', () => {
    expect(polylinePath([{ x: 0, y: 1 }, { x: 2.5, y: 3 }, { x: 4, y: 5.125 }]))
      .toBe('M0.00 1.00 L2.50 3.00 L4.00 5.13');
  });

  it('draws nothing for no points', () => {
    expect(polylinePath([])).toBe('');
  });
});
