/**
 * Era-appropriate "MIDI" tracks for the GeoCities background player — the kind
 * of auto-playing .mid files every homepage inflicted on you circa 2001.
 *
 * Each track is pure note data (MIDI numbers + beat durations); the player
 * synthesizes it with Web Audio. Recognizable riffs, no audio files.
 */

// MIDI note number → frequency (Hz), A4 (69) = 440.
export const mtof = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

// Darude — Sandstorm: eight phrases of seven staccato sixteenths + a rest,
// the relentless pulse with the B B B B / E E D A hook.
const sandstorm = () => {
  const pitches = [71, 71, 71, 71, 76, 76, 74, 69]; // B4 B4 B4 B4 E5 E5 D5 A4
  const notes = [];
  for (const p of pitches) {
    for (let i = 0; i < 7; i++) notes.push({ n: p, b: 0.25 });
    notes.push({ n: null, b: 0.25 });
  }
  return notes;
};

// Zombie Nation — Kernkraft 400: the "oh-oh-oh" stadium chant riff.
const zombieNation = () => {
  const pitches = [69, 69, 69, 69, 76, 76, 74, 72, 74, 74, 72, 71, 69, 69];
  return pitches.map((n) => ({ n, b: 0.5 }));
};

// Alice DeeJay — Better Off Alone: the syncopated trance lead hook.
const betterOffAlone = () => {
  const pitches = [73, 73, 71, 73, 76, 73, 71, 69, 71, 71, 69, 71, 68, 66];
  return pitches.map((n) => ({ n, b: 0.5 }));
};

// Voodoo & Serano — Blood Is Pumping: hard-trance stabs.
const bloodIsPumping = () => {
  const seq = [
    { n: 57, b: 0.5 }, { n: 57, b: 0.5 }, { n: 57, b: 0.5 }, { n: 60, b: 0.5 },
    { n: 64, b: 1 }, { n: 62, b: 0.5 }, { n: 60, b: 0.5 },
    { n: 57, b: 0.5 }, { n: 60, b: 0.5 }, { n: 64, b: 0.5 }, { n: 67, b: 0.5 },
    { n: 69, b: 1 }, { n: null, b: 0.5 },
  ];
  return seq;
};

// Euphoric A-minor arpeggio, straight sixteenths — generic trance filler.
const tranceArp = () => {
  const chords = [
    [57, 60, 64, 69], // Am
    [53, 57, 60, 65], // F
    [55, 59, 62, 67], // G
    [57, 60, 64, 69], // Am
  ];
  const notes = [];
  for (const chord of chords) {
    for (let rep = 0; rep < 2; rep++) {
      for (const n of chord) notes.push({ n, b: 0.25 });
    }
  }
  return notes;
};

export const TRACKS = [
  { id: 'sandstorm', name: 'sandstorm.mid', bpm: 136, notes: sandstorm() },
  {
    id: 'nokia',
    name: 'nokia.mid',
    bpm: 150,
    notes: [
      { n: 76, b: 0.5 }, { n: 74, b: 0.5 }, { n: 66, b: 1 }, { n: 68, b: 1 },
      { n: 73, b: 0.5 }, { n: 71, b: 0.5 }, { n: 62, b: 1 }, { n: 64, b: 1 },
      { n: 71, b: 0.5 }, { n: 69, b: 0.5 }, { n: 61, b: 1 }, { n: 64, b: 1 },
      { n: 69, b: 2 }, { n: null, b: 1 },
    ],
  },
  {
    id: 'furelise',
    name: 'furelise.mid',
    bpm: 120,
    notes: [
      { n: 76, b: 0.5 }, { n: 75, b: 0.5 }, { n: 76, b: 0.5 }, { n: 75, b: 0.5 },
      { n: 76, b: 0.5 }, { n: 71, b: 0.5 }, { n: 74, b: 0.5 }, { n: 72, b: 0.5 },
      { n: 69, b: 1 }, { n: null, b: 0.5 }, { n: 60, b: 0.5 }, { n: 64, b: 0.5 }, { n: 69, b: 0.5 },
      { n: 71, b: 1 }, { n: null, b: 0.5 }, { n: 64, b: 0.5 }, { n: 68, b: 0.5 }, { n: 71, b: 0.5 },
      { n: 72, b: 1 }, { n: null, b: 1 },
    ],
  },
  { id: 'zombienation', name: 'zombie_nation.mid', bpm: 132, notes: zombieNation() },
  { id: 'betteroffalone', name: 'better_off_alone.mid', bpm: 137, notes: betterOffAlone() },
  { id: 'bloodispumping', name: 'blood_is_pumping.mid', bpm: 145, notes: bloodIsPumping() },
  { id: 'trance', name: 'trance.mid', bpm: 140, notes: tranceArp() },
];

export const DEFAULT_TRACK_ID = 'sandstorm';

export const getTrack = (id) => TRACKS.find((t) => t.id === id) || TRACKS[0];

/**
 * Flatten a track into absolute-time note events for the player.
 * @returns {{ notes: {freq:number, at:number, dur:number}[], loopSeconds:number }}
 */
export function trackToSequence(track) {
  const beat = 60 / track.bpm;
  const notes = [];
  let at = 0;
  for (const note of track.notes) {
    const dur = note.b * beat;
    if (note.n != null) notes.push({ freq: mtof(note.n), at, dur: dur * 0.9 });
    at += dur;
  }
  return { notes, loopSeconds: at };
}
