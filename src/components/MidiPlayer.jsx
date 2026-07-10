import { useState, useRef, useEffect } from 'react';
import { createMidiPlayer } from '../eras/midiPlayer';
import { TRACKS, DEFAULT_TRACK_ID } from '../eras/miditracks';

const DEFAULT_INDEX = Math.max(0, TRACKS.findIndex((t) => t.id === DEFAULT_TRACK_ID));

/**
 * A period-correct auto-playing "MIDI" background player for the GeoCities era:
 * a playlist of synthesized late-'90s/early-2000s bangers (Sandstorm by
 * default). Tries to autostart on mount — works when mounted from the click
 * that entered the era; otherwise the visitor can hit play. Stops on unmount.
 */
function MidiPlayer({ autoStart = false }) {
  const playerRef = useRef(null);
  const [index, setIndex] = useState(DEFAULT_INDEX);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const player = createMidiPlayer();
    playerRef.current = player;
    if (autoStart) {
      player.play(TRACKS[DEFAULT_INDEX]);
      setPlaying(player.playing);
    }
    return () => player.stop();
  }, [autoStart]);

  const playIndex = (nextIndex) => {
    const wrapped = (nextIndex + TRACKS.length) % TRACKS.length;
    setIndex(wrapped);
    playerRef.current?.play(TRACKS[wrapped]);
    setPlaying(!!playerRef.current?.playing);
  };

  const toggle = () => {
    const player = playerRef.current;
    if (!player) return;
    if (player.playing) {
      player.stop();
      setPlaying(false);
    } else {
      player.play(TRACKS[index]);
      setPlaying(player.playing);
    }
  };

  const track = TRACKS[index];

  return (
    <div className="gc-midi">
      <div className="gc-midi__screen">
        <span className="gc-midi__note" aria-hidden="true">♪♫</span>
        <span className="gc-midi__title">{track.name}</span>
      </div>
      <div className="gc-midi__controls">
        <button type="button" className="gc-midi__btn" onClick={() => playIndex(index - 1)} aria-label="Previous track">
          ◄◄
        </button>
        <button type="button" className="gc-midi__btn" onClick={toggle} aria-label={playing ? 'Stop' : 'Play'}>
          {playing ? '■' : '►'}
        </button>
        <button type="button" className="gc-midi__btn" onClick={() => playIndex(index + 1)} aria-label="Next track">
          ►►
        </button>
      </div>
      <select
        className="gc-midi__list"
        value={track.id}
        onChange={(e) => playIndex(TRACKS.findIndex((t) => t.id === e.target.value))}
        aria-label="Choose a MIDI"
      >
        {TRACKS.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
    </div>
  );
}

export default MidiPlayer;
