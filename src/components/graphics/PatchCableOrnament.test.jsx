/**
 * @jest-environment jsdom
 */
import { render } from "@testing-library/react";
import PatchCableOrnament from "./PatchCableOrnament";

describe("PatchCableOrnament", () => {
  it("is hidden from assistive tech", () => {
    const { container } = render(<PatchCableOrnament />);

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("renders unflipped by default", () => {
    const { container } = render(<PatchCableOrnament />);

    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("data-flip", "false");
    expect(svg.style.transform).toBe("");
  });

  it("mirrors horizontally when flipped", () => {
    const { container } = render(<PatchCableOrnament flip />);

    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("data-flip", "true");
    expect(svg.style.transform).toBe("scaleX(-1)");
  });

  it("appends a custom className", () => {
    const { container } = render(<PatchCableOrnament className="corner-tl" />);

    expect(container.querySelector("svg")).toHaveClass("patch-cable-ornament", "corner-tl");
  });
});
