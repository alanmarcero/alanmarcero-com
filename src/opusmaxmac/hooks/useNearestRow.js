import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Which row of the register the reader is currently on.
 *
 * The register keeps one instrument beside it rather than giving every row its
 * own figure, so something has to decide which row the instrument is showing.
 * A thin band across the middle of the viewport does it: the row crossing that
 * band is the row being read.
 *
 * Implemented with a negative `rootMargin` on both sides, which shrinks the
 * observer's root to that band. Without an IntersectionObserver — jsdom, and
 * anything very old — the first row stays selected, which is a static page
 * with one photograph rather than a broken one.
 *
 * @param {number} count how many rows there are; re-observes when it changes
 * @param {string} band how much of the viewport to discard top and bottom
 * @returns {[(index: number) => (element: Element|null) => void, number]}
 */
export default function useNearestRow(count, band = '-45%') {
  const rows = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const rowRef = useCallback(
    (index) => (element) => {
      rows.current[index] = element;
    },
    [],
  );

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = Number(entry.target.dataset.row);
          if (Number.isInteger(index)) setActiveIndex(index);
        });
      },
      { rootMargin: `${band} 0px ${band} 0px` },
    );

    const observed = rows.current.slice(0, count).filter(Boolean);
    observed.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [count, band]);

  // A filtered register can end up shorter than the row that was selected.
  useEffect(() => {
    if (count > 0 && activeIndex > count - 1) setActiveIndex(0);
  }, [count, activeIndex]);

  return [rowRef, activeIndex];
}
