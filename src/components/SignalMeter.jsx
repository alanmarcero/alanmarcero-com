import { useEffect } from 'react';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';
import useInViewport from '../hooks/useInViewport';
import { segmentBand, createBarParams, barTarget, stepBar, staticBars } from './spectrum';

/**
 * Decorative spectrum analyzer styled after the classic Winamp visualizer:
 * vertical LED bars coloured green → yellow → red by height, with light
 * peak-hold caps that jump up and slowly fall. There's no real audio — the
 * spectrum is simulated. Purely ornamental (aria-hidden); paused under
 * prefers-reduced-motion (drawn once, static) and while scrolled off-screen
 * (the footer sits below the fold, so the rAF loop would otherwise run unseen).
 */

// logical geometry (CSS px; scaled by devicePixelRatio for crispness)
const W = 132;
const H = 28;
const BARS = 18;
const BAR_GAP = 1;
const SEG_H = 2;
const SEG_GAP = 1;
const ROW = SEG_H + SEG_GAP;
const SEGMENTS = Math.floor((H + SEG_GAP) / ROW);
const BAR_W = (W - (BARS - 1) * BAR_GAP) / BARS;

const FRAME_MS = 1000 / 30;

const BAND_COLORS = { green: '#1fe03a', yellow: '#ece520', red: '#ff3020' };
const PEAK = '#d8d8c4';

export default function SignalMeter({ className = '' }) {
  const reduced = usePrefersReducedMotion();
  // start the loop a little before the footer scrolls into view
  const [canvasRef, inView] = useInViewport({ rootMargin: '200px' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined; // jsdom has no 2d context

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const render = (bars) => {
      ctx.clearRect(0, 0, W, H);
      bars.forEach(({ level, peak }, i) => {
        const x = i * (BAR_W + BAR_GAP);
        const lit = Math.round(level * SEGMENTS);
        for (let s = 0; s < lit; s++) {
          ctx.fillStyle = BAND_COLORS[segmentBand(s / (SEGMENTS - 1))];
          ctx.fillRect(x, H - (s + 1) * ROW + SEG_GAP, BAR_W, SEG_H);
        }
        const pk = Math.round(peak * SEGMENTS);
        if (pk > 0) {
          ctx.fillStyle = PEAK;
          ctx.fillRect(x, H - pk * ROW + SEG_GAP, BAR_W, SEG_H);
        }
      });
    };

    if (reduced) {
      render(staticBars(BARS));
      return undefined;
    }

    // off-screen: skip the rAF loop entirely so it costs nothing while unseen
    if (!inView) return undefined;

    const params = createBarParams(BARS);
    let bars = Array.from({ length: BARS }, () => ({ level: 0, peak: 0 }));
    let raf;
    let last = 0;
    let start = null;
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      if (now - last < FRAME_MS) return;
      last = now;
      if (start === null) start = now;
      const t = (now - start) / 1000;
      bars = bars.map((bar, i) => stepBar(bar, barTarget(t, i, BARS, params[i])));
      render(bars);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, inView, canvasRef]);

  return <canvas ref={canvasRef} className={`signal-meter ${className}`.trim()} aria-hidden="true" />;
}
