import { useEffect, useRef } from 'react';

/**
 * Runs `onPopstate` on back/forward navigation. Used by state that mirrors a
 * query param, so it can re-read the URL the browser has just restored.
 *
 * The latest callback is kept in a ref, so callers can pass an inline function
 * without re-subscribing on every render.
 */
export default function usePopstate(onPopstate) {
  const callbackRef = useRef(onPopstate);

  useEffect(() => {
    callbackRef.current = onPopstate;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handle = () => callbackRef.current();
    window.addEventListener('popstate', handle);
    return () => window.removeEventListener('popstate', handle);
  }, []);
}
