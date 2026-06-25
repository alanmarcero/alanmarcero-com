/**
 * @jest-environment jsdom
 */
import { render } from "@testing-library/react";
import SignalMeter from "./SignalMeter";

describe("SignalMeter", () => {
  it("renders a canvas", () => {
    const { container } = render(<SignalMeter />);
    expect(container.querySelector("canvas.signal-meter")).toBeInTheDocument();
  });

  it("is hidden from assistive tech", () => {
    const { container } = render(<SignalMeter />);
    expect(container.querySelector(".signal-meter")).toHaveAttribute("aria-hidden", "true");
  });

  it("appends a custom className", () => {
    const { container } = render(<SignalMeter className="footer-meter" />);
    expect(container.querySelector("canvas")).toHaveClass("signal-meter", "footer-meter");
  });
});
