import { useRef, useEffect, useState } from 'react';
import { useGameLoop } from '../games/useGameLoop';
import { controlGlyphs } from '../games/controlGlyphs';

// Cabinet demos are tiny thumbnails — a low frame rate is plenty and keeps the
// grid of 12 live canvases from saturating the compositor.
const DEMO_FPS = 15;
const DEMO_RESTART_DELAY_MS = 1500;

function CabinetCard({ game, onSelect }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    let restartTimer;

    // A demo that reaches game over holds its final frame for a beat, then
    // starts over, so the cabinet never sits dead.
    const startDemo = () => {
      const instance = game.factory();
      instance.onHudUpdate = (data) => {
        if (!data.gameOver) return;
        clearTimeout(restartTimer);
        restartTimer = setTimeout(startDemo, DEMO_RESTART_DELAY_MS);
      };
      gameRef.current?.instance.destroy();
      gameRef.current = { instance, ctx };
      instance.init(canvas.width, canvas.height);
    };

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      gameRef.current?.instance.resize(canvas.width, canvas.height);
    };

    resize();
    startDemo();
    gameRef.current.instance.render(ctx); // paint one frame so the cabinet isn't blank before the loop ticks

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);

    return () => {
      clearTimeout(restartTimer);
      ro.disconnect();
      gameRef.current?.instance.destroy();
      gameRef.current = null;
    };
  }, [game]);

  // Only run a demo while its cabinet is on-screen.
  useEffect(() => {
    const el = canvasRef.current?.closest('.crt-monitor');
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '100px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useGameLoop(
    (dt) => {
      const ref = gameRef.current;
      if (!ref) return;
      ref.instance.update(dt);
      ref.instance.render(ref.ctx);
    },
    { fps: DEMO_FPS, active: inView }
  );

  return (
    <button
      className="crt-monitor"
      onClick={() => onSelect(game.id)}
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
          <div className="crt-monitor-controls" aria-hidden="true">
            {controlGlyphs(game.controls).map((glyph) => (
              <span key={glyph} className="crt-monitor-key">{glyph}</span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

export default CabinetCard;
