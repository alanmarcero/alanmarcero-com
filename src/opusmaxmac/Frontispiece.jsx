import { useState } from 'react';
import { YOUTUBE_CHANNEL_URL } from '../config';
import useInViewport from '../hooks/useInViewport';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';
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
            Mix, and released on Armada, Bonzai and Ministry of Sound. Everything in
            the register below is free to download, and free to use in whatever you
            make with it.
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
              Eleven banks as eleven orbits, spaced by Kepler&rsquo;s third law. The
              interval on a ring is a <em>designation</em>, assigned by position in the
              register exactly as the numeral is — it is not derived from the bank. What
              the figure measures is the patch count, which sets how large and bright
              each body is: seven of the eleven hold 128 patches, so seven of them
              match.
            </p>
            {!reducedMotion && (
              <button
                type="button"
                className="gloss frontispiece__pause"
                aria-pressed={paused}
                onClick={() => setPaused((wasPaused) => !wasPaused)}
              >
                {paused ? 'Resume the orrery' : 'Pause the orrery'}
              </button>
            )}
          </figcaption>
        </figure>
      </div>
    </header>
  );
}

export default Frontispiece;
