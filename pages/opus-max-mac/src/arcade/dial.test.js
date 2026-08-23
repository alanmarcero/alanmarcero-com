import {
  SECTOR_INNER,
  SECTOR_OUTER,
  SECTOR_PAD_DEGREES,
  LIMB_INNER,
  LIMB_OUTER,
  TICKS_PER_SECTOR,
  MAX_READING_CHARS,
  ROMAN,
  numeralFor,
  bearingPoint,
  sectors,
  dialTicks,
  readingLines,
} from './dial';
import { games } from '../../../arcade/src/games/gameRegistry';

/** Every number in a path, so a wedge can be checked without parsing SVG. */
const coordinates = (path) => (path.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);

describe('bearingPoint', () => {
  it('puts zero at twelve o’clock and counts clockwise', () => {
    const up = bearingPoint(10, 0);
    expect(up.x).toBeCloseTo(0, 10);
    expect(up.y).toBeCloseTo(-10, 10);

    const right = bearingPoint(10, 90);
    expect(right.x).toBeCloseTo(10, 10);
    expect(right.y).toBeCloseTo(0, 10);

    const down = bearingPoint(10, 180);
    expect(down.x).toBeCloseTo(0, 10);
    expect(down.y).toBeCloseTo(10, 10);

    const left = bearingPoint(10, 270);
    expect(left.x).toBeCloseTo(-10, 10);
    expect(left.y).toBeCloseTo(0, 10);
  });

  it('stays on its radius', () => {
    [0, 37, 145, 299.5, 360].forEach((bearing) => {
      const { x, y } = bearingPoint(31.5, bearing);
      expect(Math.hypot(x, y)).toBeCloseTo(31.5, 10);
    });
  });

  it('comes back round', () => {
    const once = bearingPoint(12, 10);
    const again = bearingPoint(12, 370);
    expect(again.x).toBeCloseTo(once.x, 10);
    expect(again.y).toBeCloseTo(once.y, 10);
  });
});

describe('sectors', () => {
  const wedges = sectors(12);

  it('sets out one sector per machine', () => {
    expect(wedges).toHaveLength(12);
    expect(sectors(games.length)).toHaveLength(games.length);
  });

  it('runs in bearing order and never overlaps a neighbour', () => {
    for (let index = 1; index < wedges.length; index += 1) {
      expect(wedges[index].start).toBeGreaterThan(wedges[index - 1].end);
    }
    // The gap across zero is the one a naive implementation loses.
    expect(wedges[0].start).toBeCloseTo(SECTOR_PAD_DEGREES, 10);
    expect(360 - wedges[wedges.length - 1].end).toBeCloseTo(SECTOR_PAD_DEGREES, 10);
  });

  it('gives every sector the same span, padded off both ends', () => {
    wedges.forEach((wedge) => {
      expect(wedge.end - wedge.start).toBeCloseTo(360 / 12 - 2 * SECTOR_PAD_DEGREES, 10);
    });
    sectors(5).forEach((wedge) => {
      expect(wedge.end - wedge.start).toBeCloseTo(360 / 5 - 2 * SECTOR_PAD_DEGREES, 10);
    });
  });

  it('keeps the midpoint the true middle of the sector', () => {
    wedges.forEach((wedge, index) => {
      expect(wedge.mid).toBeCloseTo(30 * index + 15, 10);
      expect(wedge.mid).toBeCloseTo((wedge.start + wedge.end) / 2, 10);
    });
  });

  it('draws an annulus wedge: out, in, back, closed', () => {
    wedges.forEach((wedge) => {
      expect(wedge.path.startsWith('M ')).toBe(true);
      expect(wedge.path.match(/A/g)).toHaveLength(2);
      expect(wedge.path.match(/L/g)).toHaveLength(1);
      expect(wedge.path.endsWith('Z')).toBe(true);
    });
  });

  it('stays inside the viewBox, with every figure a real number', () => {
    wedges.forEach((wedge) => {
      const numbers = coordinates(wedge.path);
      expect(numbers.length).toBeGreaterThan(8);
      numbers.forEach((value) => {
        expect(Number.isFinite(value)).toBe(true);
        expect(Math.abs(value)).toBeLessThanOrEqual(50);
      });
    });
  });

  it('parks the numeral mid-sector, midway between the two arcs', () => {
    wedges.forEach((wedge) => {
      const { x, y } = wedge.labelPoint;
      expect(Math.hypot(x, y)).toBeCloseTo((SECTOR_INNER + SECTOR_OUTER) / 2, 10);
      expect(wedge.labelPoint).toEqual(bearingPoint((SECTOR_INNER + SECTOR_OUTER) / 2, wedge.mid));
    });
  });

  it('never stands a numeral on its head', () => {
    sectors(24).forEach((wedge) => {
      expect(Math.abs(wedge.textAngle)).toBeLessThanOrEqual(90);
    });
    expect(sectors(12)[0].textAngle).toBeCloseTo(15, 10);
    // Six sectors on: the same lean, read from the other side of the dial.
    expect(sectors(12)[6].textAngle).toBeCloseTo(15, 10);
  });

  it('honours a different ring', () => {
    const [only] = sectors(4, { inner: 10, outer: 20, padDegrees: 0 });
    expect(only.start).toBe(0);
    expect(only.end).toBe(90);
    expect(Math.hypot(only.labelPoint.x, only.labelPoint.y)).toBeCloseTo(15, 10);
  });

  it('survives a dial with one machine on it', () => {
    const [only] = sectors(1);
    expect(sectors(1)).toHaveLength(1);
    expect(only.end - only.start).toBeCloseTo(360 - 2 * SECTOR_PAD_DEGREES, 10);
    // A sector that sweeps more than a half turn needs the large-arc flag set.
    expect(only.path).toMatch(/A 44 44 0 1 1 /);
    expect(only.path).toMatch(/A 26 26 0 1 0 /);
  });

  it('has nothing to set out for nothing', () => {
    expect(sectors(0)).toEqual([]);
    expect(sectors()).toEqual([]);
    expect(sectors(-3)).toEqual([]);
  });

  it('draws the same dial every time', () => {
    expect(sectors(12)).toEqual(wedges);
  });
});

