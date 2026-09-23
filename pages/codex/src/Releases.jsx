import WaveTrace from '../../opus5ios/src/graphics/WaveTrace.jsx';
import Demo from '../../opus5ios/src/Demo';
import { ordinal } from '../../matrix/src/lib/format';

function Releases({ items, loading, error, query }) {
  return (
    <section className="codex-releases" id="releases" aria-labelledby="codex-releases-title">
      <div className="codex-shell">
        <div className="codex-section-head">
          <h2 id="codex-releases-title">Music and remixes</h2>
          <p className="codex-label">YouTube · Spotify · Pandora</p>
        </div>
        {loading && <p className="codex-state" role="status">Loading releases…</p>}
        {error && (
          <p className="codex-state" role="status">
            The releases did not load. The patch banks above are unaffected.
          </p>
        )}
        {!loading && !error && items.length === 0 && (
          <p className="codex-state" role="status">
            {query ? `No releases match “${query}”.` : 'No releases are listed just now.'}
          </p>
        )}

        {!loading && !error && items.length > 0 && (
          <ol className="codex-tracks">
            {items.map((item, index) => (
              <li className="codex-track" key={item.videoId}>
                <span className="codex-track__index">{ordinal(index)}</span>
                <h3>{item.title}</h3>
                <WaveTrace
                  seed={item.title || item.videoId}
                  variant="silhouette"
                  cycles={5}
                  className="codex-track__trace"
                />
                <Demo
                  videoId={item.videoId}
                  cue="Play"
                  label={`Play ${item.title}`}
                  stopLabel={`Stop ${item.title}`}
                />
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

export default Releases;
