import { YOUTUBE_CHANNEL_URL, GITHUB_URL } from '../config';
import SignalMeter from './SignalMeter';

function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <p className="footer-copyright">&copy; {new Date().getFullYear()} Alan Marcero</p>
        <SignalMeter className="footer-meter" />
        <nav className="footer-links" aria-label="Site links">
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
          <a href="/arcade">Arcade</a>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
