/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import Hero from "./Hero";

describe("Hero", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders name and tagline", () => {
    render(<Hero />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Alan Marcero");
    expect(screen.getByText("Synthesizer Sound Designer & Producer")).toBeInTheDocument();
  });

  it("renders the synthesist mark in place of a photo", () => {
    render(<Hero />);
    expect(screen.getByRole("img", {
      name: "Alan Marcero — synthesist at the console",
    })).toBeInTheDocument();
  });

  it("does not render the removed hero call-to-action buttons", () => {
    render(<Hero />);

    expect(screen.queryByRole("link", { name: "Get in Touch" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Plugins" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Subscribe on YouTube" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Take Me Back" })).not.toBeInTheDocument();
  });

  it("renders bio text", () => {
    render(<Hero />);
    expect(screen.getByText(/Trance and electronic music producer from Boston/)).toBeInTheDocument();
  });
});
