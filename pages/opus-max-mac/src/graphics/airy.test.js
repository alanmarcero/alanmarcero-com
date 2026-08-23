import {
  AIRY_ZEROS,
  WIDTH_DECADES,
  WIDTH_RANGE,
  airyIntensity,
  airyRings,
  besselJ1,
} from './airy';

/*
 * Every figure below is a published one. The point of testing against the
 * literature rather than against a snapshot of our own output is that this
 * module claims to be physics: if it stops agreeing with Airy and Bessel it is
 * broken even when it still draws something pretty.
 */

/** The zeros of J₂ — where the bright rings peak. A&S table 9.5. */
const J2_ZEROS = [5.135622, 8.417244, 11.619841];

describe('besselJ1', () => {
  it('is zero at the origin, exactly', () => {
    expect(besselJ1(0)).toBe(0);
  });

  it('matches the tabulated values', () => {
    expect(besselJ1(1)).toBeCloseTo(0.4400506, 6);
    expect(besselJ1(10)).toBeCloseTo(0.0434727, 5);
  });

  it('vanishes at its first zero', () => {
    expect(besselJ1(AIRY_ZEROS[0])).toBeCloseTo(0, 4);
  });

  it('vanishes at every zero the pattern is built from', () => {
    AIRY_ZEROS.forEach((zero) => {
      expect(Math.abs(besselJ1(zero))).toBeLessThan(1e-4);
    });
  });

  it('is odd', () => {
    // Crosses both approximations: 1 is the series, 10 the asymptotic form.
    [0.5, 1, 2.5, 5, 10].forEach((x) => {
      expect(besselJ1(-x)).toBe(-besselJ1(x));
    });
  });

  it('joins its two approximations without a step at x = 3', () => {
    // The one place a mistyped coefficient in either polynomial shows up as a
    // visible discontinuity rather than as a slightly wrong number.
    const below = besselJ1(2.9999999);
    const above = besselJ1(3.0000001);
    expect(Math.abs(above - below)).toBeLessThan(1e-6);
  });
});

describe('airyIntensity', () => {
  it('is exactly 1 at the centre of the core', () => {
    expect(airyIntensity(0)).toBe(1);
  });

  it('is dark on every dark ring', () => {
    AIRY_ZEROS.forEach((zero) => {
      expect(airyIntensity(zero)).toBeLessThan(1e-9);
    });
  });

  it('is even, like the pattern', () => {
    expect(airyIntensity(-2.5)).toBe(airyIntensity(2.5));
  });

  it('falls monotonically from the core to the first dark ring', () => {
    // This is why ring 0 has no bright ring inside it to search for.
    const samples = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, AIRY_ZEROS[0]].map(airyIntensity);
    samples.slice(1).forEach((value, index) => {
      expect(value).toBeLessThan(samples[index]);
    });
  });

  it('halves at the published half-power point', () => {
    expect(airyIntensity(1.61633)).toBeCloseTo(0.5, 4);
  });
});

describe('AIRY_ZEROS', () => {
  it('is the four published zeros, ascending', () => {
    expect(AIRY_ZEROS).toEqual([3.8317, 7.0156, 10.1735, 13.3237]);
    AIRY_ZEROS.slice(1).forEach((zero, index) => {
      expect(zero).toBeGreaterThan(AIRY_ZEROS[index]);
    });
  });

  it('puts the first dark ring at the Rayleigh criterion', () => {
    // x = π·D·sinθ/λ, so dividing by π returns the ring in λ/D: 1.220.
    expect(AIRY_ZEROS[0] / Math.PI).toBeCloseTo(1.22, 3);
  });
});

