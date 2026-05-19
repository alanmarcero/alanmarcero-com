import { YOUTUBE_CHANNEL_URL, GITHUB_URL } from '../config';

function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <p className="footer-copyright">&copy; {new Date().getFullYear()} Alan Marcero</p>
        <nav className="footer-links" aria-label="Social links">
          <a
            href={YOUTUBE_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            YouTube
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
