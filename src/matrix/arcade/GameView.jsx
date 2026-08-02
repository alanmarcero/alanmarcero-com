import GameCanvas from '../../arcade/components/GameCanvas';
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
 */
function GameView({ game, onExit }) {
  return <GameCanvas game={game} onExit={onExit} />;
}

export default GameView;
