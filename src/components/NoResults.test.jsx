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

  it("wraps query in quotes", () => {
    render(<NoResults query="synth bass" />);

    const message = screen.getByText(/synth bass/);
    expect(message.textContent).toContain("\u201C");
    expect(message.textContent).toContain("\u201D");
  });
});
