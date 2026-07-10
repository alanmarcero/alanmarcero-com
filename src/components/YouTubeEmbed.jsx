import { useState } from 'react';

const thumbnailUrl = (videoId) => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

/**
 * Click-to-load YouTube facade. Until the visitor activates it, only a
 * lightweight thumbnail and a play button render — no iframe — so the ~1MB+
 * YouTube player and its scripts never load for videos nobody watches. On click
 * the real embed replaces the facade and autoplays.
 *
 * `width`/`height` are kept for API compatibility; card CSS drives the actual
 * 16:9 sizing for both the facade and the iframe.
 */
function YouTubeEmbed({ videoId, title = 'YouTube video', width = '100%', height = '220px' }) {
  const [activated, setActivated] = useState(false);

  if (activated) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
        title={title}
        width={width}
        height={height}
        loading="lazy"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation allow-top-navigation-by-user-activation"
      />
    );
  }

  return (
    <button
      type="button"
      className="yt-facade"
      onClick={() => setActivated(true)}
      aria-label={`Play video: ${title}`}
    >
      <img
        className="yt-facade__thumb"
        src={thumbnailUrl(videoId)}
        alt=""
        loading="lazy"
        width="480"
        height="360"
      />
      <span className="yt-facade__play" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </button>
  );
}

export default YouTubeEmbed;
