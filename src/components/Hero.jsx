import { useRef } from 'react';
import { YOUTUBE_CHANNEL_URL } from '../config';

function Hero({ searchQuery, onSearchChange, resultsCount }) {
  const inputRef = useRef(null);

  const handleKeyDown = (event) => {
    if (event.key === 'Escape' && searchQuery) {
      event.preventDefault();
      onSearchChange('');
      inputRef.current?.focus();
    }
  };

  return (
    <section className="hero">
      <svg
        className="hero-signal"
        viewBox="0 0 1200 240"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M -220,120 Q -100,46 20,120 Q 140,194 260,120 Q 380,46 500,120 L 560,46 L 620,194 L 680,46 L 740,194 L 800,46 L 860,194 L 900,46 L 900,194 L 950,194 L 950,46 L 1000,46 L 1000,194 L 1050,194 L 1050,46 L 1100,46 L 1100,194 L 1150,194 L 1150,46 L 1190,120 L 1260,46 L 1330,194 L 1400,46 L 1470,194 L 1540,46" />
      </svg>
      <div className="hero-content">
        <img
          src="/about-me.webp"
          alt="Alan Marcero"
          className="hero-image"
          loading="eager"
          fetchPriority="high"
          width="180"
          height="180"
        />
        <h1 className="hero-name">Alan Marcero</h1>
        <p className="hero-tagline">Synthesizer Sound Designer &amp; Producer</p>
        <div className="hero-bio">
          <p>
            Trance and electronic music producer from Boston, USA. Crafting original tracks,
            remixes, and synthesizer sound design since the early 2000s. Supported by Ferry Corsten,
            Paul van Dyk, Sean Tyas, and Daniel Kandi. Featured on A State of Trance and
            BBC Radio 1's Essential Mix. Released on Armada, Bonzai, and Ministry of Sound.
          </p>
        </div>
        <div className="hero-cta-row">
          <a
            className="btn-primary hero-cta"
            href={YOUTUBE_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Subscribe on YouTube
          </a>
          <a className="btn-primary btn-primary--ghost hero-cta--arcade" href="/arcade.html">
            Arcade
          </a>
        </div>
        <div className="hero-search">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search patches and music..."
            aria-label="Search patches and music"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
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
        {resultsCount && (
          <p className="hero-results-count" role="status" aria-live="polite">
            {resultsCount.patches} {resultsCount.patches === 1 ? 'patch bank' : 'patch banks'},{' '}
            {resultsCount.music} {resultsCount.music === 1 ? 'music item' : 'music items'}
          </p>
        )}
      </div>
    </section>
  );
}

export default Hero;
