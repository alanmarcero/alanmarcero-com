import { useEffect, useRef } from 'react';

const MAX_DT = 0.05; // clamp to 50ms to avoid spiral-of-death

export function useGameLoop(callback) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    let frameId;
    let lastTime = performance.now();

    const tick = (now) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, MAX_DT);
      callbackRef.current(dt);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);
}
