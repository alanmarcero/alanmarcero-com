import {
  magnitudeDb,
  responsePoints,
  frequencyToX,
  decadeTicks,
  curvePath,
} from './filterCurve';

describe('magnitudeDb', () => {
  it('passes the band below cutoff at roughly unity', () => {
    expect(magnitudeDb(50, 1000, 1)).toBeCloseTo(0, 1);
  });

  it('rolls off above cutoff', () => {
    const atCutoff = magnitudeDb(1000, 1000, 1);
    const anOctaveUp = magnitudeDb(2000, 1000, 1);
    const twoOctavesUp = magnitudeDb(4000, 1000, 1);
    expect(anOctaveUp).toBeLessThan(atCutoff);
    expect(twoOctavesUp).toBeLessThan(anOctaveUp);
  });

  it('rolls off at about 12 dB per octave well above cutoff', () => {
    // Two poles. Far enough above cutoff that the corner no longer skews
    // the reading, doubling the frequency should cost ~12 dB.
    const slope = magnitudeDb(8000, 1000, 1) - magnitudeDb(16000, 1000, 1);
    expect(slope).toBeGreaterThan(11);
    expect(slope).toBeLessThan(13);
  });

  it('lifts the resonant peak as Q rises', () => {
    expect(magnitudeDb(1000, 1000, 6)).toBeGreaterThan(magnitudeDb(1000, 1000, 2));
  });

  it('reads exactly Q at the cutoff frequency', () => {
    // At f = fc the real term vanishes and |H| collapses to Q.
    expect(magnitudeDb(1000, 1000, 4)).toBeCloseTo(20 * Math.log10(4), 10);
  });
});

describe('responsePoints', () => {
  const width = 400;
  const height = 50;

  it('spans the plate', () => {
    const points = responsePoints({ width, height, samples: 40 });
    expect(points).toHaveLength(41);
    expect(points[0].x).toBe(0);
    expect(points[points.length - 1].x).toBeCloseTo(width, 10);
  });

  it('clamps inside the plate even with a violent resonance', () => {
    responsePoints({ width, height, q: 40 }).forEach(({ y }) => {
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(height);
    });
  });

  it('sweeps frequency upward across the axis', () => {
    const points = responsePoints({ width, height, samples: 20 });
    for (let index = 1; index < points.length; index += 1) {
      expect(points[index].frequency).toBeGreaterThan(points[index - 1].frequency);
    }
  });

  it('puts the peak near the cutoff', () => {
    const cutoff = 1200;
    const points = responsePoints({ width, height, samples: 400, cutoff, q: 6 });
    const peak = points.reduce((best, point) => (point.db > best.db ? point : best));
    expect(peak.frequency / cutoff).toBeGreaterThan(0.85);
    expect(peak.frequency / cutoff).toBeLessThan(1.15);
  });
});

describe('axis', () => {
  it('places a decade a fixed distance from the one below it', () => {
    const options = { width: 600, minHz: 20, maxHz: 20000 };
    const hundred = frequencyToX(100, options);
    const thousand = frequencyToX(1000, options);
    const tenThousand = frequencyToX(10000, options);
    expect(thousand - hundred).toBeCloseTo(tenThousand - thousand, 6);
  });

  it('labels decades in the audio band and skips the ones outside it', () => {
    expect(decadeTicks({ minHz: 20, maxHz: 20000 }).map((t) => t.label))
      .toEqual(['100', '1k', '10k']);
    expect(decadeTicks({ minHz: 500, maxHz: 5000 }).map((t) => t.label))
      .toEqual(['1k']);
  });
});

describe('curvePath', () => {
  it('starts with a move', () => {
    expect(curvePath(responsePoints({ samples: 3 })).startsWith('M')).toBe(true);
  });
});
