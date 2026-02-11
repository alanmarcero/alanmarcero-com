import { useState, useCallback } from 'react';
import './ArcadeApp.css';
import ArcadeHeader from './components/ArcadeHeader';
import GamePicker from './components/GamePicker';
import GameCanvas from './components/GameCanvas';
import { games } from './games/gameRegistry';

function ArcadeApp() {
  const [activeGameId, setActiveGameId] = useState(null);

  const handleSelectGame = useCallback((gameId) => {
    setActiveGameId(gameId);
  }, []);

  const handleExitGame = useCallback(() => {
    setActiveGameId(null);
  }, []);

  const activeGame = activeGameId ? games.find((g) => g.id === activeGameId) : null;

  return (
    <>
      {activeGame ? (
        <GameCanvas game={activeGame} onExit={handleExitGame} />
      ) : (
        <div className="arcade-page">
          <ArcadeHeader />
          <GamePicker onSelectGame={handleSelectGame} />
        </div>
      )}
    </>
  );
}

export default ArcadeApp;
