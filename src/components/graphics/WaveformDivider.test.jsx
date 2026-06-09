/**
 * @jest-environment jsdom
 */
import { render } from "@testing-library/react";
import WaveformDivider from "./WaveformDivider";

describe("WaveformDivider", () => {
  it("is hidden from assistive tech", () => {
    const { container } = render(<WaveformDivider />);

    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("defaults to the sine variant", () => {
    const { container } = render(<WaveformDivider />);

    expect(container.querySelector("svg")).toHaveAttribute("data-variant", "sine");
  });

  it.each(["sine", "saw", "square"])("renders a path for the %s variant", (variant) => {
    const { container } = render(<WaveformDivider variant={variant} />);

    const path = container.querySelector("path");
    expect(path).toHaveAttribute("d");
    expect(path.getAttribute("d").length).toBeGreaterThan(0);
  });

  it("falls back to sine for an unknown variant", () => {
    const { container: unknown } = render(<WaveformDivider variant="triangle" />);
    const { container: sine } = render(<WaveformDivider variant="sine" />);

    expect(unknown.querySelector("path").getAttribute("d")).toBe(
      sine.querySelector("path").getAttribute("d")
    );
  });

  it("appends a custom className", () => {
    const { container } = render(<WaveformDivider className="hero-divider" />);

    expect(container.querySelector("svg")).toHaveClass("waveform-divider", "hero-divider");
  });
});
