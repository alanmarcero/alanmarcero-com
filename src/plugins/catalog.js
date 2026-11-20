const MANAGER_RELEASE = 'https://github.com/alanmarcero/alan-m-OpenVSTManager/releases/latest';

const repoUrl = (repo) => `https://github.com/alanmarcero/${repo}`;
const releasesUrl = (repo) => `https://github.com/alanmarcero/${repo}/releases/latest`;
const latestReleaseApiUrl = (repo) =>
  `https://api.github.com/repos/alanmarcero/${repo}/releases/latest`;
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
  },
  {
    repo: 'openClapper',
    name: 'openClapper',
    summary: 'A pitched clap synthesizer with a tuned body, a flam of up to five hands, and a noise tail.',
  },
  {
    repo: 'openHatter',
    name: 'openHatter',
    summary: 'A hi-hat synthesizer for trance and club drums.',
  },
  {
    repo: 'openSmacker',
    name: 'openSmacker',
    summary: 'Pitched trance percussion for snares, bells, toms, and rim smacks.',
  },
  {
    repo: 'openEDMDelay',
    name: 'openEDMDelay',
    summary: 'Beat-synced echoes built from eight taps.',
  },
  {
    repo: 'openEDMFilter',
    name: 'openEDMFilter',
    summary: 'A dual filter for transitions and resonant builds.',
  },
  {
    repo: 'openDucker',
    name: 'openDucker',
    summary: 'Automatic volume ducking and sidechain effects for a bass, pad, lead, or bus.',
  },
  {
    repo: 'openGlitchFX',
    name: 'openGlitchFX',
    summary: 'Beat-synced glitches placed on a 32-step sequencer.',
  },
  {
    repo: 'openSausage',
    name: 'openSausage',
    summary: 'Saturation, reverb, a rising pitch, and stereo width, in that order.',
  },
  {
    repo: 'openWallLimiter',
    name: 'openWallLimiter',
    summary: 'A mastering limiter for peaks and loudness at the end of a mix.',
  },
  {
    repo: 'openTunerEQ',
    name: 'openTunerEQ',
    summary: 'A five-band equalizer with note snapping and a live spectrum.',
  },
  {
    repo: 'openBassSpace',
    name: 'openBassSpace',
    summary: 'Separate stereo width for the bass and for the band above a crossover.',
  },
  {
    repo: 'openFruit',
    name: 'openFruit',
    summary: 'A step sequencer and sample player that arranges four pages into a song.',
  },
].map((plugin) => ({
  ...plugin,
  repoUrl: repoUrl(plugin.repo),
  releasesUrl: releasesUrl(plugin.repo),
  latestReleaseApiUrl: latestReleaseApiUrl(plugin.repo),
  shotUrl: shotUrl(plugin.repo),
}));
