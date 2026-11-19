import { YOUTUBE_CHANNEL_URL, GITHUB_URL } from '../config';
import SignalMeter from '../components/SignalMeter';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p className="footer-copyright">&copy; {new Date().getFullYear()} Alan Marcero</p>
        <SignalMeter className="footer-meter" />
        <nav className="footer-links" aria-label="Elsewhere">
          <a href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
            YouTube
          </a>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
