import { useState, useEffect, useRef } from 'react';

/**
 * Tracks whether the referenced element is intersecting the viewport, so
 * consumers can pause off-screen work (canvas rAF loops, SVG SMIL animation)
 * that would otherwise burn CPU while invisible.
 *
 * Starts `false` (assume off-screen) and lets the observer report the real
 * state on its first callback — this way an element that loads off-screen never
 * animates before it is seen. When IntersectionObserver is unavailable (jsdom,
 * very old browsers) it falls back to `true` so animations still run.
 *
 * @param {object} [options]
 * @param {string} [options.rootMargin='0px'] expand the trigger box so work can
 *   spin up just before the element scrolls into view
 * @returns {[React.RefObject<Element>, boolean]} `[ref, inView]`
 */
export default function useInViewport({ rootMargin = '0px' } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true); // no observer: assume visible so animations still run
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return [ref, inView];
}
