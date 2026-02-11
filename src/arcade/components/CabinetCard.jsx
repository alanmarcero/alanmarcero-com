import { useRef, useEffect } from 'react';
import { useGameLoop } from '../games/useGameLoop';

function CabinetCard({ game, onSelect }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const instance = game.factory();

    instance.onHudUpdate = (data) => {
      if (data.gameOver) {
        setTimeout(() => {
          if (!gameRef.current) return;
          const fresh = game.factory();
          fresh.onHudUpdate = instance.onHudUpdate;
          gameRef.current.instance.destroy();
          gameRef.current = { instance: fresh, ctx };
          const c = canvasRef.current;
          if (c) fresh.init(c.width, c.height);
        }, 1500);
      }
    };

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      gameRef.current?.instance.resize(canvas.width, canvas.height);
    };

    gameRef.current = { instance, ctx };
    resize();
    instance.init(canvas.width, canvas.height);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);

    return () => {
      ro.disconnect();
      gameRef.current?.instance.destroy();
      gameRef.current = null;
    };
  }, [game]);

  useGameLoop((dt) => {
    const ref = gameRef.current;
    if (!ref) return;
    ref.instance.update(dt);
    ref.instance.render(ref.ctx);
  });

  return (
    <button
      className="crt-monitor"
      onClick={() => onSelect(game.id)}
      style={{ '--monitor-accent': game.accent }}
    >
      <div className="crt-monitor-bezel">
        <div className="crt-monitor-screen">
          <canvas ref={canvasRef} className="crt-monitor-demo" />
          <div className="crt-monitor-scanlines" />
          <div className="crt-monitor-vignette" />
          <div className="crt-monitor-reflection" />
          <div className="crt-monitor-overlay">
            <span className="crt-monitor-title">{game.name}</span>
            <span className="crt-monitor-insert">INSERT COIN</span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default CabinetCard;
