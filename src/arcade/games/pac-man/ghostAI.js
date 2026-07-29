/**
 * Ghost targeting and movement decisions, exactly as the 1980 arcade does it.
 *
 * There is no pathfinding here, and adding any would be wrong. A ghost looks
 * one tile ahead, picks the exit that sits closest in a straight line to its
 * target tile, and commits. It has no memory and no route. Everything that
 * looks like intelligence comes from the four ghosts choosing different target
 * tiles — that is the entire personality system.
 *
 * See the project spec for the source of these rules.
 */

import { isWalkable, isNoUpTile, SCATTER_TARGETS } from './maze';

/**
 * Candidate order IS the tie-break rule: when two exits are equally close to
 * the target, the arcade prefers up, then left, then down, then right. Do not
 * reorder — it changes ghost routes.
 */
export const DIRECTION_ORDER = ['up', 'left', 'down', 'right'];

export const VECTORS = {
  up: { col: 0, row: -1 },
  left: { col: -1, row: 0 },
  down: { col: 0, row: 1 },
  right: { col: 1, row: 0 },
};

const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

export function reverseOf(dir) {
  return OPPOSITE[dir];
}

/** Squared Euclidean distance — the arcade compares distances, never needs the root. */
export function distanceSquared(a, b) {
  const dc = a.col - b.col;
  const dr = a.row - b.row;
  return dc * dc + dr * dr;
}

/**
 * Project a tile some distance ahead of Pac-Man.
 *
 * WARNING — the `up` case is deliberately wrong. The original ROM adds the
 * offset to both the row and the column when Pac-Man faces up, an 8-bit
 * overflow bug in the developers' vector arithmetic. It is preserved here
 * because Pinky and Inky's real behaviour depends on it: it is why they crowd
 * a north-facing Pac-Man from the upper left rather than from directly above.
 * Do not "fix" this.
 */
export function tilesAhead(pacTile, pacDir, distance) {
  const v = VECTORS[pacDir] ?? VECTORS.left;
  const ahead = {
    col: pacTile.col + v.col * distance,
    row: pacTile.row + v.row * distance,
  };
  if (pacDir === 'up') ahead.col -= distance;
  return ahead;
}

/**
 * Each ghost's chase target.
 *
 * @param {string} name           blinky | pinky | inky | clyde
 * @param {{pacTile, pacDir, blinkyTile, ghostTile}} state
 */
export function chaseTarget(name, state) {
  const { pacTile, pacDir, blinkyTile, ghostTile } = state;

  if (name === 'blinky') return { ...pacTile };

  if (name === 'pinky') return tilesAhead(pacTile, pacDir, 4);

  if (name === 'inky') {
    // Pivot two tiles ahead of Pac-Man, then take Blinky's position and
    // reflect it through that pivot. Inky therefore only becomes dangerous
    // when Blinky closes in.
    const pivot = tilesAhead(pacTile, pacDir, 2);
    return {
      col: pivot.col * 2 - blinkyTile.col,
      row: pivot.row * 2 - blinkyTile.row,
    };
  }

  // Clyde chases until he gets within eight tiles, then loses his nerve and
  // makes for his own corner — which is why he drifts around the bottom left.
  const isClose = distanceSquared(ghostTile, pacTile) <= 8 * 8;
  return isClose ? { ...SCATTER_TARGETS.clyde } : { ...pacTile };
}

export function scatterTarget(name) {
  return { ...SCATTER_TARGETS[name] };
}

/**
 * Which exits a ghost may take from the tile it is entering.
 *
 * Reverse is excluded here because a ghost never chooses to turn around; a
 * reversal is only ever forced on it by a mode change.
 */
export function legalDirections(grid, tile, currentDir, { doorPassable = false } = {}) {
  const banned = reverseOf(currentDir);

  return DIRECTION_ORDER.filter((dir) => {
    if (dir === banned) return false;
    if (dir === 'up' && !doorPassable && isNoUpTile(tile.col, tile.row)) return false;
    const v = VECTORS[dir];
    return isWalkable(grid, tile.col + v.col, tile.row + v.row, { doorPassable });
  });
}

/**
 * The decision rule. Called as a ghost enters `tile`; returns the direction it
 * should leave by.
 *
 * Greedy and one tile deep: of the legal exits, take whichever neighbouring
 * tile lies closest to the target. Ties fall to DIRECTION_ORDER.
 */
export function chooseDirection({ grid, tile, currentDir, target, doorPassable = false }) {
  const options = legalDirections(grid, tile, currentDir, { doorPassable });

  // Boxed in — the only way out is back the way we came.
  if (options.length === 0) return reverseOf(currentDir);

  let best = options[0];
  let bestDistance = Infinity;

  options.forEach((dir) => {
    const v = VECTORS[dir];
    const neighbour = { col: tile.col + v.col, row: tile.row + v.row };
    const d = distanceSquared(neighbour, target);
    // Strict less-than preserves the tie-break: an earlier direction wins.
    if (d < bestDistance) {
      bestDistance = d;
      best = dir;
    }
  });

  return best;
}

/**
 * Frightened ghosts abandon their target and pick at random. They still may not
 * turn back on themselves.
 */
export function chooseFrightenedDirection({ grid, tile, currentDir, random = Math.random }) {
  const options = legalDirections(grid, tile, currentDir);
  if (options.length === 0) return reverseOf(currentDir);
  return options[Math.min(options.length - 1, Math.floor(random() * options.length))];
}
