/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import NoResults from "./NoResults";

describe("NoResults", () => {
  it("renders the search query", () => {
    render(<NoResults query="trance pads" />);

    expect(screen.getByText(/trance pads/)).toBeInTheDocument();
  });

  it("renders suggestion text", () => {
    render(<NoResults query="test" />);

    expect(screen.getByText("Try different keywords or clear the search")).toBeInTheDocument();
  });

  it("has correct container class", () => {
    const { container } = render(<NoResults query="test" />);

    expect(container.querySelector(".no-results")).toBeInTheDocument();
  });

  it("renders search icon", () => {
    const { container } = render(<NoResults query="test" />);

    expect(container.querySelector(".no-results-icon")).toBeInTheDocument();
  });

  it("wraps query in quotes", () => {
    render(<NoResults query="synth bass" />);

    const message = screen.getByText(/synth bass/);
    expect(message.textContent).toContain("\u201C");
    expect(message.textContent).toContain("\u201D");
  });

  it("has no-results-message class on message paragraph", () => {
    const { container } = render(<NoResults query="test" />);

    expect(container.querySelector(".no-results-message")).toBeInTheDocument();
  });

  it("has no-results-suggestion class on suggestion paragraph", () => {
    const { container } = render(<NoResults query="test" />);

    expect(container.querySelector(".no-results-suggestion")).toBeInTheDocument();
  });
});
