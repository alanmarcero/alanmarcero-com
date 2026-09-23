import { YOUTUBE_CHANNEL_URL, GITHUB_URL } from '../../../src/config';
import SignalMeter from '../../../src/components/SignalMeter';
import Line from '../../opus-max-mac/src/Line';
import { credits } from './lib/catalog';

function Colophon() {
  return (
    <footer className="codex-footer">
      <div className="codex-shell">
        <div className="codex-footer__grid">
          <div>
            <p className="codex-label">Published by</p>
            <p className="codex-footer__mark">
              <span>Alan</span> <span>Marcero</span>
            </p>
            <p className="codex-footer__note">
              Patch banks are free to download and free to use in your own music.
            </p>
            <SignalMeter className="codex-footer__meter" />
          </div>

          <nav aria-label="Elsewhere">
            <p className="codex-label">Elsewhere</p>
            <div className="codex-footer__links">
              <Line as="a" value="Channel" href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                YouTube
              </Line>
              <Line as="a" value="Source" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                GitHub
              </Line>
              <Line as="a" value="12 machines" href="/arcade">Arcade</Line>
            </div>
          </nav>

          <div>
            <p className="codex-label">Images · {credits.length} instruments · Commons + manufacturers</p>
            <ul className="codex-credits">
              {credits.map((item) => (
                <li key={item.slug}>
                  <span>{item.bank}</span> — {item.author}, {' '}
                  {item.licenceUrl ? (
                    <a href={item.licenceUrl} rel="license noopener noreferrer" target="_blank">
                      {item.licence}
                    </a>
                  ) : item.licence}
                  {' · '}
                  <a href={item.source} rel="noopener noreferrer" target="_blank">source</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="codex-footer__fine codex-label">
          <p>&copy; {new Date().getFullYear()} Alan Marcero</p>
        </div>
      </div>
    </footer>
  );
}

export default Colophon;
