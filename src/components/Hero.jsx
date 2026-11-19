import { YOUTUBE_CHANNEL_URL } from '../config';
import { SynthesistMark } from './graphics';
import TakeMeBack from './TakeMeBack';
import { getEraHero } from '../eras/eraHero';

const NAME_BANNER_ERAS = new Set(['y2007', 'y2014', 'y2020']);

function Hero({ onTravel, era = 'present' }) {
  const eraHero = getEraHero(era);
  const showNameBanner = NAME_BANNER_ERAS.has(era);

  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-mark">
          <SynthesistMark size={180} />
        </div>
        {showNameBanner && (
          <img
            className="hero-era-banner"
            src="/eras/img/me.png"
            width="251"
            height="56"
            alt="Alan Marcero"
          />
        )}
        <h1 className="hero-name">Alan <span className="hero-name__accent">Marcero</span></h1>
        <p className="hero-tagline">
          {eraHero ? eraHero.tagline : 'Synthesizer Sound Designer & Producer'}
        </p>
        <div className="hero-bio">
          {eraHero ? (
            eraHero.writeup.map((paragraph, i) => <p key={i}>{paragraph}</p>)
          ) : (
            <p>
              Trance and electronic music producer from Boston, USA. I've produced original tracks,
              remixes, and synthesizer sound banks since the early 2000s. My music has been supported by
              Ferry Corsten, Paul van Dyk, Sean Tyas, and Daniel Kandi, featured on A State of Trance and
              BBC Radio 1's Essential Mix, and released on Armada, Bonzai, and Ministry of Sound.
            </p>
          )}
        </div>
        {era === 'y2007' && (
          <p className="hero-blogfeed">
            <img src="/eras/img/blog-feed.gif" width="75" height="17" alt="" /> Subscribe to my blog
          </p>
        )}
        <div className="hero-cta-group">
          <a className="btn" href="/contact">
            Get in Touch
          </a>
          <div className="hero-cta-row">
            <a className="btn btn--ghost" href="/plugins">
              Plugins
            </a>
            <a
              className="btn btn--ghost"
              href={YOUTUBE_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Subscribe on YouTube
            </a>
            <TakeMeBack onSelect={onTravel} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
