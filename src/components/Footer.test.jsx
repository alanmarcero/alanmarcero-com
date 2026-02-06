/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import Footer from "./Footer";
import { YOUTUBE_CHANNEL_URL, GITHUB_URL } from "../config";

describe("Footer", () => {
  it("renders the current year", () => {
    render(<Footer />);

    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it("renders YouTube link", () => {
    render(<Footer />);

    const link = screen.getByText("YouTube");
    expect(link).toHaveAttribute("href", YOUTUBE_CHANNEL_URL);
  });

  it("renders GitHub link", () => {
    render(<Footer />);

    const link = screen.getByText("GitHub");
    expect(link).toHaveAttribute("href", GITHUB_URL);
  });

  it("links open in new tab with security attributes", () => {
    render(<Footer />);

    const links = [screen.getByText("YouTube"), screen.getByText("GitHub")];
    links.forEach((link) => {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });
});
