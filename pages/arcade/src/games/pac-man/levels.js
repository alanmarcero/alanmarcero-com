/**
 * Per-level tuning tables from the original arcade ROM.
 *
 * Speeds are percentages of the machine's 100%, which is 75.75757 px/s — one
 * tile is 8 px there, so 100% is a shade under 9.5 tiles/s. Everything is kept
 * as a percentage so the numbers match published tables and can be checked
 * against them; the game converts to tiles/s once.
 */

/** Arcade 100% speed, expressed in tiles per second. */
export const FULL_SPEED_TILES = 75.75757 / 8;

/**
 * Movement speeds by level band. `pac`/`ghost` are the normal rates;
 * `pacFright`/`ghostFright` apply while an energizer is active; `tunnel` is the
 * ghost rate inside the wrap corridor, where they always crawl.
 */
const SPEED_BANDS = [
  { upTo: 1, pac: 0.8, pacFright: 0.9, ghost: 0.75, ghostFright: 0.5, tunnel: 0.4 },
  { upTo: 4, pac: 0.9, pacFright: 0.95, ghost: 0.85, ghostFright: 0.55, tunnel: 0.45 },
  { upTo: 20, pac: 1.0, pacFright: 1.0, ghost: 0.95, ghostFright: 0.6, tunnel: 0.5 },
  { upTo: Infinity, pac: 0.9, pacFright: 0.9, ghost: 0.95, ghostFright: 0.6, tunnel: 0.5 },
];

/**
 * Scatter/chase wave lengths in seconds, alternating scatter first. The last
 * entry is Infinity: once the waves run out the ghosts chase for good.
 */
const WAVE_BANDS = [
  { upTo: 1, waves: [7, 20, 7, 20, 5, 20, 5, Infinity] },
  { upTo: 4, waves: [7, 20, 7, 20, 5, 1033, 1 / 60, Infinity] },
  { upTo: Infinity, waves: [5, 20, 5, 20, 5, 1037, 1 / 60, Infinity] },
];

/**
 * Energizer duration in seconds and how many times the ghosts flash before it
 * ends. From level 19 the energizer stops frightening them at all — it still
 * scores, but nothing turns blue.
 */
const FRIGHT_TABLE = [
  { secs: 6, flashes: 5 }, { secs: 5, flashes: 5 }, { secs: 4, flashes: 5 },
  { secs: 3, flashes: 5 }, { secs: 2, flashes: 5 }, { secs: 5, flashes: 5 },
  { secs: 2, flashes: 5 }, { secs: 2, flashes: 5 }, { secs: 1, flashes: 3 },
  { secs: 5, flashes: 5 }, { secs: 2, flashes: 5 }, { secs: 1, flashes: 3 },
  { secs: 1, flashes: 3 }, { secs: 3, flashes: 5 }, { secs: 1, flashes: 3 },
  { secs: 1, flashes: 3 }, { secs: 0, flashes: 0 }, { secs: 1, flashes: 3 },
];

/**
 * Cruise Elroy: Blinky speeds up once the dots run low, twice. Values are
 * dots-remaining thresholds and the speed multiplier that kicks in.
 */
const ELROY_BANDS = [
  { upTo: 1, dots1: 20, dots2: 10 },
  { upTo: 2, dots1: 30, dots2: 15 },
  { upTo: 5, dots1: 40, dots2: 20 },
  { upTo: 8, dots1: 50, dots2: 25 },
  { upTo: 11, dots1: 60, dots2: 30 },
  { upTo: 14, dots1: 80, dots2: 40 },
  { upTo: 18, dots1: 100, dots2: 50 },
  { upTo: Infinity, dots1: 120, dots2: 60 },
];

/** Dots Pac-Man must eat before each penned ghost is let out. */
const HOUSE_DOTS = [
  { upTo: 1, pinky: 0, inky: 30, clyde: 60 },
  { upTo: 2, pinky: 0, inky: 0, clyde: 50 },
  { upTo: Infinity, pinky: 0, inky: 0, clyde: 0 },
];

/** Bonus fruit: the two spawn points are fixed at 70 and 170 dots eaten. */
export const FRUIT_SPAWN_DOTS = [70, 170];
export const FRUIT_VISIBLE_SECS = 9.5;

const FRUIT_TABLE = [
  { name: 'cherry', points: 100 },
  { name: 'strawberry', points: 300 },
  { name: 'orange', points: 500 },
  { name: 'orange', points: 500 },
  { name: 'apple', points: 700 },
  { name: 'apple', points: 700 },
  { name: 'melon', points: 1000 },
  { name: 'melon', points: 1000 },
  { name: 'galaxian', points: 2000 },
  { name: 'galaxian', points: 2000 },
  { name: 'bell', points: 3000 },
  { name: 'bell', points: 3000 },
  { name: 'key', points: 5000 },
];

export const SCORE = {
  DOT: 10,
  ENERGIZER: 50,
  GHOST_CHAIN: [200, 400, 800, 1600],
  EXTRA_LIFE_AT: 10000,
};

export const STARTING_LIVES = 3;

/**
 * If Pac-Man dawdles without eating, the house releases a ghost anyway so the
 * level cannot stall. Four seconds early on, three from level five.
 */
export function houseTimeoutSecs(level) {
  return level < 5 ? 4 : 3;
}

function bandFor(bands, level) {
  return bands.find((b) => level <= b.upTo) ?? bands[bands.length - 1];
}

export function speedsForLevel(level) {
  const band = bandFor(SPEED_BANDS, level);
  return {
    pac: band.pac * FULL_SPEED_TILES,
    pacFright: band.pacFright * FULL_SPEED_TILES,
    ghost: band.ghost * FULL_SPEED_TILES,
    ghostFright: band.ghostFright * FULL_SPEED_TILES,
    tunnel: band.tunnel * FULL_SPEED_TILES,
    // Eyes return home much faster than a live ghost ever moves.
    eyes: 1.6 * FULL_SPEED_TILES,
  };
}

export function wavesForLevel(level) {
  return bandFor(WAVE_BANDS, level).waves;
}

export function frightForLevel(level) {
  // Past the table (level 19 on) the energizer stops frightening anyone — it
  // still scores, but no ghost turns blue. Do not clamp to the last row.
  return FRIGHT_TABLE[level - 1] ?? { secs: 0, flashes: 0 };
}

export function elroyForLevel(level) {
  const band = bandFor(ELROY_BANDS, level);
  return { dots1: band.dots1, dots2: band.dots2 };
}

export function houseDotsForLevel(level) {
  const band = bandFor(HOUSE_DOTS, level);
  return { pinky: band.pinky, inky: band.inky, clyde: band.clyde };
}

export function fruitForLevel(level) {
  return FRUIT_TABLE[Math.min(level, FRUIT_TABLE.length) - 1];
}
