/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import YouTubeEmbed from "./YouTubeEmbed";

const activate = () => fireEvent.click(screen.getByRole("button"));

describe("YouTubeEmbed", () => {
  it("renders a facade button and no iframe before activation", () => {
    render(<YouTubeEmbed videoId="abc123" title="Demo video" />);

    expect(screen.getByRole("button", { name: "Play video: Demo video" })).toBeInTheDocument();
    expect(document.querySelector("iframe")).not.toBeInTheDocument();
  });

  it("shows the lazy-loaded video thumbnail in the facade", () => {
    render(<YouTubeEmbed videoId="abc123" />);

    const img = document.querySelector("img.yt-facade__thumb");
    expect(img).toHaveAttribute("src", "https://i.ytimg.com/vi/abc123/hqdefault.jpg");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
    expect(img).toHaveAttribute("alt", ""); // decorative; the button carries the label
  });

  it("loads the iframe with autoplay only after the user clicks", () => {
    render(<YouTubeEmbed videoId="abc123" />);
    expect(document.querySelector("iframe")).not.toBeInTheDocument();

    activate();

    expect(document.querySelector("iframe")).toHaveAttribute(
      "src",
      "https://www.youtube.com/embed/abc123?autoplay=1"
    );
  });

  it("passes width, height and title to the activated iframe", () => {
    render(<YouTubeEmbed videoId="abc123" title="Demo video" width="300px" height="200px" />);

    activate();

    const iframe = document.querySelector("iframe");
    expect(iframe).toHaveAttribute("width", "300px");
    expect(iframe).toHaveAttribute("height", "200px");
    expect(iframe).toHaveAttribute("title", "Demo video");
  });

  it("keeps fullscreen, lazy loading, permissions and sandbox on the iframe", () => {
    render(<YouTubeEmbed videoId="abc123" />);

    activate();

    const iframe = document.querySelector("iframe");
    expect(iframe).toHaveAttribute("allowFullScreen");
    expect(iframe).toHaveAttribute("loading", "lazy");
    expect(iframe).toHaveAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    );
    expect(iframe).toHaveAttribute("sandbox");
  });

  it("defaults the facade label when no title is given", () => {
    render(<YouTubeEmbed videoId="abc123" />);

    expect(screen.getByRole("button")).toHaveAccessibleName("Play video: YouTube video");
  });
});
