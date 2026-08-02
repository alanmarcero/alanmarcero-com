import GameCanvas from '../../arcade/components/GameCanvas';
import './game-chrome.css';

/**
 * The running game, mounted unchanged — wearing this sheet's chrome rather
 * than its own.
 *
 * `GameCanvas`, the loop, the HUD markup and the touch controls are the
 * existing runtime, untouched. It imports no CSS of its own, so it renders
 * against whatever stylesheet an ancestor loaded; `game-chrome.css` covers
 * every class name it emits, including the touch controls, whose only
 * styling lives in the old page's stylesheet.
 *
 * Lazily loaded, so the chrome and the runtime arrive together and only
 * once a machine is chosen.
 */
function GameStage({ game, onExit }) {
  return <GameCanvas game={game} onExit={onExit} />;
}

export default GameStage;
