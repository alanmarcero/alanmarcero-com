import GameCanvas from '../../arcade/components/GameCanvas';
import '../../arcade/ArcadeApp.css';

/**
 * The running game, mounted unchanged with its own stylesheet.
 *
 * This module exists so that the game runtime's CSS is only fetched once a
 * game is actually launched. Loading it up front would style the cabinet
 * list too, and the old arcade's palette would bleed into the new layout.
 */
function GameView({ game, onExit }) {
  return <GameCanvas game={game} onExit={onExit} />;
}

export default GameView;
