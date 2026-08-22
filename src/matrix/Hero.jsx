import { useEffect, useState } from 'react';
import EnvelopeField from './graphics/EnvelopeField';
import './hero.css';

/**
 * How long typing must pause before the result count is spoken.
 *
 * The search filters on every keystroke, and the results element is a live
 * region, so typing "Prophet" used to fire seven announcements — each one
 * interrupting the last. A screen reader user heard fragments of counts and
 * never one whole. Filtering stays instant; only the announcement waits.
 */
export const ANNOUNCE_DELAY_MS = 600;

/**
 * The visible readout. Terser than the spoken one, and it omits an unknown
 * release count for the same reason: "0 releases" during a cold load is not
 * a smaller truth, it is a wrong one.
 */
export const visibleResults = ({ patches, music }) =>
  music === null || music === undefined
    ? `${patches} banks`
    : `${patches} banks, ${music} releases`;

/**
 * What the live region says.
 *
 * Two distinctions the previous string could not make:
 *
 * - Zero results gets words rather than "0 banks, 0 releases", so the spoken
 *   text matches what a sighted reader sees in the catalog's empty state.
 * - `music: null` means the release count is NOT KNOWN YET, not that there
 *   are none. Announcing "0 releases" during a cold load states a false
 *   count as fact, so an unknown count is omitted rather than guessed — and
 *   with patches at zero we say "no banks" rather than "no matches", because
 *   a release we have not counted may still match.
 */
export const describeResults = (resultsCount, query) => {
  if (!resultsCount) return '';
  const { patches, music } = resultsCount;
  const banks = `${patches} ${patches === 1 ? 'bank' : 'banks'}`;

  if (music === null || music === undefined) {
    return patches === 0
      ? `No banks match “${query}”.`
      : `${banks} for “${query}”.`;
  }

  if (patches === 0 && music === 0) return `No matches for “${query}”.`;

  const releases = `${music} ${music === 1 ? 'release' : 'releases'}`;
  return `${banks}, ${releases} for “${query}”.`;
};

/**
 * The thesis, stated as an image: every patch this site gives away, drawn
 * as its own ADSR envelope, all at once. The headline sits over it.
 */
function Hero({
  totalPatches,
  instrumentCount,
  searchQuery,
  onSearchChange,
  resultsCount,
}) {
  const patches = resultsCount ? resultsCount.patches : null;
  const music = resultsCount ? resultsCount.music : null;
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const next = describeResults(
      patches === null ? null : { patches, music },
      searchQuery,
    );
    // `music` may legitimately be null here (not counted yet) — that is a
    // distinct state from 0 and describeResults keeps them apart.
    // Clearing is immediate: an emptied box should not leave a stale count
    // waiting to be spoken half a second later.
    if (!next) {
      setAnnouncement('');
      return undefined;
    }
    const timer = setTimeout(() => setAnnouncement(next), ANNOUNCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [patches, music, searchQuery]);

  return (
    <header className="hero">
      <div className="hero__field" aria-hidden="true">
        <EnvelopeField
          seed="alan-marcero-catalog"
          count={totalPatches}
          aspect={1.6}
          cellWidth={8}
          cellHeight={6}
          gap={2}
          draw
        />
      </div>

      <div className="shell hero__body">
        <p className="legend legend--wide hero__eyebrow">
          Synthesizer sound design
        </p>

        <h1 className="hero__title">Alan Marcero</h1>

        <p className="hero__lead prose">
          Patch banks for the hardware you already own — Prophet 08, Virus TI,
          Nord Lead 3, Moog, JP-8000 and more. Every bank is free to download.
        </p>

        <p className="hero__count">
          <span className="readout hero__count-value">
            {totalPatches.toLocaleString()}
          </span>
          <span className="legend hero__count-label">
            patches across {instrumentCount} instruments
          </span>
        </p>

        <div className="hero__search">
          <label className="legend hero__search-label" htmlFor="find-instrument">
            Find your instrument
          </label>
          <input
            id="find-instrument"
            className="hero__search-input"
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Nord Lead, Virus, trance…"
            autoComplete="off"
            spellCheck="false"
            aria-describedby="hero-search-announce"
          />
          {/* The visible readout updates instantly and is hidden from
              assistive tech, because the live region below carries the same
              information on a cadence a screen reader can actually follow.
              Two elements, one fact, two different tempos. */}
          <p className="hero__search-result" aria-hidden="true">
            {resultsCount ? visibleResults(resultsCount) : ''}
          </p>

          <p
            id="hero-search-announce"
            className="hero__search-announce"
            role="status"
          >
            {announcement}
          </p>
        </div>
      </div>
    </header>
  );
}

export default Hero;
