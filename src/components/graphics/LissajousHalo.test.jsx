/**
 * @jest-environment jsdom
 */
import { render, act } from "@testing-library/react";
import LissajousHalo from "./LissajousHalo";

const withReducedMotion = (matches) => {
  window.matchMedia = () => ({
    matches,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
};

describe("LissajousHalo", () => {
  afterEach(() => {
    delete window.matchMedia;
  });

  it("is hidden from assistive tech", () => {
    const { container } = render(<LissajousHalo />);

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("appends a custom className", () => {
    const { container } = render(<LissajousHalo className="hero-mark-halo" />);

    expect(container.querySelector("svg")).toHaveClass("lissajous-halo", "hero-mark-halo");
  });

  it("draws the trace in currentColor so the slot's CSS drives the hue", () => {
    const { container } = render(<LissajousHalo />);

    const paths = container.querySelectorAll("path");
    expect(paths.length).toBeGreaterThanOrEqual(2);
    paths.forEach((p) => expect(p).toHaveAttribute("stroke", "currentColor"));
  });

  it("morphs the path between figures when motion is allowed", () => {
    // jsdom has no matchMedia → treated as motion allowed
    const { container } = render(<LissajousHalo />);

    const animates = container.querySelectorAll("animate");
    expect(animates.length).toBeGreaterThan(0);
    animates.forEach((a) => expect(a).toHaveAttribute("attributeName", "d"));
    // the travelling beam only rides the trace in motion mode
    expect(container.querySelector(".lissajous-halo__beam")).toBeInTheDocument();
  });

  it("pauses its animation while off-screen and resumes when visible", () => {
    const pauseAnimations = jest.fn();
    const unpauseAnimations = jest.fn();
    window.SVGSVGElement.prototype.pauseAnimations = pauseAnimations;
    window.SVGSVGElement.prototype.unpauseAnimations = unpauseAnimations;
    let ioCallback;
    window.IntersectionObserver = class {
      constructor(cb) {
        ioCallback = cb;
      }
      observe() {}
      disconnect() {}
    };

    try {
      const { container } = render(<LissajousHalo className="page-scope__trace" />);
      const svg = container.querySelector("svg");

      // starts off-screen: paused class applied and SMIL timeline paused
      expect(svg).toHaveClass("lissajous-halo--paused");
      expect(pauseAnimations).toHaveBeenCalled();

      act(() => ioCallback([{ isIntersecting: true }]));
      expect(svg).not.toHaveClass("lissajous-halo--paused");
      expect(unpauseAnimations).toHaveBeenCalled();

      act(() => ioCallback([{ isIntersecting: false }]));
      expect(svg).toHaveClass("lissajous-halo--paused");
    } finally {
      delete window.SVGSVGElement.prototype.pauseAnimations;
      delete window.SVGSVGElement.prototype.unpauseAnimations;
      delete window.IntersectionObserver;
    }
  });

  it("holds a single static figure under reduced motion", () => {
    withReducedMotion(true);

    const { container } = render(<LissajousHalo />);

    expect(container.querySelectorAll("animate")).toHaveLength(0);
    expect(container.querySelector(".lissajous-halo__beam")).not.toBeInTheDocument();
    // echo + main trace only, no beam
    expect(container.querySelectorAll("path")).toHaveLength(2);
  });
});
