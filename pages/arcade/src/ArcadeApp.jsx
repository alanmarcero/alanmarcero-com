import { useState, useCallback, useEffect } from 'react';
import './ArcadeApp.css';
import ArcadeHeader from './components/ArcadeHeader';
import GamePicker from './components/GamePicker';
import GameCanvas from './components/GameCanvas';
import { getGameById } from './games/gameRegistry';

// Each game is addressable as `/arcade#<game-id>`. Hash routing keeps the
// static, no-router setup intact while making every game directly linkable.
const gameIdFromHash = () => {
  if (typeof window === 'undefined') return null;
  const id = window.location.hash.replace(/^#/, '');
  return getGameById(id) ? id : null;
};

function ArcadeApp() {
  const [activeGameId, setActiveGameId] = useState(gameIdFromHash);

  // Reflect the active game in the URL so it can be shared / bookmarked.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const desiredHash = activeGameId ? `#${activeGameId}` : '';
    if (window.location.hash === desiredHash) return;
    const url = `${window.location.pathname}${window.location.search}${desiredHash}`;
    window.history.pushState(null, '', url);
  }, [activeGameId]);

  // Follow shared links, back/forward navigation, and manual hash edits.
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

  const handleSelectGame = useCallback((gameId) => setActiveGameId(gameId), []);
  const handleExitGame = useCallback(() => setActiveGameId(null), []);

  const activeGame = getGameById(activeGameId);

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