describe('airyRings', () => {
  const rings = airyRings();

  it('draws one ring per zero, in order', () => {
    expect(rings).toHaveLength(AIRY_ZEROS.length);
    expect(rings.map((ring) => ring.index)).toEqual([0, 1, 2, 3]);
  });

  it('spaces the rings outwards and lands the last one on the field edge', () => {
    const radii = rings.map((ring) => ring.radius);
    radii.slice(1).forEach((radius, index) => {
      expect(radius).toBeGreaterThan(radii[index]);
    });
    expect(radii[radii.length - 1]).toBeCloseTo(44, 10);
  });

  it('scales the whole pattern to the field it is given', () => {
    const small = airyRings(4, 12);
    expect(small[small.length - 1].radius).toBeCloseTo(12, 10);
    // Scaling changes the size and nothing else: the ratios are the physics.
    small.forEach((ring, index) => {
      expect(ring.radius / small[0].radius).toBeCloseTo(
        rings[index].radius / rings[0].radius,
        10,
      );
      expect(ring.intensity).toBe(rings[index].intensity);
    });
  });

  it('finds each bright ring strictly inside its bracketing dark ones', () => {
    const scale = 44 / AIRY_ZEROS[AIRY_ZEROS.length - 1];
    rings.slice(1).forEach((ring) => {
      expect(ring.peak).toBeGreaterThan(rings[ring.index - 1].radius);
      expect(ring.peak).toBeLessThan(ring.radius);
      // And where it lands is the zero of J₂ the literature puts it at.
      expect(ring.peak / scale).toBeCloseTo(J2_ZEROS[ring.index - 1], 4);
    });
  });

  it('reports the core itself for the innermost ring', () => {
    expect(rings[0].peak).toBe(0);
    expect(rings[0].intensity).toBe(1);
  });

  it('dims outwards, by the published fractions of the core', () => {
    const intensities = rings.map((ring) => ring.intensity);
    intensities.slice(1).forEach((intensity, index) => {
      expect(intensity).toBeLessThan(intensities[index]);
    });
    // The real numbers: 1.75%, 0.42% and 0.16% of the central maximum.
    expect(intensities[1]).toBeCloseTo(0.0174979, 6);
    expect(intensities[2]).toBeCloseTo(0.004158, 6);
    expect(intensities[3]).toBeCloseTo(0.0016006, 6);
  });

  it('draws the brighter ring heavier, within the range it promises', () => {
    const widths = rings.map((ring) => ring.width);
    expect(widths[0]).toBe(WIDTH_RANGE[1]);
    widths.forEach((width) => {
      expect(width).toBeGreaterThanOrEqual(WIDTH_RANGE[0]);
      expect(width).toBeLessThanOrEqual(WIDTH_RANGE[1]);
    });
    widths.slice(1).forEach((width, index) => {
      expect(width).toBeLessThan(widths[index]);
    });
  });

  it('keeps the faintest ring off the floor of the width range', () => {
    // If the width scale ever collapses, the outer rings all draw identically
    // and the figure stops saying anything about brightness.
    const faintest = rings[rings.length - 1];
    expect(Math.log10(faintest.intensity)).toBeGreaterThan(-WIDTH_DECADES);
    expect(faintest.width).toBeGreaterThan(WIDTH_RANGE[0]);
  });

  it('draws the same pattern every time', () => {
    expect(airyRings()).toEqual(rings);
    expect(airyRings(4, 44)).toEqual(rings);
  });

  it('draws nothing when nothing is asked for', () => {
    expect(airyRings(0)).toEqual([]);
  });

  it('survives being asked for one ring', () => {
    const [only] = airyRings(1);
    expect(only).toMatchObject({ index: 0, peak: 0, intensity: 1 });
    expect(only.radius).toBeCloseTo(44, 10);
  });

  it('keeps the inner rings put when fewer are asked for', () => {
    // Fewer rings is a closer crop, not a different pattern: the second ring
    // still sits at the same fraction of the first.
    const two = airyRings(2);
    expect(two).toHaveLength(2);
    expect(two[1].radius / two[0].radius).toBeCloseTo(
      AIRY_ZEROS[1] / AIRY_ZEROS[0],
      10,
    );
    expect(two[1].intensity).toBe(rings[1].intensity);
  });
});
