import { useEffect, useRef, useState } from 'react';

/**
 * One instrument's closes, imported the first time `enabled` is true and
 * kept after that. `{ status: 'idle' | 'loading' | 'ready' | 'error', closes }`.
 */
export default function useCloses(load, enabled) {
  const [state, setState] = useState({ status: 'idle', closes: null });
  // the import starts once; scrolling away and back must not start another
  const started = useRef(false);

  useEffect(() => {
    if (!enabled || started.current) return;
    started.current = true;
    setState({ status: 'loading', closes: null });
    // no unmount guard: StrictMode's rehearsal unmount would discard the one
    // import there is, and a set on an unmounted component is a no-op anyway
    load()
      .then(({ CLOSES }) => setState({ status: 'ready', closes: CLOSES }))
      .catch(() => setState({ status: 'error', closes: null }));
  }, [enabled, load]);

  return state;
}
