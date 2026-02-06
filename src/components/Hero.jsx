import { YOUTUBE_CHANNEL_URL } from '../config';

function Hero({ searchQuery, onSearchChange }) {
  return (
    <section className="hero">
      <div className="hero-backdrop" />
      <div className="hero-content">
        <img
          src="/about-me.webp"
          alt="Alan Marcero"
          className="hero-image"
        />
        <h1 className="hero-name">Alan Marcero</h1>
        <p className="hero-tagline">Synthesizer Sound Designer & Producer</p>
        <div className="hero-bio">
          <p>
            Trance and electronic music producer from Boston, USA — creating original tracks,
            remixes, and sound design since the early 2000s. Supported by Ferry Corsten,
            Paul van Dyk, Sean Tyas, and Daniel Kandi. Featured on A State of Trance,
            BBC Radio 1's Essential Mix, and released on Armada, Bonzai, and Ministry of Sound.
          </p>
        </div>
        <a
          className="btn-primary hero-cta"
          href={YOUTUBE_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Subscribe on YouTube
        </a>
        <div className="hero-search">
          <input
            type="text"
            placeholder="Search patches and music..."
            aria-label="Search patches and music"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              className="search-clear"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
            >
              &times;
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default Hero;
