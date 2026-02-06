import { YOUTUBE_CHANNEL_URL, GITHUB_URL } from '../config';

function Footer() {
  return (
    <footer>
      <div className="footer-links">
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
      </div>
      <p className="footer-copyright">{new Date().getFullYear()} Alan Marcero</p>
    </footer>
  );
}

export default Footer;
