import { useEffect, useRef } from 'react';
import { YOUTUBE_CHANNEL_URL } from '../config';

const GLITCH_EFFECTS = [
  { className: 'glitch-1', duration: 500 },
  { className: 'glitch-2', duration: 700 },
];

function useRandomGlitch(ref) {
  useEffect(() => {
    if (typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let delayTimer;
    let durationTimer;

    const schedule = () => {
      const delay = (Math.random() * 6 + 4) * 1000;
      delayTimer = setTimeout(() => {
        const effect = GLITCH_EFFECTS[Math.floor(Math.random() * GLITCH_EFFECTS.length)];
        const el = ref.current;
        if (!el) return;
        el.classList.add(effect.className);
        durationTimer = setTimeout(() => {
          el.classList.remove(effect.className);
          schedule();
        }, effect.duration);
      }, delay);
    };

    schedule();
    return () => { clearTimeout(delayTimer); clearTimeout(durationTimer); };
  }, [ref]);
}

function Hero({ searchQuery, onSearchChange }) {
  const nameRef = useRef(null);
  useRandomGlitch(nameRef);

  return (
    <section className="hero">
      <div className="hero-backdrop" />
      <div className="hero-content">
        <img
          src="/about-me.webp"
          alt="Alan Marcero"
          className="hero-image"
        />
        <h1 ref={nameRef} className="hero-name" data-text="Alan Marcero" aria-label="Alan Marcero">Alan Marcero</h1>
        <p className="hero-tagline">Synthesizer Sound Designer & Producer</p>
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
          <a className="hero-cta--secondary" href="/arcade.html">
            Arcade
          </a>
        </div>
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
