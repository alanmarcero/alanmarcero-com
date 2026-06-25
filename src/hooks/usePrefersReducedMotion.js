import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

const supportsMatchMedia = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function';

const readPreference = () =>
  supportsMatchMedia() ? window.matchMedia(QUERY).matches : false;

/**
 * Tracks the user's `prefers-reduced-motion` setting.
 *
 * CSS animations are already disabled globally via a media query, but SMIL
 * (`<animate>`) and JS-driven motion are not — components use this hook to
 * opt out of those explicitly.
 */
export default function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(readPreference);

  useEffect(() => {
    if (!supportsMatchMedia()) return undefined;
    const query = window.matchMedia(QUERY);
    const onChange = () => setPrefersReduced(query.matches);
    onChange();
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return prefersReduced;
}
