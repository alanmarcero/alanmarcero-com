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
  if (fetchErr || !response) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch from YouTube", details: fetchErr?.message }),
    };
  }

  if (!response.ok) {
    return {
      statusCode: response.status,
      body: JSON.stringify({ error: `Failed at fetching: ${response.statusText}` })
    };
  }

  const [parseErr, data] = await asyncWrapper<YouTubeRes>(response.json());
  if (parseErr || !data) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Failed at parsing: ${parseErr?.message}` })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      items: data.items.map(item => ({
        title: item.snippet.title,
        videoId: item.snippet.resourceId.videoId,
        publishedAt: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails?.medium?.url,
      })),
    }),
  };
};