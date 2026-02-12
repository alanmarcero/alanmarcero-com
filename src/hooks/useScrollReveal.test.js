/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { render } from "@testing-library/react";
import useScrollReveal from "./useScrollReveal";

let observers;
let observerCallback;

beforeEach(() => {
  observers = [];
  observerCallback = null;

  global.IntersectionObserver = jest.fn((callback, options) => {
    observerCallback = callback;
    const observer = {
      observe: jest.fn(),
      disconnect: jest.fn(),
      callback,
      options,
    };
    observers.push(observer);
    return observer;
  });
});

function TestComponent({ threshold }) {
  const [ref, isVisible] = useScrollReveal(threshold);
  return <div ref={ref} data-visible={isVisible} />;
}

describe("useScrollReveal", () => {
  it("returns a ref and false initially", () => {
    const { result } = renderHook(() => useScrollReveal());

    const [ref, isVisible] = result.current;
    expect(ref).toHaveProperty("current");
    expect(isVisible).toBe(false);
  });

  it("creates an IntersectionObserver with default threshold", () => {
    render(<TestComponent />);

    expect(global.IntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { threshold: 0.1 }
    );
  });

  it("accepts a custom threshold", () => {
    render(<TestComponent threshold={0.5} />);

    expect(observers[0].options.threshold).toBe(0.5);
  });

  it("observes the ref element", () => {
    render(<TestComponent />);

    expect(observers[0].observe).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });

  it("sets isVisible to true when element intersects", () => {
    const { container } = render(<TestComponent />);

    act(() => {
      observerCallback([{ isIntersecting: true }]);
    });

    expect(container.firstChild.getAttribute("data-visible")).toBe("true");
  });

  it("toggles visibility when element leaves viewport", () => {
    const { container } = render(<TestComponent />);

    act(() => {
      observerCallback([{ isIntersecting: true }]);
    });
    expect(container.firstChild.getAttribute("data-visible")).toBe("true");

    act(() => {
      observerCallback([{ isIntersecting: false }]);
    });
    expect(container.firstChild.getAttribute("data-visible")).toBe("false");
  });

  it("disconnects on unmount", () => {
    const { unmount } = render(<TestComponent />);

    unmount();

    expect(observers[0].disconnect).toHaveBeenCalled();
  });
});
