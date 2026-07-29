import {
  FULL_SPEED_TILES, FRUIT_SPAWN_DOTS, SCORE, STARTING_LIVES,
  speedsForLevel, wavesForLevel, frightForLevel, elroyForLevel,
  houseDotsForLevel, houseTimeoutSecs, fruitForLevel,
} from './levels';

describe('speeds', () => {
  it('runs level 1 at the arcade 80% for Pac-Man and 75% for ghosts', () => {
    const s = speedsForLevel(1);

    expect(s.pac).toBeCloseTo(0.8 * FULL_SPEED_TILES);
    expect(s.ghost).toBeCloseTo(0.75 * FULL_SPEED_TILES);
  });

  it('steps up through the level bands', () => {
    expect(speedsForLevel(2).pac).toBeCloseTo(0.9 * FULL_SPEED_TILES);
    expect(speedsForLevel(5).pac).toBeCloseTo(1.0 * FULL_SPEED_TILES);
  });

  it('drops Pac-Man back to 90% from level 21', () => {
    expect(speedsForLevel(21).pac).toBeCloseTo(0.9 * FULL_SPEED_TILES);
  });

  it('always crawls ghosts through the tunnel', () => {
    [1, 5, 21].forEach((level) => {
      const s = speedsForLevel(level);
      expect(s.tunnel).toBeLessThan(s.ghost);
    });
  });

  it('sends eyes home faster than any live ghost', () => {
    const s = speedsForLevel(1);

    expect(s.eyes).toBeGreaterThan(s.ghost);
  });
});

describe('scatter and chase waves', () => {
  it('opens level 1 with a seven-second scatter', () => {
    expect(wavesForLevel(1)[0]).toBe(7);
  });

  it('shortens the opening scatter from level 5', () => {
    expect(wavesForLevel(5)[0]).toBe(5);
  });

  it('ends every band in an endless chase', () => {
    [1, 3, 10].forEach((level) => {
      const waves = wavesForLevel(level);
      expect(waves[waves.length - 1]).toBe(Infinity);
    });
  });
});

describe('frightened timing', () => {
  it('gives six seconds on level 1', () => {
    expect(frightForLevel(1)).toEqual({ secs: 6, flashes: 5 });
  });

  it('shortens as levels climb', () => {
    expect(frightForLevel(5).secs).toBeLessThan(frightForLevel(1).secs);
  });

  it('stops frightening ghosts entirely by level 19', () => {
    expect(frightForLevel(19).secs).toBe(0);
    expect(frightForLevel(25).secs).toBe(0);
  });
});

describe('cruise Elroy', () => {
  it('triggers on level 1 at 20 then 10 dots remaining', () => {
    expect(elroyForLevel(1)).toEqual({ dots1: 20, dots2: 10 });
  });

  it('triggers earlier on later levels', () => {
    expect(elroyForLevel(15).dots1).toBeGreaterThan(elroyForLevel(1).dots1);
  });

  it('always sets the second threshold below the first', () => {
    [1, 5, 12, 30].forEach((level) => {
      const e = elroyForLevel(level);
      expect(e.dots2).toBeLessThan(e.dots1);
    });
  });
});

describe('ghost house release', () => {
  it('holds Inky and Clyde back on level 1', () => {
    expect(houseDotsForLevel(1)).toEqual({ pinky: 0, inky: 30, clyde: 60 });
  });

  it('releases everyone immediately from level 3', () => {
    expect(houseDotsForLevel(3)).toEqual({ pinky: 0, inky: 0, clyde: 0 });
  });

  it('shortens the stall timeout from level 5', () => {
    expect(houseTimeoutSecs(1)).toBe(4);
    expect(houseTimeoutSecs(5)).toBe(3);
  });
});

describe('fruit', () => {
  it('spawns twice per level, at 70 and 170 dots', () => {
    expect(FRUIT_SPAWN_DOTS).toEqual([70, 170]);
  });

  it('starts with the cherry', () => {
    expect(fruitForLevel(1)).toEqual({ name: 'cherry', points: 100 });
  });

  it('reaches the key and stays there', () => {
    expect(fruitForLevel(13)).toEqual({ name: 'key', points: 5000 });
    expect(fruitForLevel(40)).toEqual({ name: 'key', points: 5000 });
  });

  it('never decreases in value as levels climb', () => {
    const values = [1, 2, 3, 5, 7, 9, 11, 13].map((l) => fruitForLevel(l).points);
    const ascending = [...values].sort((a, b) => a - b);

    expect(values).toEqual(ascending);
  });
});

describe('scoring constants', () => {
  it('matches the arcade values', () => {
    expect(SCORE.DOT).toBe(10);
    expect(SCORE.ENERGIZER).toBe(50);
    expect(SCORE.GHOST_CHAIN).toEqual([200, 400, 800, 1600]);
    expect(SCORE.EXTRA_LIFE_AT).toBe(10000);
    expect(STARTING_LIVES).toBe(3);
  });
});
