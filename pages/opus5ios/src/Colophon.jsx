import { YOUTUBE_CHANNEL_URL, GITHUB_URL } from '../../../src/config';
import { credits } from './data/synthImages';

/**
 * The colophon — what a printed sheet puts at the foot: who made it, where
 * else it lives, and where the pictures came from.
 */
function Colophon() {
  return (
    <footer className="colophon">
      <div className="sheet">
        <div className="colophon__grid">
          <div>
            <p className="legend">Published by</p>
            <p className="colophon__mark">Alan Marcero</p>
            <p className="colophon__note">
              Patch banks are free to download and free to use in your own
              music.
            </p>
          </div>

          <nav aria-label="Elsewhere">
            <p className="legend">Elsewhere</p>
            <div className="colophon__links">
              <a className="action action--quiet" href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                YouTube
              </a>
              <a className="action action--quiet" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              <a className="action action--quiet" href="/opus5ios-arcade">
                Arcade
              </a>
            </div>
          </nav>

          {/*
            CC BY and CC BY-SA are conditional licences: the permission to
            use these photographs depends on crediting the photographer and
            naming the licence. This block is that condition being met, not
            a courtesy — if it goes, the images must go with it.
          */}
          <div>
            <p className="legend">
              Photographs &mdash; {credits.length} instruments, Wikimedia Commons
            </p>
            <ul className="credits__list">
              {credits.map((item) => (
                <li key={item.slug} className="credits__item">
                  <span className="credits__subject">{item.bank}</span>
                  {' — '}
                  {item.author}
                  {', '}
                  {item.licenceUrl ? (
                    <a className="credits__link" href={item.licenceUrl} rel="license noopener noreferrer" target="_blank">
                      {item.licence}
                    </a>
                  ) : (
                    <span>{item.licence}</span>
                  )}
                  {item.source && (
                    <>
                      {' · '}
                      <a className="credits__link" href={item.source} rel="noopener noreferrer" target="_blank">
                        source
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="colophon__fine">
          <p className="legend">Set in Instrument Serif, Inter Tight and Azeret Mono</p>
          <p className="legend">Figures drawn from the data on this page</p>
          <p className="legend">&copy; {new Date().getFullYear()} Alan Marcero</p>
        </div>
      </div>
    </footer>
  );
}

export default Colophon;
