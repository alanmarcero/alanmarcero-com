import {
  DIRECTION_ORDER, VECTORS, reverseOf, distanceSquared, tilesAhead,
  chaseTarget, scatterTarget, legalDirections, chooseDirection,
  chooseFrightenedDirection,
} from './ghostAI';
import { buildGrid } from './maze';

const grid = buildGrid();

describe('ghostAI helpers', () => {
  it('orders candidate directions up, left, down, right', () => {
    expect(DIRECTION_ORDER).toEqual(['up', 'left', 'down', 'right']);
  });

  it('maps each direction to a unit vector', () => {
    expect(VECTORS.up).toEqual({ col: 0, row: -1 });
    expect(VECTORS.down).toEqual({ col: 0, row: 1 });
    expect(VECTORS.left).toEqual({ col: -1, row: 0 });
    expect(VECTORS.right).toEqual({ col: 1, row: 0 });
  });

  it('reverses directions', () => {
    expect(reverseOf('up')).toBe('down');
    expect(reverseOf('left')).toBe('right');
  });

  it('measures squared distance', () => {
    expect(distanceSquared({ col: 0, row: 0 }, { col: 3, row: 4 })).toBe(25);
  });
});

describe('tilesAhead', () => {
  const pac = { col: 10, row: 10 };

  it('projects along the facing direction', () => {
    expect(tilesAhead(pac, 'left', 4)).toEqual({ col: 6, row: 10 });
    expect(tilesAhead(pac, 'right', 4)).toEqual({ col: 14, row: 10 });
    expect(tilesAhead(pac, 'down', 4)).toEqual({ col: 10, row: 14 });
  });

  it('reproduces the arcade overflow bug when facing up', () => {
    // The original ROM shifts left as well as up. Preserved on purpose.
    expect(tilesAhead(pac, 'up', 4)).toEqual({ col: 6, row: 6 });
    expect(tilesAhead(pac, 'up', 2)).toEqual({ col: 8, row: 8 });
  });
});

describe('chase targets', () => {
  const pacTile = { col: 10, row: 20 };
  const blinkyTile = { col: 5, row: 20 };

  it('sends Blinky straight at Pac-Man', () => {
    const target = chaseTarget('blinky', { pacTile, pacDir: 'left', blinkyTile, ghostTile: blinkyTile });

    expect(target).toEqual({ col: 10, row: 20 });
  });

  it('sends Pinky four tiles in front of Pac-Man', () => {
    const target = chaseTarget('pinky', { pacTile, pacDir: 'right', blinkyTile, ghostTile: { col: 1, row: 1 } });

    expect(target).toEqual({ col: 14, row: 20 });
  });

  it('carries the overflow bug into Pinky when Pac-Man faces up', () => {
    const target = chaseTarget('pinky', { pacTile, pacDir: 'up', blinkyTile, ghostTile: { col: 1, row: 1 } });

    expect(target).toEqual({ col: 6, row: 16 });
  });

  it('reflects Blinky through the tile two ahead of Pac-Man for Inky', () => {
    // Pivot is (12,20); doubling from Blinky at (5,20) gives (19,20).
    const target = chaseTarget('inky', { pacTile, pacDir: 'right', blinkyTile, ghostTile: { col: 1, row: 1 } });

    expect(target).toEqual({ col: 19, row: 20 });
  });

  it('carries the overflow bug into Inky when Pac-Man faces up', () => {
    // Pivot becomes (8,18); doubling from Blinky at (5,20) gives (11,16).
    const target = chaseTarget('inky', { pacTile, pacDir: 'up', blinkyTile, ghostTile: { col: 1, row: 1 } });

    expect(target).toEqual({ col: 11, row: 16 });
  });

  it('makes Clyde chase while he is more than eight tiles out', () => {
    const far = { col: 10, row: 3 };
    const target = chaseTarget('clyde', { pacTile, pacDir: 'left', blinkyTile, ghostTile: far });

    expect(target).toEqual({ col: 10, row: 20 });
  });

  it('makes Clyde break for his corner once inside eight tiles', () => {
    const near = { col: 10, row: 14 };
    const target = chaseTarget('clyde', { pacTile, pacDir: 'left', blinkyTile, ghostTile: near });

    expect(target).toEqual(scatterTarget('clyde'));
  });

  it('switches Clyde exactly at the eight-tile boundary', () => {
    const atEight = { col: 10, row: 28 };
    const justOutside = { col: 10, row: 29 };

    expect(chaseTarget('clyde', { pacTile, pacDir: 'left', blinkyTile, ghostTile: atEight }))
      .toEqual(scatterTarget('clyde'));
    expect(chaseTarget('clyde', { pacTile, pacDir: 'left', blinkyTile, ghostTile: justOutside }))
      .toEqual({ col: 10, row: 20 });
  });
});

