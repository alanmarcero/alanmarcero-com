import { useState, useEffect } from 'react';
import { LAMBDA_URL } from '../config';

const LOADING = { musicItems: [], musicLoading: true, musicError: null };

export async function fetchMusicItems(signal) {
  const response = await fetch(LAMBDA_URL, { signal });
  if (!response.ok) throw new Error(`Failed to load music: ${response.status}`);
  const musicResponse = await response.json();
  return musicResponse.items ?? [];
}

// Items, loading and error land in one state update so a render never sees
// the items without the loading flag cleared (or the reverse).
function useMusicItems() {
  const [state, setState] = useState(LOADING);

  useEffect(() => {
    const controller = new AbortController();

    fetchMusicItems(controller.signal).then(
      (musicItems) => {
        if (controller.signal.aborted) return;
        setState({ musicItems, musicLoading: false, musicError: null });
      },
      (error) => {
        if (controller.signal.aborted || error.name === 'AbortError') return;
        setState({ musicItems: [], musicLoading: false, musicError: error.message });
      }
    );

    return () => controller.abort();
  }, []);

  return state;
}

export default useMusicItems;
