import { useEffect } from 'react';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';
import useInViewport from '../hooks/useInViewport';

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

const BAR_FALL = 0.045; // bars drop fast (gravity)
const PEAK_FALL = 0.015; // peak caps linger above, falling slower
const FRAME_MS = 1000 / 30;

const GREEN = '#1fe03a';
const YELLOW = '#ece520';
const RED = '#ff3020';
const PEAK = '#d8d8c4';

// colour a segment by its height fraction (bottom green, mid yellow, top red)
const segColor = (frac) => (frac < 0.55 ? GREEN : frac < 0.8 ? YELLOW : RED);

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

    // per-bar oscillation params + live state
    const speed = [];
    const phase = [];
    const levels = new Array(BARS).fill(0);
    const peaks = new Array(BARS).fill(0);
    for (let i = 0; i < BARS; i++) {
      speed[i] = 1.4 + Math.random() * 3.2; // higher bars flicker faster
      phase[i] = Math.random() * Math.PI * 2;
    }

    const target = (t, i) => {
      const bass = 1 - (i / BARS) * 0.4; // low bars (bass) sit a touch higher
      const env = 0.55 + 0.45 * Math.sin(t * 0.6 + i * 0.5); // slow swell
      const osc = 0.5 + 0.5 * Math.sin(t * speed[i] + phase[i]);
      // boosted so bars regularly climb into the yellow/red, with beat spikes
      let v = osc * env * bass * 1.35;
      if (Math.random() < 0.05) v += 0.5; // occasional beat into the red
      v += (Math.random() - 0.5) * 0.15;
      return Math.max(0, Math.min(1, v));
    };

    const step = (t) => {
      for (let i = 0; i < BARS; i++) {
        const v = target(t, i);
        levels[i] = Math.max(v, levels[i] - BAR_FALL); // jump up, gravity down
        peaks[i] = levels[i] >= peaks[i] ? levels[i] : Math.max(0, peaks[i] - PEAK_FALL);
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < BARS; i++) {
        const x = i * (BAR_W + BAR_GAP);
        const lit = Math.round(levels[i] * SEGMENTS);
        for (let s = 0; s < lit; s++) {
          ctx.fillStyle = segColor(s / (SEGMENTS - 1));
          ctx.fillRect(x, H - (s + 1) * ROW + SEG_GAP, BAR_W, SEG_H);
        }
        const pk = Math.round(peaks[i] * SEGMENTS);
        if (pk > 0) {
          ctx.fillStyle = PEAK;
          ctx.fillRect(x, H - pk * ROW + SEG_GAP, BAR_W, SEG_H);
        }
      }
    };

    if (reduced) {
      // static frame: a frozen spectrum with peaks resting above the bars
      for (let i = 0; i < BARS; i++) {
        levels[i] = 0.25 + 0.5 * Math.abs(Math.sin(i * 0.9));
        peaks[i] = Math.min(1, levels[i] + 0.18);
      }
      render();
      return undefined;
    }

    // off-screen: skip the rAF loop entirely so it costs nothing while unseen
    if (!inView) return undefined;

    let raf;
    let last = 0;
    let start = null;
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      if (now - last < FRAME_MS) return;
      last = now;
      if (start === null) start = now;
      step((now - start) / 1000);
      render();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, inView, canvasRef]);

  return <canvas ref={canvasRef} className={`signal-meter ${className}`.trim()} aria-hidden="true" />;
}
