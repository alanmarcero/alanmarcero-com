import { useState, useEffect } from 'react';

/**
 * Returns how far the page is scrolled, as a 0–1 fraction of the total
 * scrollable height. Useful for a scroll-progress indicator.
 */
function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const next = max > 0 ? window.scrollY / max : 0;
      setProgress(Math.min(1, Math.max(0, next)));
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return progress;
}

export default useScrollProgress;
