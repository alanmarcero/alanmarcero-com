/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import MusicPage from "./MusicPage";
import { LAMBDA_URL } from "../config";

describe("MusicPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.replaceState(null, "", "/music");
    global.fetch = jest.fn();
  });

  const mockFetchSuccess = (items = []) => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items }),
    });
  };

  it("shows skeleton cards while fetching", () => {
    global.fetch.mockImplementationOnce(() => new Promise(() => {}));
    const { container } = render(<MusicPage />);
    expect(container.querySelectorAll(".skeleton-card").length).toBe(3);
  });

  it("shows an error when the fetch fails and hides the skeletons", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Network error"));
    const { container } = render(<MusicPage />);

    await waitFor(() => {
      expect(screen.getByText("Unable to load music. Please try again later.")).toBeInTheDocument();
      expect(container.querySelectorAll(".skeleton-card").length).toBe(0);
    });
  });

  it("fetches from LAMBDA_URL and renders the tracks", async () => {
    mockFetchSuccess([
      { title: "Track A", videoId: "v1", description: "ambient pads" },
      { title: "Track B", videoId: "v2", description: "hard trance" },
    ]);
    render(<MusicPage />);

    expect(global.fetch).toHaveBeenCalledWith(
      LAMBDA_URL,
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );

    await waitFor(() => expect(screen.getByText("Track A")).toBeInTheDocument());
    expect(screen.getByText("Track B")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search music..."), { target: { value: "ambient" } });
    expect(screen.getByText("Track A")).toBeInTheDocument();
    expect(screen.queryByText("Track B")).not.toBeInTheDocument();
  });

  it("does not show no-results while loading, then shows it when nothing matches", async () => {
    let resolveFetch;
    global.fetch.mockImplementationOnce(() => new Promise((resolve) => {
      resolveFetch = resolve;
    }));
    render(<MusicPage />);

    fireEvent.change(screen.getByPlaceholderText("Search music..."), { target: { value: "zzz" } });
    expect(screen.queryByText(/No signal for/)).not.toBeInTheDocument();

    resolveFetch({ ok: true, json: async () => ({ items: [] }) });
    await waitFor(() => expect(screen.getByText(/No signal for/)).toBeInTheDocument());
  });

  it("hydrates ?q= and restores it on popstate", async () => {
    window.history.replaceState(null, "", "/music?q=trance");
    mockFetchSuccess([{ title: "Trance Track", videoId: "v1", description: "" }]);
    render(<MusicPage />);

    const search = screen.getByLabelText("Search music");
    expect(search).toHaveValue("trance");

    await waitFor(() => expect(screen.getByText("Trance Track")).toBeInTheDocument());

    fireEvent.change(search, { target: { value: "abc" } });
    await waitFor(() => expect(window.location.search).toBe("?q=abc"));

    window.history.replaceState(null, "", "/music?q=xyz");
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(search).toHaveValue("xyz");
  });
});
