import { Frogger } from './Frogger';

describe('Frogger', () => {
  let game;
  let hudData;

  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    game = new Frogger();
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

    test('lives starts at 3', () => {
      expect(game.lives).toBe(3);
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
      expect(hudData.lives).toBe(3);
    });

    test('frog starts at bottom row', () => {
      expect(game._frog.row).toBe(11);
    });

    test('frog starts alive', () => {
      expect(game._frog.dead).toBe(false);
    });

    test('goal slots are empty', () => {
      expect(game._goalsFilled.every((g) => g === false)).toBe(true);
    });
  });

  describe('Frog movement', () => {
    test('ArrowUp moves frog up', () => {
      const initialRow = game._frog.row;
      game.handleKeyDown('ArrowUp');
      expect(game._frog.row).toBe(initialRow - 1);
    });

    test('ArrowDown moves frog down', () => {
      game._frog.row = 8;
      game.handleKeyDown('ArrowDown');
      expect(game._frog.row).toBe(9);
    });

    test('ArrowLeft moves frog left', () => {
      const initialCol = Math.round(game._frog.col);
      game.handleKeyDown('ArrowLeft');
      expect(Math.round(game._frog.col)).toBe(initialCol - 1);
    });

    test('ArrowRight moves frog right', () => {
      const initialCol = Math.round(game._frog.col);
      game.handleKeyDown('ArrowRight');
      expect(Math.round(game._frog.col)).toBe(initialCol + 1);
    });

    test('frog cannot move off left edge', () => {
      game._frog.col = 0;
      game._moveCooldown = 0;
      game.handleKeyDown('ArrowLeft');
      expect(game._frog.col).toBe(0);
    });

    test('frog cannot move off bottom edge', () => {
      game._frog.row = 11;
      game._moveCooldown = 0;
      game.handleKeyDown('ArrowDown');
      expect(game._frog.row).toBe(11);
    });

    test('move cooldown prevents rapid moves', () => {
      game.handleKeyDown('ArrowUp');
      const row1 = game._frog.row;
      game.handleKeyDown('ArrowUp');
      expect(game._frog.row).toBe(row1); // cooldown blocks second move
    });
  });

  describe('Score', () => {
    test('moving forward scores points', () => {
      game.handleKeyDown('ArrowUp');
      expect(game.score).toBe(10);
    });

    test('moving backward does not score', () => {
      game.handleKeyDown('ArrowUp');
      const scoreAfterUp = game.score;
      game._moveCooldown = 0;
      game.handleKeyDown('ArrowDown');
      expect(game.score).toBe(scoreAfterUp);
    });
  });

  describe('Vehicle collision', () => {
    test('frog dies on vehicle collision', () => {
      // Move to a road lane
      game._frog.row = 8;
      game._frog.col = 0;
      // Place a vehicle directly on frog
      const lane = game._lanes[8];
      lane.objects[0].x = 0;
      lane.objects[0].w = 60;
      game.update(0.01);
      expect(game._frog.dead).toBe(true);
    });

    test('frog death reduces lives', () => {
      const initialLives = game.lives;
      game._killFrog();
      expect(game.lives).toBe(initialLives - 1);
    });
  });

  describe('River and logs', () => {
    test('frog dies in water without log', () => {
      game._frog.row = 3;
      game._frog.col = 0;
      // Ensure no log under frog
      const lane = game._lanes[3];
      for (const obj of lane.objects) {
        obj.x = 400; // move all logs away
      }
      game.update(0.01);
      expect(game._frog.dead).toBe(true);
    });

    test('frog rides log and moves with it', () => {
      game._frog.row = 3;
      game._frog.col = 5;
      const lane = game._lanes[3];
      // Place a log under frog
      lane.objects[0].x = 5 * 30 - 10;
      lane.objects[0].w = 120;
      const colBefore = game._frog.col;
      game.update(0.1);
      // Frog should have moved with log
      expect(game._frog.col).not.toBe(colBefore);
    });
  });

  describe('Game over', () => {
    test('game over when lives depleted', () => {
      game.lives = 1;
      game._killFrog();
      game._frog.deathTimer = 0;
      game.update(0.01);
      expect(game.gameOver).toBe(true);
    });

    test('update does nothing when game is over', () => {
      game.gameOver = true;
      const row = game._frog.row;
      game.update(1);
      expect(game._frog.row).toBe(row);
    });
  });

  describe('Touch controls', () => {
    test('touch up moves frog up', () => {
      const initialRow = game._frog.row;
      game.handleTouchAction('up', true);
      expect(game._frog.row).toBe(initialRow - 1);
    });

    test('touch does nothing on release', () => {
      const row = game._frog.row;
      game.handleTouchAction('up', false);
      expect(game._frog.row).toBe(row);
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