describe('dialTicks', () => {
  const ticks = dialTicks(12);

  it('graduates every sector five times', () => {
    expect(ticks).toHaveLength(12 * TICKS_PER_SECTOR);
    expect(ticks.filter((tick) => tick.major)).toHaveLength(12);
  });

  it('lands a major on every sector boundary', () => {
    ticks
      .filter((tick) => tick.major)
      .forEach((tick, index) => {
        expect(tick.bearing).toBeCloseTo(30 * index, 10);
      });
  });

  it('runs a major the full depth of the limb and a minor half of it', () => {
    const [major] = ticks;
    const minor = ticks[1];
    expect(Math.hypot(major.inner.x, major.inner.y)).toBeCloseTo(LIMB_INNER, 10);
    expect(Math.hypot(major.outer.x, major.outer.y)).toBeCloseTo(LIMB_OUTER, 10);
    expect(Math.hypot(minor.inner.x, minor.inner.y)).toBeCloseTo((LIMB_INNER + LIMB_OUTER) / 2, 10);
  });

  it('ascends in bearing and stays inside the viewBox', () => {
    for (let index = 1; index < ticks.length; index += 1) {
      expect(ticks[index].bearing).toBeGreaterThan(ticks[index - 1].bearing);
    }
    ticks.forEach((tick) => {
      [tick.inner.x, tick.inner.y, tick.outer.x, tick.outer.y].forEach((value) => {
        expect(Number.isFinite(value)).toBe(true);
        expect(Math.abs(value)).toBeLessThanOrEqual(50);
      });
    });
  });

  it('honours a different limb, and has nothing to draw for nothing', () => {
    const [first] = dialTicks(3, { inner: 30, outer: 33 });
    expect(Math.hypot(first.inner.x, first.inner.y)).toBeCloseTo(30, 10);
    expect(dialTicks(0)).toEqual([]);
    expect(dialTicks()).toEqual([]);
  });

  it('graduates the same limb every time', () => {
    expect(dialTicks(12)).toEqual(ticks);
  });
});

describe('numeralFor', () => {
  it('numbers the twelve machines in roman', () => {
    expect(ROMAN).toHaveLength(12);
    expect(games.map((_game, index) => numeralFor(index))).toEqual([
      'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII',
    ]);
  });

  it('falls back to arabic past the table', () => {
    expect(numeralFor(12)).toBe('13');
    expect(numeralFor(40)).toBe('41');
  });
});

describe('readingLines', () => {
  it('keeps a short name on one line', () => {
    expect(readingLines('Snake')).toEqual(['Snake']);
    expect(readingLines('Pac-Man')).toEqual(['Pac-Man']);
    expect(readingLines('Life Pulse')).toEqual(['Life Pulse']);
  });

  it('balances a name too long for the field', () => {
    expect(readingLines('Bird Name Generator')).toEqual(['Bird Name', 'Generator']);
    expect(readingLines('Space Invaders')).toEqual(['Space', 'Invaders']);
    expect(readingLines('Rhythm Catcher')).toEqual(['Rhythm', 'Catcher']);
  });

  it('never breaks a machine name onto more than two lines', () => {
    games.forEach((game) => {
      const lines = readingLines(game.name);
      expect(lines.length).toBeGreaterThan(0);
      expect(lines.length).toBeLessThanOrEqual(2);
      expect(lines.join(' ')).toBe(game.name);
      lines.forEach((line) => expect(line.trim()).toBe(line));
    });
  });

  it('cannot break a single word, however long', () => {
    expect(readingLines('Supercalifragilistic')).toEqual(['Supercalifragilistic']);
  });

  it('takes the budget from the caller', () => {
    expect(readingLines('Life Pulse', 4)).toEqual(['Life', 'Pulse']);
    expect(readingLines('Bird Name Generator', MAX_READING_CHARS * 4)).toEqual([
      'Bird Name Generator',
    ]);
  });

  it('reads nothing when there is nothing in hand', () => {
    expect(readingLines()).toEqual([]);
    expect(readingLines(null)).toEqual([]);
    expect(readingLines('   ')).toEqual([]);
  });

  it('breaks the same name the same way every time', () => {
    expect(readingLines('Bird Name Generator')).toEqual(readingLines('Bird Name Generator'));
  });
});
