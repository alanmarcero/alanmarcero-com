import { useState } from 'react';
import Line from './Line';

/**
 * A video that only becomes a player once someone asks for it, and stops
 * being one when they are done.
 *
 * Nothing from youtube.com loads until the click, so eleven banks with twelve
 * demos between them, plus every release in the log, cost no third-party
 * requests on arrival.
 *
 * The cue is a register line like every other instruction on the page, not a
 * thumbnail: a thumbnail is a filled rectangle, and this design has no filled
 * rectangles in it.
 *
 * Returns a fragment rather than a wrapper, so a caller laying its row out on
 * a grid can place the cue and the screen in two different cells.
 *
 * `label` is the whole instruction ("Hear the Nord Lead 3 bank"); `subject` is
 * the thing on its own, because "Stop " + label would announce two verbs.
 */
function Eyepiece({ videoId, label, subject = label, cue = 'Hear it', value }) {
  const [playing, setPlaying] = useState(false);

  return (
    <>
      <Line
        as="button"
        className="act--quiet"
        value={value}
        onClick={() => setPlaying((wasPlaying) => !wasPlaying)}
        aria-label={playing ? `Stop ${subject}` : label}
        aria-expanded={playing}
      >
        {playing ? 'Stop' : cue}
      </Line>

      {playing && (
        <div className="eyepiece">
          {/* Sandboxed to the site's documented standard for YouTube frames —
              see the Security section of CLAUDE.md. */}
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title={label}
            sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </>
  );
}

export default Eyepiece;
