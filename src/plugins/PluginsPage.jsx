import { useEffect, useState } from 'react';
import '../App.css';
import './plugins.css';
import SiteChrome from '../site/SiteChrome';
import ModulePanel from '../components/ModulePanel';
import { BETA_NOTE, MANAGER, PLUGINS } from './catalog';

const RELEASE_CACHE_TTL_MS = 10 * 60 * 1000;

function safeHttpsUrl(value) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' ? parsed.href : null;
  } catch {
    return null;
  }
}

function stripMarkdownImages(body) {
  return String(body || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function readCachedRelease(repo) {
  try {
    const raw = window.sessionStorage?.getItem(`plugin-release:${repo}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || Date.now() - parsed.fetchedAt > RELEASE_CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCachedRelease(repo, data) {
  try {
    window.sessionStorage?.setItem(
      `plugin-release:${repo}`,
      JSON.stringify({ fetchedAt: Date.now(), data }),
    );
  } catch {
    // Ignore storage quota or private browsing errors.
  }
}

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
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

function useLatestReleases(plugins) {
  const [releases, setReleases] = useState(() => {
    const initial = {};
    plugins.forEach((plugin) => {
      const cached = readCachedRelease(plugin.repo);
      if (cached) initial[plugin.repo] = cached;
    });
    return initial;
  });

  useEffect(() => {
    if (typeof fetch !== 'function') return undefined;
    let cancelled = false;

    async function loadAll() {
      const missing = plugins.filter((plugin) => !readCachedRelease(plugin.repo));
      if (missing.length === 0) return;

      const entries = await Promise.all(
        missing.map(async (plugin) => {
          try {
            const response = await fetch(plugin.latestReleaseApiUrl, {
              headers: { Accept: 'application/vnd.github+json' },
            });
            if (!response.ok) return null;
            const json = await response.json();
            const info = {
              tag: json.tag_name || '',
              url: safeHttpsUrl(json.html_url) || plugin.releasesUrl,
              notes: stripMarkdownImages(json.body),
            };
            writeCachedRelease(plugin.repo, info);
            return [plugin.repo, info];
          } catch {
            return null;
          }
        }),
      );

      if (cancelled) return;
      const updates = Object.fromEntries(entries.filter(Boolean));
      if (Object.keys(updates).length > 0) {
        setReleases((prev) => ({ ...prev, ...updates }));
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [plugins]);

  return releases;
}

export default function PluginsPage() {
  const releases = useLatestReleases(PLUGINS);

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

        <div className="module-grid plugin-grid">
          {PLUGINS.map((plugin, index) => {
            const release = releases[plugin.repo];
            return (
              <ModulePanel key={plugin.repo} style={{ '--card-index': index }}>
                <div className="module__media">
                  <Shot plugin={plugin} />
                </div>
                <div className="module__head">
                  <h2 className="module__title">{plugin.name}</h2>
                  {release?.tag && (
                    <span className="plugin-version">{release.tag}</span>
                  )}
                </div>
                <p className="module__desc">{plugin.summary}</p>
                {release?.notes && (
                  <details className="plugin-notes">
                    <summary>Release notes</summary>
                    <pre className="plugin-notes__body">{release.notes}</pre>
                  </details>
                )}
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
                  <a
                    className="btn btn--ghost"
                    href={safeHttpsUrl(release?.url) || plugin.releasesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${plugin.name} release notes`}
                  >
                    Release
                  </a>
                </div>
              </ModulePanel>
            );
          })}
        </div>
      </main>
    </SiteChrome>
  );
}
