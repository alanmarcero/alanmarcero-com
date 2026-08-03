import { bearingPoint, radialTicks, crosshair, bearingLabels } from './graticule';

/** How far from the origin a point on a segment gets, sampled along it. */
const distancesAlong = (segment, samples = 64) =>
  Array.from({ length: samples + 1 }, (_unused, step) => {
    const along = step / samples;
    return Math.hypot(
      segment.x1 + (segment.x2 - segment.x1) * along,
      segment.y1 + (segment.y2 - segment.y1) * along,
    );
  });

describe('bearingPoint', () => {
  it('reads twelve o’clock as zero and turns clockwise', () => {
    // The one assertion that catches a sine swapped for a cosine, which is a
    // mistake that still draws a plausible-looking dial.
    expect(bearingPoint(10, 0)).toEqual({ x: 0, y: -10 });
    expect(bearingPoint(10, 90)).toEqual({ x: 10, y: 0 });
    expect(bearingPoint(10, 180)).toEqual({ x: 0, y: 10 });
    expect(bearingPoint(10, 270)).toEqual({ x: -10, y: 0 });
  });

  it('holds the radius at any bearing', () => {
    [7, 33.5, 61, 118, 204.25, 355].forEach((bearing) => {
      const { x, y } = bearingPoint(44, bearing);
      expect(Math.hypot(x, y)).toBeCloseTo(44, 4);
    });
  });

  it('wraps a full turn back onto itself', () => {
    expect(bearingPoint(20, 405)).toEqual(bearingPoint(20, 45));
  });
});

describe('radialTicks', () => {
  const ticks = radialTicks();

  it('graduates the limb every five degrees by default', () => {
    expect(ticks).toHaveLength(72);
    expect(ticks.map((tick) => tick.bearing).slice(0, 4)).toEqual([0, 5, 10, 15]);
    expect(ticks[71].bearing).toBe(355);
  });

  it('starts every stroke on the limb and ends it at the right reach', () => {
    ticks.forEach((tick) => {
      expect(Math.hypot(tick.x1, tick.y1)).toBeCloseTo(44, 4);
      expect(Math.hypot(tick.x2, tick.y2)).toBeCloseTo(tick.major ? 48.4 : 46.6, 4);
    });
  });

  it('runs each stroke straight out along its own bearing', () => {
    ticks.forEach((tick) => {
      const foot = bearingPoint(44, tick.bearing);
      expect({ x: tick.x1, y: tick.y1 }).toEqual(foot);
      // Same direction from the origin, further out: the cross product of the
      // two radii is zero and the outer one is longer.
      expect(tick.x1 * tick.y2 - tick.y1 * tick.x2).toBeCloseTo(0, 3);
      expect(Math.hypot(tick.x2, tick.y2)).toBeGreaterThan(Math.hypot(tick.x1, tick.y1));
    });
  });

  it('marks a major tick exactly every sixth one', () => {
    const majors = ticks.filter((tick) => tick.major);
    expect(majors).toHaveLength(12);
    expect(majors.map((tick) => tick.bearing)).toEqual([0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]);
    ticks.forEach((tick) => {
      expect(tick.major).toBe(tick.index % 6 === 0);
    });
  });

  it('takes a different grouping', () => {
    const quarters = radialTicks({ count: 8, majorEvery: 2 });
    expect(quarters.filter((tick) => tick.major).map((tick) => tick.bearing)).toEqual([0, 90, 180, 270]);
  });

  it('never marks a major when asked for none', () => {
    expect(radialTicks({ majorEvery: 0 }).some((tick) => tick.major)).toBe(false);
  });

  it('survives a single graduation, and no graduations at all', () => {
    const [only] = radialTicks({ count: 1 });
    expect(only).toMatchObject({ index: 0, bearing: 0, major: true });
    expect(radialTicks({ count: 0 })).toEqual([]);
    expect(radialTicks({ count: -4 })).toEqual([]);
  });

  it('engraves the same limb every time', () => {
    expect(radialTicks()).toEqual(ticks);
  });
});

describe('crosshair', () => {
  const hairs = crosshair();

  it('is four segments, on the four cardinals', () => {
    expect(hairs).toHaveLength(4);
    expect(hairs.map((hair) => hair.bearing)).toEqual([0, 90, 180, 270]);
  });

  it('leaves the centre genuinely clear', () => {
    // Sampled rather than checked at the endpoints, because a cross drawn as
    // two lines through the origin has its endpoints in the right places too.
    hairs.forEach((hair) => {
      const distances = distancesAlong(hair);
      expect(Math.min(...distances)).toBeGreaterThanOrEqual(9 - 1e-4);
      expect(Math.max(...distances)).toBeCloseTo(41, 4);
    });
  });

  it('takes a wider gap and a shorter reach', () => {
    const tight = crosshair({ gap: 15, reach: 20 });
    tight.forEach((hair) => {
      expect(Math.min(...distancesAlong(hair))).toBeGreaterThanOrEqual(15 - 1e-4);
      expect(Math.hypot(hair.x2, hair.y2)).toBeCloseTo(20, 4);
    });
  });

  it('draws the same cross every time', () => {
    expect(crosshair()).toEqual(hairs);
  });
});

describe('bearingLabels', () => {
  const labels = bearingLabels();

  it('prints the four cardinals, zero-padded to three digits', () => {
    expect(labels.map((label) => label.text)).toEqual(['000', '090', '180', '270']);
  });

  it('parks them all on one circle, inside the limb', () => {
    labels.forEach((label) => {
      expect(Math.hypot(label.x, label.y)).toBeCloseTo(37, 4);
      expect(Math.hypot(label.x, label.y)).toBeLessThan(44);
    });
  });

  it('places each label at its own bearing', () => {
    expect(labels[0]).toMatchObject({ x: 0, y: -37 });
    expect(labels[1]).toMatchObject({ x: 37, y: 0 });
  });

  it('takes a finer step, and keeps the padding', () => {
    const thirty = bearingLabels({ step: 30 });
    expect(thirty).toHaveLength(12);
    expect(thirty.map((label) => label.text)).toEqual([
      '000', '030', '060', '090', '120', '150', '180', '210', '240', '270', '300', '330',
    ]);
  });

  it('keeps a label that a whole step would fall short of', () => {
    expect(bearingLabels({ step: 100 }).map((label) => label.text)).toEqual(['000', '100', '200', '300']);
  });

  it('survives a single turn of a step, and a nonsense one', () => {
    expect(bearingLabels({ step: 360 })).toEqual([{ bearing: 0, text: '000', x: 0, y: -37 }]);
    expect(bearingLabels({ step: 0 })).toEqual([]);
    expect(bearingLabels({ step: -90 })).toEqual([]);
  });

  it('prints the same labels every time', () => {
    expect(bearingLabels()).toEqual(labels);
  });
});
