import { useEffect, useState } from 'react';

const supportsMatchMedia = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function';

const readMatch = (query) =>
  (supportsMatchMedia() ? window.matchMedia(query).matches : false);

/**
 * Tracks whether a media query currently matches.
 *
 * For layout that CSS alone can't express — an SVG viewBox, a canvas size —
 * a component needs the breakpoint in JS, not just in a stylesheet. Returns
 * false anywhere `matchMedia` is unavailable (SSR, older jsdom).
 */
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => readMatch(query));

  useEffect(() => {
    if (!supportsMatchMedia()) return undefined;
    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);
    onChange();
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
