import GameCanvas from '../../../arcade/src/components/GameCanvas';
import './game-chrome.css';

/**
 * The running game, mounted unchanged — with our chrome, not its old one.
 *
 * The runtime is re-used exactly as directive 7 requires: `GameCanvas`, the
 * game loop, the HUD markup and the touch controls are untouched. It imports
 * no CSS of its own, so it renders against whatever stylesheet an ancestor
 * loaded. That used to be `../../arcade/ArcadeApp.css`, which directive 4
 * forbids and which carries the old skeuomorphic CRT design with it.
 *
 * `game-chrome.css` covers every class name the runtime emits — including the
 * touch controls, whose only styling lived in that same file. Splitting them
 * this way keeps the game and replaces its design, which is what the brief
 * asked for.
 *
 * Still lazily loaded: the chrome and the runtime arrive together, only once
 * a cabinet is actually chosen.
 *
 * --- Why there is a title bar here -----------------------------------------
 *
 * Two things were missing from the running-game view, and they turned out to
 * be one thing:
 *
 *   1. The document had no `h1`. `ArcadeShell` swaps the marquee out when a
 *      cabinet starts, and the runtime's only heading is the `<h2>GAME OVER`
 *      inside a panel that is absent until you lose. `Marquee` was given the
 *      page's `h1` precisely because this route had none — that fix covered
 *      the catalog and not the state one click away from it.
 *   2. The runtime never renders `game.name` at all. Its HUD is SCORE / LIVES
 *      / LEVEL plus copy-link and exit. You could launch Asteroids and find
 *      nothing on screen that said Asteroids.
 *
 * So the name is the `h1`: correct outline, and the missing label at once.
 * The exit route is deliberately NOT repeated here — the runtime already
 * renders `ESC Exit`, and a second control doing the same thing is a worse
 * page than a missing one.
 */
function GameView({ game, onExit }) {
  return (
    /*
     * `.game-page` owns the viewport so the bar and the cabinet can share it.
     *
     * Load-bearing, per this file's contract 1: `.game-wrapper` sets
     * `min-height: 100dvh` for the case where it IS the page. Nested in a row
     * here, that would push the canvas below the fold. `game-chrome.css`
     * releases it (`min-height: 0; height: 100%`) so the canvas area still
     * resolves to a non-zero height — a zero-height parent is a blank game,
     * because the runtime sizes the canvas bitmap from its parent's client box.
     */
    <div className="game-page">
      <header className="game-page__bar">
        <h1 className="game-page__title">{game.name}</h1>
      </header>
      <GameCanvas game={game} onExit={onExit} />
    </div>
  );
}

export default GameView;
