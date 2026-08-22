import { useEffect } from 'react';
import SpectrumBars from '../graphics/SpectrumBars';
import YouTubeFacade from '../YouTubeFacade';
import useMusic from '../hooks/useMusic';
import { matchesQuery } from '../lib/catalog';

const PENDING_ROWS = 4;

/**
 * Releases and remixes.
 *
 * Deliberately NOT the catalogue's language. The catalogue is a reference
 * shelf — wide plates, alternating grounds, a machine per row, built for
 * finding the instrument you already own. This is a listening list: one
 * continuous ground, a tighter rhythm, and a spectrum instead of an
 * envelope field, because a release is energy over time and not a bank of
 * 128 patches.
 *
 * Same palette, same type, same building. A different room in it.
 */
function Music({ searchQuery, onVisibleCountChange }) {
  const { items, loading, error } = useMusic();

  const visible = items.filter(
    (item) => matchesQuery(searchQuery, item.title, item.description),
  );

  // `null` means "not known yet", NOT "none". While the fetch is in flight
  // -- or after it fails -- there is no true count to report, and the hero
  // publishes this number to a live region. Reporting 0 here made the page
  // announce "11 banks, 0 releases" on every cold load, stating a false
  // count as fact. See the contract in dispatch/in-progress/amc-r2-S3-music.md.
  const settled = !loading && !error;

  useEffect(() => {
    onVisibleCountChange(settled ? visible.length : null);
  }, [settled, visible.length, onVisibleCountChange]);

  return (
    <section className="music" aria-labelledby="music-heading">
      <div className="shell music__head">
        <div className="section-head">
          <h2 id="music-heading" className="section-title">Music and remixes</h2>
          <p className="legend legend--wide">YouTube · Spotify · Pandora</p>
        </div>
        {!loading && !error && visible.length > 0 && (
          <p className="section-stat">
            <span className="readout">{visible.length}</span>
            {visible.length === 1 ? ' release' : ' releases'}, made with the
            same patches.
          </p>
        )}
      </div>

      <div className="shell">
        {loading && (
          <>
            <p className="state" role="status">Loading releases…</p>
            <ul className="tracklist" aria-hidden="true">
              {Array.from({ length: PENDING_ROWS }, (_, row) => (
                <li key={row} className="track track--pending">
                  <span className="track__title">Loading</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {error && (
          <p className="state state--error">
            The releases did not load. Reload the page to try again — the
            patch banks above are unaffected.
          </p>
        )}

        {!loading && !error && visible.length === 0 && searchQuery && (
          <p className="state">No releases match “{searchQuery}”.</p>
        )}

        {!loading && !error && visible.length > 0 && (
          <ul className="tracklist">
            {visible.map((item) => (
              <li key={item.videoId} className="track">
                <SpectrumBars
                  seed={item.title || item.videoId}
                  className="track__spectrum"
                />

                <h3 className="track__title">{item.title}</h3>

                {item.description && (
                  <p className="track__desc">{item.description}</p>
                )}

                <div className="track__action">
                  <YouTubeFacade
                    videoId={item.videoId}
                    cue="Play"
                    label={`Play ${item.title}`}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default Music;
