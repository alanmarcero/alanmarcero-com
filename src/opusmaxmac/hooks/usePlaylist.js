import { useState, useEffect } from 'react';
import { LAMBDA_URL } from '../../config';

/**
 * The release log, from the site's own API at request time.
 *
 * Written for this route rather than shared with the other pages: same
 * endpoint, our own code, so a change here cannot re-render a page this work
 * is not supposed to touch.
 *
 * The API returns a title and a video id per item and nothing else — no date,
 * no description. Anything the log claims about a track has to come out of the
 * title, which is why the only mark a row carries is whether it is a remix.
 */
export default function usePlaylist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(LAMBDA_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        return response.json();
      })
      .then((payload) => setItems(payload.items ?? []))
      .catch((cause) => {
        if (cause.name === 'AbortError') return;
        setError(cause.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { items, loading, error };
}
