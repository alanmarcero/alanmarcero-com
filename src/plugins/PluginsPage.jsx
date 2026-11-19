import { useState } from 'react';
import '../App.css';
import './plugins.css';
import SiteChrome from '../site/SiteChrome';
import ModulePanel from '../components/ModulePanel';
import { BETA_NOTE, MANAGER, PLUGINS } from './catalog';

function Shot({ plugin }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="plugin-shot plugin-shot--fallback">
        Screenshot unavailable
      </div>
    );
  }

  return (
    <img
      className="plugin-shot"
      src={plugin.shotUrl}
      alt={`${plugin.name} editor`}
      width="1200"
      height="750"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export default function PluginsPage() {
  return (
    <SiteChrome page="plugins">
      <main id="main-content">
        <header className="page-intro">
          <div className="section-head">
            <h1 className="section-title" data-kicker="Audio">Plugins</h1>
          </div>
          <p className="section-lead">
            VST plugins for trance and electronic music. Install them with OpenVST Manager.
          </p>
        </header>

        <section className="manager-lead" aria-labelledby="manager-heading">
          <p className="kicker">Install</p>
          <h2 id="manager-heading">{MANAGER.name}</h2>
          <p>{MANAGER.summary}</p>
          <a className="btn" href={MANAGER.downloadUrl}>
            Download OpenVST Manager
          </a>
        </section>

        <p className="beta-note">{BETA_NOTE}</p>

        <div className="module-grid">
          {PLUGINS.map((plugin, index) => (
            <ModulePanel key={plugin.repo} style={{ '--card-index': index }}>
              <div className="module__media">
                <Shot plugin={plugin} />
              </div>
              <div className="module__head">
                <h2 className="module__title">{plugin.name}</h2>
              </div>
              <p className="module__desc">{plugin.summary}</p>
              <p className="plugin-why">
                <span className="plugin-why__label">Why does this exist?</span>
                <span className="plugin-why__text">{plugin.why}</span>
              </p>
              <div className="module__actions">
                <a
                  className="btn btn--ghost"
                  href={plugin.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${plugin.name} on GitHub`}
                >
                  GitHub
                </a>
              </div>
            </ModulePanel>
          ))}
        </div>
      </main>
    </SiteChrome>
  );
}
