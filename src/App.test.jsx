/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import App from "./App";
import { LAMBDA_URL, TOAST_DISMISS_MS } from "./config";

global.fetch = jest.fn();

let intersectionCallback;
global.IntersectionObserver = jest.fn((callback) => {
  intersectionCallback = callback;
  return {
    observe: jest.fn(),
    disconnect: jest.fn(),
  };
});

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

  it("shows skeleton cards while fetching music", () => {
    global.fetch.mockImplementationOnce(() => new Promise(() => {}));
    const { container } = render(<App />);

    const skeletons = container.querySelectorAll(".skeleton-card");
    expect(skeletons.length).toBe(3);
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

  it("fetches from LAMBDA_URL on mount", () => {
    mockFetchSuccess();
    render(<App />);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      LAMBDA_URL,
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("hides skeleton cards after successful fetch", async () => {
    mockFetchSuccess([
      { title: "Track 1", videoId: "v1", description: "" },
    ]);
    const { container } = render(<App />);

    await waitFor(() => {
      expect(container.querySelectorAll(".skeleton-card").length).toBe(0);
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

  it("shows no-results message when search yields nothing", async () => {
    mockFetchSuccess([]);
    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText(/No results for/)).not.toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search patches and music...");
    fireEvent.change(searchInput, { target: { value: "xyznonexistent" } });

    await waitFor(() => {
      expect(screen.getByText(/No results for/)).toBeInTheDocument();
      expect(screen.getByText(/xyznonexistent/)).toBeInTheDocument();
    });
  });

  it("handles missing data.items gracefully", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText("Unable to load music")).not.toBeInTheDocument();
    });
  });

  it("does not show no-results while still loading", () => {
    global.fetch.mockImplementationOnce(() => new Promise(() => {}));
    render(<App />);

    const searchInput = screen.getByPlaceholderText("Search patches and music...");
    fireEvent.change(searchInput, { target: { value: "xyznonexistent" } });

    expect(screen.queryByText(/No results for/)).not.toBeInTheDocument();
  });

  it("hides skeleton cards after fetch error", async () => {
    global.fetch.mockRejectedValueOnce(new Error("fail"));
    const { container } = render(<App />);

    await waitFor(() => {
      expect(container.querySelectorAll(".skeleton-card").length).toBe(0);
    });
  });

  it("filters music items by description field", async () => {
    mockFetchSuccess([
      { title: "Track One", videoId: "v1", description: "ambient pads" },
      { title: "Track Two", videoId: "v2", description: "hard trance" },
    ]);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Track One")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search patches and music...");
    fireEvent.change(searchInput, { target: { value: "ambient" } });

    await waitFor(() => {
      expect(screen.getByText("Track One")).toBeInTheDocument();
      expect(screen.queryByText("Track Two")).not.toBeInTheDocument();
    });
  });

  it("passes card-index style to patch bank items", async () => {
    mockFetchSuccess();
    const { container } = render(<App />);

    await waitFor(() => {
      const card = container.querySelector(".store-item");
      expect(card.style.getPropertyValue("--card-index")).toBe("0");
    });
  });

  it("does not show error and skeleton at the same time", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Network error"));
    const { container } = render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Unable to load music. Please try again later.")).toBeInTheDocument();
      expect(container.querySelectorAll(".skeleton-card").length).toBe(0);
    });
  });

  it("sections start with scroll-reveal class", () => {
    mockFetchSuccess();
    const { container } = render(<App />);

    const sections = container.querySelectorAll(".scroll-reveal");
    expect(sections.length).toBe(2);
  });

  it("sections gain scroll-reveal--visible when intersected", () => {
    mockFetchSuccess();
    const { container } = render(<App />);

    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });

    const visibleSections = container.querySelectorAll(".scroll-reveal--visible");
    expect(visibleSections.length).toBeGreaterThan(0);
  });

  it("shows toast when download button is clicked", async () => {
    mockFetchSuccess();
    render(<App />);

    const downloadBtn = screen.getByText("Download");
    fireEvent.click(downloadBtn);

    expect(screen.getByText("Downloading now...")).toBeInTheDocument();
  });

  it("toast auto-dismisses after timeout", async () => {
    jest.useFakeTimers();
    mockFetchSuccess();
    render(<App />);

    const downloadBtn = screen.getByText("Download");
    fireEvent.click(downloadBtn);
    expect(screen.getByText("Downloading now...")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(TOAST_DISMISS_MS);
    });

    expect(screen.queryByText("Downloading now...")).not.toBeInTheDocument();
    jest.useRealTimers();
  });

});
