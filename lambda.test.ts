import { handler } from "./lambda";
import type { APIGatewayEvent } from "aws-lambda";

beforeAll(() => {
  global.fetch = jest.fn();
});

const mockEvent: Partial<APIGatewayEvent> = {
  httpMethod: "GET",
  path: "/",
};

describe("handler", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns 500 on fetch error", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("network down"));

    const result = await handler(mockEvent as APIGatewayEvent);

    expect(result.statusCode).toBe(500);
    expect(result.headers).toEqual({ "Content-Type": "application/json" });
    expect(result.body).toContain("network down");
  });

  it("returns 500 when YouTube API returns non-ok response", async () => {
    const mockResponse = {
      ok: false,
      status: 403,
      statusText: "Forbidden",
      json: async () => ({}),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const result = await handler(mockEvent as APIGatewayEvent);

    expect(result.statusCode).toBe(500);
    expect(result.headers).toEqual({ "Content-Type": "application/json" });
    expect(result.body).toContain("YouTube Fetch Failed");
  });

  it("returns 500 on json parse error", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => {
        throw new Error("invalid json");
      },
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const result = await handler(mockEvent as APIGatewayEvent);

    expect(result.statusCode).toBe(500);
    expect(result.headers).toEqual({ "Content-Type": "application/json" });
    expect(result.body).toContain("invalid json");
  });

  it("returns 200 with mapped playlist", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({
        items: [
          {
            snippet: {
              title: "Test Video",
              publishedAt: "2025-01-01T00:00:00Z",
              thumbnails: { medium: { url: "http://thumb/1.jpg" } },
              resourceId: { videoId: "abc123" },
            },
          },
        ],
      }),
    });

    const result = await handler(mockEvent as APIGatewayEvent);
    expect(result.statusCode).toBe(200);
    expect(result.headers).toEqual({ "Content-Type": "application/json" });

    const body = JSON.parse(result.body);
    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toEqual({
      title: "Test Video",
      videoId: "abc123",
      publishedAt: "2025-01-01T00:00:00Z",
      thumbnail: "http://thumb/1.jpg",
    });
  });

  it("handles missing thumbnails gracefully", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({
        items: [
          {
            snippet: {
              title: "No Thumb Video",
              publishedAt: "2025-06-01T00:00:00Z",
              resourceId: { videoId: "noThumb1" },
            },
          },
        ],
      }),
    });

    const result = await handler(mockEvent as APIGatewayEvent);
    const body = JSON.parse(result.body);

    expect(body.items[0].thumbnail).toBeUndefined();
    expect(body.items[0].title).toBe("No Thumb Video");
  });

  it("maps multiple playlist items", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({
        items: [
          {
            snippet: {
              title: "Video A",
              publishedAt: "2025-01-01T00:00:00Z",
              thumbnails: { medium: { url: "http://thumb/a.jpg" } },
              resourceId: { videoId: "vidA" },
            },
          },
          {
            snippet: {
              title: "Video B",
              publishedAt: "2025-02-01T00:00:00Z",
              thumbnails: { medium: { url: "http://thumb/b.jpg" } },
              resourceId: { videoId: "vidB" },
            },
          },
        ],
      }),
    });

    const result = await handler(mockEvent as APIGatewayEvent);
    const body = JSON.parse(result.body);

    expect(body.items).toHaveLength(2);
    expect(body.items[0].videoId).toBe("vidA");
    expect(body.items[1].videoId).toBe("vidB");
  });

  it("constructs API URL with playlist ID and API key", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("irrelevant"));

    await handler(mockEvent as APIGatewayEvent);

    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain("googleapis.com/youtube/v3/playlistItems");
    expect(calledUrl).toContain("playlistId=PLjHbhxiY56y28ezRPYzMi3lzV3nMQt-1c");
    expect(calledUrl).toContain("maxResults=50");
  });
});
