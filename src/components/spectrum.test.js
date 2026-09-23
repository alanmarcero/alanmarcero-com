import {
  BAR_FALL,
  PEAK_FALL,
  segmentBand,
  createBarParams,
  barTarget,
  stepBar,
  staticBars,
} from "./spectrum";

const fixedRandom = (value) => () => value;

describe("segmentBand", () => {
  it("is green low, yellow mid, red high", () => {
    expect(segmentBand(0.2)).toBe("green");
    expect(segmentBand(0.6)).toBe("yellow");
    expect(segmentBand(0.9)).toBe("red");
  });
});

describe("createBarParams", () => {
  it("makes one param set per bar from the injected random source", () => {
    const params = createBarParams(3, fixedRandom(0));

    expect(params).toHaveLength(3);
    expect(params[0]).toEqual({ speed: 1.4, phase: 0 });
  });
});

describe("barTarget", () => {
  const params = { speed: 2, phase: 0 };

  it("stays within [0, 1]", () => {
    for (let t = 0; t < 10; t += 0.37) {
      const v = barTarget(t, 0, 18, params, Math.random);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("is deterministic for a fixed random source", () => {
    const random = fixedRandom(0.5);

    expect(barTarget(1.2, 4, 18, params, random)).toBe(barTarget(1.2, 4, 18, params, random));
  });

  it("adds a beat spike when the random draw is low", () => {
    const quiet = barTarget(0, 0, 18, params, fixedRandom(0.5));
    const beat = barTarget(0, 0, 18, params, fixedRandom(0));

    expect(beat).toBeGreaterThan(quiet);
  });
});

describe("stepBar", () => {
  it("jumps straight up to a higher target and lifts the peak with it", () => {
    expect(stepBar({ level: 0.2, peak: 0.3 }, 0.8)).toEqual({ level: 0.8, peak: 0.8 });
  });

  it("falls by BAR_FALL toward a lower target while the peak drifts by PEAK_FALL", () => {
    const next = stepBar({ level: 0.5, peak: 0.9 }, 0);

    expect(next.level).toBeCloseTo(0.5 - BAR_FALL);
    expect(next.peak).toBeCloseTo(0.9 - PEAK_FALL);
  });

  it("does not mutate its input", () => {
    const bar = { level: 0.5, peak: 0.9 };
    stepBar(bar, 0);

    expect(bar).toEqual({ level: 0.5, peak: 0.9 });
  });
});

describe("staticBars", () => {
  it("rests every peak above its bar", () => {
    staticBars(18).forEach(({ level, peak }) => expect(peak).toBeGreaterThan(level));
  });
});
