import type { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";

const asyncWrapper = async function <T>(
  promise: Promise<T>
): Promise<[Error | null, T | undefined]> {
  try {
    const data = await promise;
    return [null, data];
  } catch (err) {
    return [err as Error, undefined];
  }
};

const apiKey = process.env.YOUTUBE_API_KEY;
const playlistId = "PLjHbhxiY56y28ezRPYzMi3lzV3nMQt-1c";

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;

  const [fetchErr, response] = await asyncWrapper(fetch(apiUrl));
  if (fetchErr || !response || !response.ok)
    return { statusCode: 500, body: JSON.stringify({ error: "YouTube Fetch Failed", details: fetchErr?.message }) };

  const [parseErr, playList] = await asyncWrapper<YouTubeRes>(response.json());
  if (parseErr || !playList)
    return { statusCode: 500, body: JSON.stringify({ error: `Parse Failed: ${parseErr?.message}` }) }

  return {
    statusCode: 200,
    body: JSON.stringify({
      items: playList.items.map(item => ({
        title: item.snippet.title,
        videoId: item.snippet.resourceId.videoId,
        publishedAt: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails?.medium?.url,
      })),
    }),
  };
};