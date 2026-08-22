import { useEffect } from 'react';
import SpectrumBars from '../graphics/SpectrumBars';
import YouTubeFacade from '../YouTubeFacade';
import useMusic, { parseRelease, groupByWork } from '../hooks/useMusic';
import { matchesQuery } from '../lib/catalog';
import './music.css';

const PENDING_WORKS = 3;

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
 *
 * What changed in r3: this was nine rows of title-plus-PLAY, every one
 * exactly 63px, because the API returns only `title` and `videoId` and the
 * design had nothing else to render. The structure was never missing — it
 * was unparsed. Those nine rows are six works, three of which have a second
 * version, and a title like "Sean Tyas - Melbourne (Alan-M Remix)" says who
 * made it, what it is, and whose hands were on this take. So a row is now a
 * WORK, its takes sit beneath it, and height follows content instead of
 * being uniform by construction. See `hooks/useMusic.js` for the parse.
 */
function Music({ searchQuery, onVisibleCountChange }) {
  const { items, loading, error } = useMusic();

  // Parse first, then filter, then group — so a search that matches one
  // take shows its work carrying only that take, rather than hiding the
  // work or showing takes nobody asked for.
  const releases = items.map(parseRelease);
  const visible = releases.filter((release) => matchesQuery(
    searchQuery,
    release.title,
    release.artists,
    release.work,
    release.version,
  ));
  const works = groupByWork(visible);

  // `null` means "not known yet", NOT "none". While the fetch is in flight
  // -- or after it fails -- there is no true count to report, and the hero
  // publishes this number to a live region. Reporting 0 here made the page
  // announce "11 banks, 0 releases" on every cold load, stating a false
  // count as fact.
  //
  // The number reported is RELEASES, not works. The hero says "releases",
  // and grouping is a presentation choice that must not silently redefine
  // a count another component speaks aloud.
  const settled = !loading && !error;

  useEffect(() => {
    onVisibleCountChange(settled ? visible.length : null);
  }, [settled, visible.length, onVisibleCountChange]);

  const takeCount = visible.length;
  const workCount = works.length;

  return (
    <section className="music" aria-labelledby="music-heading">
      <div className="shell music__head">
        <div className="section-head">
          <h2 id="music-heading" className="section-title">Music and remixes</h2>
          <p className="legend legend--wide">YouTube · Spotify · Pandora</p>
        </div>
        {settled && takeCount > 0 && (
          <p className="section-stat">
            <span className="readout">{takeCount}</span>
            {takeCount === 1 ? ' release' : ' releases'}
            {workCount !== takeCount && (
              <>
                {' across '}
                <span className="readout">{workCount}</span>
                {workCount === 1 ? ' work' : ' works'}
              </>
            )}
            , made with the same patches.
          </p>
        )}
      </div>

      <div className="shell">
        {loading && (
          <>
            <p className="state" role="status">Loading releases…</p>
            <ul className="worklist" aria-hidden="true">
              {Array.from({ length: PENDING_WORKS }, (_, row) => (
                <li key={row} className="work work--pending">
                  <div className="work__id">
                    <p className="work__artists">Loading</p>
                    <h3 className="work__title">Loading release</h3>
                  </div>
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

        {/* Two different emptinesses. A search that matched nothing is the
            reader's doing and says so; an empty list from a successful fetch
            is the site's, and used to render as nothing at all — a section
            head floating above blank ground. */}
        {settled && takeCount === 0 && searchQuery && (
          <p className="state">No releases match “{searchQuery}”.</p>
        )}

        {settled && takeCount === 0 && !searchQuery && (
          <p className="state">
            No releases are listed right now. The patch banks above are
            unaffected.
          </p>
        )}

        {settled && takeCount > 0 && (
          <ul className="worklist">
            {works.map((group) => (
              <li
                key={group.key}
                className={`work${group.versions.length > 1 ? ' work--multi' : ''}`}
              >
                <SpectrumBars seed={group.work} className="work__spectrum" />

                <div className="work__id">
                  {group.artists && (
                    <p className="work__artists">{group.artists}</p>
                  )}
                  <h3 className="work__title">{group.work}</h3>
                </div>

                <ul className="takes">
                  {group.versions.map((take) => (
                    <li key={take.videoId} className={`take take--${take.role}`}>
                      <span className="take__version">
                        {take.isOriginal ? 'Original' : take.version}
                      </span>
                      {take.role === 'remixer' && (
                        <span className="take__role">his remix</span>
                      )}
                      <span className="take__action">
                        <YouTubeFacade
                          videoId={take.videoId}
                          cue="Play"
                          label={`Play ${take.title}`}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default Music;
