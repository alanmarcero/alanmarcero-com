import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import '../tokens.css';
import '../layout.css';
import './arcade.css';
import { getGameById, games } from '../../arcade/games/gameRegistry';
import Marquee from './Marquee';
import { spellCount } from './spellCount';

// The game runtime and its stylesheet load only once a cabinet is chosen,
// so the old arcade's palette never touches this layout.
const GameView = lazy(() => import('./GameView'));

/*
 * The arcade, relaid out.
 *
 * Scope note (user directive): the games themselves are not re-worked. The
 * running game — its loop, canvas, HUD and touch controls — is the existing
 * runtime, mounted unchanged, and it keeps its own stylesheet while it is on
 * screen. What is new is everything around it: the marquee, the way the
 * cabinet list is presented, and the route back to the catalog.
 */

const gameIdFromHash = () => {
  if (typeof window === 'undefined') return null;
  const id = window.location.hash.replace(/^#/, '');
  return getGameById(id) ? id : null;
};

function ArcadeShell() {
  const [activeGameId, setActiveGameId] = useState(gameIdFromHash);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const desiredHash = activeGameId ? `#${activeGameId}` : '';
    if (window.location.hash === desiredHash) return;
    const url = `${window.location.pathname}${window.location.search}${desiredHash}`;
    window.history.pushState(null, '', url);
  }, [activeGameId]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const sync = () => setActiveGameId(gameIdFromHash());
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  const selectGame = useCallback((gameId) => setActiveGameId(gameId), []);
  const exitGame = useCallback(() => setActiveGameId(null), []);

  const activeGame = getGameById(activeGameId);

  if (activeGame) {
    return (
      <Suspense fallback={<p className="shell state" role="status">Starting {activeGame.name}…</p>}>
        <GameView game={activeGame} onExit={exitGame} />
      </Suspense>
    );
  }

  return (
    <>
      <a className="skip-link" href="#cabinets">Skip to the games</a>

      <header className="arcade-hero">
        <div className="shell arcade-hero__body">
          <Marquee />
          <p className="arcade-hero__lead prose">
            {/*
              Derived, not typed. This read "Twelve" as a literal while the
              thing it counts is a registry in a file this slice does not own,
              and no test would have caught the day they disagreed.
            */}
            {spellCount(games.length, { capitalized: true })} arcade machines,
            each rebuilt from scratch in the browser — no emulator, no ROM.
            Pick one and it starts immediately.
          </p>
          <a className="action action--quiet arcade-hero__back" href="/matrix">
            Back to the patch banks
          </a>
        </div>
      </header>

      {/*
        tabIndex={-1} is what makes the skip link above actually work. Without
        it the browser scrolls to this element and leaves focus on <body>, so
        the next Tab returns to the top of the page — the link looks right,
        announces right, and does nothing for the keyboard user it exists for.
      */}
      <main id="cabinets" className="cabinets" tabIndex={-1}>
        <h2 className="visually-hidden">Games</h2>
        <ul className="cabinet-list">
          {games.map((game, index) => (
            <li
              key={game.id}
              className={`plate cabinet ${index % 2 === 1 ? 'plate--raised' : ''}`}
            >
              <div className="shell plate__body cabinet__body">
                <span
                  className="cabinet__led"
                  style={{ background: game.accent }}
                  aria-hidden="true"
                />
                <h3 className="cabinet__name">
                  <button
                    type="button"
                    className="cabinet__launch"
                    onClick={() => selectGame(game.id)}
                  >
                    {game.name}
                  </button>
                </h3>
                <p className="cabinet__desc">{game.description}</p>
                <p className="legend cabinet__keys">
                  {Object.keys(game.controls?.keyboard || {}).join(' · ') || 'Mouse'}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

export default ArcadeShell;
