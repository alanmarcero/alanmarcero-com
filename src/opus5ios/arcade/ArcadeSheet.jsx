import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import '../styles/paper.css';
import './arcade.css';
import { getGameById, games } from '../../arcade/games/gameRegistry';
import Pictogram from './Pictogram';
import AttractBand from './AttractBand';

// The runtime and its chrome load only when a machine is actually chosen,
// so the list itself stays a text page.
const GameStage = lazy(() => import('./GameStage'));

/*
 * /opus5ios-arcade — the arcade, set as a section of the same sheet.
 *
 * Scope: the games are not re-worked. The running game — its loop, canvas,
 * HUD and touch controls — is the existing runtime mounted unchanged. What
 * is new is the sheet around it: the masthead, the way the machines are
 * listed, the marks, and the chrome the running game wears.
 */

const gameIdFromHash = () => {
  if (typeof window === 'undefined') return null;
  const id = window.location.hash.replace(/^#/, '');
  return getGameById(id) ? id : null;
};

const machineNumber = (index) => String(index + 1).padStart(2, '0');

/** The keys a machine answers to, as a printable list. */
const keyLine = (game) => {
  const keys = Object.values(game.controls?.keyboard || {});
  if (!keys.length) return 'Mouse';
  return keys
    .map((key) => key.replace(/^Arrow/, '').toUpperCase())
    .join(' · ');
};

function ArcadeSheet() {
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
      <Suspense fallback={<p className="state sheet" role="status">Starting {activeGame.name}…</p>}>
        <GameStage game={activeGame} onExit={exitGame} />
      </Suspense>
    );
  }

  return (
    <>
      <a className="skip-link" href="#machines">Skip to the machines</a>

      <header className="masthead">
        <div className="sheet">
          <div className="masthead__meta">
            <p className="legend legend--ink">Alan Marcero · Arcade</p>
            <p className="legend">{games.length} machines · rebuilt in the browser</p>
            <p className="legend">No emulator · no ROM</p>
          </div>

          <h1 className="masthead__title">
            The <em>Arcade</em>
          </h1>

          <div className="masthead__deck">
            <p className="masthead__lead">
              Twelve arcade machines, each written from scratch as a canvas
              game — the maze, the ghosts, the wave tables, the collision
              maths. Pick one and it starts immediately. Keyboard on a
              desktop, touch controls on a phone.
            </p>
            <div className="masthead__figures">
              <a className="action action--quiet" href="/opus5ios">
                Back to the patch banks
              </a>
            </div>
          </div>
        </div>

        <div className="attract-band">
          <AttractBand />
        </div>
      </header>

      {/*
        tabIndex={-1} is what makes the skip link work. Without it the
        browser scrolls here and leaves focus on <body>, so the next Tab
        goes back to the top of the page — the link looks right, announces
        right, and does nothing for the keyboard user it exists for.
      */}
      <main id="machines" className="machines sheet" tabIndex={-1}>
        <div className="section-head">
          <h2 className="section-title">Machines</h2>
          <p className="legend">Fig. 3 &mdash; select one</p>
        </div>

        <ul>
          {games.map((game, index) => (
            <li className="machine" key={game.id}>
              <span className="machine__index">{machineNumber(index)}</span>
              <Pictogram id={game.id} className="machine__mark" />
              <div>
                <h3 className="machine__name">
                  <button
                    type="button"
                    className="machine__launch"
                    onClick={() => selectGame(game.id)}
                  >
                    {game.name}
                  </button>
                </h3>
                <p className="machine__desc">{game.description}</p>
              </div>
              <p className="legend machine__keys">{keyLine(game)}</p>
            </li>
          ))}
        </ul>
      </main>

      <footer className="colophon">
        <div className="sheet colophon__fine">
          <p className="legend">Every machine written from scratch</p>
          <p className="legend">Marks drawn for this sheet</p>
          <p className="legend">&copy; {new Date().getFullYear()} Alan Marcero</p>
        </div>
      </footer>
    </>
  );
}

export default ArcadeSheet;
export { keyLine };
