/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import App from "./App";
import { LAMBDA_URL } from "./config";

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

  it("renders the hero with name", () => {
    mockFetchSuccess();
    render(<App />);

    expect(screen.getByText("Alan Marcero")).toBeInTheDocument();
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

  it("renders hero bio text", () => {
    mockFetchSuccess();
    render(<App />);

    expect(screen.getByText(/Trance and electronic music producer from Boston/)).toBeInTheDocument();
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

  it("fetches from LAMBDA_URL on mount", () => {
    mockFetchSuccess();
    render(<App />);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(LAMBDA_URL);
  });

  it("renders section titles", () => {
    mockFetchSuccess();
    render(<App />);

    expect(screen.getByText("Patch Banks")).toBeInTheDocument();
    expect(screen.getByText("Music and Remixes")).toBeInTheDocument();
  });

  it("hides loading message after successful fetch", async () => {
    mockFetchSuccess([
      { title: "Track 1", videoId: "v1", description: "" },
    ]);
    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText("Loading music...")).not.toBeInTheDocument();
    });
  });

  it("search is case-insensitive", async () => {
    mockFetchSuccess();
    render(<App />);

    const searchInput = screen.getByPlaceholderText("Search patches and music...");
    fireEvent.change(searchInput, { target: { value: "TEST SYNTH" } });

    await waitFor(() => {
      expect(screen.getByText("Test Synth")).toBeInTheDocument();
    });
  });

  it("filters patch banks by description", async () => {
    mockFetchSuccess();
    render(<App />);

    const searchInput = screen.getByPlaceholderText("Search patches and music...");
    fireEvent.change(searchInput, { target: { value: "Test patches" } });

    await waitFor(() => {
      expect(screen.getByText("Test Synth")).toBeInTheDocument();
    });
  });

  it("shows all items when search is cleared", async () => {
    mockFetchSuccess([
      { title: "Track A", videoId: "v1", description: "" },
    ]);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Track A")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search patches and music...");
    fireEvent.change(searchInput, { target: { value: "zzz" } });

    await waitFor(() => {
      expect(screen.queryByText("Track A")).not.toBeInTheDocument();
    });

    fireEvent.change(searchInput, { target: { value: "" } });

    await waitFor(() => {
      expect(screen.getByText("Track A")).toBeInTheDocument();
      expect(screen.getByText("Test Synth")).toBeInTheDocument();
    });
  });

  it("PayPal link opens in new tab with security attributes", () => {
    mockFetchSuccess();
    render(<App />);

    const paypalLink = screen.getByText("Donate via PayPal");
    expect(paypalLink).toHaveAttribute("target", "_blank");
    expect(paypalLink).toHaveAttribute("rel", "noopener");
    expect(paypalLink).toHaveClass("btn-primary");
  });

  it("renders multiple music items", async () => {
    mockFetchSuccess([
      { title: "Track A", videoId: "v1", description: "Desc A" },
      { title: "Track B", videoId: "v2", description: "Desc B" },
      { title: "Track C", videoId: "v3", description: "Desc C" },
    ]);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Track A")).toBeInTheDocument();
      expect(screen.getByText("Track B")).toBeInTheDocument();
      expect(screen.getByText("Track C")).toBeInTheDocument();
    });
  });
});
