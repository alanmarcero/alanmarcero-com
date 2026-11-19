import { SynthesistMark } from './graphics';
import { getEraHero } from '../eras/eraHero';

const NAME_BANNER_ERAS = new Set(['y2007', 'y2014', 'y2020']);

function Hero({ era = 'present' }) {
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
      </div>
    </section>
  );
}

export default Hero;
