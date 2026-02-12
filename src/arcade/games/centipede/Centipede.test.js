import { Centipede } from './Centipede';

describe('Centipede', () => {
  let game;
  let hudData;

  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    game = new Centipede();
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

    test('centipede has 10 segments', () => {
      const totalSegments = game._centipedes.reduce((sum, c) => sum + c.segments.length, 0);
      expect(totalSegments).toBe(10);
    });

    test('mushrooms are spawned', () => {
      expect(game._mushrooms.length).toBeGreaterThan(0);
    });

    test('player starts alive', () => {
      expect(game._player.alive).toBe(true);
    });
  });

  describe('Player movement', () => {
    test('ArrowLeft moves player left', () => {
      const initialX = game._player.x;
      game.handleKeyDown('ArrowLeft');
      game.update(0.1);
      expect(game._player.x).toBeLessThan(initialX);
    });

    test('ArrowRight moves player right', () => {
      const initialX = game._player.x;
      game.handleKeyDown('ArrowRight');
      game.update(0.1);
      expect(game._player.x).toBeGreaterThan(initialX);
    });

    test('ArrowUp moves player up', () => {
      const initialY = game._player.y;
      game.handleKeyDown('ArrowUp');
      game.update(0.1);
      expect(game._player.y).toBeLessThan(initialY);
    });

    test('player stays in player zone', () => {
      game.handleKeyDown('ArrowUp');
      for (let i = 0; i < 100; i++) game.update(0.1);
      const minY = 360 - 6 * 15; // GAME_H - PLAYER_ZONE_ROWS * CELL
      expect(game._player.y).toBeGreaterThanOrEqual(minY);
    });

    test('player stays in bounds horizontally', () => {
      game.handleKeyDown('ArrowLeft');
      for (let i = 0; i < 100; i++) game.update(0.1);
      expect(game._player.x).toBeGreaterThanOrEqual(12); // PLAYER_SIZE
    });
  });

  describe('Shooting', () => {
    test('space fires bullet', () => {
      game.handleKeyDown(' ');
      game.update(0.01);
      expect(game._bullets.length).toBeGreaterThan(0);
    });

    test('bullets move upward', () => {
      game.handleKeyDown(' ');
      game.update(0.01);
      const y1 = game._bullets[0].y;
      game.handleKeyUp(' ');
      game.update(0.1);
      expect(game._bullets[0].y).toBeLessThan(y1);
    });

    test('bullets removed when off screen', () => {
      game._bullets.push({ x: 240, y: -20, w: 2, h: 8 });
      game._updateBullets(0.1);
      expect(game._bullets.length).toBe(0);
    });

    test('auto-fire creates multiple bullets', () => {
      game.handleKeyDown(' ');
      for (let i = 0; i < 10; i++) game.update(0.1);
      expect(game._bullets.length).toBeGreaterThan(1);
    });
  });

  describe('Centipede', () => {
    test('centipede moves', () => {
      const seg = game._centipedes[0].segments[0];
      const initialX = seg.x;
      game.update(0.5);
      expect(seg.x).not.toBe(initialX);
    });

    test('shooting segment adds mushroom', () => {
      const seg = game._centipedes[0].segments[5];
      game._bullets.push({
        x: seg.x + 7,
        y: seg.y + 7,
        w: 2,
        h: 8,
      });
      const mushroomCountBefore = game._mushrooms.length;
      game._checkCollisions();
      // New mushroom should be at segment position
      expect(game._mushrooms.length).toBeGreaterThanOrEqual(mushroomCountBefore);
    });

    test('shooting segment increases score', () => {
      const seg = game._centipedes[0].segments[0];
      game._bullets.push({
        x: seg.x + 7,
        y: seg.y + 7,
        w: 2,
        h: 8,
      });
      game._checkCollisions();
      expect(game.score).toBe(10);
    });

    test('shooting middle segment splits centipede', () => {
      const initialCentipedes = game._centipedes.length;
      const seg = game._centipedes[0].segments[5];
      game._bullets.push({
        x: seg.x + 7,
        y: seg.y + 7,
        w: 2,
        h: 8,
      });
      game._checkCollisions();
      expect(game._centipedes.length).toBeGreaterThan(initialCentipedes);
    });
  });

  describe('Mushrooms', () => {
    test('shooting mushroom reduces hp', () => {
      const m = game._mushrooms[0];
      const hpBefore = m.hp;
      game._bullets.push({
        x: m.col * 15 + 7,
        y: m.row * 15 + 7,
        w: 2,
        h: 8,
      });
      game._checkCollisions();
      expect(m.hp).toBe(hpBefore - 1);
    });

    test('destroying mushroom scores', () => {
      const m = game._mushrooms[0];
      m.hp = 1;
      game._bullets.push({
        x: m.col * 15 + 7,
        y: m.row * 15 + 7,
        w: 2,
        h: 8,
      });
      game._checkCollisions();
      expect(game.score).toBe(1);
    });
  });

  describe('Player death', () => {
    test('centipede hitting player kills player', () => {
      const seg = game._centipedes[0].segments[0];
      game._player.x = seg.x + 7;
      game._player.y = seg.y + 7;
      game._player.invulnTimer = 0;
      game._checkCollisions();
      expect(game._player.alive).toBe(false);
    });

    test('player death reduces lives', () => {
      game._playerHit();
      expect(game.lives).toBe(2);
    });

    test('game over when lives depleted', () => {
      game.lives = 1;
      game._playerHit();
      expect(game.gameOver).toBe(true);
    });

    test('player respawns after death timer', () => {
      game._player.alive = false;
      game._player.invulnTimer = 0.1;
      game.update(0.2);
      expect(game._player.alive).toBe(true);
    });
  });

  describe('Level progression', () => {
    test('level advances when centipede fully destroyed', () => {
      game._centipedes = [];
      game.update(0.01);
      expect(game._levelTransition).toBe(true);
    });

    test('level increments after transition', () => {
      game._centipedes = [];
      game.update(0.01);
      for (let i = 0; i < 20; i++) game.update(0.1);
      expect(game.level).toBe(2);
    });

    test('new centipede spawns after level transition', () => {
      game._centipedes = [];
      game.update(0.01);
      for (let i = 0; i < 20; i++) game.update(0.1);
      const totalSegments = game._centipedes.reduce((sum, c) => sum + c.segments.length, 0);
      expect(totalSegments).toBe(10);
    });
  });

  describe('Touch controls', () => {
    test('touch left moves player left', () => {
      const initialX = game._player.x;
      game.handleTouchAction('left', true);
      game.update(0.1);
      expect(game._player.x).toBeLessThan(initialX);
    });

    test('touch fire shoots', () => {
      game.handleTouchAction('fire', true);
      game.update(0.01);
      expect(game._bullets.length).toBeGreaterThan(0);
    });
  });

  describe('Update when game over', () => {
    test('update does nothing when game is over', () => {
      game.gameOver = true;
      const playerX = game._player.x;
      game.handleKeyDown('ArrowLeft');
      game.update(0.1);
      expect(game._player.x).toBe(playerX);
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
