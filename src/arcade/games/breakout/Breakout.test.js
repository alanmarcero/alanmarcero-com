import { Breakout } from './Breakout';

describe('Breakout', () => {
  let game;
  let hudData;

  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    game = new Breakout();
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
      expect(hudData.level).toBe(1);
      expect(hudData.gameOver).toBe(false);
    });

    test('bricks are created', () => {
      expect(game._bricks.length).toBe(60); // 6 rows x 10 cols
    });

    test('all bricks start alive', () => {
      expect(game._bricks.every((b) => b.alive)).toBe(true);
    });

    test('ball starts unlaunched', () => {
      expect(game._ball.launched).toBe(false);
    });
  });

  describe('Paddle movement', () => {
    test('ArrowLeft moves paddle left', () => {
      const initialX = game._paddle.x;
      game.handleKeyDown('ArrowLeft');
      game.update(0.1);
      expect(game._paddle.x).toBeLessThan(initialX);
    });

    test('ArrowRight moves paddle right', () => {
      const initialX = game._paddle.x;
      game.handleKeyDown('ArrowRight');
      game.update(0.1);
      expect(game._paddle.x).toBeGreaterThan(initialX);
    });

    test('paddle stays in left bounds', () => {
      game.handleKeyDown('ArrowLeft');
      for (let i = 0; i < 100; i++) game.update(0.1);
      expect(game._paddle.x).toBeGreaterThanOrEqual(0);
    });

    test('paddle stays in right bounds', () => {
      game.handleKeyDown('ArrowRight');
      for (let i = 0; i < 100; i++) game.update(0.1);
      expect(game._paddle.x + game._paddle.w).toBeLessThanOrEqual(480);
    });

    test('handleKeyUp stops movement', () => {
      game.handleKeyDown('ArrowLeft');
      game.update(0.1);
      const x1 = game._paddle.x;
      game.handleKeyUp('ArrowLeft');
      game.update(0.1);
      expect(game._paddle.x).toBe(x1);
    });
  });

  describe('Ball launch', () => {
    test('space launches ball', () => {
      game.handleKeyDown(' ');
      game.update(0.01);
      expect(game._ball.launched).toBe(true);
    });

    test('Space key launches ball', () => {
      game.handleKeyDown('Space');
      game.update(0.01);
      expect(game._ball.launched).toBe(true);
    });

    test('ball follows paddle before launch', () => {
      game.handleKeyDown('ArrowRight');
      game.update(0.1);
      const paddleCenter = game._paddle.x + game._paddle.w / 2;
      expect(game._ball.x).toBe(paddleCenter);
    });

    test('ball has velocity after launch', () => {
      game.handleKeyDown(' ');
      game.update(0.01);
      expect(game._ball.vy).toBeLessThan(0);
    });
  });

  describe('Ball physics', () => {
    test('ball bounces off left wall', () => {
      game._ball.launched = true;
      game._ball.x = 3;
      game._ball.vx = -200;
      game._ball.vy = -100;
      game.update(0.01);
      expect(game._ball.vx).toBeGreaterThan(0);
    });

    test('ball bounces off right wall', () => {
      game._ball.launched = true;
      game._ball.x = 478;
      game._ball.vx = 200;
      game._ball.vy = -100;
      game.update(0.01);
      expect(game._ball.vx).toBeLessThan(0);
    });

    test('ball bounces off top wall', () => {
      game._ball.launched = true;
      game._ball.y = 3;
      game._ball.vx = 100;
      game._ball.vy = -200;
      game.update(0.01);
      expect(game._ball.vy).toBeGreaterThan(0);
    });
  });

  describe('Brick collision', () => {
    test('ball hitting brick destroys brick', () => {
      const brick = game._bricks.find((b) => b.alive);
      game._ball.launched = true;
      game._ball.x = brick.x + brick.w / 2;
      game._ball.y = brick.y + brick.h / 2;
      game._ball.vx = 0;
      game._ball.vy = -200;
      game._checkCollisions();
      expect(brick.alive).toBe(false);
    });

    test('brick hit increases score', () => {
      const brick = game._bricks.find((b) => b.alive);
      const pts = brick.points;
      game._ball.launched = true;
      game._ball.x = brick.x + brick.w / 2;
      game._ball.y = brick.y + brick.h / 2;
      game._ball.vx = 0;
      game._ball.vy = -200;
      game._checkCollisions();
      expect(game.score).toBe(pts);
    });
  });

  describe('Lives and game over', () => {
    test('ball falling below paddle loses a life', () => {
      game._ball.launched = true;
      game._ball.y = 400;
      game._ball.vx = 0;
      game._ball.vy = 200;
      game._updateBall(0.01);
      expect(game.lives).toBe(2);
    });

    test('game over when all lives lost', () => {
      game.lives = 1;
      game._ball.launched = true;
      game._ball.y = 400;
      game._ball.vx = 0;
      game._ball.vy = 200;
      game._updateBall(0.01);
      expect(game.gameOver).toBe(true);
    });

    test('update does nothing when game is over', () => {
      game.gameOver = true;
      const paddleX = game._paddle.x;
      game.handleKeyDown('ArrowLeft');
      game.update(0.1);
      expect(game._paddle.x).toBe(paddleX);
    });
  });

  describe('Level progression', () => {
    test('level advances when all bricks destroyed', () => {
      for (const b of game._bricks) b.alive = false;
      game._ball.launched = true;
      game._ball.vx = 100;
      game._ball.vy = -200;
      game.update(0.01);
      expect(game._levelTransition).toBe(true);
    });

    test('level increments after transition', () => {
      for (const b of game._bricks) b.alive = false;
      game._ball.launched = true;
      game._ball.vx = 100;
      game._ball.vy = -200;
      game.update(0.01);
      for (let i = 0; i < 20; i++) game.update(0.1);
      expect(game.level).toBe(2);
    });

    test('bricks reset after level transition', () => {
      for (const b of game._bricks) b.alive = false;
      game._ball.launched = true;
      game._ball.vx = 100;
      game._ball.vy = -200;
      game.update(0.01);
      for (let i = 0; i < 20; i++) game.update(0.1);
      const alive = game._bricks.filter((b) => b.alive).length;
      expect(alive).toBe(60);
    });
  });

  describe('Touch controls', () => {
    test('touch left moves paddle left', () => {
      const initialX = game._paddle.x;
      game.handleTouchAction('left', true);
      game.update(0.1);
      expect(game._paddle.x).toBeLessThan(initialX);
    });

    test('touch right moves paddle right', () => {
      const initialX = game._paddle.x;
      game.handleTouchAction('right', true);
      game.update(0.1);
      expect(game._paddle.x).toBeGreaterThan(initialX);
    });

    test('touch fire launches ball', () => {
      game.handleTouchAction('fire', true);
      game.update(0.01);
      expect(game._ball.launched).toBe(true);
    });
  });

  describe('Resize', () => {
    test('resize updates canvas dimensions', () => {
      game.resize(800, 600);
      expect(game.canvasW).toBe(800);
      expect(game.canvasH).toBe(600);
    });

    test('resize recalculates transform', () => {
      const initialScale = game._scale;
      game.resize(800, 600);
      expect(game._scale).not.toBe(initialScale);
    });
  });

  describe('Destroy', () => {
    test('destroy does not crash', () => {
      expect(() => game.destroy()).not.toThrow();
    });
  });
});
