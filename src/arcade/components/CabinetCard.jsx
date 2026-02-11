import { useRef, useEffect } from 'react';

function CabinetCard({ game, onSelect }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const instance = game.factory();

    // Suppress HUD updates for demo
    instance.onHudUpdate = (data) => {
      if (data.gameOver) {
        // Restart demo after a pause
        setTimeout(() => {
          if (!gameRef.current) return;
          const fresh = game.factory();
          fresh.onHudUpdate = instance.onHudUpdate;
          gameRef.current.instance.destroy();
          gameRef.current.instance = fresh;
          const c = canvasRef.current;
          if (c) fresh.init(c.width, c.height);
        }, 1500);
      }
    };

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      instance.resize(canvas.width, canvas.height);
    };

    gameRef.current = { instance };
    resize();
    instance.init(canvas.width, canvas.height);

    let lastTime = performance.now();
    const tick = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const g = gameRef.current;
      if (!g) return;
      g.instance.update(dt);
      g.instance.render(ctx);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);

    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
      gameRef.current?.instance.destroy();
      gameRef.current = null;
    };
  }, [game]);

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
