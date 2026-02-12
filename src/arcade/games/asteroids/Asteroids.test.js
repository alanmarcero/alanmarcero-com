import { Asteroids } from './Asteroids';

describe('Asteroids', () => {
  let game;
  let hudData;

  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0.1);
    game = new Asteroids();
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

    test('gameOver starts as false', () => {
      expect(game.gameOver).toBe(false);
    });

    test('ship exists after init', () => {
      expect(game.ship).not.toBeNull();
    });

    test('ship spawns at center', () => {
      expect(game.ship.x).toBe(240);
      expect(game.ship.y).toBe(180);
    });

    test('ship is invulnerable initially', () => {
      expect(game.ship.invulnerable).toBe(true);
    });

    test('asteroids are spawned', () => {
      expect(game.asteroids.length).toBeGreaterThan(0);
    });

    test('bullets array starts empty', () => {
      expect(game.bullets).toEqual([]);
    });
  });

  describe('HUD Updates', () => {
    test('HUD callback fires after init', () => {
      expect(hudData).toEqual({
        score: 0,
        lives: 3,
        level: 1,
        gameOver: false,
      });
    });

    test('HUD callback fires after score change', () => {
      game.score = 100;
      game._emitHud();
      expect(hudData.score).toBe(100);
    });
  });

  describe('Ship Rotation', () => {
    test('pressing left rotates ship counter-clockwise', () => {
      const initialAngle = game.ship.angle;
      game.handleKeyDown('ArrowLeft');
      game.update(0.1);
      expect(game.ship.angle).toBeLessThan(initialAngle);
    });

    test('pressing right rotates ship clockwise', () => {
      const initialAngle = game.ship.angle;
      game.handleKeyDown('ArrowRight');
      game.update(0.1);
      expect(game.ship.angle).toBeGreaterThan(initialAngle);
    });

    test('touch left action rotates ship counter-clockwise', () => {
      const initialAngle = game.ship.angle;
      game.handleTouchAction('left', true);
      game.update(0.1);
      expect(game.ship.angle).toBeLessThan(initialAngle);
    });

    test('touch right action rotates ship clockwise', () => {
      const initialAngle = game.ship.angle;
      game.handleTouchAction('right', true);
      game.update(0.1);
      expect(game.ship.angle).toBeGreaterThan(initialAngle);
    });
  });

  describe('Ship Thrust', () => {
    test('pressing up increases velocity', () => {
      game.handleKeyDown('ArrowUp');
      game.update(0.1);
      const speed = Math.sqrt(game.ship.vx * game.ship.vx + game.ship.vy * game.ship.vy);
      expect(speed).toBeGreaterThan(0);
    });

    test('thrusting flag is set when pressing up', () => {
      game.handleKeyDown('ArrowUp');
      game.update(0.1);
      expect(game.ship.thrusting).toBe(true);
    });

    test('touch thrust action increases velocity', () => {
      game.handleTouchAction('thrust', true);
      game.update(0.1);
      const speed = Math.sqrt(game.ship.vx * game.ship.vx + game.ship.vy * game.ship.vy);
      expect(speed).toBeGreaterThan(0);
    });

    test('ship velocity persists after thrust released', () => {
      game.handleKeyDown('ArrowUp');
      game.update(0.1);
      game.handleKeyUp('ArrowUp');
      game.update(0.01);
      const speed = Math.sqrt(game.ship.vx * game.ship.vx + game.ship.vy * game.ship.vy);
      expect(speed).toBeGreaterThan(0);
    });
  });

  describe('Ship Movement', () => {
    test('ship position updates based on velocity', () => {
      game.ship.vx = 100;
      game.ship.vy = 0;
      const initialX = game.ship.x;
      game.update(0.1);
      expect(game.ship.x).toBeGreaterThan(initialX);
    });

    test('ship wraps around horizontal edges', () => {
      game.ship.x = -30;
      game.update(0.01);
      expect(game.ship.x).toBeGreaterThan(game.width);
    });

    test('ship wraps around vertical edges', () => {
      game.ship.y = -30;
      game.update(0.01);
      expect(game.ship.y).toBeGreaterThan(game.height);
    });
  });

  describe('Firing Bullets', () => {
    test('pressing space creates a bullet', () => {
      game.handleKeyDown(' ');
      game.update(0.1);
      expect(game.bullets.length).toBe(1);
    });

    test('bullet has initial velocity', () => {
      game.handleKeyDown(' ');
      game.update(0.1);
      const bullet = game.bullets[0];
      const speed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
      expect(speed).toBeGreaterThan(0);
    });

    test('bullet spawns at ship nose', () => {
      const shipX = game.ship.x;
      const shipY = game.ship.y;
      game.handleKeyDown(' ');
      game.update(0.1);
      const bullet = game.bullets[0];
      const distance = Math.sqrt((bullet.x - shipX) ** 2 + (bullet.y - shipY) ** 2);
      expect(distance).toBeGreaterThan(0);
    });

    test('touch fire action creates a bullet', () => {
      game.handleTouchAction('fire', true);
      game.update(0.1);
      expect(game.bullets.length).toBe(1);
    });

    test('fire cooldown prevents rapid firing', () => {
      game.handleKeyDown(' ');
      game.update(0.01);
      game.update(0.01);
      expect(game.bullets.length).toBe(1);
    });

    test('bullets can fire after cooldown expires', () => {
      game.handleKeyDown(' ');
      game.update(0.1);
      game.update(0.3);
      expect(game.bullets.length).toBe(2);
    });
  });

  describe('Bullet Lifecycle', () => {
    test('bullets move based on velocity', () => {
      game.ship.angle = 0; // point right so bullet moves along x-axis
      game.handleKeyDown(' ');
      game.update(0.1);
      const initialX = game.bullets[0].x;
      game.update(0.1);
      expect(game.bullets[0].x).not.toBe(initialX);
    });

    test('bullets expire after lifetime', () => {
      game.handleKeyDown(' ');
      game.update(0.1);
      game.update(2);
      expect(game.bullets.length).toBe(0);
    });

    test('bullets wrap around screen edges', () => {
      game.handleKeyDown(' ');
      game.update(0.1);
      game.bullets[0].x = -30;
      game.update(0.01);
      expect(game.bullets[0].x).toBeGreaterThan(game.width);
    });
  });

  describe('Bullet-Asteroid Collisions', () => {
    test('bullet hitting asteroid increases score', () => {
      const asteroid = game.asteroids[0];
      game.bullets.push({
        x: asteroid.x,
        y: asteroid.y,
        vx: 0,
        vy: 0,
        life: 1,
      });
      game._checkBulletAsteroidCollisions();
      expect(game.score).toBeGreaterThan(0);
    });

    test('bullet is removed after hitting asteroid', () => {
      const asteroid = game.asteroids[0];
      game.bullets.push({
        x: asteroid.x,
        y: asteroid.y,
        vx: 0,
        vy: 0,
        life: 1,
      });
      game._checkBulletAsteroidCollisions();
      expect(game.bullets.length).toBe(0);
    });

    test('asteroid is removed after being hit', () => {
      const asteroid = { x: 300, y: 300, size: 'small', radius: 12, vx: 0, vy: 0, vertices: [], rotationAngle: 0, rotationSpeed: 0 };
      game.asteroids = [asteroid];
      game.bullets.push({
        x: 300,
        y: 300,
        vx: 0,
        vy: 0,
        life: 1,
      });
      game._checkBulletAsteroidCollisions();
      expect(game.asteroids.some(a => a === asteroid)).toBe(false);
    });
  });

  describe('Asteroid Splitting', () => {
    test('large asteroid splits into 2 medium asteroids', () => {
      const largeAsteroid = { x: 100, y: 100, size: 'large', radius: 45 };
      game.asteroids = [largeAsteroid];
      game._destroyAsteroid(0);
      expect(game.asteroids.length).toBe(2);
      expect(game.asteroids[0].size).toBe('medium');
      expect(game.asteroids[1].size).toBe('medium');
    });

    test('medium asteroid splits into 2 small asteroids', () => {
      const mediumAsteroid = { x: 100, y: 100, size: 'medium', radius: 25 };
      game.asteroids = [mediumAsteroid];
      game._destroyAsteroid(0);
      expect(game.asteroids.length).toBe(2);
      expect(game.asteroids[0].size).toBe('small');
      expect(game.asteroids[1].size).toBe('small');
    });

    test('small asteroid does not split', () => {
      const smallAsteroid = { x: 100, y: 100, size: 'small', radius: 12 };
      game.asteroids = [smallAsteroid];
      game._destroyAsteroid(0);
      expect(game.asteroids.length).toBe(0);
    });

    test('split asteroids spawn at parent position', () => {
      const largeAsteroid = { x: 200, y: 150, size: 'large', radius: 45 };
      game.asteroids = [largeAsteroid];
      game._destroyAsteroid(0);
      expect(game.asteroids[0].x).toBe(200);
      expect(game.asteroids[0].y).toBe(150);
      expect(game.asteroids[1].x).toBe(200);
      expect(game.asteroids[1].y).toBe(150);
    });
  });

  describe('Ship-Asteroid Collisions', () => {
    test('ship colliding with asteroid is destroyed', () => {
      game.ship.invulnerable = false;
      const asteroid = game.asteroids[0];
      asteroid.x = game.ship.x;
      asteroid.y = game.ship.y;
      game._checkShipAsteroidCollisions();
      expect(game.ship).toBeNull();
    });

    test('ship collision decreases lives', () => {
      game.ship.invulnerable = false;
      const asteroid = game.asteroids[0];
      asteroid.x = game.ship.x;
      asteroid.y = game.ship.y;
      game._checkShipAsteroidCollisions();
      expect(game.lives).toBe(2);
    });

    test('invulnerable ship does not die on collision', () => {
      game.ship.invulnerable = true;
      const asteroid = game.asteroids[0];
      asteroid.x = game.ship.x;
      asteroid.y = game.ship.y;
      game._checkShipAsteroidCollisions();
      expect(game.ship).not.toBeNull();
    });

    test('invulnerability timer decreases on update', () => {
      const initialTimer = game.ship.invulnerableTimer;
      game.update(0.1);
      expect(game.ship.invulnerableTimer).toBeLessThan(initialTimer);
    });

    test('ship becomes vulnerable after timer expires', () => {
      game.ship.invulnerableTimer = 0.05;
      game.update(0.1);
      expect(game.ship.invulnerable).toBe(false);
    });
  });

  describe('Ship Respawn', () => {
    test('ship respawns after respawn delay', () => {
      game.ship.invulnerable = false;
      const asteroid = game.asteroids[0];
      asteroid.x = game.ship.x;
      asteroid.y = game.ship.y;
      game._checkShipAsteroidCollisions();
      game.update(1.5);
      expect(game.ship).not.toBeNull();
    });

    test('ship does not respawn immediately', () => {
      game.ship.invulnerable = false;
      const asteroid = game.asteroids[0];
      asteroid.x = game.ship.x;
      asteroid.y = game.ship.y;
      game._checkShipAsteroidCollisions();
      game.update(0.5);
      expect(game.ship).toBeNull();
    });

    test('respawned ship is invulnerable', () => {
      game.ship.invulnerable = false;
      const asteroid = game.asteroids[0];
      asteroid.x = game.ship.x;
      asteroid.y = game.ship.y;
      game._checkShipAsteroidCollisions();
      game.update(1.5);
      expect(game.ship.invulnerable).toBe(true);
    });
  });

  describe('Game Over', () => {
    test('game over when lives reach zero', () => {
      game.lives = 1;
      game.ship.invulnerable = false;
      const asteroid = game.asteroids[0];
      asteroid.x = game.ship.x;
      asteroid.y = game.ship.y;
      game._checkShipAsteroidCollisions();
      expect(game.gameOver).toBe(true);
    });

    test('ship does not respawn after game over', () => {
      game.lives = 1;
      game.ship.invulnerable = false;
      const asteroid = game.asteroids[0];
      asteroid.x = game.ship.x;
      asteroid.y = game.ship.y;
      game._checkShipAsteroidCollisions();
      game.update(2);
      expect(game.ship).toBeNull();
    });

    test('update stops processing when game over', () => {
      game.gameOver = true;
      const initialAsteroidCount = game.asteroids.length;
      game.update(0.1);
      expect(game.asteroids.length).toBe(initialAsteroidCount);
    });
  });

  describe('Level Transition', () => {
    test('level transition triggers when all asteroids cleared', () => {
      game.asteroids = [];
      game.update(0.1);
      expect(game.levelTransitioning).toBe(true);
    });

    test('level increases after transition delay', () => {
      game.asteroids = [];
      game.update(0.1);
      game.update(2);
      expect(game.level).toBe(2);
    });

    test('new asteroids spawn after level transition', () => {
      game.asteroids = [];
      game.update(0.1);
      game.update(2);
      expect(game.asteroids.length).toBeGreaterThan(0);
    });

    test('level transition does not trigger immediately', () => {
      game.asteroids = [];
      game.update(0.01);
      expect(game.level).toBe(1);
    });

    test('ship and bullets update during level transition', () => {
      game.asteroids = [];
      game.update(0.1);
      game.ship.vx = 100;
      const initialX = game.ship.x;
      game.update(0.1);
      expect(game.ship.x).not.toBe(initialX);
    });
  });

  describe('Restart', () => {
    test('restart resets score to 0', () => {
      game.score = 1000;
      game._restart();
      expect(game.score).toBe(0);
    });

    test('restart resets lives to 3', () => {
      game.lives = 1;
      game._restart();
      expect(game.lives).toBe(3);
    });

    test('restart resets level to 1', () => {
      game.level = 5;
      game._restart();
      expect(game.level).toBe(1);
    });

    test('restart creates new ship', () => {
      game.ship = null;
      game._restart();
      expect(game.ship).not.toBeNull();
    });

    test('restart clears gameOver flag', () => {
      game.gameOver = true;
      game._restart();
      expect(game.gameOver).toBe(false);
    });

    test('pressing space on game over restarts game', () => {
      game.gameOver = true;
      game.score = 500;
      game.handleKeyDown(' ');
      expect(game.score).toBe(0);
    });

    test('touch fire on game over restarts game', () => {
      game.gameOver = true;
      game.score = 500;
      game.handleTouchAction('fire', true);
      expect(game.score).toBe(0);
    });
  });

  describe('Asteroid Movement', () => {
    test('asteroids move based on velocity', () => {
      const asteroid = game.asteroids[0];
      const initialX = asteroid.x;
      game.update(0.1);
      expect(asteroid.x).not.toBe(initialX);
    });

    test('asteroids rotate over time', () => {
      const asteroid = game.asteroids[0];
      const initialAngle = asteroid.rotationAngle;
      game.update(0.1);
      expect(asteroid.rotationAngle).not.toBe(initialAngle);
    });

    test('asteroids wrap around screen edges', () => {
      const asteroid = game.asteroids[0];
      asteroid.x = -30;
      game.update(0.01);
      expect(asteroid.x).toBeGreaterThan(game.width);
    });
  });

  describe('Input Handling', () => {
    test('key down sets key state to true', () => {
      game.handleKeyDown('ArrowLeft');
      expect(game.keys['ArrowLeft']).toBe(true);
    });

    test('key up sets key state to false', () => {
      game.handleKeyDown('ArrowLeft');
      game.handleKeyUp('ArrowLeft');
      expect(game.keys['ArrowLeft']).toBe(false);
    });

    test('touch action sets action state', () => {
      game.handleTouchAction('thrust', true);
      expect(game.touchActions['thrust']).toBe(true);
    });

    test('touch action can be deactivated', () => {
      game.handleTouchAction('thrust', true);
      game.handleTouchAction('thrust', false);
      expect(game.touchActions['thrust']).toBe(false);
    });
  });

  describe('Destroy', () => {
    test('destroy clears ship', () => {
      game.destroy();
      expect(game.ship).toBeNull();
    });

    test('destroy clears bullets', () => {
      game.bullets.push({ x: 100, y: 100 });
      game.destroy();
      expect(game.bullets).toEqual([]);
    });

    test('destroy clears asteroids', () => {
      game.destroy();
      expect(game.asteroids).toEqual([]);
    });

    test('destroy clears keys', () => {
      game.handleKeyDown('ArrowLeft');
      game.destroy();
      expect(game.keys).toEqual({});
    });

    test('destroy clears touch actions', () => {
      game.handleTouchAction('thrust', true);
      game.destroy();
      expect(game.touchActions).toEqual({});
    });

    test('destroy removes HUD callback', () => {
      game.destroy();
      expect(game.onHudUpdate).toBeNull();
    });
  });

  describe('Resize', () => {
    test('resize updates width', () => {
      game.resize(800, 600);
      expect(game.width).toBe(800);
    });

    test('resize updates height', () => {
      game.resize(800, 600);
      expect(game.height).toBe(600);
    });
  });

  describe('Scoring', () => {
    test('destroying large asteroid awards points', () => {
      const largeAsteroid = { x: 100, y: 100, size: 'large', radius: 45 };
      game.asteroids = [largeAsteroid];
      game.score = 0;
      game.bullets.push({ x: 100, y: 100, vx: 0, vy: 0, life: 1 });
      game._checkBulletAsteroidCollisions();
      expect(game.score).toBe(20);
    });

    test('destroying medium asteroid awards more points', () => {
      const mediumAsteroid = { x: 100, y: 100, size: 'medium', radius: 25 };
      game.asteroids = [mediumAsteroid];
      game.score = 0;
      game.bullets.push({ x: 100, y: 100, vx: 0, vy: 0, life: 1 });
      game._checkBulletAsteroidCollisions();
      expect(game.score).toBe(50);
    });

    test('destroying small asteroid awards most points', () => {
      const smallAsteroid = { x: 100, y: 100, size: 'small', radius: 12 };
      game.asteroids = [smallAsteroid];
      game.score = 0;
      game.bullets.push({ x: 100, y: 100, vx: 0, vy: 0, life: 1 });
      game._checkBulletAsteroidCollisions();
      expect(game.score).toBe(100);
    });

    test('score accumulates across multiple hits', () => {
      const asteroid1 = { x: 100, y: 100, size: 'small', radius: 12 };
      const asteroid2 = { x: 200, y: 200, size: 'small', radius: 12 };
      game.asteroids = [asteroid1, asteroid2];
      game.score = 0;
      game.bullets.push({ x: 100, y: 100, vx: 0, vy: 0, life: 1 });
      game._checkBulletAsteroidCollisions();
      game.bullets.push({ x: 200, y: 200, vx: 0, vy: 0, life: 1 });
      game._checkBulletAsteroidCollisions();
      expect(game.score).toBe(200);
    });
  });
});
