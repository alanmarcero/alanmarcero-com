import { isRemix } from '../utils/trackMeta';
import Line from './Line';
import Eyepiece from './Eyepiece';

/**
 * The log — the tracks, in the order the playlist returns them.
 *
 * A tighter rhythm than the register, because there are four times as many of
 * them and each one holds far less: the API gives a title and a video id and
 * nothing else. So the only thing a row can honestly claim beyond its title is
 * whether the title says "remix", and that is the only thing it claims.
 */
function Tracklist({ tracks, loading, error, query }) {
  const number = (index) => String(index + 1).padStart(2, '0');

  return (
    <section className="tracklist" aria-labelledby="tracklist-title">
      <div className="page">
        <div className="section-head">
          <h2 className="section-title" id="tracklist-title">Releases</h2>
          <p className="gloss">
            Log{tracks.length ? ` · ${tracks.length} entries` : ''} · YouTube
          </p>
        </div>

        <p className="section-note prose">
          Originals and remixes. Each one opens where it is, and nothing loads from
          YouTube until you ask it to.
        </p>

        {loading && <p className="state" role="status">Reading the log…</p>}

        {error && (
          <p className="state" role="status">
            The log could not be read just now. The tracks are all on{' '}
            <a className="link" href="https://www.youtube.com/alanmarcero" target="_blank" rel="noopener noreferrer">
              YouTube
            </a>.
          </p>
        )}

        {/*
          The empty state is announced like the other two. Without the live
          region a screen-reader user hears "Reading the log…", then that region
          is replaced by a plain paragraph and they are never told what came of
          it.
        */}
        {!loading && !error && tracks.length === 0 && (
          <p className="state" role="status">
            {query
              ? `Nothing in the log matches “${query}”.`
              : 'The log is empty just now.'}
          </p>
        )}

        {tracks.length > 0 && (
          <ol className="tracklist__rows">
            {tracks.map((track, index) => (
              <li className="track" key={track.videoId}>
                <p className="track__index gloss gloss--quiet">{number(index)}</p>

                <h3 className="track__title">
                  <Line value={isRemix(track.title) ? 'Remix' : 'Original'}>
                    {track.title}
                  </Line>
                </h3>

                <Eyepiece
                  videoId={track.videoId}
                  value="Video"
                  cue="Play"
                  label={`Play ${track.title}`}
                  subject={track.title}
                />
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

export default Tracklist;
