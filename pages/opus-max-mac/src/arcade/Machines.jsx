import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import '../styles/dusk.css';
import './machines.css';
import { games, getGameById } from '../../../arcade/src/games/gameRegistry';
import { YOUTUBE_CHANNEL_URL, GITHUB_URL } from '../../../../src/config';
import Line from '../Line';
import AzimuthDial from './AzimuthDial';
import KeyCluster from './KeyCluster';
import { keyLayout } from './keycaps';
import { numeralFor } from './dial';

/*
 * /opus-max-mac-arcade — twelve machines, listed the way the register lists
 * the banks.
 *
 * The games themselves are not re-worked. The running machine is the existing
 * runtime — `GameCanvas`, the loop, the HUD and the touch controls — mounted
 * unchanged and lazily by `RunningGame`. What belongs to this route is the
 * page around it: the dial, the key diagrams, the twelve rows, and the chrome
 * the running game wears.
 *
 * The dial is a reflection of the list and not a second set of controls. The
 * list is the twelve controls; hovering or focusing a row is what lights a
 * sector, which is why the traffic runs list → dial and never back.
 */

// The runtime and its chrome arrive together, and only once someone has
// actually chosen a machine — the list itself stays a text page.
const RunningGame = lazy(() => import('./RunningGame'));

/*
 * Whether the arrival has already been seen, at module scope so it survives the
 * list being unmounted.
 *
 * Choosing a machine replaces this whole tree with the game, so coming back
 * mounts every row fresh — and a fresh node carrying a CSS animation always runs
 * it. Left alone, quitting a game rebuilds the page in front of you, and because
 * the arrival fills `backwards` the row that the focus restore has just moved to
 * starts at `opacity: 0`. The page arrives once per visit; after that the rows
 * are simply there.
 */
let hasArrived = false;

