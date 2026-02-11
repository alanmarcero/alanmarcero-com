import CabinetCard from './CabinetCard';
import { games } from '../games/gameRegistry';

function GamePicker({ onSelectGame }) {
  return (
    <div className="game-picker">
      <p className="picker-subtitle">Choose your game</p>
      <div className="picker-grid">
        {games.map((game) => (
          <CabinetCard key={game.id} game={game} onSelect={onSelectGame} />
        ))}
      </div>
    </div>
  );
}

export default GamePicker;
