import { useRef, useEffect } from 'react';

/**
 * Drives a scroll-progress indicator without re-rendering the React tree.
 *
 * Returns a ref to attach to the indicator element; the hook writes
 * `transform: scaleX(fraction)` straight to that element's style, coalescing
 * bursts of scroll events into a single write per animation frame. Keeping the
 * update off React state avoids reconciling the whole page on every scroll.
 *
 * @returns {React.RefObject<HTMLElement>} ref for the progress element
 */
function useScrollProgress() {
  const ref = useRef(null);

  useEffect(() => {
    let raf = 0;

    const apply = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.transform = `scaleX(${progress})`;
    };

    const schedule = () => {
      if (raf) return; // already queued for this frame
      raf = requestAnimationFrame(apply);
    };

    apply(); // set the initial position
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return ref;
}

export default useScrollProgress;
