/**
 * @jest-environment jsdom
 */
import { render } from "@testing-library/react";
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

  it("holds a single static figure under reduced motion", () => {
    withReducedMotion(true);

    const { container } = render(<LissajousHalo />);

    expect(container.querySelectorAll("animate")).toHaveLength(0);
    expect(container.querySelector(".lissajous-halo__beam")).not.toBeInTheDocument();
    // echo + main trace only, no beam
    expect(container.querySelectorAll("path")).toHaveLength(2);
  });
});
