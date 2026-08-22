import { useEffect, useRef, useState } from 'react';
import './codex.css';
import { patchBanks } from '../data/patchBanks';
import { YOUTUBE_CHANNEL_URL, GITHUB_URL } from '../config';
import useMusicItems from '../hooks/useMusicItems';
import useInViewport from '../hooks/useInViewport';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';
import useNearestRow from '../opusmaxmac/hooks/useNearestRow';
import EnvelopeField from '../matrix/graphics/EnvelopeField';
import WaveTrace from '../opus5ios/graphics/WaveTrace.jsx';
import FaceplatePlan from '../opus5ios/graphics/FaceplatePlan';
import Demo from '../opus5ios/Demo';
import Orrery from '../opusmaxmac/graphics/Orrery';
import Line from '../opusmaxmac/Line';
import SynthesistMark from '../components/graphics/SynthesistMark';
import SignalMeter from '../components/SignalMeter';
import {
  credits,
  imageFor,
  sourceFor,
  srcSetFor,
} from '../opus5ios/data/synthImages';

const TOTAL_PATCHES = patchBanks.reduce((sum, bank) => sum + (bank.count || 0), 0);
const INSTRUMENT_COUNT = new Set(
  patchBanks.flatMap((bank) => bank.instruments || []),
).size;

const matches = (query, ...fields) => {
  if (!query) return true;
  const needle = query.toLowerCase();
  return fields.some((field) => (field || '').toLowerCase().includes(needle));
};

const number = (index) => String(index + 1).padStart(2, '0');
const isTypingTarget = (element) => element && (
  element.tagName === 'INPUT'
  || element.tagName === 'TEXTAREA'
  || element.isContentEditable
);

function Hero({ releaseCount, activeBankIndex }) {
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const [figureRef, inView] = useInViewport({ rootMargin: '160px' });

  return (
    <header className="codex-hero">
      <div className="codex-hero__field" aria-hidden="true">
        <EnvelopeField
          seed="alan-marcero-codex"
          count={TOTAL_PATCHES}
          aspect={1.8}
          cellWidth={8}
          cellHeight={6}
          gap={2}
          draw
          beam
        />
      </div>

      <div className="codex-shell codex-hero__inner">
        <div className="codex-meta">
          <p>Alan Marcero · Boston, USA</p>
          <p>Synthesizer sound design &amp; production</p>
          <p>Patch banks &amp; releases</p>
        </div>

        <h1 className="codex-hero__title">
          Alan <em>Marcero</em>
        </h1>

        <div className="codex-hero__deck">
          <div className="codex-hero__copy">
            <p className="codex-hero__lead">
              Trance and electronic music producer from Boston, USA. Crafting
              original tracks, remixes, and synthesizer sound design since the
              early 2000s. Supported by Ferry Corsten, Paul van Dyk, Sean Tyas,
              and Daniel Kandi. Featured on A State of Trance and BBC Radio 1&rsquo;s
              Essential Mix. Released on Armada, Bonzai, and Ministry of Sound.
            </p>

            <div className="codex-stats" aria-label="Catalogue totals">
              <p className="codex-stat">
                <span className="codex-stat__value">{TOTAL_PATCHES.toLocaleString()}</span>
                <span className="codex-label">Patches, free</span>
              </p>
              <p className="codex-stat">
                <span className="codex-stat__value">{INSTRUMENT_COUNT}</span>
                <span className="codex-label">Instruments</span>
              </p>
              {releaseCount !== null && (
                <p className="codex-stat">
                  <span className="codex-stat__value">{releaseCount}</span>
                  <span className="codex-label">Releases &amp; remixes</span>
                </p>
              )}
            </div>

            <div className="codex-hero__actions">
              <Line
                as="a"
                className="codex-primary-action"
                value="Channel"
                href={YOUTUBE_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Subscribe on YouTube
              </Line>
              <Line as="a" value="12 machines" href="/arcade">
                Enter the arcade
              </Line>
            </div>
          </div>

          <figure className="codex-hero__instrument" ref={figureRef}>
            <Orrery
              banks={patchBanks}
              activeIndex={activeBankIndex}
              paused={paused || !inView}
            />
            <div className="codex-hero__mark">
              <SynthesistMark size={112} />
            </div>
            <figcaption>
              <p className="codex-label">Eleven banks in orbit</p>
              <p>One envelope in the field for every patch in the catalogue.</p>
              {!reducedMotion && (
                <button
                  type="button"
                  className="codex-quiet-action"
                  aria-pressed={paused}
                  onClick={() => setPaused((wasPaused) => !wasPaused)}
                >
                  Pause the orrery
                </button>
              )}
            </figcaption>
          </figure>
        </div>
      </div>
    </header>
  );
}

function Finder({ query, onQueryChange, bankCount, releaseCount }) {
  const inputRef = useRef(null);
  const result = [
    `${bankCount} ${bankCount === 1 ? 'bank' : 'banks'}`,
    releaseCount === null
      ? null
      : `${releaseCount} ${releaseCount === 1 ? 'release' : 'releases'}`,
  ].filter(Boolean).join(' · ');

  // Match the primary site's keyboard path into its catalogue search.
  useEffect(() => {
    const handleShortcut = (event) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(document.activeElement)) return;
      event.preventDefault();
      inputRef.current?.focus();
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  return (
    <div className="codex-finder codex-shell">
      <div className="codex-finder__label-row">
        <label className="codex-label" htmlFor="codex-find">
          Find an instrument or a track
        </label>
        <kbd className="codex-finder__shortcut" aria-hidden="true">/</kbd>
      </div>
      <div className="codex-finder__field">
        <input
          id="codex-find"
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Escape' || !query) return;
            event.preventDefault();
            onQueryChange('');
            inputRef.current?.focus();
          }}
          placeholder="Nord, Virus, trance…"
          autoComplete="off"
          spellCheck="false"
        />
      </div>
      <p className="codex-label codex-finder__result" role="status">
        {query ? result : ''}
      </p>
    </div>
  );
}

