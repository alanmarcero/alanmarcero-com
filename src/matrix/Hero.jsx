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
 * Noun agreement, split from number formatting so a layout that shows the
 * two apart (the hero puts the figure at display scale and the noun beneath
 * it) uses the SAME rule as one that shows them together. One rule, two
 * presentations — the alternative is a second implementation, which is how
 * "1 releases" shipped.
 *
 * Shared by both renderers on purpose. They previously pluralized
 * independently — the spoken one did, the visible one did not — and any
 * search matching exactly one release showed "1 releases" on screen while
 * the live region said "1 release". Two implementations of one rule is the
 * defect generator, so there is now one.
 */
export const pluralize = (n, singular, plural = `${singular}s`) =>
  (n === 1 ? singular : plural);

export const count = (n, singular, plural) =>
  `${n.toLocaleString()} ${pluralize(n, singular, plural)}`;

/**
 * The visible readout. Terser than the spoken one, and it omits an unknown
 * release count for the same reason: "0 releases" during a cold load is not
 * a smaller truth, it is a wrong one.
 */
export const visibleResults = ({ patches, music }) =>
  music === null || music === undefined
    ? count(patches, 'bank')
    : `${count(patches, 'bank')}, ${count(music, 'release')}`;

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
  const banks = count(patches, 'bank');

  if (music === null || music === undefined) {
    return patches === 0
      ? `No banks match “${query}”.`
      : `${banks} for “${query}”.`;
  }

  if (patches === 0 && music === 0) return `No matches for “${query}”.`;

  const releases = count(music, 'release');
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

        {/* The thesis, at the weight it earns. This is the strongest
            sentence on the page and it previously read as a small readout
            under the lead. Both nouns route through count() — they were
            hardcoded plurals, the same defect that shipped "1 releases",
            two call sites further along. */}
        <p className="hero__count">
          <span className="readout hero__count-value">
            {totalPatches.toLocaleString()}
          </span>
          <span className="legend hero__count-label">
            {pluralize(totalPatches, 'patch', 'patches')}
            {' across '}
            {count(instrumentCount, 'instrument')}
          </span>
        </p>

        {/* What the field behind this text IS, said in words. The graphic
            is aria-hidden, so without this sentence the site's central
            claim existed only as a picture — withheld from any reader who
            cannot see it. Saying it here is what MAKES the graphic
            legitimately decorative rather than load-bearing. */}
        <p className="hero__field-note">
          One envelope drawn behind this text for every patch in the
          catalog.
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
