/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import useScrollProgress from "./useScrollProgress";

const setMetrics = ({ scrollY, scrollHeight, clientHeight }) => {
  Object.defineProperty(window, "scrollY", { value: scrollY, writable: true, configurable: true });
  Object.defineProperty(document.documentElement, "scrollHeight", {
    value: scrollHeight, writable: true, configurable: true,
  });
  Object.defineProperty(document.documentElement, "clientHeight", {
    value: clientHeight, writable: true, configurable: true,
  });
};

describe("useScrollProgress", () => {
  it("starts at 0 at the top of the page", () => {
    setMetrics({ scrollY: 0, scrollHeight: 2000, clientHeight: 1000 });
    const { result } = renderHook(() => useScrollProgress());
    expect(result.current).toBe(0);
  });

  it("reports the midpoint as 0.5", () => {
    setMetrics({ scrollY: 0, scrollHeight: 2000, clientHeight: 1000 });
    const { result } = renderHook(() => useScrollProgress());

    act(() => {
      setMetrics({ scrollY: 500, scrollHeight: 2000, clientHeight: 1000 });
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBeCloseTo(0.5);
  });

  it("clamps to 1 at the bottom", () => {
    const { result } = renderHook(() => useScrollProgress());

    act(() => {
      setMetrics({ scrollY: 5000, scrollHeight: 2000, clientHeight: 1000 });
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe(1);
  });

  it("returns 0 when the page is not scrollable", () => {
    const { result } = renderHook(() => useScrollProgress());

    act(() => {
      setMetrics({ scrollY: 0, scrollHeight: 800, clientHeight: 800 });
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe(0);
  });
});
