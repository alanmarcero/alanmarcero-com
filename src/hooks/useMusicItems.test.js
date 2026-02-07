/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import useMusicItems from "./useMusicItems";

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

    renderHook(() => useMusicItems());

    expect(global.fetch).toHaveBeenCalledWith(
      "/api"
    );
  });
});
