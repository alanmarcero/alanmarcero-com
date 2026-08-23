/**
 * The 1980 arcade Pac-Man maze and the tile queries built on it.
 *
 * Authored as strings so the layout is readable in source and diffs
 * meaningfully. 28 columns x 31 rows, 240 dots + 4 energizers.
 *
 *   #  wall          .  dot
 *   o  energizer     -  ghost-house door
 *   (space)          empty walkable tile
 *
 * Row 14 is the tunnel row: stepping off either end wraps horizontally.
 */

export const COLS = 28;
export const ROWS = 31;

/** Virtual pixels per tile. 8 is the arcade's own figure, so the maze keeps its proportions. */
export const TILE_PX = 8;

const LAYOUT = [
  '############################',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#o####.#####.##.#####.####o#',
  '#.####.#####.##.#####.####.#',
  '#..........................#',
  '#.####.##.########.##.####.#',
  '#.####.##.########.##.####.#',
  '#......##....##....##......#',
  '######.##### ## #####.######',
  '######.##### ## #####.######',
  '######.##          ##.######',
  '######.## ###--### ##.######',
  '######.## #      # ##.######',
  '      .   #      #   .      ',
  '######.## #      # ##.######',
  '######.## ######## ##.######',
  '######.##          ##.######',
  '######.## ######## ##.######',
  '######.## ######## ##.######',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#.####.#####.##.#####.####.#',
  '#o..##.......  .......##..o#',
  '###.##.##.########.##.##.###',
  '###.##.##.########.##.##.###',
  '#......##....##....##......#',
  '#.##########.##.##########.#',
  '#.##########.##.##########.#',
  '#..........................#',
  '############################',
];

export const TILE = {
  WALL: '#',
  DOT: '.',
  ENERGIZER: 'o',
  DOOR: '-',
  EMPTY: ' ',
};

/** The row whose two open ends wrap into each other. */
export const TUNNEL_ROW = 14;

/**
 * Ghosts may not choose "up" when entering these tiles. An original quirk of
 * the arcade ROM, not a bug — it shapes the routes through the two corridors
 * above and below the ghost house.
 */
const NO_UP_TILES = [
  { col: 12, row: 13 },
  { col: 15, row: 13 },
  { col: 12, row: 25 },
  { col: 15, row: 25 },
];

/** Pac-Man starts between two tiles, facing left. */
export const PAC_START = { col: 13.5, row: 23, dir: 'left' };

/** The tile just outside the house door — where eaten ghosts head for. */
export const HOUSE_DOOR = { col: 13.5, row: 11 };

/** Inside the house: where the three penned ghosts bob. */
export const HOUSE_CENTER = { col: 13.5, row: 14 };

export const SCATTER_TARGETS = {
  blinky: { col: 25, row: 0 },
  pinky: { col: 2, row: 0 },
  inky: { col: 27, row: 30 },
  clyde: { col: 0, row: 30 },
};

export function buildGrid() {
  return LAYOUT.map((row) => row.split(''));
}

export function tileAt(grid, col, row) {
  if (row < 0 || row >= ROWS) return TILE.WALL;
  const wrapped = wrapCol(col);
  return grid[row][wrapped] ?? TILE.WALL;
}

/** Horizontal wrap for the tunnel; columns outside the grid come out the far side. */
export function wrapCol(col) {
  return ((col % COLS) + COLS) % COLS;
}

/**
 * Walls block everyone. The house door blocks Pac-Man and blocks ghosts too,
 * except the eyes of an eaten ghost returning home (and a ghost on its way out).
 */
export function isWalkable(grid, col, row, { doorPassable = false } = {}) {
  const tile = tileAt(grid, col, row);
  if (tile === TILE.WALL) return false;
  if (tile === TILE.DOOR) return doorPassable;
  return true;
}

export function countDots(grid) {
  return grid.flat().filter((t) => t === TILE.DOT || t === TILE.ENERGIZER).length;
}

export function isNoUpTile(col, row) {
  return NO_UP_TILES.some((t) => t.col === col && t.row === row);
}

/** True once the tile is close enough to its centre to count as "at" it. */
export function atTileCenter(pos, epsilon = 0.08) {
  return Math.abs(pos - Math.round(pos)) < epsilon;
}
