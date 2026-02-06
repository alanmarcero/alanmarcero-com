/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import MusicItem from "./MusicItem";

describe("MusicItem", () => {
  const mockItem = {
    title: "Test Track",
    videoId: "xyz789",
    description: "A great track",
  };

  it("renders the title", () => {
    render(<MusicItem item={mockItem} />);

    expect(screen.getByText("Test Track")).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(<MusicItem item={mockItem} />);

    expect(screen.getByText("A great track")).toBeInTheDocument();
  });

  it("renders a YouTube embed with correct videoId", () => {
    render(<MusicItem item={mockItem} />);

    const iframe = document.querySelector("iframe");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute("src", "https://www.youtube.com/embed/xyz789");
  });

  it("handles missing description gracefully", () => {
    const itemWithoutDesc = { title: "No Desc", videoId: "abc" };
    render(<MusicItem item={itemWithoutDesc} />);

    expect(screen.getByText("No Desc")).toBeInTheDocument();
  });

  it("renders with store-item container class", () => {
    const { container } = render(<MusicItem item={mockItem} />);

    expect(container.querySelector(".store-item")).toBeInTheDocument();
  });
});
