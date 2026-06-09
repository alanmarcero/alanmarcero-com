/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import SynthesistMark from "./SynthesistMark";

describe("SynthesistMark", () => {
  it("renders as an accessible image with the default title", () => {
    render(<SynthesistMark />);

    const img = screen.getByRole("img", {
      name: "Alan Marcero — synthesist at the console",
    });
    expect(img).toBeInTheDocument();
  });

  it("accepts a custom title", () => {
    render(<SynthesistMark title="Custom title" />);

    expect(screen.getByRole("img", { name: "Custom title" })).toBeInTheDocument();
  });

  it("renders at the default 180px size", () => {
    render(<SynthesistMark />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("width", "180");
    expect(img).toHaveAttribute("height", "180");
  });

  it("scales to a custom size", () => {
    render(<SynthesistMark size={96} />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("width", "96");
    expect(img).toHaveAttribute("height", "96");
  });
});

describe("SynthesistMark className", () => {
  it("appends a custom className", () => {
    const { container } = render(<SynthesistMark className="hero-mark-art" />);

    expect(container.querySelector("svg")).toHaveClass(
      "synthesist-mark",
      "hero-mark-art"
    );
  });
});
