/**
 * @jest-environment jsdom
 */
import { render, act } from "@testing-library/react";
import useScrollProgress from "./useScrollProgress";

// A probe that attaches the hook's ref so we can read the written transform.
function Probe() {
  const ref = useScrollProgress();
  return <div ref={ref} data-testid="bar" />;
}

const setMetrics = ({ scrollY, scrollHeight, clientHeight }) => {
  Object.defineProperty(window, "scrollY", { value: scrollY, writable: true, configurable: true });
  Object.defineProperty(document.documentElement, "scrollHeight", {
    value: scrollHeight, writable: true, configurable: true,
  });
  Object.defineProperty(document.documentElement, "clientHeight", {
    value: clientHeight, writable: true, configurable: true,
  });
};

// Model rAF: queue callbacks and flush them on demand (one frame later), the
// way a real browser coalesces a burst of scroll events into one paint.
let frame;
const flushFrame = () => act(() => {
  const cbs = frame;
  frame = [];
  cbs.forEach((cb) => cb(0));
});

describe("useScrollProgress", () => {
  beforeEach(() => {
    frame = [];
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => frame.push(cb));
    jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const transformOf = (el) => el.style.transform;

  it("writes scaleX(0) at the top of the page on mount", () => {
    setMetrics({ scrollY: 0, scrollHeight: 2000, clientHeight: 1000 });
    const { getByTestId } = render(<Probe />);
    expect(transformOf(getByTestId("bar"))).toBe("scaleX(0)");
  });

  it("writes the midpoint as scaleX(0.5)", () => {
    setMetrics({ scrollY: 0, scrollHeight: 2000, clientHeight: 1000 });
    const { getByTestId } = render(<Probe />);

    act(() => {
      setMetrics({ scrollY: 500, scrollHeight: 2000, clientHeight: 1000 });
      window.dispatchEvent(new Event("scroll"));
    });
    flushFrame();

    expect(transformOf(getByTestId("bar"))).toBe("scaleX(0.5)");
  });

  it("clamps to scaleX(1) at the bottom", () => {
    setMetrics({ scrollY: 0, scrollHeight: 2000, clientHeight: 1000 });
    const { getByTestId } = render(<Probe />);

    act(() => {
      setMetrics({ scrollY: 5000, scrollHeight: 2000, clientHeight: 1000 });
      window.dispatchEvent(new Event("scroll"));
    });
    flushFrame();

    expect(transformOf(getByTestId("bar"))).toBe("scaleX(1)");
  });

  it("coalesces a burst of scroll events into a single frame write", () => {
    setMetrics({ scrollY: 0, scrollHeight: 2000, clientHeight: 1000 });
    const { getByTestId } = render(<Probe />);

    act(() => {
      for (let i = 0; i < 10; i++) window.dispatchEvent(new Event("scroll"));
    });
    // ten events, but only one rAF should have been queued for the frame
    expect(frame).toHaveLength(1);

    act(() => {
      setMetrics({ scrollY: 500, scrollHeight: 2000, clientHeight: 1000 });
    });
    flushFrame();
    expect(transformOf(getByTestId("bar"))).toBe("scaleX(0.5)");
  });

  it("writes scaleX(0) when the page is not scrollable", () => {
    const { getByTestId } = render(<Probe />);

    act(() => {
      setMetrics({ scrollY: 0, scrollHeight: 800, clientHeight: 800 });
      window.dispatchEvent(new Event("scroll"));
    });
    flushFrame();

    expect(transformOf(getByTestId("bar"))).toBe("scaleX(0)");
  });
});
