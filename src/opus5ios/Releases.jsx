import { useEffect } from 'react';
import Demo from './Demo';
import WaveTrace from './graphics/WaveTrace';
import FilterRule from './graphics/FilterRule';

const PENDING_ROWS = 4;
const trackNumber = (index) => String(index + 1).padStart(2, '0');

/**
 * The tracklist.
 *
 * Deliberately a different rhythm from the catalogue above it. A plate is
 * a reference entry you read one of; a tracklist is a run you read down.
 * So: tighter rows, four columns instead of three, and the wave drawn as
 * the printed silhouette a finished track has rather than the single-cycle
 * scope trace an oscillator has. Same ink, same rules, same sheet.
 */
function Releases({ items, loading, error, searchQuery, onVisibleCountChange }) {
  useEffect(() => {
    onVisibleCountChange?.(items.length);
  }, [items.length, onVisibleCountChange]);

  return (
    <section className="releases sheet" aria-labelledby="releases-heading">
      <FilterRule cutoff={2400} q={5.5} label="Fig. 2 — low-pass, 12 dB/oct" />

      <div className="section-head">
        <h2 id="releases-heading" className="section-title">Music and remixes</h2>
        <p className="legend">YouTube &middot; Spotify &middot; Pandora</p>
      </div>

      <p className="section-note prose">
        Made with the same patches the catalogue gives away.
      </p>

      {loading && (
        <>
          <p className="state" role="status">Loading releases&hellip;</p>
          <ul aria-hidden="true">
            {Array.from({ length: PENDING_ROWS }, (_, row) => (
              <li key={row} className="track track--pending">
                <span className="track__index">{trackNumber(row)}</span>
                <span className="track__title">&mdash;</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {error && (
        <p className="state state--error">
          The releases did not load. Reload the page to try again &mdash; the
          patch banks above are unaffected.
        </p>
      )}

      {!loading && !error && items.length === 0 && searchQuery && (
        <p className="state">No releases match &ldquo;{searchQuery}&rdquo;.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <ul>
          {items.map((item, index) => (
            <li className="track" key={item.videoId}>
              <span className="track__index">{trackNumber(index)}</span>

              <div>
                <h3 className="track__title">{item.title}</h3>
                {item.description && (
                  <p className="track__desc">{item.description}</p>
                )}
              </div>

              <WaveTrace
                seed={item.title || item.videoId}
                variant="silhouette"
                cycles={5}
                className="track__trace"
              />

              <Demo
                videoId={item.videoId}
                cue="Play"
                label={`Play ${item.title}`}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default Releases;
