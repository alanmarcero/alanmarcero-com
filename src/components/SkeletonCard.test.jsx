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

  it("renders the shimmer panel", () => {
    const { container } = render(<SkeletonCard />);

    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("contains no interactive elements", () => {
    const { container } = render(<SkeletonCard />);

    expect(container.querySelectorAll("button")).toHaveLength(0);
    expect(container.querySelectorAll("a")).toHaveLength(0);
    expect(container.querySelectorAll("input")).toHaveLength(0);
  });
});
