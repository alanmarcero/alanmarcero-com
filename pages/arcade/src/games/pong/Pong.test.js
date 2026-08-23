import { Pong } from './Pong';

describe('Pong', () => {
  let game;
  let hudData;

  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    game = new Pong();
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

    test('ball is centered', () => {
      expect(game._ball.x).toBe(240);
      expect(game._ball.y).toBe(180);
    });

    test('paddles are on opposite sides', () => {
      expect(game._player.x).toBeLessThan(game._ai.x);
    });
  });

  describe('Player paddle', () => {
    test('ArrowUp moves paddle up', () => {
      game._serveTimer = 0;
      const initialY = game._player.y;
      game.handleKeyDown('ArrowUp');
      game.update(0.1);
      expect(game._player.y).toBeLessThan(initialY);
    });

    test('ArrowDown moves paddle down', () => {
      game._serveTimer = 0;
      const initialY = game._player.y;
      game.handleKeyDown('ArrowDown');
      game.update(0.1);
      expect(game._player.y).toBeGreaterThan(initialY);
    });

    test('paddle stays in top bounds', () => {
      game._serveTimer = 0;
      game.handleKeyDown('ArrowUp');
      for (let i = 0; i < 100; i++) game.update(0.1);
      expect(game._player.y).toBeGreaterThanOrEqual(0);
    });

    test('paddle stays in bottom bounds', () => {
      game._serveTimer = 0;
      game.handleKeyDown('ArrowDown');
      for (let i = 0; i < 100; i++) game.update(0.1);
      expect(game._player.y + game._player.h).toBeLessThanOrEqual(360);
    });

    test('handleKeyUp stops movement', () => {
      game._serveTimer = 0;
      game.handleKeyDown('ArrowUp');
      game.update(0.1);
      const y1 = game._player.y;
      game.handleKeyUp('ArrowUp');
      game.update(0.1);
      expect(game._player.y).toBe(y1);
    });
  });

  describe('Ball physics', () => {
    test('ball moves after serve delay', () => {
      const initialX = game._ball.x;
      game._serveTimer = 0;
      game.update(0.1);
      expect(game._ball.x).not.toBe(initialX);
    });

    test('ball does not move during serve delay', () => {
      const initialX = game._ball.x;
      game._serveTimer = 0.5;
      game.update(0.1);
      expect(game._ball.x).toBe(initialX);
    });

    test('ball bounces off top wall', () => {
      game._serveTimer = 0;
      game._ball.y = 3;
      game._ball.vy = -200;
      game.update(0.01);
      expect(game._ball.vy).toBeGreaterThan(0);
    });

    test('ball bounces off bottom wall', () => {
      game._serveTimer = 0;
      game._ball.y = 357;
      game._ball.vy = 200;
      game.update(0.01);
      expect(game._ball.vy).toBeLessThan(0);
    });
  });

  describe('Scoring', () => {
    test('player scores when ball passes AI', () => {
      game._serveTimer = 0;
      game._ball.x = 490;
      game._ball.vx = 200;
      game._ball.vy = 0;
      game.update(0.1);
      expect(game.score).toBe(1);
    });

    test('player loses life when ball passes player', () => {
      game._serveTimer = 0;
      game._ball.x = -10;
      game._ball.vx = -200;
      game._ball.vy = 0;
      game.update(0.1);
      expect(game.lives).toBe(2);
    });

    test('game over when all lives lost', () => {
      game.lives = 1;
      game._serveTimer = 0;
      game._ball.x = -10;
      game._ball.vx = -200;
      game._ball.vy = 0;
      game.update(0.1);
      expect(game.gameOver).toBe(true);
    });

    test('level increases every 5 points', () => {
      game._serveTimer = 0;
      for (let i = 0; i < 5; i++) {
        game._ball.x = 490;
        game._ball.vx = 200;
        game._ball.vy = 0;
        game.update(0.1);
        game._serveTimer = 0;
      }
      expect(game.level).toBe(2);
    });
  });

  describe('AI paddle', () => {
    test('AI tracks ball position', () => {
      game._serveTimer = 0;
      game._ball.y = 50;
      game._aiTargetY = 50;
      const initialY = game._ai.y;
      game.update(0.5);
      // AI should have moved toward ball
      expect(Math.abs(game._ai.y - 50)).toBeLessThan(Math.abs(initialY - 50));
    });
  });

  describe('Touch controls', () => {
    test('touch up moves paddle up', () => {
      game._serveTimer = 0;
      const initialY = game._player.y;
      game.handleTouchAction('up', true);
      game.update(0.1);
      expect(game._player.y).toBeLessThan(initialY);
    });

    test('touch down moves paddle down', () => {
      game._serveTimer = 0;
      const initialY = game._player.y;
      game.handleTouchAction('down', true);
      game.update(0.1);
      expect(game._player.y).toBeGreaterThan(initialY);
    });
  });

  describe('Update when game over', () => {
    test('update does nothing when game is over', () => {
      game.gameOver = true;
      const ballX = game._ball.x;
      game.update(0.1);
      expect(game._ball.x).toBe(ballX);
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
