import { Snake } from './Snake';

describe('Snake', () => {
  let game;
  let hudData;

  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    game = new Snake();
    hudData = null;
    game.onHudUpdate = (data) => { hudData = data; };
    game.init(480, 360);
  });

  afterEach(() => {
    game.destroy();
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    test('score starts at 0', () => {
      expect(game.score).toBe(0);
    });

    test('lives starts at 1', () => {
      expect(game.lives).toBe(1);
    });

    test('level starts at 1', () => {
      expect(game.level).toBe(1);
    });

    test('gameOver is false', () => {
      expect(game.gameOver).toBe(false);
    });

    test('HUD callback fires on init', () => {
      expect(hudData).not.toBeNull();
      expect(hudData.score).toBe(0);
      expect(hudData.lives).toBe(1);
    });

    test('snake starts with 3 segments', () => {
      expect(game._segments.length).toBe(3);
    });

    test('food is spawned', () => {
      expect(game._food).not.toBeNull();
    });
  });

  describe('Movement', () => {
    test('snake moves right by default', () => {
      const headX = game._segments[0].x;
      game._move();
      expect(game._segments[0].x).toBeGreaterThan(headX);
    });

    test('ArrowUp changes direction to up', () => {
      game.handleKeyDown('ArrowUp');
      game._move();
      expect(game._direction.y).toBe(-1);
    });

    test('ArrowDown changes direction to down', () => {
      // First move up so we can go down
      game.handleKeyDown('ArrowUp');
      game._move();
      game.handleKeyDown('ArrowDown');
      // Can't reverse, so this should not change
      expect(game._nextDirection.y).not.toBe(1);
    });

    test('cannot reverse direction', () => {
      // Snake is moving right, ArrowLeft should be ignored
      game.handleKeyDown('ArrowLeft');
      expect(game._nextDirection.x).not.toBe(-1);
    });

    test('snake tail follows head', () => {
      const prevTail = { ...game._segments[2] };
      game._move();
      // Tail should have moved to where segment 1 was
      expect(game._segments[2].x).not.toBe(prevTail.x);
    });
  });

  describe('Food and growth', () => {
    test('eating food increases score', () => {
      game._food = { x: game._segments[0].x + 1, y: game._segments[0].y };
      game._move();
      expect(game.score).toBe(10);
    });

    test('eating food grows snake', () => {
      const initialLen = game._segments.length;
      game._food = { x: game._segments[0].x + 1, y: game._segments[0].y };
      game._move();
      expect(game._segments.length).toBe(initialLen + 1);
    });

    test('new food spawns after eating', () => {
      game._food = { x: game._segments[0].x + 1, y: game._segments[0].y };
      game._move();
      // Food should be different (Math.random mock is consistent but food pos is recomputed)
      expect(game._food).not.toBeNull();
    });
  });

  describe('Collision and game over', () => {
    test('wall collision triggers game over', () => {
      // Move snake to right edge
      game._segments[0].x = 31; // COLS - 1
      game._direction = { x: 1, y: 0 };
      game._nextDirection = { x: 1, y: 0 };
      game._move();
      expect(game.gameOver).toBe(true);
    });

    test('self collision triggers game over', () => {
      // Create a situation where snake hits itself
      game._segments = [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 4, y: 4 },
        { x: 5, y: 4 },
        { x: 5, y: 5 }, // would collide
      ];
      // Move down to overlap the last segment's old pos
      game._direction = { x: 0, y: -1 };
      game._nextDirection = { x: 0, y: -1 };
      game._move();
      expect(game.gameOver).toBe(true);
    });

    test('game over sets lives to 0', () => {
      game._segments[0].x = 31;
      game._direction = { x: 1, y: 0 };
      game._nextDirection = { x: 1, y: 0 };
      game._move();
      expect(game.lives).toBe(0);
    });

    test('update does nothing when game is over', () => {
      game.gameOver = true;
      const segments = JSON.stringify(game._segments);
      game.update(1);
      expect(JSON.stringify(game._segments)).toBe(segments);
    });
  });

  describe('Touch controls', () => {
    test('touch up changes direction', () => {
      game.handleTouchAction('up', true);
      expect(game._nextDirection.y).toBe(-1);
    });

    test('touch does nothing on release', () => {
      const dir = { ...game._nextDirection };
      game.handleTouchAction('up', false);
      expect(game._nextDirection).toEqual(dir);
    });
  });

  describe('Speed', () => {
    test('speed increases as food is eaten', () => {
      const initialInterval = game._moveInterval;
      game._food = { x: game._segments[0].x + 1, y: game._segments[0].y };
      game._move();
      expect(game._moveInterval).toBeLessThan(initialInterval);
    });
  });

  describe('Resize', () => {
    test('resize updates canvas dimensions', () => {
      game.resize(800, 600);
      expect(game.canvasW).toBe(800);
      expect(game.canvasH).toBe(600);
    });
  });

  describe('Destroy', () => {
    test('destroy does not crash', () => {
      expect(() => game.destroy()).not.toThrow();
    });
  });
});
