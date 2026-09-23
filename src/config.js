export const LAMBDA_URL = '/api';
export const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/alanmarcero';
export const GITHUB_URL = 'https://github.com/alanmarcero';

// Every YouTube player on every page loads under the same policy. Popups must
// escape the sandbox or "Watch on YouTube" opens a youtube.com that cannot run.
export const YOUTUBE_EMBED_SANDBOX =
  'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation allow-top-navigation-by-user-activation';
export const YOUTUBE_EMBED_ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
export const SCROLL_THRESHOLD = 400;
export const TOAST_DISMISS_MS = 2500;
