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
    why: 'You can quickly dial in a kick and tune its pitch from the note you play.',
  },
  {
    repo: 'openClapper',
    name: 'openClapper',
    summary: 'A pitched clap synthesizer with a tuned body, a flam of up to five hands, and a noise tail.',
    why: 'You can quickly dial in a clap and tune the body so it hits on the note you play.',
  },
  {
    repo: 'openHatter',
    name: 'openHatter',
    summary: 'A hi-hat synthesizer for trance and club drums.',
    why: 'You can quickly dial in a hi-hat. The stick tracks the note you play.',
  },
  {
    repo: 'openSmacker',
    name: 'openSmacker',
    summary: 'Pitched trance percussion for snares, bells, toms, and rim smacks.',
    why: 'You can quickly dial in pitched percussion and tune a tom to the bass line.',
  },
  {
    repo: 'openEDMDelay',
    name: 'openEDMDelay',
    summary: 'Beat-synced echoes built from eight taps.',
    why: 'Echoes lock to the beat, so a repeat lands on the grid position you give it.',
  },
  {
    repo: 'openEDMFilter',
    name: 'openEDMFilter',
    summary: 'A dual filter for transitions and resonant builds.',
    why: 'Two filters move with the tempo so you can shape a transition or a resonant build.',
  },
  {
    repo: 'openDucker',
    name: 'openDucker',
    summary: 'Automatic volume ducking and sidechain effects for a bass, pad, lead, or bus.',
    why: 'It ducks the sound around the kick so the kick has room.',
  },
  {
    repo: 'openGlitchFX',
    name: 'openGlitchFX',
    summary: 'Beat-synced glitches placed on a 32-step sequencer.',
    why: 'A glitch lands on the step you choose, in time with the beat.',
  },
  {
    repo: 'openSausage',
    name: 'openSausage',
    summary: 'Saturation, reverb, a rising pitch, and stereo width, in that order.',
    why: 'One style retunes the saturation, space, pitch rise, and width together.',
  },
  {
    repo: 'openWallLimiter',
    name: 'openWallLimiter',
    summary: 'A mastering limiter for peaks and loudness at the end of a mix.',
    why: 'It holds the peaks at the end of a mix and sets loudness for streaming or a club.',
  },
  {
    repo: 'openTunerEQ',
    name: 'openTunerEQ',
    summary: 'A five-band equalizer with note snapping and a live spectrum.',
    why: 'It puts a visualizer of the track and a tuned EQ in one plugin.',
  },
  {
    repo: 'openBassSpace',
    name: 'openBassSpace',
    summary: 'Separate stereo width for the bass and for the band above a crossover.',
    why: 'The bass can stay centered while you set a different width on the band above it.',
  },
  {
    repo: 'openFruit',
    name: 'openFruit',
    summary: 'A step sequencer and sample player that arranges four pages into a song.',
    why: 'You can write a drum pattern one hit at a time and arrange four pages into a song.',
  },
].map((plugin) => ({
  ...plugin,
  repoUrl: repoUrl(plugin.repo),
  shotUrl: shotUrl(plugin.repo),
}));
