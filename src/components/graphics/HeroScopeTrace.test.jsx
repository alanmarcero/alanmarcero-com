/**
 * @jest-environment jsdom
 */
import { render } from "@testing-library/react";
import HeroScopeTrace from "./HeroScopeTrace";

describe("HeroScopeTrace", () => {
  it("is hidden from assistive tech", () => {
    const { container } = render(<HeroScopeTrace />);

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("stretches to its container", () => {
    const { container } = render(<HeroScopeTrace />);

    expect(container.querySelector("svg")).toHaveAttribute(
      "preserveAspectRatio",
      "none"
    );
  });

  it("draws both the main trace and the echo pass in currentColor", () => {
    const { container } = render(<HeroScopeTrace />);

    const paths = container.querySelectorAll("path");
    expect(paths).toHaveLength(2);
    paths.forEach((path) => expect(path).toHaveAttribute("stroke", "currentColor"));
  });

  it("appends a custom className", () => {
    const { container } = render(<HeroScopeTrace className="hero-scope" />);

    expect(container.querySelector("svg")).toHaveClass("hero-scope-trace", "hero-scope");
  });
});
