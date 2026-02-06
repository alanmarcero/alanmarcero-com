/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import Hero from "./Hero";
import { YOUTUBE_CHANNEL_URL } from "../config";

describe("Hero", () => {
  const defaultProps = {
    searchQuery: "",
    onSearchChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders name and tagline", () => {
    render(<Hero {...defaultProps} />);

    expect(screen.getByText("Alan Marcero")).toBeInTheDocument();
    expect(screen.getByText("Synthesizer Sound Designer & Producer")).toBeInTheDocument();
  });

  it("renders hero image", () => {
    render(<Hero {...defaultProps} />);

    const img = screen.getByAltText("Alan Marcero");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/about-me.webp");
  });

  it("renders YouTube subscribe link with security attributes", () => {
    render(<Hero {...defaultProps} />);

    const link = screen.getByText("Subscribe on YouTube");
    expect(link).toHaveAttribute("href", YOUTUBE_CHANNEL_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders search input with placeholder", () => {
    render(<Hero {...defaultProps} />);

    expect(screen.getByPlaceholderText("Search patches and music...")).toBeInTheDocument();
  });

  it("calls onSearchChange when input changes", () => {
    render(<Hero {...defaultProps} />);

    const input = screen.getByPlaceholderText("Search patches and music...");
    fireEvent.change(input, { target: { value: "trance" } });

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith("trance");
  });

  it("displays current searchQuery value", () => {
    render(<Hero {...defaultProps} searchQuery="prophet" />);

    const input = screen.getByPlaceholderText("Search patches and music...");
    expect(input).toHaveValue("prophet");
  });

  it("renders bio text", () => {
    render(<Hero {...defaultProps} />);

    expect(screen.getByText(/Trance and electronic music producer from Boston/)).toBeInTheDocument();
  });

  it("search input has accessible aria-label", () => {
    render(<Hero {...defaultProps} />);

    const input = screen.getByLabelText("Search patches and music");
    expect(input).toBeInTheDocument();
  });

  it("does not show clear button when search is empty", () => {
    render(<Hero {...defaultProps} />);

    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();
  });

  it("shows clear button when search has value", () => {
    render(<Hero {...defaultProps} searchQuery="trance" />);

    expect(screen.getByLabelText("Clear search")).toBeInTheDocument();
  });

  it("clears search when clear button is clicked", () => {
    render(<Hero {...defaultProps} searchQuery="trance" />);

    fireEvent.click(screen.getByLabelText("Clear search"));

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith("");
  });
});
