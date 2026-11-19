/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import Hero from "./Hero";
import { YOUTUBE_CHANNEL_URL } from "../config";

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

  it("links to contact, plugins, and YouTube", () => {
    render(<Hero />);

    const contact = screen.getByRole("link", { name: "Get in Touch" });
    expect(contact).toHaveAttribute("href", "/contact");
    expect(contact).toHaveClass("btn");
    expect(contact).not.toHaveClass("btn--ghost");

    expect(screen.getByRole("link", { name: "Plugins" })).toHaveAttribute("href", "/plugins");

    const youtube = screen.getByRole("link", { name: "Subscribe on YouTube" });
    expect(youtube).toHaveAttribute("href", YOUTUBE_CHANNEL_URL);
    expect(youtube).toHaveAttribute("target", "_blank");
    expect(youtube).toHaveAttribute("rel", "noopener noreferrer");
    expect(youtube).toHaveClass("btn--ghost");
  });

  it("renders bio text", () => {
    render(<Hero />);
    expect(screen.getByText(/Trance and electronic music producer from Boston/)).toBeInTheDocument();
  });
});
