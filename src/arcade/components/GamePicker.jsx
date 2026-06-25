import { useCallback } from 'react';
import CabinetCard from './CabinetCard';
import { games, pickRandomGameId } from '../games/gameRegistry';

function GamePicker({ onSelectGame }) {
  const handleRandom = useCallback(() => {
    onSelectGame(pickRandomGameId());
  }, [onSelectGame]);

  return (
    <div className="game-picker">
      <div className="picker-head">
        <p className="picker-subtitle">Choose your game — {games.length} cabinets</p>
        <button className="picker-random" onClick={handleRandom}>⚄ Random</button>
      </div>
      <div className="picker-grid">
        {games.map((game) => (
          <CabinetCard key={game.id} game={game} onSelect={onSelectGame} />
        ))}
      </div>
    </div>
  );
}

export default GamePicker;
