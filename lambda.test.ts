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
    console.log(result);

    expect(result.statusCode).toBe(500);
    expect(result.body).toContain("network down");
  });

  it("returns 403", async () => {
    const mockResponse = {
      ok: false,
      status: 403,
      statusText: "Forbidden",
      json: async () => ({}),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const result = await handler(mockEvent as APIGatewayEvent);

    expect(result.statusCode).toBe(403);
    expect(result.body).toContain("Forbidden");
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

    const body = JSON.parse(result.body);
    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toEqual({
      title: "Test Video",
      videoId: "abc123",
      publishedAt: "2025-01-01T00:00:00Z",
      thumbnail: "http://thumb/1.jpg",
    });
  });
});
