import { useState } from 'react';
import { YOUTUBE_CHANNEL_URL } from '../../../src/config';
import useInViewport from '../../../src/hooks/useInViewport';
import usePrefersReducedMotion from '../../../src/hooks/usePrefersReducedMotion';
import Orrery from './graphics/Orrery';
import { labelledOrbits } from './graphics/orbits';
import Line from './Line';

/**
 * The frontispiece — the plate that faces an almanac's title page.
 *
 * Whose work this is, what there is of it, and the one figure the page is
 * built around.
 *
 * The orrery is the only thing here that moves, and it can be stopped. WCAG
 * 2.2.2 asks for a control on the page and an operating-system motion
 * preference is not one; the button is hidden when that preference is already
 * set, because then there is nothing left to stop.
 */
function Frontispiece({ banks, bodies, totalPatches, releaseCount, currentBank = null }) {
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  // Eleven simultaneous SVG rotations repaint the whole figure every frame, and
  // SVG transforms do not composite the way HTML ones do — so the orrery stops
  // turning as soon as it leaves the screen.
  const [figureRef, inView] = useInViewport({ rootMargin: '160px' });

  const key = labelledOrbits(bodies)
    .map((body) => `${body.designation} ${body.interval.label}`)
    .join('   ·   ');

  // Derived, like every other count on the page. Written into the caption by
  // hand, they would disagree with the figure above them the day a bank is added.
  const largest = Math.max(...banks.map((bank) => bank.count || 0));
  const matching = banks.filter((bank) => bank.count === largest).length;

  return (
    <header className="frontispiece">
      <div className="page frontispiece__inner">
        <p className="gloss gloss-row frontispiece__strip bloom">
          <span>Ephemeris of the work</span>
          <span>Edition {new Date().getFullYear()}</span>
          <span>{banks.length} banks</span>
        </p>

        <div className="frontispiece__lede">
          <h1 className="frontispiece__name rise">
            Alan <em>Marcero</em>
          </h1>
          <p className="gloss frontispiece__role rise">
            Synthesist · Sound designer · Boston
          </p>
        </div>

        <div className="frontispiece__deck">
          <p className="prose">
            Trance and electronic music out of Boston, and the sound design that goes
            into it — original tracks, remixes and patch banks, since the early 2000s.
          </p>
          <p className="prose">
            The tracks have been played by Ferry Corsten, Paul van Dyk, Sean Tyas and
            Daniel Kandi, aired on A State of Trance and BBC Radio 1&rsquo;s Essential
            Mix, and released on Armada, Bonzai and Ministry of Sound.
          </p>

          <div className="frontispiece__figures">
            <p className="stat">
              <span className="figure">{totalPatches.toLocaleString('en-US')}</span>
              <span className="gloss">patches</span>
            </p>
            <p className="stat">
              <span className="figure">{banks.length}</span>
              <span className="gloss">patch banks</span>
            </p>
            {/* No figure at all until the fetch resolves, and none if it fails:
                "0 releases" while a request is in flight is a claim the page
                cannot make yet. */}
            {releaseCount !== null && (
              <p className="stat">
                <span className="figure">{releaseCount}</span>
                <span className="gloss">releases</span>
              </p>
            )}
          </div>

          <div className="act-stack frontispiece__acts">
            <Line
              as="a"
              value="Channel"
              href={YOUTUBE_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Subscribe on YouTube
            </Line>
            <Line as="a" value="12 machines" href="/opus-max-mac-arcade">
              Enter the arcade
            </Line>
          </div>
        </div>

        <figure className="frontispiece__plate" ref={figureRef}>
          <Orrery banks={banks} activeIndex={currentBank} paused={paused || !inView} />

          <figcaption className="frontispiece__caption">
            <p className="gloss gloss--quiet frontispiece__key">{key}</p>
            <p>
              {bodies.length} banks as {bodies.length} orbits, spaced by
              Kepler&rsquo;s third law. The interval on a ring is a{' '}
              <em>designation</em>, assigned by position in the register exactly as the
              numeral is — it is not derived from the bank. What the figure measures is
              the patch count, which sets how large and bright each body is:{' '}
              {matching} of the {bodies.length} hold {largest} patches, so {matching} of
              them match. The one bank with no count is drawn hollow.
            </p>
            {/*
              A toggle says its state through `aria-pressed`, so the label has to
              hold still. Swapping it to "Resume" as well would announce "Resume
              the orrery, pressed" — the state saying the resume has already
              happened while the label says it has not.
            */}
            {!reducedMotion && (
              <button
                type="button"
                className="gloss frontispiece__pause"
                aria-pressed={paused}
                onClick={() => setPaused((wasPaused) => !wasPaused)}
              >
                Pause the orrery
              </button>
            )}
          </figcaption>
        </figure>
      </div>
    </header>
  );
}

export default Frontispiece;
