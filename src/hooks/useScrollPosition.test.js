/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import useScrollPosition from "./useScrollPosition";

describe("useScrollPosition", () => {
  beforeEach(() => {
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
  });

  it("returns false initially", () => {
    const { result } = renderHook(() => useScrollPosition(400));

    expect(result.current).toBe(false);
  });

  it("returns true when scroll exceeds threshold", () => {
    const { result } = renderHook(() => useScrollPosition(400));

    act(() => {
      Object.defineProperty(window, "scrollY", { value: 500, writable: true });
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe(true);
  });

  it("returns false when scroll is at exact threshold", () => {
    const { result } = renderHook(() => useScrollPosition(400));

    act(() => {
      Object.defineProperty(window, "scrollY", { value: 400, writable: true });
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe(false);
  });

  it("returns false when scrolling back below threshold", () => {
    const { result } = renderHook(() => useScrollPosition(400));

    act(() => {
      Object.defineProperty(window, "scrollY", { value: 500, writable: true });
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe(true);

    act(() => {
      Object.defineProperty(window, "scrollY", { value: 100, writable: true });
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe(false);
  });

  it("uses default threshold of 400", () => {
    const { result } = renderHook(() => useScrollPosition());

    act(() => {
      Object.defineProperty(window, "scrollY", { value: 401, writable: true });
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe(true);
  });

  it("accepts custom threshold", () => {
    const { result } = renderHook(() => useScrollPosition(100));

    act(() => {
      Object.defineProperty(window, "scrollY", { value: 101, writable: true });
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe(true);
  });

  it("cleans up scroll listener on unmount", () => {
    const removeSpy = jest.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useScrollPosition(400));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
    removeSpy.mockRestore();
  });
});
