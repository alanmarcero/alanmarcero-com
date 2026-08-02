import { YOUTUBE_CHANNEL_URL, GITHUB_URL } from '../config';

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

        <p className="footer__note">
          Patch banks are free to download and free to use in your own music.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
