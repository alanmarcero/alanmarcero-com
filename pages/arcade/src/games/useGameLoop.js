import { useEffect, useRef } from 'react';

const MAX_DT = 0.05; // clamp to 50ms to avoid spiral-of-death

/**
 * requestAnimationFrame loop with delta-time clamping.
 *
 * Options:
 *   fps    — throttle to roughly this many ticks/sec (0 = uncapped, full rAF).
 *            Throttling is quantized to shared wall-clock buckets, so multiple
 *            loops tick on the SAME frames — the browser then composites at the
 *            throttled rate instead of every frame (key for the cabinet grid,
 *            where many canvases would otherwise repaint 60×/sec).
 *   active — when false, the loop is fully stopped (no rAF scheduled). Used to
 *            pause off-screen cabinet demos.
 */
export function useGameLoop(callback, { fps = 0, active = true } = {}) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!active) return undefined;

    let frameId;
    let lastTime = performance.now();
    const interval = fps > 0 ? 1000 / fps : 0;
    let lastBucket = -1;

    const tick = (now) => {
      frameId = requestAnimationFrame(tick);

      if (interval) {
        const bucket = Math.floor(now / interval);
        if (bucket === lastBucket) return; // not this loop's turn yet
        lastBucket = bucket;
      }

      const dt = Math.min((now - lastTime) / 1000, MAX_DT);
      lastTime = now;
      callbackRef.current(dt);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [fps, active]);
}
