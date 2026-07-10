import { trackToSequence } from './miditracks';

const getAudioContext = () =>
  typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);

/**
 * A looping Web Audio "MIDI" player for the era tracks. Synthesizes each note
 * with detuned sawtooths (cheap supersaw) through a lowpass. Returns
 * `{ play, stop, playing }`; when Web Audio is unavailable (jsdom) the controls
 * are safe no-ops. Must be started from a user gesture (autoplay policy).
 */
export function createMidiPlayer() {
  const AudioCtx = getAudioContext();
  if (!AudioCtx) {
    return { play() {}, stop() {}, get playing() { return false; } };
  }

  let ctx = null;
  let master = null;
  let timer = null;
  let current = null;
  let nextLoopAt = 0;
  let playing = false;

  const ensureContext = () => {
    if (ctx) return;
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = 0.18;
    master.connect(ctx.destination);
  };

  const playNote = (freq, at, dur) => {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.5, at + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, at + dur);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2600;
    gain.connect(filter).connect(master);
    [-7, 7].forEach((detune) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(gain);
      osc.start(at);
      osc.stop(at + dur + 0.02);
    });
  };

  // Only schedules while the context is actually running, so a blocked autoplay
  // (no user gesture yet) doesn't spam warnings or churn CPU.
  const tick = () => {
    if (!playing || !current || ctx.state !== 'running') return;
    while (nextLoopAt < ctx.currentTime + 0.3) {
      current.notes.forEach((n) => playNote(n.freq, nextLoopAt + n.at, n.dur));
      nextLoopAt += current.loopSeconds;
    }
    timer = setTimeout(tick, 100);
  };

  const begin = () => {
    if (!playing) return;
    if (timer) clearTimeout(timer);
    nextLoopAt = ctx.currentTime + 0.12;
    tick();
  };

  return {
    play(track) {
      ensureContext();
      current = trackToSequence(track);
      playing = true;
      if (ctx.state === 'running') {
        begin();
        return;
      }
      // needs a user gesture — try to resume, and only start if it takes
      ctx.resume().then(
        () => {
          if (ctx.state === 'running') begin();
          else playing = false;
        },
        () => {
          playing = false;
        }
      );
    },
    stop() {
      playing = false;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (ctx && ctx.state === 'running') ctx.suspend();
    },
    get playing() {
      return playing;
    },
  };
}
