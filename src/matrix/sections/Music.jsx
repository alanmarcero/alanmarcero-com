import { useEffect } from 'react';
import EnvelopeField from '../graphics/EnvelopeField';
import YouTubeFacade from '../YouTubeFacade';
import useMusic from '../hooks/useMusic';

const PENDING_ROWS = 3;

const matches = (query, ...fields) => {
  if (!query) return true;
  const needle = query.toLowerCase();
  return fields.some((field) => (field || '').toLowerCase().includes(needle));
};

/**
 * Releases and remixes, in the same plate language as the catalog above —
 * so the page reads as one instrument, not two sections bolted together.
 */
function Music({ searchQuery, onVisibleCountChange }) {
  const { items, loading, error } = useMusic();

  const visible = items.filter(
    (item) => matches(searchQuery, item.title, item.description),
  );

  useEffect(() => {
    onVisibleCountChange(visible.length);
  }, [visible.length, onVisibleCountChange]);

  return (
    <section className="music" aria-labelledby="music-heading">
      <div className="plate plate--head">
        <div className="shell plate__body">
          <div className="section-head">
            <h2 id="music-heading" className="section-title">Music and remixes</h2>
            <p className="legend legend--wide">YouTube · Spotify · Pandora</p>
          </div>
          {!loading && !error && visible.length > 0 && (
            <p className="section-stat">
              <span className="readout">{visible.length}</span> releases, made
              with the same patches.
            </p>
          )}
        </div>
      </div>

      {loading && Array.from({ length: PENDING_ROWS }, (_, row) => (
        <div key={row} className="plate">
          <div className="shell plate__body entry entry--pending" aria-hidden="true">
            <h3 className="entry__name">Loading</h3>
            <p className="entry__desc">Loading release details</p>
          </div>
        </div>
      ))}

      {loading && <p className="shell state" role="status">Loading releases…</p>}

      {error && (
        <div className="plate">
          <div className="shell plate__body">
            <p className="state state--error">
              The releases did not load. Reload the page to try again — the
              patch banks above are unaffected.
            </p>
          </div>
        </div>
      )}

      {!loading && !error && visible.length === 0 && searchQuery && (
        <div className="plate">
          <div className="shell plate__body">
            <p className="state">No releases match “{searchQuery}”.</p>
          </div>
        </div>
      )}

      {!loading && !error && visible.map((item, index) => (
        <article
          key={item.videoId}
          className={`plate ${index % 2 === 0 ? 'plate--raised' : ''}`}
        >
          <div className="plate__field">
            <EnvelopeField
              seed={item.title || item.videoId}
              count={96}
              aspect={4.2}
              cellWidth={9}
              cellHeight={7}
              gap={2}
            />
          </div>

          <div className="shell plate__body entry">
            <h3 className="entry__name">{item.title}</h3>
            {item.description && <p className="entry__desc">{item.description}</p>}

            <div className="entry__actions">
              <YouTubeFacade videoId={item.videoId} label={`Play ${item.title}`} />
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

export default Music;
