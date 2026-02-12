/**
 * @jest-environment jsdom
 */
import { render } from "@testing-library/react";
import YouTubeEmbed from "./YouTubeEmbed";

describe("YouTubeEmbed", () => {
  it("renders an iframe with correct YouTube URL", () => {
    render(<YouTubeEmbed videoId="abc123" />);

    const iframe = document.querySelector("iframe");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute("src", "https://www.youtube.com/embed/abc123");
  });

  it("uses default width and height", () => {
    render(<YouTubeEmbed videoId="abc123" />);

    const iframe = document.querySelector("iframe");
    expect(iframe).toHaveAttribute("width", "100%");
    expect(iframe).toHaveAttribute("height", "220px");
  });

  it("accepts custom width and height", () => {
    render(<YouTubeEmbed videoId="abc123" width="300px" height="200px" />);

    const iframe = document.querySelector("iframe");
    expect(iframe).toHaveAttribute("width", "300px");
    expect(iframe).toHaveAttribute("height", "200px");
  });

  it("has allowFullScreen attribute", () => {
    render(<YouTubeEmbed videoId="test" />);

    const iframe = document.querySelector("iframe");
    expect(iframe).toHaveAttribute("allowFullScreen");
  });

  it("has default title attribute for accessibility", () => {
    render(<YouTubeEmbed videoId="abc123" />);

    const iframe = document.querySelector("iframe");
    expect(iframe).toHaveAttribute("title", "YouTube video");
  });

  it("accepts custom title", () => {
    render(<YouTubeEmbed videoId="abc123" title="Demo video" />);

    const iframe = document.querySelector("iframe");
    expect(iframe).toHaveAttribute("title", "Demo video");
  });

  it("has permissions policy for embedded content", () => {
    render(<YouTubeEmbed videoId="abc123" />);

    const iframe = document.querySelector("iframe");
    expect(iframe).toHaveAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    );
  });
});
