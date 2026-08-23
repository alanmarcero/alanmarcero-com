import { YOUTUBE_CHANNEL_URL, GITHUB_URL } from '../../../src/config';
import { credits } from './data/plates';
import Line from './Line';

/**
 * The imprint — who published this, where else it lives, and where the
 * photographs came from.
 */
function Imprint() {
  return (
    <footer className="imprint">
      <div className="page">
        <div className="imprint__grid">
          <div>
            <p className="gloss">Published by</p>
            <p className="imprint__mark">Alan Marcero</p>
            <p className="imprint__note">
              Patch banks, music, and twelve machines written from scratch.
            </p>
          </div>

          <nav aria-label="Elsewhere">
            <p className="gloss">Elsewhere</p>
            <div className="imprint__links">
              <Line as="a" value="Channel" href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                YouTube
              </Line>
              <Line as="a" value="Source" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                GitHub
              </Line>
              <Line as="a" value="12 machines" href="/opus-max-mac-arcade">
                Arcade
              </Line>
            </div>
          </nav>

          {/*
            CC BY and CC BY-SA are conditional licences: permission to use these
            photographs depends on crediting the photographer and naming the
            licence. This block is that condition being met, not a courtesy — if
            it goes, the photographs go with it.
          */}
          <div>
            <p className="gloss">
              {/* Plates, not instruments: eight photographs cover far more than
                  eight machines — one bank alone names four. */}
              Photographs · {credits.length} plates · Wikimedia Commons
            </p>
            <ul className="credits">
              {credits.map((credit) => (
                <li className="credits__item" key={credit.slug}>
                  <span className="credits__subject">{credit.bank}</span>
                  {' — '}
                  {credit.author}
                  {', '}
                  {credit.licenceUrl ? (
                    <a className="link" href={credit.licenceUrl} rel="license noopener noreferrer" target="_blank">
                      {credit.licence}
                    </a>
                  ) : (
                    <span>{credit.licence}</span>
                  )}
                  {credit.source && (
                    <>
                      {' · '}
                      <a className="link" href={credit.source} rel="noopener noreferrer" target="_blank">
                        source
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="imprint__fine">
          <p className="gloss gloss--quiet">Set throughout in Spectral</p>
          <p className="gloss gloss--quiet">Figures computed from the data on this page</p>
          <p className="gloss gloss--quiet">© {new Date().getFullYear()} Alan Marcero</p>
        </div>
      </div>
    </footer>
  );
}

export default Imprint;
