/**
 * @jest-environment jsdom
 */
import { render } from "@testing-library/react";
import SignalMeter from "./SignalMeter";

describe("SignalMeter", () => {
  it("renders the default number of bars", () => {
    const { container } = render(<SignalMeter />);
    expect(container.querySelectorAll(".signal-meter__bar")).toHaveLength(7);
  });

  it("renders a custom number of bars", () => {
    const { container } = render(<SignalMeter bars={4} />);
    expect(container.querySelectorAll(".signal-meter__bar")).toHaveLength(4);
  });

  it("is hidden from assistive tech", () => {
    const { container } = render(<SignalMeter />);
    expect(container.querySelector(".signal-meter")).toHaveAttribute("aria-hidden", "true");
  });

  it("renders the label", () => {
    const { getByText } = render(<SignalMeter label="MAIN" />);
    expect(getByText("MAIN")).toBeInTheDocument();
  });

  it("omits the label when empty (bars only)", () => {
    const { container } = render(<SignalMeter label="" />);
    expect(container.querySelector(".signal-meter__label")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".signal-meter__bar")).toHaveLength(7);
  });

  it("staggers bars with an index custom property", () => {
    const { container } = render(<SignalMeter bars={3} />);
    const bars = container.querySelectorAll(".signal-meter__bar");
    expect(bars[2].style.getPropertyValue("--bar-index")).toBe("2");
  });
});
