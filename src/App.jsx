import { useEffect } from 'react';
import './App.css';
import './plugins/plugins.css';
import './eras/eras.css';
import Hero from './components/Hero';
import { LissajousHalo } from './components/graphics';
import EraChrome from './eras/EraChrome';
import useEra from './eras/useEra';
import SiteChrome from './site/SiteChrome';
import { HOME_LINKS } from './site/pages';
import { legacyRedirectFromLocation } from './site/legacyRoutes';

function App() {
  const [era, setEra] = useEra();

  useEffect(() => {
    const target = legacyRedirectFromLocation(window.location);
    if (target) window.location.replace(target);
  }, []);

  return (
    <SiteChrome page="home">
      <Hero onTravel={setEra} era={era} />
      <main id="main-content">
        <section aria-labelledby="directory-heading">
          <div className="section-head">
            <h2 id="directory-heading" className="section-title" data-kicker="Directory">Sections</h2>
          </div>
          <ul className="home-directory">
            {HOME_LINKS.map((item) => (
              <li key={item.id}>
                <a href={item.href}>
                  <strong>{item.label}</strong>
                  <span>{item.blurb}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <div className="page-scope">
        <LissajousHalo className="page-scope__trace" />
      </div>
      <EraChrome era={era} onSetEra={setEra} />
    </SiteChrome>
  );
}

export default App;
