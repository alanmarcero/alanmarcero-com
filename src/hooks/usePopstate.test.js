/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import usePopstate from "./usePopstate";

const firePopstate = () => window.dispatchEvent(new PopStateEvent("popstate"));

describe("usePopstate", () => {
  it("calls the callback on popstate", () => {
    const onPopstate = jest.fn();
    renderHook(() => usePopstate(onPopstate));

    firePopstate();

    expect(onPopstate).toHaveBeenCalledTimes(1);
  });

  it("calls the latest callback after a re-render", () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = renderHook(({ cb }) => usePopstate(cb), { initialProps: { cb: first } });

    rerender({ cb: second });
    firePopstate();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("stops listening on unmount", () => {
    const onPopstate = jest.fn();
    const { unmount } = renderHook(() => usePopstate(onPopstate));

    unmount();
    firePopstate();

    expect(onPopstate).not.toHaveBeenCalled();
  });
});
