import { lissajous, rose, buildParametricPath, CURVE_SAMPLES } from "./parametric";

// Parse "M100.00 50.00 L..." into [[x, y], ...] number pairs.
const points = (d) =>
  d
    .trim()
    .split(/(?=[ML])/)
    .map((seg) => seg.trim().slice(1).split(" ").map(Number));

describe("lissajous", () => {
  it("maps t=0 to (sin δ, 0)", () => {
    const p = lissajous(3, 2, Math.PI / 2)(0);
    expect(p.x).toBeCloseTo(1); // sin(π/2)
    expect(p.y).toBeCloseTo(0); // sin(0)
  });

  it("stays within the unit box for every sample", () => {
    const fn = lissajous(3, 2, 0.4);
    for (let i = 0; i <= 32; i++) {
      const { x, y } = fn(i / 32);
      expect(Math.abs(x)).toBeLessThanOrEqual(1.0001);
      expect(Math.abs(y)).toBeLessThanOrEqual(1.0001);
    }
  });

  it("is closed: t=0 and t=1 coincide for integer frequencies", () => {
    const fn = lissajous(3, 2, 0.7);
    const a = fn(0);
    const b = fn(1);
    expect(a.x).toBeCloseTo(b.x);
    expect(a.y).toBeCloseTo(b.y);
  });

  it("traces a circle when a=b and δ=π/2", () => {
    const fn = lissajous(1, 1, Math.PI / 2); // x=cos, y=sin
    for (let i = 0; i <= 16; i++) {
      const { x, y } = fn(i / 16);
      expect(Math.hypot(x, y)).toBeCloseTo(1);
    }
  });
});

describe("rose", () => {
  it("passes through the origin where cos(k·2π·t)=0", () => {
    const p = rose(2)(1 / 8); // cos(2·2π·1/8)=cos(π/2)=0
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
  });

  it("never leaves the unit disk", () => {
    const fn = rose(5);
    for (let i = 0; i <= 40; i++) {
      const { x, y } = fn(i / 40);
      expect(Math.hypot(x, y)).toBeLessThanOrEqual(1.0001);
    }
  });

  it("is closed: t=0 and t=1 coincide", () => {
    const fn = rose(5);
    const a = fn(0);
    const b = fn(1);
    expect(a.x).toBeCloseTo(b.x);
    expect(a.y).toBeCloseTo(b.y);
  });
});

describe("buildParametricPath", () => {
  it("emits samples+1 points so a closed curve returns to its start", () => {
    const d = buildParametricPath(lissajous(3, 2, 0), { samples: 60 });
    expect(points(d)).toHaveLength(61);
  });

  it("defaults to CURVE_SAMPLES samples", () => {
    const d = buildParametricPath(rose(3));
    expect(points(d)).toHaveLength(CURVE_SAMPLES + 1);
  });

  it("gives every figure an identical point count so they can morph", () => {
    const opts = { samples: 120 };
    const counts = [
      buildParametricPath(lissajous(3, 2, Math.PI / 2), opts),
      buildParametricPath(lissajous(5, 4, Math.PI / 2), opts),
      buildParametricPath(rose(5), opts),
    ].map((d) => points(d).length);
    expect(new Set(counts).size).toBe(1);
  });

  it("centers on (cx, cy) and scales by radius", () => {
    // a=b, δ=π/2 → unit circle, so every point sits `radius` from the center
    const d = buildParametricPath(lissajous(1, 1, Math.PI / 2), {
      cx: 100,
      cy: 50,
      radius: 10,
      samples: 8,
    });
    points(d).forEach(([x, y]) => {
      expect(Math.hypot(x - 100, y - 50)).toBeCloseTo(10, 1);
    });
  });

  it("starts the path with a single move command", () => {
    const d = buildParametricPath(rose(3), { samples: 10 });
    expect(d.startsWith("M")).toBe(true);
    expect(d.match(/M/g)).toHaveLength(1);
  });

  it("is deterministic", () => {
    const opts = { samples: 50 };
    expect(buildParametricPath(lissajous(3, 2, 0.5), opts)).toBe(
      buildParametricPath(lissajous(3, 2, 0.5), opts)
    );
  });
});
