import {
  COLS, ROWS, TILE, TUNNEL_ROW, PAC_START, SCATTER_TARGETS,
  buildGrid, countDots, tileAt, isWalkable, wrapCol, isNoUpTile, atTileCenter,
} from './maze';

describe('maze', () => {
  const grid = buildGrid();

  it('is 28 columns by 31 rows', () => {
    expect(grid.length).toBe(ROWS);
    expect(new Set(grid.map((row) => row.length))).toEqual(new Set([COLS]));
  });

  it('holds the arcade pellet count: 240 dots and 4 energizers', () => {
    const dots = grid.flat().filter((t) => t === TILE.DOT).length;
    const energizers = grid.flat().filter((t) => t === TILE.ENERGIZER).length;

    expect(dots).toBe(240);
    expect(energizers).toBe(4);
    expect(countDots(grid)).toBe(244);
  });

  it('is mirror-symmetric left to right', () => {
    const asymmetric = [];
    grid.forEach((row, r) => {
      for (let c = 0; c < COLS / 2; c++) {
        if (row[c] !== row[COLS - 1 - c]) asymmetric.push(`${r},${c}`);
      }
    });

    expect(asymmetric).toEqual([]);
  });

  it('leaves every pellet reachable from the start tile', () => {
    const start = { col: Math.floor(PAC_START.col), row: PAC_START.row };
    const seen = new Set([`${start.col},${start.row}`]);
    const queue = [start];

    while (queue.length) {
      const { col, row } = queue.pop();
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dc, dr]) => {
        const nr = row + dr;
        if (nr < 0 || nr >= ROWS) return;
        const nc = wrapCol(col + dc);
        if (!isWalkable(grid, nc, nr)) return;
        const key = `${nc},${nr}`;
        if (seen.has(key)) return;
        seen.add(key);
        queue.push({ col: nc, row: nr });
      });
    }

    const stranded = [];
    grid.forEach((row, r) => row.forEach((tile, c) => {
      const isPellet = tile === TILE.DOT || tile === TILE.ENERGIZER;
      if (isPellet && !seen.has(`${c},${r}`)) stranded.push(`${r},${c}`);
    }));

    expect(stranded).toEqual([]);
  });

  it('starts Pac-Man on open floor', () => {
    expect(isWalkable(grid, 13, PAC_START.row)).toBe(true);
    expect(isWalkable(grid, 14, PAC_START.row)).toBe(true);
  });

  it('puts the four energizers in the corners of the playfield', () => {
    const positions = [];
    grid.forEach((row, r) => row.forEach((tile, c) => {
      if (tile === TILE.ENERGIZER) positions.push({ col: c, row: r });
    }));

    expect(positions).toEqual([
      { col: 1, row: 3 }, { col: 26, row: 3 },
      { col: 1, row: 23 }, { col: 26, row: 23 },
    ]);
  });

  describe('walls and the door', () => {
    it('treats walls as solid', () => {
      expect(isWalkable(grid, 0, 0)).toBe(false);
    });

    it('blocks the ghost-house door by default but opens it for eyes', () => {
      const doorCol = grid[12].indexOf(TILE.DOOR);

      expect(isWalkable(grid, doorCol, 12)).toBe(false);
      expect(isWalkable(grid, doorCol, 12, { doorPassable: true })).toBe(true);
    });

    it('reads out-of-range rows as wall', () => {
      expect(tileAt(grid, 5, -1)).toBe(TILE.WALL);
      expect(tileAt(grid, 5, ROWS)).toBe(TILE.WALL);
    });
  });

  describe('tunnel wrapping', () => {
    it('wraps columns past either edge', () => {
      expect(wrapCol(-1)).toBe(COLS - 1);
      expect(wrapCol(COLS)).toBe(0);
      expect(wrapCol(5)).toBe(5);
    });

    it('leaves both tunnel mouths open', () => {
      expect(isWalkable(grid, 0, TUNNEL_ROW)).toBe(true);
      expect(isWalkable(grid, COLS - 1, TUNNEL_ROW)).toBe(true);
    });
  });

  describe('no-up tiles', () => {
    it('marks the four documented tiles', () => {
      expect(isNoUpTile(12, 13)).toBe(true);
      expect(isNoUpTile(15, 13)).toBe(true);
      expect(isNoUpTile(12, 25)).toBe(true);
      expect(isNoUpTile(15, 25)).toBe(true);
    });

    it('marks nothing else', () => {
      expect(isNoUpTile(13, 13)).toBe(false);
      expect(isNoUpTile(12, 14)).toBe(false);
    });
  });

  describe('scatter targets', () => {
    it('sends each ghost to a different corner', () => {
      expect(SCATTER_TARGETS.blinky).toEqual({ col: 25, row: 0 });
      expect(SCATTER_TARGETS.pinky).toEqual({ col: 2, row: 0 });
      expect(SCATTER_TARGETS.inky).toEqual({ col: 27, row: 30 });
      expect(SCATTER_TARGETS.clyde).toEqual({ col: 0, row: 30 });
    });
  });

  describe('atTileCenter', () => {
    it('accepts a position on the centre', () => {
      expect(atTileCenter(7)).toBe(true);
      expect(atTileCenter(7.02)).toBe(true);
    });

    it('rejects a position between tiles', () => {
      expect(atTileCenter(7.5)).toBe(false);
    });

    it('honours a widened window', () => {
      expect(atTileCenter(7.3, 0.35)).toBe(true);
      expect(atTileCenter(7.3, 0.1)).toBe(false);
    });
  });
});
