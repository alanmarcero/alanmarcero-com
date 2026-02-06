/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import App from "./App";

global.fetch = jest.fn();

jest.mock("./data/patchBanks", () => ({
  patchBanks: [
    {
      name: "Test Synth",
      description: "Test patches",
      audioDemo: ["testVideo"],
      downloadLink: "/banks/test.zip",
    },
  ],
}));

const mockFetchSuccess = (items = []) => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ items }),
  });
};

describe("App", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the header", () => {
    mockFetchSuccess();
    render(<App />);

    expect(screen.getByText("Alan's Synthesizer Patch Banks")).toBeInTheDocument();
  });

  it("renders the news banner", () => {
    mockFetchSuccess();
    render(<App />);

    expect(screen.getByText(/The site is back up/)).toBeInTheDocument();
  });

  it("renders the search input", () => {
    mockFetchSuccess();
    render(<App />);

    expect(screen.getByPlaceholderText("Search patches and music...")).toBeInTheDocument();
  });

  it("shows loading message while fetching music", () => {
    global.fetch.mockImplementationOnce(() => new Promise(() => {}));
    render(<App />);

    expect(screen.getByText("Loading music...")).toBeInTheDocument();
  });

  it("shows error message when fetch fails", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Network error"));
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Unable to load music. Please try again later.")).toBeInTheDocument();
    });
  });

  it("shows error message when response is not ok", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Unable to load music. Please try again later.")).toBeInTheDocument();
    });
  });

  it("renders music items after successful fetch", async () => {
    mockFetchSuccess([
      { title: "Music Track 1", videoId: "vid1", description: "Desc 1" },
    ]);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Music Track 1")).toBeInTheDocument();
    });
  });

  it("renders patch banks from data", async () => {
    mockFetchSuccess();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Test Synth")).toBeInTheDocument();
    });
  });

  it("filters patch banks by search query", async () => {
    mockFetchSuccess();
    render(<App />);

    const searchInput = screen.getByPlaceholderText("Search patches and music...");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    await waitFor(() => {
      expect(screen.queryByText("Test Synth")).not.toBeInTheDocument();
    });
  });

  it("filters music items by search query", async () => {
    mockFetchSuccess([
      { title: "Trance Track", videoId: "vid1", description: "" },
      { title: "House Track", videoId: "vid2", description: "" },
    ]);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Trance Track")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search patches and music...");
    fireEvent.change(searchInput, { target: { value: "Trance" } });

    await waitFor(() => {
      expect(screen.getByText("Trance Track")).toBeInTheDocument();
      expect(screen.queryByText("House Track")).not.toBeInTheDocument();
    });
  });

  it("renders About Me section", () => {
    mockFetchSuccess();
    render(<App />);

    expect(screen.getByText("About Me")).toBeInTheDocument();
    expect(screen.getByText(/I'm Alan from Boston/)).toBeInTheDocument();
  });

  it("renders Donate section with PayPal link", () => {
    mockFetchSuccess();
    render(<App />);

    expect(screen.getByText("Support My Work")).toBeInTheDocument();
    const paypalLink = screen.getByText("Donate via PayPal");
    expect(paypalLink).toHaveAttribute("href", "https://www.paypal.com/donate/?hosted_button_id=NFXJTJVKD43CG");
  });

  it("renders footer", () => {
    mockFetchSuccess();
    render(<App />);

    expect(screen.getByText("2025 Alan Marcero")).toBeInTheDocument();
  });
});
