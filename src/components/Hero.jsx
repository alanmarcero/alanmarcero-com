import { useRef, useEffect } from 'react';
import { YOUTUBE_CHANNEL_URL } from '../config';
import { SynthesistMark, HeroScopeTrace } from './graphics';
import TakeMeBack from './TakeMeBack';

const isTypingTarget = (el) =>
  el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

function Hero({ searchQuery, onSearchChange, resultsCount, onTravel }) {
  const inputRef = useRef(null);

  const handleKeyDown = (event) => {
    if (event.key === 'Escape' && searchQuery) {
      event.preventDefault();
      onSearchChange('');
      inputRef.current?.focus();
    }
  };

  // Press "/" anywhere (when not already typing) to jump to search.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(document.activeElement)) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <section className="hero">
      <HeroScopeTrace className="hero-scope" />
      <div className="hero-content">
        <div className="hero-mark">
          <SynthesistMark size={180} />
        </div>
        <h1 className="hero-name">Alan <span className="hero-name__accent">Marcero</span></h1>
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
          <TakeMeBack onSelect={onTravel} />
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
          {searchQuery ? (
            <button
              className="search-clear"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
            >
              &times;
            </button>
          ) : (
            <kbd className="search-hint" aria-hidden="true">/</kbd>
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
