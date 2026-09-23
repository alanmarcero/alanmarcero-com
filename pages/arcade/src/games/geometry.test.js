import { clamp, rectsOverlap, circlesOverlap, distance } from './geometry';

describe('clamp', () => {
  it('leaves an in-range value alone and pins the rest to the nearest bound', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(12, 0, 10)).toBe(10);
  });
});

describe('rectsOverlap', () => {
  it('detects an overlap', () => {
    expect(rectsOverlap(0, 0, 10, 10, 5, 5, 10, 10)).toBe(true);
  });

  it('does not count rectangles that only share an edge', () => {
    expect(rectsOverlap(0, 0, 10, 10, 10, 0, 10, 10)).toBe(false);
    expect(rectsOverlap(0, 0, 10, 10, 0, 10, 10, 10)).toBe(false);
  });
});

describe('circlesOverlap', () => {
  it('detects an overlap and rejects circles that only touch', () => {
    expect(circlesOverlap(0, 0, 5, 8, 0, 5)).toBe(true);
    expect(circlesOverlap(0, 0, 5, 10, 0, 5)).toBe(false);
  });
});

describe('distance', () => {
  it('is the straight-line distance', () => {
    expect(distance(0, 0, 3, 4)).toBe(5);
  });
});
