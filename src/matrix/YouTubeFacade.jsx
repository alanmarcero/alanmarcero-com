import { useState } from 'react';

/**
 * A demo that only becomes a player once someone asks for it. Nothing from
 * youtube.com loads until the click.
 *
 * Deliberately not a thumbnail: a thumbnail is a filled rectangle, and a
 * filled rectangle on this page is a card. The cue is a legend like every
 * other action, and the player replaces it in place.
 */
function YouTubeFacade({ videoId, label, cue = 'Hear it' }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="player">
        <iframe
          className="player__frame"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title={label}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className="action action--quiet"
      onClick={() => setPlaying(true)}
      aria-label={label}
    >
      {cue}
    </button>
  );
}

export default YouTubeFacade;