const gameIdFromHash = () => {
  if (typeof window === 'undefined') return null;
  const id = window.location.hash.replace(/^#/, '');
  return getGameById(id) ? id : null;
};

function Machines() {
  const [runningId, setRunningId] = useState(gameIdFromHash);
  const arriving = useRef(!hasArrived).current;
  const arrival = arriving ? ' rise' : '';
  /*
   * The dial follows the pointer and the keyboard, and it has to track them
   * separately. With one shared value, moving the mouse across the list and off
   * it again blanks the dial while a row is still focused — the figure then
   * says nothing about a row the keyboard reader is standing on.
   */
  const [hoveredId, setHoveredId] = useState(null);
  const [focusedId, setFocusedId] = useState(null);
  const activeId = hoveredId ?? focusedId;

  // One launch button per machine, so focus can be put back where it came
  // from. Without this, leaving a game drops focus on <body> and a keyboard
  // reader restarts at the top of the document.
  const launchRefs = useRef(new Map());
  const lastPlayedRef = useRef(null);

  useEffect(() => {
    hasArrived = true;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const desiredHash = runningId ? `#${runningId}` : '';
    if (window.location.hash === desiredHash) return;
    const url = `${window.location.pathname}${window.location.search}${desiredHash}`;
    // Starting a machine pushes, so Back leaves the game. Leaving one replaces,
    // because pushing on the way out too would mean Back re-enters the game
    // just left, and a visitor who played three machines could not get off the
    // page in fewer than six presses.
    if (runningId) window.history.pushState(null, '', url);
    else window.history.replaceState(null, '', url);
  }, [runningId]);

  // Both events matter: `hashchange` for someone editing the address bar,
  // `popstate` for the back button, which on a same-document push fires
  // popstate without always firing hashchange.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const sync = () => setRunningId(gameIdFromHash());
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  useEffect(() => {
    if (runningId) {
      lastPlayedRef.current = runningId;
      return;
    }
    const played = lastPlayedRef.current;
    if (!played) return;
    lastPlayedRef.current = null;
    // The list has re-rendered by the time an effect runs, so the button is
    // back on the page and can take focus.
    launchRefs.current.get(played)?.focus();
  }, [runningId]);

  const exitGame = useCallback(() => setRunningId(null), []);
  const clearHover = useCallback(() => setHoveredId(null), []);
  const clearFocus = useCallback(() => setFocusedId(null), []);

  const runningGame = getGameById(runningId);

  if (runningGame) {
    return (
      <Suspense fallback={<p className="page state" role="status">Starting {runningGame.name}…</p>}>
        <RunningGame game={runningGame} onExit={exitGame} />
      </Suspense>
    );
  }

  return (
    <>
      <a className="skip-link" href="#machines">Skip to the machines</a>

      <header className="masthead">
        <div className="page masthead__grid">
          <div>
            <p className={`gloss${arrival}`}>Twelve machines · free · no sign-in</p>
            <h1 className={`masthead__title${arrival}`} style={arriving ? { animationDelay: '70ms' } : undefined}>
              Arcade
            </h1>
            <p className={`prose masthead__lead${arrival}`} style={arriving ? { animationDelay: '140ms' } : undefined}>
              Every machine here was written from scratch as a canvas game: the maze,
              the ghost targeting, the scatter and chase tables, the collision maths.
              There is no emulator and no ROM behind any of them. Keyboard on a
              desktop; touch controls appear on a phone.
            </p>
            <div className={`masthead__act${arrival}`} style={arriving ? { animationDelay: '210ms' } : undefined}>
              <Line as="a" value="Eleven banks" href="/opus-max-mac">
                Back to the patch banks
              </Line>
            </div>
          </div>

          <figure className={`masthead__figure${arriving ? ' bloom' : ''}`} style={arriving ? { animationDelay: '280ms' } : undefined}>
            <AzimuthDial items={games} activeId={activeId} />
            <figcaption className="gloss gloss--quiet masthead__caption">
              One sector per machine · the lit sector is the row you are on
            </figcaption>
          </figure>
        </div>
      </header>

      {/*
        tabIndex={-1} is what makes the skip link work. Without it the browser
        scrolls here and leaves focus on <body>, so the next Tab returns to the
        top of the page: the link looks right, announces right, and does
        nothing for the one reader it exists for.
      */}
      <main id="machines" className="page machines" tabIndex={-1}>
        <div className="section-head">
          <h2 className="section-title">The machines</h2>
          <p className="gloss">Twelve · choose one</p>
        </div>

        <ul className="machine-list">
          {games.map((game, index) => {
            const layout = keyLayout(game.controls.keyboard);

            return (
              <li
                className={`machine${arrival}`}
                key={game.id}
                style={arriving ? { animationDelay: `${index * 45}ms` } : undefined}
                onMouseEnter={() => setHoveredId(game.id)}
                onMouseLeave={clearHover}
                onFocus={() => setFocusedId(game.id)}
                onBlur={clearFocus}
              >
                <div className="machine__entry">
                  <h3 className="machine__name">
                    <button
                      type="button"
                      className="machine__launch"
                      ref={(node) => {
                        if (node) launchRefs.current.set(game.id, node);
                        else launchRefs.current.delete(game.id);
                      }}
                      onClick={() => setRunningId(game.id)}
                    >
                      {game.name}
                    </button>
                    {/*
                      The row's own sector, printed where a register line's
                      figure goes. It is what connects the row to the dial
                      above: the numeral lit up there is this one.
                    */}
                    <span className="line__value">{numeralFor(index)}</span>
                  </h3>
                  <p className="machine__desc">{game.description}</p>
                  {/*
                    The key diagram is a figure, so it is not the only way to
                    learn the controls — this is the same information as a
                    sentence, for anyone the drawing does not reach.
                  */}
                  <p className="sr-only">Keys: {layout.spoken}</p>
                </div>

                <KeyCluster keyboard={game.controls.keyboard} />
              </li>
            );
          })}
        </ul>
      </main>

      <footer className="imprint">
        <div className="page">
          <div className="imprint__grid">
            <div>
              <p className="gloss">Published by</p>
              <p className="imprint__mark">Alan Marcero</p>
              <p className="imprint__note">
                Twelve machines, written from scratch in the browser. Nothing here is
                emulated and nothing is for sale.
              </p>
            </div>

            <nav aria-label="Elsewhere">
              <p className="gloss">Elsewhere</p>
              <div className="imprint__links">
                <Line as="a" value="Eleven banks" href="/opus-max-mac">
                  Patch banks
                </Line>
                <Line
                  as="a"
                  value="Channel"
                  href={YOUTUBE_CHANNEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  YouTube
                </Line>
                <Line
                  as="a"
                  value="Source"
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </Line>
              </div>
            </nav>
          </div>

          <div className="imprint__fine">
            <p className="gloss gloss--quiet">Set throughout in Spectral</p>
            <p className="gloss gloss--quiet">Every machine drawn on a canvas</p>
            <p className="gloss gloss--quiet">© {new Date().getFullYear()} Alan Marcero</p>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Machines;
