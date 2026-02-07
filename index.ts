import type { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";

const YOUTUBE_PLAYLIST_ID = "PLjHbhxiY56y28ezRPYzMi3lzV3nMQt-1c";
const MAX_PLAYLIST_RESULTS = 50;

const asyncWrapper = async function <T>(
  promise: Promise<T>
): Promise<[Error | null, T | undefined]> {
  try {
    const data = await promise;
    return [null, data];
  } catch (err) {
    return [err instanceof Error ? err : new Error(String(err)), undefined];
  }
};

interface YouTubeRes {
  items: {
    snippet: {
      title: string;
      publishedAt: string;
      thumbnails?: {
        medium?: { url: string };
      };
      resourceId: { videoId: string };
    };
  }[];
}

export const handler = async (_event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey)
    return { statusCode: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Missing YOUTUBE_API_KEY" }) };

  const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${MAX_PLAYLIST_RESULTS}&playlistId=${YOUTUBE_PLAYLIST_ID}&key=${apiKey}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=300",
  };

  const [fetchErr, response] = await asyncWrapper(fetch(apiUrl));
  if (fetchErr || !response || !response.ok)
    return { statusCode: 500, headers, body: JSON.stringify({ error: "YouTube Fetch Failed" }) };

  const [parseErr, playList] = await asyncWrapper<YouTubeRes>(response.json());
  if (parseErr || !playList)
    return { statusCode: 500, headers, body: JSON.stringify({ error: "YouTube Fetch Failed" }) };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      items: playList.items.map(item => ({
        title: item.snippet.title,
        videoId: item.snippet.resourceId.videoId,
      })),
    }),
  };
};