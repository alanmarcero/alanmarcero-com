import { buildWavePath, WAVE_SHAPES, SAMPLES_PER_PERIOD } from "./waveforms";

const OPTS = { width: 440, mid: 20, amplitude: 13, period: 88 };

const points = (d) =>
  d
    .trim()
    .split(/(?=[ML])/)
    .map((seg) => seg.trim().slice(1).split(" ").map(Number));

describe("WAVE_SHAPES", () => {
  it("sine crosses zero at t=0 and peaks at t=0.25", () => {
    expect(WAVE_SHAPES.sine(0)).toBeCloseTo(0);
    expect(WAVE_SHAPES.sine(0.25)).toBeCloseTo(1);
  });

  it("square is +1 in the first half, -1 in the second", () => {
    expect(WAVE_SHAPES.square(0.1)).toBe(1);
    expect(WAVE_SHAPES.square(0.9)).toBe(-1);
  });

  it("saw ramps from +1 down to -1 across the period", () => {
    expect(WAVE_SHAPES.saw(0)).toBeCloseTo(1);
    expect(WAVE_SHAPES.saw(0.5)).toBeCloseTo(0);
    expect(WAVE_SHAPES.saw(1)).toBeCloseTo(-1);
  });

  it("unknown shapes fall back to sine", () => {
    const d = buildWavePath("triangle", OPTS);
    expect(d).toBe(buildWavePath("sine", OPTS));
  });
});

describe("buildWavePath", () => {
  it("starts one period before the visible area for seamless scrolling", () => {
    const first = points(buildWavePath("sine", OPTS))[0];
    expect(first[0]).toBeCloseTo(-OPTS.period);
  });

  it("extends one period past the visible width", () => {
    const pts = points(buildWavePath("sine", OPTS));
    expect(pts[pts.length - 1][0]).toBeCloseTo(OPTS.width + OPTS.period);
  });

  it("gives every shape an identical point count so they can morph", () => {
    const counts = ["sine", "square", "saw"].map(
      (shape) => points(buildWavePath(shape, OPTS)).length
    );
    expect(new Set(counts).size).toBe(1);
  });

  it("tiles seamlessly: the point one period in matches the start height", () => {
    const pts = points(buildWavePath("sine", OPTS));
    const start = pts[0];
    const onePeriodOver = pts[SAMPLES_PER_PERIOD];
    expect(onePeriodOver[1]).toBeCloseTo(start[1]);
  });

  it("keeps the wave within amplitude of the center line", () => {
    const pts = points(buildWavePath("saw", OPTS));
    pts.forEach(([, y]) => {
      expect(y).toBeGreaterThanOrEqual(OPTS.mid - OPTS.amplitude - 0.01);
      expect(y).toBeLessThanOrEqual(OPTS.mid + OPTS.amplitude + 0.01);
    });
  });
});
