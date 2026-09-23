/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import useMusicItems, { fetchMusicItems } from "./useMusicItems";

beforeAll(() => {
  global.fetch = jest.fn();
});

describe("useMusicItems", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns fetched music items after loading", async () => {
    const mockItems = [
      { title: "Song A", videoId: "a1" },
      { title: "Song B", videoId: "b2" },
    ];
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ items: mockItems }),
    });

    const { result } = renderHook(() => useMusicItems());

    await waitFor(() => expect(result.current.musicLoading).toBe(false));

    expect(result.current.musicItems).toEqual(mockItems);
    expect(result.current.musicError).toBeNull();
  });

  it("defaults to empty array when response has no items key", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useMusicItems());

    await waitFor(() => expect(result.current.musicLoading).toBe(false));

    expect(result.current.musicItems).toEqual([]);
  });

  it("reports HTTP status in error on non-ok response", async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 503 });

    const { result } = renderHook(() => useMusicItems());

    await waitFor(() => expect(result.current.musicLoading).toBe(false));

    expect(result.current.musicError).toBe("Failed to load music: 503");
    expect(result.current.musicItems).toEqual([]);
  });

  it("reports network error message on fetch rejection", async () => {
    global.fetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useMusicItems());

    await waitFor(() => expect(result.current.musicLoading).toBe(false));

    expect(result.current.musicError).toBe("Network error");
    expect(result.current.musicItems).toEqual([]);
  });

  it("fetches from the Lambda function URL", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });

    const { result } = renderHook(() => useMusicItems());

    expect(global.fetch).toHaveBeenCalledWith(
      "/api",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    await waitFor(() => expect(result.current.musicLoading).toBe(false));
  });

  it("ignores a response that lands after unmount", async () => {
    let resolveFetch;
    global.fetch.mockImplementation(() => new Promise((resolve) => { resolveFetch = resolve; }));

    const { result, unmount } = renderHook(() => useMusicItems());
    unmount();
    resolveFetch({ ok: true, json: async () => ({ items: [{ title: "Late", videoId: "l1" }] }) });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.musicLoading).toBe(true);
    expect(result.current.musicItems).toEqual([]);
  });
});

describe("fetchMusicItems", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("resolves to the response's items", async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ items: [{ title: "A", videoId: "a" }] }) });

    await expect(fetchMusicItems()).resolves.toEqual([{ title: "A", videoId: "a" }]);
  });

  it("rejects with the HTTP status on a non-ok response", async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 500 });

    await expect(fetchMusicItems()).rejects.toThrow("Failed to load music: 500");
  });
});
