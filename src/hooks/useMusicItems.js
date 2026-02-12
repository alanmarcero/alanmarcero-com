import { useState, useEffect } from 'react';
import { LAMBDA_URL } from '../config';

function useMusicItems() {
  const [musicItems, setMusicItems] = useState([]);
  const [musicLoading, setMusicLoading] = useState(true);
  const [musicError, setMusicError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(LAMBDA_URL, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`Failed to load music: ${response.status}`);
        return response.json();
      })
      .then(musicResponse => {
        setMusicItems(musicResponse.items ?? []);
      })
      .catch(error => {
        if (error.name === 'AbortError') return;
        setMusicError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setMusicLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { musicItems, musicLoading, musicError };
}

export default useMusicItems;
