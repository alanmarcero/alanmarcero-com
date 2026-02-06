/**
 * @jest-environment jsdom
 */
import { render } from "@testing-library/react";
import SkeletonCard from "./SkeletonCard";

describe("SkeletonCard", () => {
  it("has aria-hidden for accessibility", () => {
    const { container } = render(<SkeletonCard />);

    const card = container.querySelector(".skeleton-card");
    expect(card).toHaveAttribute("aria-hidden", "true");
  });

  it("renders title, description, and button bars", () => {
    const { container } = render(<SkeletonCard />);

    expect(container.querySelector(".skeleton-bar--title")).toBeInTheDocument();
    expect(container.querySelector(".skeleton-bar--desc")).toBeInTheDocument();
    expect(container.querySelector(".skeleton-bar--button")).toBeInTheDocument();
  });

  it("renders exactly 4 shimmer bars", () => {
    const { container } = render(<SkeletonCard />);

    const bars = container.querySelectorAll(".skeleton-bar");
    expect(bars).toHaveLength(4);
  });

  it("renders 2 description bars", () => {
    const { container } = render(<SkeletonCard />);

    const descBars = container.querySelectorAll(".skeleton-bar--desc");
    expect(descBars).toHaveLength(2);
  });

  it("contains no interactive elements", () => {
    const { container } = render(<SkeletonCard />);

    expect(container.querySelectorAll("button")).toHaveLength(0);
    expect(container.querySelectorAll("a")).toHaveLength(0);
    expect(container.querySelectorAll("input")).toHaveLength(0);
  });
});
