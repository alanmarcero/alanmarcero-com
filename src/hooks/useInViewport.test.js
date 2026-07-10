/**
 * @jest-environment jsdom
 */
import { render, act } from "@testing-library/react";
import useInViewport from "./useInViewport";

// A tiny probe that surfaces the hook's inView flag as a DOM attribute.
function Probe({ rootMargin }) {
  const [ref, inView] = useInViewport(rootMargin ? { rootMargin } : undefined);
  return <div ref={ref} data-inview={String(inView)} />;
}

const installIO = () => {
  let cb;
  const observed = [];
  const disconnect = jest.fn();
  global.IntersectionObserver = class {
    constructor(callback, options) {
      cb = callback;
      this.options = options;
    }
    observe(el) {
      observed.push(el);
    }
    disconnect() {
      disconnect();
    }
  };
  return {
    fire: (isIntersecting) => act(() => cb([{ isIntersecting }])),
    observed,
    disconnect,
  };
};

describe("useInViewport", () => {
  afterEach(() => {
    delete global.IntersectionObserver;
  });

  it("starts hidden and observes the element", () => {
    const io = installIO();
    const { container } = render(<Probe />);
    expect(container.firstChild).toHaveAttribute("data-inview", "false");
    expect(io.observed).toHaveLength(1);
  });

  it("becomes visible when the element intersects", () => {
    const io = installIO();
    const { container } = render(<Probe />);

    io.fire(true);
    expect(container.firstChild).toHaveAttribute("data-inview", "true");

    io.fire(false);
    expect(container.firstChild).toHaveAttribute("data-inview", "false");
  });

  it("disconnects the observer on unmount", () => {
    const io = installIO();
    const { unmount } = render(<Probe />);
    unmount();
    expect(io.disconnect).toHaveBeenCalled();
  });

  it("assumes visible when IntersectionObserver is unavailable", () => {
    const { container } = render(<Probe />);
    expect(container.firstChild).toHaveAttribute("data-inview", "true");
  });
});
