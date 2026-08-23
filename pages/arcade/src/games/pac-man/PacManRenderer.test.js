import { wallSegments, WALL_INSET, GAME_W, COLORS } from './PacManRenderer';
import { buildGrid, TILE_PX } from './maze';

const grid = buildGrid();
const segments = wallSegments(grid);

const isHorizontal = ([, y1, , y2]) => y1 === y2;
const span = ([x1, y1, x2, y2]) => (isHorizontal([x1, y1, x2, y2])
  ? { fixed: y1, lo: Math.min(x1, x2), hi: Math.max(x1, x2) }
  : { fixed: x1, lo: Math.min(y1, y2), hi: Math.max(y1, y2) });

describe('wall geometry', () => {
  it('produces segments for the maze', () => {
    expect(segments.length).toBeGreaterThan(100);
  });

  it('emits only axis-aligned segments', () => {
    const skewed = segments.filter(([x1, y1, x2, y2]) => x1 !== x2 && y1 !== y2);

    expect(skewed).toEqual([]);
  });

  it('never overlaps two collinear segments', () => {
    // The bug this guards: edges that ran the full tile width overlapped their
    // neighbours instead of joining, so corners were drawn twice.
    const lanes = new Map();
    segments.forEach((seg) => {
      const { fixed, lo, hi } = span(seg);
      const key = `${isHorizontal(seg) ? 'h' : 'v'}@${fixed}`;
      if (!lanes.has(key)) lanes.set(key, []);
      lanes.get(key).push([lo, hi]);
    });

    const overlaps = [];
    lanes.forEach((intervals, key) => {
      const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
      for (let i = 1; i < sorted.length; i++) {
        // Touching end-to-end is a join; anything past that is an overlap.
        if (sorted[i][0] < sorted[i - 1][1] - 1e-9) {
          overlaps.push(`${key} ${sorted[i - 1]} vs ${sorted[i]}`);
        }
      }
    });

    expect(overlaps).toEqual([]);
  });

  it('never runs one segment through the middle of a perpendicular one', () => {
    const horizontals = segments.filter(isHorizontal);
    const verticals = segments.filter((s) => !isHorizontal(s));

    const crossings = [];
    horizontals.forEach((h) => {
      const hs = span(h);
      verticals.forEach((v) => {
        const vs = span(v);
        const throughX = vs.fixed > hs.lo + 1e-9 && vs.fixed < hs.hi - 1e-9;
        const throughY = hs.fixed > vs.lo + 1e-9 && hs.fixed < vs.hi - 1e-9;
        if (throughX && throughY) crossings.push(`h@${hs.fixed} x v@${vs.fixed}`);
      });
    });

    expect(crossings).toEqual([]);
  });

  it('joins corners exactly, leaving loose ends only at the tunnel mouths', () => {
    // A wall outline is closed, so an endpoint that meets nothing means a
    // corner failed to join. The sole exception is the tunnel row, where the
    // maze is genuinely open and the walls run off both sides of the screen.
    const tally = new Map();
    segments.forEach(([x1, y1, x2, y2]) => {
      [`${x1},${y1}`, `${x2},${y2}`].forEach((p) => tally.set(p, (tally.get(p) ?? 0) + 1));
    });

    const dangling = [...tally.entries()]
      .filter(([, n]) => n < 2)
      .map(([point]) => point)
      .sort();

    expect(dangling).toEqual(['0,110.5', '0,121.5', '224,110.5', '224,121.5']);
  });

  it('opens those loose ends exactly on the tunnel row', () => {
    const tunnelWallYs = [13, 15].map((row) => row * TILE_PX + (row === 13 ? TILE_PX - WALL_INSET : WALL_INSET));

    expect(tunnelWallYs).toEqual([110.5, 121.5]);
  });

  it('keeps the outline inside the playfield', () => {
    const outside = segments.filter(([x1, , x2]) => Math.min(x1, x2) < -WALL_INSET
      || Math.max(x1, x2) > GAME_W + WALL_INSET);

    expect(outside).toEqual([]);
  });

  it('insets the pipe within its tile', () => {
    expect(WALL_INSET).toBeGreaterThan(0);
    expect(WALL_INSET).toBeLessThan(TILE_PX / 2);
  });

  it('caches per grid so segments are not rebuilt every frame', () => {
    expect(wallSegments(grid)).toBe(segments);
    expect(wallSegments(buildGrid())).not.toBe(segments);
  });

  it('uses the arcade blue for the maze', () => {
    expect(COLORS.maze).toBe('#2121ff');
    expect(COLORS.pac).toBe('#ffff00');
  });
});