describe('legalDirections', () => {
  it('never offers the reverse of the current direction', () => {
    const options = legalDirections(grid, { col: 6, row: 8 }, 'right');

    expect(options).not.toContain('left');
  });

  it('excludes directions blocked by wall', () => {
    // Row 1 col 1 is the top-left dot pocket; up is the outer wall.
    const options = legalDirections(grid, { col: 1, row: 1 }, 'right');

    expect(options).not.toContain('up');
  });

  it('refuses to turn up on a no-up tile', () => {
    const options = legalDirections(grid, { col: 12, row: 13 }, 'left');

    expect(options).not.toContain('up');
  });

  it('returns candidates in the tie-break order', () => {
    const options = legalDirections(grid, { col: 6, row: 8 }, 'down');
    const expectedOrder = DIRECTION_ORDER.filter((d) => options.includes(d));

    expect(options).toEqual(expectedOrder);
  });
});

describe('chooseDirection', () => {
  it('takes the exit that closes on the target', () => {
    // At the row-8 junction under the top-left block, a target far below
    // should pull the ghost downward.
    const dir = chooseDirection({
      grid,
      tile: { col: 6, row: 8 },
      currentDir: 'right',
      target: { col: 6, row: 26 },
    });

    expect(dir).toBe('down');
  });

  it('takes the opposite exit for a target above', () => {
    const dir = chooseDirection({
      grid,
      tile: { col: 6, row: 8 },
      currentDir: 'right',
      target: { col: 6, row: 1 },
    });

    expect(dir).toBe('up');
  });

  it('breaks a tie by preferring up over left', () => {
    // A target equidistant up and left must resolve to up.
    const tile = { col: 6, row: 8 };
    const options = legalDirections(grid, tile, 'right');
    expect(options).toEqual(expect.arrayContaining(['up', 'down']));

    const dir = chooseDirection({ grid, tile, currentDir: 'right', target: tile });

    expect(dir).toBe(options[0]);
  });

  it('falls back to reversing when every exit is blocked', () => {
    // Boxed in on all four sides, so the rule has nothing to choose from.
    const walled = { col: 0, row: 0 };
    expect(legalDirections(grid, walled, 'right')).toEqual([]);

    const dir = chooseDirection({ grid, tile: walled, currentDir: 'right', target: { col: 26, row: 1 } });

    expect(dir).toBe('left');
  });

  it('still advances toward the target from a three-way junction', () => {
    // (1,1) has only one legal exit heading up: right. Not a dead end.
    const dir = chooseDirection({
      grid,
      tile: { col: 1, row: 1 },
      currentDir: 'up',
      target: { col: 26, row: 1 },
    });

    expect(dir).toBe('right');
  });

  it('keeps eyes able to cross the ghost-house door', () => {
    const withoutDoor = legalDirections(grid, { col: 13, row: 11 }, 'left');
    const withDoor = legalDirections(grid, { col: 13, row: 11 }, 'left', { doorPassable: true });

    expect(withoutDoor).not.toContain('down');
    expect(withDoor).toContain('down');
  });
});

describe('chooseFrightenedDirection', () => {
  const tile = { col: 6, row: 8 };

  it('picks from the legal exits', () => {
    const options = legalDirections(grid, tile, 'right');
    const dir = chooseFrightenedDirection({ grid, tile, currentDir: 'right', random: () => 0 });

    expect(options).toContain(dir);
    expect(dir).toBe(options[0]);
  });

  it('reaches the last option when the draw is high', () => {
    const options = legalDirections(grid, tile, 'right');
    const dir = chooseFrightenedDirection({ grid, tile, currentDir: 'right', random: () => 0.999 });

    expect(dir).toBe(options[options.length - 1]);
  });

  it('still refuses to double back', () => {
    const dir = chooseFrightenedDirection({ grid, tile, currentDir: 'right', random: () => 0.5 });

    expect(dir).not.toBe('left');
  });
});
