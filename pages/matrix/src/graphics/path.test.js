import { roundToHundredths, polylinePath } from './path';

describe('roundToHundredths', () => {
  it('rounds to two decimal places', () => {
    expect(roundToHundredths(1.23456)).toBe(1.23);
    expect(roundToHundredths(0.995)).toBe(1);
    expect(roundToHundredths(7)).toBe(7);
  });
});

describe('polylinePath', () => {
  it('emits one moveto and a lineto per remaining point', () => {
    expect(polylinePath([[0, 6], [2, 0], [8, 6]])).toBe('M0 6L2 0L8 6');
  });

  it('draws a lone point as a bare moveto', () => {
    expect(polylinePath([[3, 4]])).toBe('M3 4');
  });
});