function BankFigure({ bank }) {
  const image = imageFor(bank.name);

  return (
    <figure className="codex-bank-figure">
      <div className="codex-bank-figure__visual">
        {image ? (
          <img
            src={sourceFor(image)}
            srcSet={srcSetFor(image)}
            sizes="(max-width: 62rem) 72vw, 24rem"
            width={image.width}
            height={image.height}
            alt={image.alt}
            decoding="async"
          />
        ) : (
          <FaceplatePlan seed={bank.name} />
        )}
        <div className="codex-bank-figure__scope" aria-hidden="true">
          <WaveTrace seed={bank.name} cycles={2} />
        </div>
      </div>
      <figcaption>
        <p className="codex-label">Current instrument</p>
        <p className="codex-bank-figure__name">{bank.name}</p>
        <div className="codex-bank-figure__readout">
          <Line value={bank.count ? `${bank.count} patches` : 'MIDI files'}>
            Catalogue entry
          </Line>
          <Line value={`${(bank.audioDemo || []).length} on file`}>Audio demos</Line>
        </div>
      </figcaption>
    </figure>
  );
}

function Register({ banks, query, rowRef, activeIndex }) {
  const currentBank = banks[activeIndex] || banks[0];

  return (
    <section className="codex-register" id="patch-banks" aria-labelledby="codex-banks-title">
      <div className="codex-shell">
        <div className="codex-section-head">
          <h2 id="codex-banks-title">Patch banks</h2>
          <p className="codex-label">Register · {banks.length} entries · free downloads</p>
        </div>
        <p className="codex-section-note">
          Load them straight into the instrument. Every bank is free, and free
          to use in whatever you make with it.
        </p>

        {banks.length === 0 ? (
          <p className="codex-state">
            Nothing in the catalogue matches &ldquo;{query}&rdquo;. Try the
            instrument&rsquo;s name — Nord, Virus, Prophet, Moog, JP-8000.
          </p>
        ) : (
          <div className="codex-register__layout">
            <ol className="codex-register__rows">
              {banks.map((bank, index) => {
                const demos = bank.audioDemo || [];
                const coverage = (bank.instruments || []).length;

                return (
                  <li
                    className="codex-entry"
                    key={bank.downloadLink}
                    data-row={index}
                    data-current={index === activeIndex ? 'true' : 'false'}
                    ref={rowRef(index)}
                  >
                    <div className="codex-entry__field" aria-hidden="true">
                      <EnvelopeField
                        seed={bank.name}
                        count={bank.count || 64}
                        aspect={4.5}
                        cellWidth={9}
                        cellHeight={7}
                        gap={2}
                      />
                    </div>
                    <p className="codex-entry__index">{number(index)}</p>
                    <div className="codex-entry__body">
                      <h3>
                        <span>{bank.name}</span>
                        <span className="codex-entry__leader" aria-hidden="true" />
                        <span className="codex-entry__value">
                          {bank.count ? `${bank.count} patches` : 'MIDI files'}
                        </span>
                      </h3>
                      <p className="codex-entry__description">{bank.description}</p>
                      {coverage > 0 && (
                        <p className="codex-entry__fits codex-label">
                          Fits {coverage} {coverage === 1 ? 'instrument' : 'instruments'} · {bank.instruments.join(' · ')}
                        </p>
                      )}
                      <WaveTrace
                        seed={bank.name}
                        cycles={2}
                        className="codex-entry__trace"
                      />
                      <div className="codex-entry__actions">
                        <a
                          className="codex-action"
                          href={bank.downloadLink}
                          download
                          aria-label={`Download the bank — ${bank.name}`}
                        >
                          Download the bank
                        </a>
                        {demos.map((videoId, demoIndex) => (
                          <Demo
                            key={videoId}
                            videoId={videoId}
                            cue={demos.length > 1 ? `Demo ${demoIndex + 1}` : 'Hear it'}
                            label={
                              demos.length > 1
                                ? `Demo ${demoIndex + 1} of ${demos.length} — ${bank.name}`
                                : `Hear it — ${bank.name}`
                            }
                          />
                        ))}
                        {demos.length === 0 && (
                          <span className="codex-label">No demo on file</span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>

            {currentBank && (
              <aside className="codex-register__bench">
                <BankFigure bank={currentBank} />
              </aside>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Releases({ items, loading, error, query }) {
  return (
    <section className="codex-releases" id="releases" aria-labelledby="codex-releases-title">
      <div className="codex-shell">
        <div className="codex-section-head">
          <h2 id="codex-releases-title">Music and remixes</h2>
          <p className="codex-label">YouTube · Spotify · Pandora</p>
        </div>
        <p className="codex-section-note">Made with the same patches the catalogue gives away.</p>

        {loading && <p className="codex-state" role="status">Loading releases…</p>}
        {error && (
          <p className="codex-state" role="status">
            The releases did not load. The patch banks above are unaffected.
          </p>
        )}
        {!loading && !error && items.length === 0 && (
          <p className="codex-state" role="status">
            {query ? `No releases match “${query}”.` : 'No releases are listed just now.'}
          </p>
        )}

        {!loading && !error && items.length > 0 && (
          <ol className="codex-tracks">
            {items.map((item, index) => (
              <li className="codex-track" key={item.videoId}>
                <span className="codex-track__index">{number(index)}</span>
                <h3>{item.title}</h3>
                <WaveTrace
                  seed={item.title || item.videoId}
                  variant="silhouette"
                  cycles={5}
                  className="codex-track__trace"
                />
                <Demo videoId={item.videoId} cue="Play" label={`Play ${item.title}`} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function Colophon() {
  return (
    <footer className="codex-footer">
      <div className="codex-shell">
        <div className="codex-footer__grid">
          <div>
            <p className="codex-label">Published by</p>
            <p className="codex-footer__mark">Alan Marcero</p>
            <p className="codex-footer__note">
              Patch banks are free to download and free to use in your own music.
            </p>
            <SignalMeter className="codex-footer__meter" />
          </div>

          <nav aria-label="Elsewhere">
            <p className="codex-label">Elsewhere</p>
            <div className="codex-footer__links">
              <Line as="a" value="Channel" href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                YouTube
              </Line>
              <Line as="a" value="Source" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                GitHub
              </Line>
              <Line as="a" value="12 machines" href="/arcade">Arcade</Line>
            </div>
          </nav>

          <div>
            <p className="codex-label">Photographs · {credits.length} instruments · Wikimedia Commons</p>
            <ul className="codex-credits">
              {credits.map((item) => (
                <li key={item.slug}>
                  <span>{item.bank}</span> — {item.author}, {' '}
                  {item.licenceUrl ? (
                    <a href={item.licenceUrl} rel="license noopener noreferrer" target="_blank">
                      {item.licence}
                    </a>
                  ) : item.licence}
                  {' · '}
                  <a href={item.source} rel="noopener noreferrer" target="_blank">source</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="codex-footer__fine codex-label">
          <p>Set in Saira Condensed, Archivo and IBM Plex Mono</p>
          <p>Figures drawn from the data on this page</p>
          <p>&copy; {new Date().getFullYear()} Alan Marcero</p>
        </div>
      </div>
    </footer>
  );
}

function CodexApp() {
  const [query, setQuery] = useState('');
  const { musicItems, musicLoading, musicError } = useMusicItems();

  const banks = patchBanks.filter((bank) => matches(
    query,
    bank.name,
    bank.description,
    ...(bank.instruments || []),
  ));
  const releases = musicItems.filter((item) => matches(query, item.title, item.description));
  const [rowRef, activeIndex] = useNearestRow(banks.length);
  const activeBank = banks[activeIndex] || banks[0];
  const activeBankIndex = activeBank
    ? patchBanks.findIndex((bank) => bank.name === activeBank.name)
    : null;

  return (
    <div className="codex-page">
      <a className="codex-skip" href="#codex-main">Skip to the catalogue</a>
      <Hero
        releaseCount={musicLoading || musicError ? null : musicItems.length}
        activeBankIndex={activeBankIndex}
      />
      <main id="codex-main">
        <Finder
          query={query}
          onQueryChange={setQuery}
          bankCount={banks.length}
          releaseCount={musicLoading || musicError ? null : releases.length}
        />
        <Register
          banks={banks}
          query={query}
          rowRef={rowRef}
          activeIndex={activeIndex}
        />
        <Releases
          items={releases}
          loading={musicLoading}
          error={musicError}
          query={query}
        />
      </main>
      <Colophon />
    </div>
  );
}

export default CodexApp;
