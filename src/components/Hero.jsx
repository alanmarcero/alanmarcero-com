import { useRef } from 'react';
import { YOUTUBE_CHANNEL_URL } from '../config';
import { SynthesistMark } from './graphics';

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
      <div className="hero-content">
        <p className="hero-kicker" aria-hidden="true">00 — Console</p>
        <div className="hero-scope hero-mark">
          <SynthesistMark size={180} />
        </div>
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
            className="btn"
            href={YOUTUBE_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Subscribe on YouTube
          </a>
          <a className="btn btn--ghost" href="/arcade.html">
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
