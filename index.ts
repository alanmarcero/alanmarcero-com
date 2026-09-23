import type { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";

const YOUTUBE_PLAYLIST_ID = "PLjHbhxiY56y28ezRPYzMi3lzV3nMQt-1c";
const MAX_PLAYLIST_RESULTS = 50;

// Every response carries the cache header, failures included — a 500 that
// CloudFront will not cache turns an upstream outage into a Lambda stampede.
const RESPONSE_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=300",
};
const FETCH_FAILED = { error: "YouTube Fetch Failed" };

interface YouTubeRes {
  items?: {
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

export interface MusicItem {
  title: string;
  videoId: string;
}

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

const jsonResponse = (statusCode: number, body: unknown): APIGatewayProxyResult => ({
  statusCode,
  headers: RESPONSE_HEADERS,
  body: JSON.stringify(body),
});

export const buildPlaylistUrl = (apiKey: string): string =>
  `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${MAX_PLAYLIST_RESULTS}&playlistId=${YOUTUBE_PLAYLIST_ID}&key=${apiKey}`;

// A 200 body without `items` would otherwise throw here and escape as an
// uncached Lambda error, so it is read as an empty playlist instead.
export const toMusicItems = (playList: YouTubeRes): MusicItem[] =>
  (playList.items ?? []).map(item => ({
    title: item.snippet.title,
    videoId: item.snippet.resourceId.videoId,
  }));

export const handler = async (_event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return jsonResponse(500, { error: "Missing YOUTUBE_API_KEY" });

  const [fetchErr, response] = await asyncWrapper(fetch(buildPlaylistUrl(apiKey)));
  if (fetchErr || !response || !response.ok) return jsonResponse(500, FETCH_FAILED);

  const [parseErr, playList] = await asyncWrapper<YouTubeRes>(response.json());
  if (parseErr || !playList) return jsonResponse(500, FETCH_FAILED);

  return jsonResponse(200, { items: toMusicItems(playList) });
};
