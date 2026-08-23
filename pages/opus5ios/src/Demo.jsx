import { useState } from 'react';

/**
 * A demo that only becomes a player once someone asks for it — nothing
 * from youtube.com loads until the click, so eleven banks with fourteen
 * demos between them cost no third-party requests on load.
 *
 * The cue is set as an action like every other instruction on the sheet,
 * not as a thumbnail: a thumbnail is a filled rectangle, and there are no
 * filled rectangles here. Supplying a stop label keeps that cue in place so
 * the player can be removed again; without one, the original one-way facade
 * remains unchanged.
 */
function Demo({ videoId, label, cue = 'Hear it', onOpen, stopLabel }) {
  const [playing, setPlaying] = useState(false);

  const player = (
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

  if (playing && !stopLabel) {
    return player;
  }

  const toggle = () => {
    if (!playing) onOpen?.();
    setPlaying((wasPlaying) => !wasPlaying);
  };

  return (
    <>
      <button
        type="button"
        className="action action--play action--quiet"
        onClick={toggle}
        aria-label={playing ? stopLabel : label}
        aria-expanded={stopLabel ? playing : undefined}
      >
        {playing ? 'Stop' : cue}
      </button>
      {playing && player}
    </>
  );
}

export default Demo;
