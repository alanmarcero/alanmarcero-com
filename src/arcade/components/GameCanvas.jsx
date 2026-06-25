import { useRef, useEffect, useState, useCallback } from 'react';
import { useGameLoop } from '../games/useGameLoop';
import { copyToClipboard } from '../../utils/clipboard';
import TouchControls from './TouchControls';

function GameCanvas({ game, onExit }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [hud, setHud] = useState({ score: 0, lives: 3, level: 1 });
  const [gameOver, setGameOver] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const copyTimerRef = useRef(null);

  const handleCopyLink = useCallback(async () => {
    const ok = await copyToClipboard(window.location.href);
    if (!ok) return;
    setLinkCopied(true);
    clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setLinkCopied(false), 1800);
  }, []);

  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  // Initialize game
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const instance = game.factory();

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      instance.resize(canvas.width, canvas.height);
    };

    const hudCallback = (data) => {
      setHud({ score: data.score, lives: data.lives, level: data.level });
      if (data.gameOver) setGameOver(true);
    };

    instance.onHudUpdate = hudCallback;
    gameRef.current = { instance, ctx };

    resizeCanvas();
    instance.init(canvas.width, canvas.height);

    window.addEventListener('resize', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      instance.destroy();
      gameRef.current = null;
    };
  }, [game]);

  // Game loop
  useGameLoop((dt) => {
    const g = gameRef.current;
    if (!g) return;
    g.instance.update(dt);
    g.instance.render(g.ctx);
  });

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onExit();
        return;
      }
      gameRef.current?.instance.handleKeyDown(e.key);
    };
    const handleKeyUp = (e) => {
      gameRef.current?.instance.handleKeyUp(e.key);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onExit]);

  const handleTouchAction = useCallback((action, active) => {
    gameRef.current?.instance.handleTouchAction(action, active);
  }, []);

  const handleRestart = useCallback(() => {
    const canvas = canvasRef.current;
    const instance = game.factory();
    const hudCallback = (data) => {
      setHud({ score: data.score, lives: data.lives, level: data.level });
      if (data.gameOver) setGameOver(true);
    };
    instance.onHudUpdate = hudCallback;
    gameRef.current?.instance.destroy();
    gameRef.current = { instance, ctx: canvas.getContext('2d') };
    instance.init(canvas.width, canvas.height);
    setGameOver(false);
    setHud({ score: 0, lives: 3, level: 1 });
  }, [game]);

  return (
    <div className="game-wrapper">
      <div className="game-hud">
        <div className="game-hud-stats">
          <div className="game-hud-stat">SCORE <span>{hud.score}</span></div>
          {hud.lives !== undefined && (
            <div className="game-hud-stat">LIVES <span>{hud.lives}</span></div>
          )}
          <div className="game-hud-stat">LEVEL <span>{hud.level}</span></div>
        </div>
        <div className="game-hud-actions">
          <button
            className={`game-hud-btn${linkCopied ? ' is-copied' : ''}`}
            onClick={handleCopyLink}
            aria-label="Copy a direct link to this game"
          >
            {linkCopied ? '✓ Link Copied' : 'Copy Link'}
          </button>
          <button className="game-hud-btn game-exit-btn" onClick={onExit}>ESC Exit</button>
        </div>
      </div>

      <div className="game-canvas-area">
        <canvas ref={canvasRef} />
        <div className="game-crt-overlay" />
        <div className="game-crt-vignette" />
        <div className="game-crt-reflection" />

        <TouchControls controls={game.controls.touch} onAction={handleTouchAction} />

        {gameOver && (
          <div className="game-over-overlay">
            <h2 className="game-over-title">GAME OVER</h2>
            <p className="game-over-score">Score: {hud.score}</p>
            <div className="game-over-actions">
              <button className="game-restart-btn" onClick={handleRestart}>Play Again</button>
              <button className="game-back-btn" onClick={onExit}>Back to Arcade</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GameCanvas;
