const MANAGER_RELEASE = 'https://github.com/alanmarcero/alan-m-OpenVSTManager/releases/latest';

const repoUrl = (repo) => `https://github.com/alanmarcero/${repo}`;
const shotUrl = (repo) =>
  `https://raw.githubusercontent.com/alanmarcero/${repo}/main/docs/screenshots/preview.png`;

// Facts are taken from each repo's README. openKicker's repository is openEDMKick.
export const MANAGER = {
  name: 'OpenVST Manager',
  summary: 'Installs, updates, and manages the plugins.',
  downloadUrl: MANAGER_RELEASE,
};

export const BETA_NOTE = 'All plugins are in beta. The macOS and Linux builds are not up to date, so Windows is the platform to use for now. A plugin can change dramatically from one release to the next, but the goal is for each one to keep getting better.';

export const PLUGINS = [
  {
    repo: 'openEDMKick',
    name: 'openKicker',
    summary: 'Pitched trance kicks and layered drum hits. MIDI notes set the kick pitch.',
    why: 'You can add up to four kick, snare, clap, or hat layers on one hit, and Hold MIDI notes plays it as a pitched synth.',
  },
  {
    repo: 'openClapper',
    name: 'openClapper',
    summary: 'A pitched clap synthesizer with a tuned body, a flam of up to five hands, and a noise tail.',
    why: 'The 56 factory claps are level-matched dance sounds, with the limiter set as a ceiling above the clap.',
  },
  {
    repo: 'openHatter',
    name: 'openHatter',
    summary: 'A hi-hat synthesizer for trance and club drums.',
    why: 'Eight hiss types and bronze shell resonators sit under a pitch-tracking stick. Factory hats run from short closed ticks to open rides past a second, and Hold notes lets the hat sustain from the keyboard.',
  },
  {
    repo: 'openSmacker',
    name: 'openSmacker',
    summary: 'Pitched trance percussion for snares, bells, toms, and rim smacks.',
    why: 'It covers a short backbeat, a tom tuned to the bass line, or a held metallic note. The 84 factory hits are split across those four voices.',
  },
  {
    repo: 'openEDMDelay',
    name: 'openEDMDelay',
    summary: 'Beat-synced echoes built from eight taps.',
    why: 'Each tap has its own grid position, level, and pan. The factory programs are grouped by delay type, and Reverse plays each echo backwards on a tempo division.',
  },
  {
    repo: 'openEDMFilter',
    name: 'openEDMFilter',
    summary: 'A dual filter for transitions and resonant builds.',
    why: 'Filter A and Filter B run in series or parallel. Each filter has its own tempo-synced sweep, plus an LFO and an envelope follower.',
  },
  {
    repo: 'openDucker',
    name: 'openDucker',
    summary: 'Automatic volume ducking and sidechain effects for a bass, pad, lead, or bus.',
    why: 'Sync, MIDI, or audio can start the duck. You shape one of 16 curves, and delay, reverb, sustain, and destroy can follow that curve.',
  },
  {
    repo: 'openGlitchFX',
    name: 'openGlitchFX',
    summary: 'Beat-synced glitches placed on a 32-step sequencer.',
    why: 'Each step can pass audio dry or route any mix of the 15 effects, so a stutter or tape stop can sit on one 32nd note.',
  },
  {
    repo: 'openSausage',
    name: 'openSausage',
    summary: 'Saturation, reverb, a rising pitch, and stereo width, in that order.',
    why: 'One style (Classic, Velvet, Punch, or Prism) retunes all four sections together, and Rise can sweep up to an octave over a set number of bars.',
  },
  {
    repo: 'openWallLimiter',
    name: 'openWallLimiter',
    summary: 'A mastering limiter for peaks and loudness at the end of a mix.',
    why: 'Styles set the recovery and the clipping. Match adds the gap between the measured loudness and a streaming or club target to the input drive.',
  },
  {
    repo: 'openTunerEQ',
    name: 'openTunerEQ',
    summary: 'A five-band equalizer with note snapping and a live spectrum.',
    why: 'Snap to notes tunes a band to semitones at an A4 reference from 400 to 480 Hz. A band can sit on stereo, left, right, mid, or side.',
  },
  {
    repo: 'openBassSpace',
    name: 'openBassSpace',
    summary: 'Separate stereo width for the bass and for the band above a crossover.',
    why: 'Width sets the bass from mono to double width. Stereoize adds width above the crossover while the bass stays centered, and Sub Drive saturates only that bass band.',
  },
  {
    repo: 'openFruit',
    name: 'openFruit',
    summary: 'A step sequencer and sample player that arranges four pages into a song.',
    why: 'The Citrus kit is 16 synthesized one-shots, and a saved song stores its samples in the session so the pattern still opens on another computer.',
  },
].map((plugin) => ({
  ...plugin,
  repoUrl: repoUrl(plugin.repo),
  shotUrl: shotUrl(plugin.repo),
}));
