import { YOUTUBE_CHANNEL_URL, GITHUB_URL } from '../config';
import { credits } from './data/synthImages';

/**
 * The end cheek. Walnut warmth, the two places the work actually lives,
 * and nothing else.
 */
function Footer() {
  return (
    <footer className="footer">
      <div className="shell footer__body">
        <p className="legend legend--wide">Alan Marcero</p>

        <nav className="footer__links" aria-label="Elsewhere">
          <a className="footer__link" href={YOUTUBE_CHANNEL_URL}>
            YouTube
          </a>
          <a className="footer__link" href={GITHUB_URL}>
            GitHub
          </a>
          <a className="footer__link" href="/matrix-arcade">
            Arcade
          </a>
        </nav>

        {/* CC BY and CC BY-SA are conditional licences: the permission to
            use these photographs depends on crediting the photographer and
            naming the licence. This block is that condition being met, not
            a courtesy — if it is removed the images must be removed too. */}
        <details className="credits">
          <summary className="legend credits__summary">
            Photo credits — {credits.length} instrument photographs
          </summary>
          <ul className="credits__list">
            {credits.map((item) => (
              <li key={item.slug} className="credits__item">
                <span className="credits__subject">{item.bank}</span>
                {' — photograph by '}
                <span className="credits__author">{item.author}</span>
                {', '}
                {item.licenceUrl ? (
                  <a className="credits__link" href={item.licenceUrl} rel="license noopener" target="_blank">
                    {item.licence}
                  </a>
                ) : (
                  <span>{item.licence}</span>
                )}
                {item.source && (
                  <>
                    {' · '}
                    <a className="credits__link" href={item.source} rel="noopener" target="_blank">
                      source
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </details>

        <p className="footer__note">
          Patch banks are free to download and free to use in your own music.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
