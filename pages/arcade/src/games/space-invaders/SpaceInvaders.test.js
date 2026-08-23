import { SpaceInvaders } from './SpaceInvaders';

describe('SpaceInvaders', () => {
  let game;
  let hudData;

  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    game = new SpaceInvaders();
    hudData = null;
    game.onHudUpdate = (data) => {
      hudData = data;
    };
    game.init(480, 360);
  });

  afterEach(() => {
    game.destroy();
    jest.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------

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
  });

  // -------------------------------------------------------------------------
  // Player movement
  // -------------------------------------------------------------------------

  describe('Player movement', () => {
    test('handleKeyDown ArrowLeft moves player left', () => {
      const initialX = game._player.x;
      game.handleKeyDown('ArrowLeft');
      game.update(0.1);
      expect(game._player.x).toBeLessThan(initialX);
    });

    test('handleKeyDown ArrowRight moves player right', () => {
      const initialX = game._player.x;
      game.handleKeyDown('ArrowRight');
      game.update(0.1);
      expect(game._player.x).toBeGreaterThan(initialX);
    });

    test('player stays in left bounds', () => {
      game.handleKeyDown('ArrowLeft');
      for (let i = 0; i < 100; i++) {
        game.update(0.1);
      }
      expect(game._player.x).toBeGreaterThanOrEqual(4);
    });

    test('player stays in right bounds', () => {
      game.handleKeyDown('ArrowRight');
      for (let i = 0; i < 100; i++) {
        game.update(0.1);
      }
      expect(game._player.x + game._player.w).toBeLessThanOrEqual(480 - 4);
    });

    test('handleKeyUp stops left movement', () => {
      game.handleKeyDown('ArrowLeft');
      game.update(0.1);
      const x1 = game._player.x;
      game.handleKeyUp('ArrowLeft');
      game.update(0.1);
      const x2 = game._player.x;
      expect(x1).toBe(x2);
    });

    test('handleKeyUp stops right movement', () => {
      game.handleKeyDown('ArrowRight');
      game.update(0.1);
      const x1 = game._player.x;
      game.handleKeyUp('ArrowRight');
      game.update(0.1);
      const x2 = game._player.x;
      expect(x1).toBe(x2);
    });
  });

  // -------------------------------------------------------------------------
  // Player firing
  // -------------------------------------------------------------------------

  describe('Player firing', () => {
    test('firing with space creates a bullet', () => {
      game.handleKeyDown(' ');
      game.update(0.01);
      expect(game._playerBullets.length).toBe(1);
    });

    test('firing with Space key creates a bullet', () => {
      game.handleKeyDown('Space');
      game.update(0.01);
      expect(game._playerBullets.length).toBe(1);
    });

    test('bullet moves upward', () => {
      game.handleKeyDown(' ');
      game.update(0.01);
      const initialY = game._playerBullets[0].y;
      game.update(0.1);
      game.update(0.1);
      game.update(0.1);
      expect(game._playerBullets[0].y).toBeLessThan(initialY);
    });

    test('bullet is removed when it goes off screen', () => {
      game.handleKeyDown(' ');
      game.update(0.01);
      for (let i = 0; i < 50; i++) {
        game.update(0.1);
      }
      expect(game._playerBullets.length).toBe(0);
    });

    test('fire lock prevents multiple bullets from one key press', () => {
      game.handleKeyDown(' ');
      game.update(0.01);
      game.update(0.01);
      game.update(0.01);
      expect(game._playerBullets.length).toBe(1);
    });

    test('releasing fire key allows another shot', () => {
      game.handleKeyDown(' ');
      game.update(0.01);
      game.handleKeyUp(' ');
      game.handleKeyDown(' ');
      game.update(0.01);
      expect(game._playerBullets.length).toBe(2);
    });

    test('player can have maximum 2 bullets on screen', () => {
      game.handleKeyDown(' ');
      game.update(0.01);
      game.handleKeyUp(' ');
      game.handleKeyDown(' ');
      game.update(0.01);
      game.handleKeyUp(' ');
      game.handleKeyDown(' ');
      game.update(0.01);
      expect(game._playerBullets.length).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // Touch controls
  // -------------------------------------------------------------------------

  describe('Touch controls', () => {
    test('touch left moves player left', () => {
      const initialX = game._player.x;
      game.handleTouchAction('left', true);
      game.update(0.1);
      expect(game._player.x).toBeLessThan(initialX);
    });

    test('touch right moves player right', () => {
      const initialX = game._player.x;
      game.handleTouchAction('right', true);
      game.update(0.1);
      expect(game._player.x).toBeGreaterThan(initialX);
    });

    test('touch fire creates a bullet', () => {
      game.handleTouchAction('fire', true);
      game.update(0.01);
      expect(game._playerBullets.length).toBe(1);
    });

    test('touch fire respects fire lock', () => {
      game.handleTouchAction('fire', true);
      game.update(0.01);
      game.update(0.01);
      expect(game._playerBullets.length).toBe(1);
    });

    test('releasing touch fire allows another shot', () => {
      game.handleTouchAction('fire', true);
      game.update(0.01);
      game.handleTouchAction('fire', false);
      game.handleTouchAction('fire', true);
      game.update(0.01);
      expect(game._playerBullets.length).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // Bullet-alien collision
  // -------------------------------------------------------------------------

  describe('Bullet-alien collision', () => {
    test('player bullet hitting alien kills alien', () => {
      const alien = game._aliens.find((a) => a.alive);
      game._playerBullets.push({
        x: alien.x,
        y: alien.y,
        w: 2,
        h: 8,
      });
      game._checkCollisions();
      expect(alien.alive).toBe(false);
    });

    test('player bullet hitting alien increases score', () => {
      const alien = game._aliens.find((a) => a.alive);
      const initialScore = game.score;
      const points = alien.points;
      game._playerBullets.push({
        x: alien.x,
        y: alien.y,
        w: 2,
        h: 8,
      });
      game._checkCollisions();
      expect(game.score).toBe(initialScore + points);
    });

    test('player bullet hitting alien removes bullet', () => {
      const alien = game._aliens.find((a) => a.alive);
      game._playerBullets.push({
        x: alien.x,
        y: alien.y,
        w: 2,
        h: 8,
      });
      game._checkCollisions();
      expect(game._playerBullets.length).toBe(0);
    });

    test('player bullet hitting alien triggers HUD update', () => {
      const alien = game._aliens.find((a) => a.alive);
      const points = alien.points;
      hudData = null;
      game._playerBullets.push({
        x: alien.x,
        y: alien.y,
        w: 2,
        h: 8,
      });
      game._checkCollisions();
      expect(hudData).not.toBeNull();
      expect(hudData.score).toBe(points);
    });
  });

  // -------------------------------------------------------------------------
  // Player hit by alien bullet
  // -------------------------------------------------------------------------

  describe('Player hit by alien bullet', () => {
    test('alien bullet hitting player reduces lives', () => {
      const initialLives = game.lives;
      game._alienBullets.push({
        x: game._player.x,
        y: game._player.y,
        w: 2,
        h: 6,
      });
      game._checkCollisions();
      expect(game.lives).toBe(initialLives - 1);
    });

    test('alien bullet hitting player marks player as not alive', () => {
      game._alienBullets.push({
        x: game._player.x,
        y: game._player.y,
        w: 2,
        h: 6,
      });
      game._checkCollisions();
      expect(game._player.alive).toBe(false);
    });

    test('alien bullet hitting player removes bullet', () => {
      game._alienBullets.push({
        x: game._player.x,
        y: game._player.y,
        w: 2,
        h: 6,
      });
      game._checkCollisions();
      expect(game._alienBullets.length).toBe(0);
    });

    test('alien bullet hitting invulnerable player does not reduce lives', () => {
      game._player.invulnTimer = 1.5;
      const initialLives = game.lives;
      game._alienBullets.push({
        x: game._player.x,
        y: game._player.y,
        w: 2,
        h: 6,
      });
      game._checkCollisions();
      expect(game.lives).toBe(initialLives);
    });

    test('alien bullet hitting invulnerable player does not remove bullet', () => {
      game._player.invulnTimer = 1.5;
      game._alienBullets.push({
        x: game._player.x,
        y: game._player.y,
        w: 2,
        h: 6,
      });
      game._checkCollisions();
      expect(game._alienBullets.length).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // Game over
  // -------------------------------------------------------------------------

  describe('Game over', () => {
    test('game over when lives depleted', () => {
      game.lives = 1;
      game._alienBullets.push({
        x: game._player.x,
        y: game._player.y,
        w: 2,
        h: 6,
      });
      game._checkCollisions();
      expect(game.gameOver).toBe(true);
    });

    test('game over triggers HUD update with gameOver true', () => {
      game.lives = 1;
      hudData = null;
      game._alienBullets.push({
        x: game._player.x,
        y: game._player.y,
        w: 2,
        h: 6,
      });
      game._checkCollisions();
      expect(hudData).not.toBeNull();
      expect(hudData.gameOver).toBe(true);
    });

    test('update does nothing when game is over', () => {
      game.gameOver = true;
      const playerX = game._player.x;
      game.handleKeyDown('ArrowLeft');
      game.update(0.1);
      expect(game._player.x).toBe(playerX);
    });
  });

  // -------------------------------------------------------------------------
  // Level progression
  // -------------------------------------------------------------------------

  describe('Level progression', () => {
    test('level advances when all aliens killed', () => {
      for (const alien of game._aliens) {
        alien.alive = false;
      }
      game.update(0.01);
      expect(game._levelTransition).toBe(true);
    });

    test('level transition timer counts down', () => {
      for (const alien of game._aliens) {
        alien.alive = false;
      }
      game.update(0.01);
      const initialTimer = game._levelTransitionTimer;
      game.update(0.1);
      expect(game._levelTransitionTimer).toBeLessThan(initialTimer);
    });

    test('level increments after transition completes', () => {
      for (const alien of game._aliens) {
        alien.alive = false;
      }
      game.update(0.01);
      for (let i = 0; i < 20; i++) {
        game.update(0.1);
      }
      expect(game.level).toBe(2);
    });

    test('aliens respawn after level transition', () => {
      for (const alien of game._aliens) {
        alien.alive = false;
      }
      game.update(0.01);
      for (let i = 0; i < 20; i++) {
        game.update(0.1);
      }
      const aliveCount = game._aliens.filter((a) => a.alive).length;
      expect(aliveCount).toBe(55);
    });

    test('player bullets cleared after level transition', () => {
      game._playerBullets.push({ x: 100, y: 100, w: 2, h: 8 });
      for (const alien of game._aliens) {
        alien.alive = false;
      }
      game.update(0.01);
      for (let i = 0; i < 20; i++) {
        game.update(0.1);
      }
      expect(game._playerBullets.length).toBe(0);
    });

    test('alien bullets cleared after level transition', () => {
      game._alienBullets.push({ x: 100, y: 100, w: 2, h: 6 });
      for (const alien of game._aliens) {
        alien.alive = false;
      }
      game.update(0.01);
      for (let i = 0; i < 20; i++) {
        game.update(0.1);
      }
      expect(game._alienBullets.length).toBe(0);
    });

    test('player receives invulnerability after level transition', () => {
      for (const alien of game._aliens) {
        alien.alive = false;
      }
      game.update(0.01);
      for (let i = 0; i < 20; i++) {
        game.update(0.1);
      }
      expect(game._player.invulnTimer).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Aliens
  // -------------------------------------------------------------------------

  describe('Aliens', () => {
    test('aliens move horizontally', () => {
      const alien = game._aliens.find((a) => a.alive);
      const initialX = alien.x;
      game.update(0.1);
      expect(alien.x).not.toBe(initialX);
    });

    test('aliens reverse direction at edge', () => {
      const initialDir = game._alienDir;
      for (let i = 0; i < 100; i++) {
        game.update(0.1);
      }
      expect(game._alienDir).not.toBe(initialDir);
    });

    test('aliens drop when reversing direction', () => {
      const alien = game._aliens.find((a) => a.alive);
      const initialY = alien.y;
      for (let i = 0; i < 100; i++) {
        game.update(0.1);
      }
      expect(alien.y).toBeGreaterThan(initialY);
    });

    test('alien bullets move downward', () => {
      game._alienBullets.push({ x: 100, y: 100, w: 2, h: 6 });
      game.update(0.1);
      expect(game._alienBullets[0].y).toBeGreaterThan(100);
    });

    test('alien bullets removed when off screen', () => {
      game._aliens = []; // prevent new alien bullets during updates
      game._alienBullets.push({ x: 100, y: 350, w: 2, h: 6 });
      for (let i = 0; i < 20; i++) {
        game.update(0.1);
      }
      expect(game._alienBullets.length).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Player respawn
  // -------------------------------------------------------------------------

  describe('Player respawn', () => {
    test('player respawns after dead timer expires', () => {
      game._player.alive = false;
      game._player.invulnTimer = 0.8;
      for (let i = 0; i < 10; i++) {
        game.update(0.1);
      }
      expect(game._player.alive).toBe(true);
    });

    test('player is centered after respawn', () => {
      game._player.alive = false;
      game._player.invulnTimer = 0.8;
      game._player.x = 100;
      for (let i = 0; i < 10; i++) {
        game.update(0.1);
      }
      expect(game._player.x).toBe(240 - 26 / 2);
    });

    test('player has invulnerability after respawn', () => {
      game._player.alive = false;
      game._player.invulnTimer = 0.8;
      for (let i = 0; i < 10; i++) {
        game.update(0.1);
      }
      expect(game._player.invulnTimer).toBeGreaterThan(0);
    });

    test('invulnerability timer counts down', () => {
      game._player.invulnTimer = 1.5;
      game.update(0.1);
      expect(game._player.invulnTimer).toBeLessThan(1.5);
    });
  });

  // -------------------------------------------------------------------------
  // Resize
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Destroy
  // -------------------------------------------------------------------------

  describe('Destroy', () => {
    test('destroy does not crash', () => {
      expect(() => game.destroy()).not.toThrow();
    });

    test('game can be used after destroy', () => {
      game.destroy();
      expect(() => game.update(0.01)).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Shields
  // -------------------------------------------------------------------------

  describe('Shields', () => {
    test('player bullet hitting shield block destroys block', () => {
      const shield = game._shields[0];
      const block = shield.find((b) => b.alive);
      game._playerBullets.push({
        x: block.x,
        y: block.y,
        w: 2,
        h: 8,
      });
      game._checkCollisions();
      expect(block.alive).toBe(false);
    });

    test('player bullet hitting shield block removes bullet', () => {
      const shield = game._shields[0];
      const block = shield.find((b) => b.alive);
      game._playerBullets.push({
        x: block.x,
        y: block.y,
        w: 2,
        h: 8,
      });
      game._checkCollisions();
      expect(game._playerBullets.length).toBe(0);
    });

    test('alien bullet hitting shield block destroys block', () => {
      const shield = game._shields[0];
      const block = shield.find((b) => b.alive);
      game._alienBullets.push({
        x: block.x,
        y: block.y,
        w: 2,
        h: 6,
      });
      game._checkCollisions();
      expect(block.alive).toBe(false);
    });

    test('alien bullet hitting shield block removes bullet', () => {
      const shield = game._shields[0];
      const block = shield.find((b) => b.alive);
      game._alienBullets.push({
        x: block.x,
        y: block.y,
        w: 2,
        h: 6,
      });
      game._checkCollisions();
      expect(game._alienBullets.length).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  describe('Edge cases', () => {
    test('multiple aliens can be killed in one frame', () => {
      const alien1 = game._aliens[0];
      const alien2 = game._aliens[1];
      game._playerBullets.push({
        x: alien1.x,
        y: alien1.y,
        w: 2,
        h: 8,
      });
      game._playerBullets.push({
        x: alien2.x,
        y: alien2.y,
        w: 2,
        h: 8,
      });
      game._checkCollisions();
      expect(alien1.alive).toBe(false);
      expect(alien2.alive).toBe(false);
    });

    test('score increases correctly for multiple kills', () => {
      const alien1 = game._aliens[0];
      const alien2 = game._aliens[1];
      const expectedScore = alien1.points + alien2.points;
      game._playerBullets.push({
        x: alien1.x,
        y: alien1.y,
        w: 2,
        h: 8,
      });
      game._playerBullets.push({
        x: alien2.x,
        y: alien2.y,
        w: 2,
        h: 8,
      });
      game._checkCollisions();
      expect(game.score).toBe(expectedScore);
    });

    test('dead player does not move', () => {
      game._player.alive = false;
      game._player.invulnTimer = 0.5;
      const initialX = game._player.x;
      game.handleKeyDown('ArrowLeft');
      game.update(0.1);
      expect(game._player.x).toBe(initialX);
    });

    test('dead player cannot fire', () => {
      game._player.alive = false;
      game._player.invulnTimer = 0.5;
      game.handleKeyDown(' ');
      game.update(0.01);
      expect(game._playerBullets.length).toBe(0);
    });
  });
});
