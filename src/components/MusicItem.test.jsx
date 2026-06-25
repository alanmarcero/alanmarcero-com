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

  it("renders Listen on YouTube link with correct URL", () => {
    render(<MusicItem item={mockItem} />);

    const link = screen.getByText("Listen on YouTube");
    expect(link).toHaveAttribute("href", "https://www.youtube.com/watch?v=xyz789");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("applies style prop to container", () => {
    const { container } = render(
      <MusicItem item={mockItem} style={{ '--card-index': 3 }} />
    );

    const card = container.querySelector(".module");
    expect(card.style.getPropertyValue("--card-index")).toBe("3");
  });

  it("tags remixes as Remix", () => {
    render(<MusicItem item={{ ...mockItem, title: "Melbourne (Alan-M Remix)" }} />);

    expect(screen.getByText("Remix")).toBeInTheDocument();
    expect(screen.queryByText("Original")).not.toBeInTheDocument();
  });

  it("tags non-remixes as Original", () => {
    render(<MusicItem item={mockItem} />);

    expect(screen.getByText("Original")).toBeInTheDocument();
    expect(screen.queryByText("Remix")).not.toBeInTheDocument();
  });

  it("renders as a module panel with LED indicator", () => {
    const { container } = render(<MusicItem item={mockItem} />);

    expect(container.querySelector("article.module")).toBeInTheDocument();
    expect(container.querySelector(".module__led")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".module__title")).toHaveTextContent("Test Track");
  });
});
