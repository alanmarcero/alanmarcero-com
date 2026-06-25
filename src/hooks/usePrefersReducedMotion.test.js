/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import usePrefersReducedMotion from "./usePrefersReducedMotion";

const makeMatchMedia = (matches) => {
  const listeners = new Set();
  const mql = {
    matches,
    addEventListener: (_event, cb) => listeners.add(cb),
    removeEventListener: (_event, cb) => listeners.delete(cb),
    _emit(next) {
      mql.matches = next;
      listeners.forEach((cb) => cb());
    },
  };
  return mql;
};

describe("usePrefersReducedMotion", () => {
  afterEach(() => {
    delete window.matchMedia;
  });

  it("returns false when reduced motion is not preferred", () => {
    window.matchMedia = () => makeMatchMedia(false);

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(false);
  });

  it("returns true when reduced motion is preferred", () => {
    window.matchMedia = () => makeMatchMedia(true);

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(true);
  });

  it("updates when the preference changes", () => {
    const mql = makeMatchMedia(false);
    window.matchMedia = () => mql;

    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);

    act(() => mql._emit(true));

    expect(result.current).toBe(true);
  });

  it("defaults to false when matchMedia is unavailable", () => {
    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(false);
  });
});
