import { CYAN, VIOLET, ORANGE, BG } from '../palette';
import { emitHud } from '../gameHud';
import { distance } from '../geometry';

const SHIP_ROTATION_SPEED = 4; // rad/s
const SHIP_THRUST = 280; // pixels/s^2
const SHIP_MAX_SPEED = 400; // pixels/s
const SHIP_SIZE = 18; // radius of ship triangle
const FRICTION = 0.99; // per frame at 60fps
const BULLET_SPEED = 500; // pixels/s
const BULLET_LIFETIME = 1.5; // seconds
const BULLET_RADIUS = 2.5;
const FIRE_COOLDOWN = 0.25; // seconds
const INVULNERABILITY_DURATION = 2; // seconds
const BLINK_RATE = 0.1; // seconds per blink toggle
const RESPAWN_DELAY = 1; // seconds before respawn
const LEVEL_TRANSITION_DELAY = 1.5; // seconds before next level starts
const STARTING_ASTEROIDS = 4;
const STARTING_LIVES = 3;

const ASTEROID_SPEEDS = {
  large: { min: 30, max: 60 },
  medium: { min: 50, max: 100 },
  small: { min: 80, max: 150 },
};

const ASTEROID_RADII = {
  large: 45,
  medium: 25,
  small: 12,
};

const ASTEROID_SCORES = {
  large: 20,
  medium: 50,
  small: 100,
};

/** What a shot rock breaks into; a small one is simply destroyed. */
const SPLITS_INTO = {
  large: 'medium',
  medium: 'small',
};

/** The keyboard key that drives each ship control, beside its touch action. */
const CONTROL_KEYS = {
  left: 'ArrowLeft',
  right: 'ArrowRight',
  thrust: 'ArrowUp',
  fire: ' ',
};

export class Asteroids {
  onHudUpdate = null;

  init(width, height) {
    this.width = width;
    this.height = height;

    this.keys = {};
    this.touchActions = {};

    this.score = 0;
    this.lives = STARTING_LIVES;
    this.level = 1;
    this.gameOver = false;

    this.ship = null;
    this.bullets = [];
    this.asteroids = [];

    this.fireCooldown = 0;
    this.respawnTimer = 0;
    this.levelTransitionTimer = 0;
    this.levelTransitioning = false;

    this._spawnShip();
    this._spawnAsteroids(STARTING_ASTEROIDS);
    this._emitHud();
  }

  update(dt) {
    if (this.gameOver) return;

    // Level transition delay
    if (this.levelTransitioning) {
      this.levelTransitionTimer -= dt;
      if (this.levelTransitionTimer <= 0) {
        this.levelTransitioning = false;
        this.level++;
        this._spawnAsteroids(STARTING_ASTEROIDS + this.level - 1);
        this._emitHud();
      }
      // Still update ship and bullets during transition
      this._updateShip(dt);
      this._updateBullets(dt);
      return;
    }

    // Respawn timer
    if (!this.ship && this.respawnTimer > 0) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this._spawnShip();
      }
      this._updateAsteroids(dt);
      return;
    }

    this._updateShip(dt);
    this._updateBullets(dt);
    this._updateAsteroids(dt);
    this._checkBulletAsteroidCollisions();
    this._checkShipAsteroidCollisions();

    // Check if level is cleared
    if (this.asteroids.length === 0 && !this.levelTransitioning) {
      this.levelTransitioning = true;
      this.levelTransitionTimer = LEVEL_TRANSITION_DELAY;
    }
  }

  render(ctx) {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, this.width, this.height);

    this._renderAsteroids(ctx);
    this._renderBullets(ctx);
    this._renderShip(ctx);
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  handleKeyDown(key) {
    if (this.gameOver && key === ' ') {
      this._restart();
      return;
    }
    this.keys[key] = true;
  }

  handleKeyUp(key) {
    this.keys[key] = false;
  }

  handleTouchAction(action, active) {
    if (this.gameOver && action === 'fire' && active) {
      this._restart();
      return;
    }
    this.touchActions[action] = active;
  }

  destroy() {
    this.keys = {};
    this.touchActions = {};
    this.ship = null;
    this.bullets = [];
    this.asteroids = [];
    this.onHudUpdate = null;
  }

  // --- Input helpers ---

  _isPressed(control) {
    const key = CONTROL_KEYS[control];
    if (!key) return false;
    return Boolean(this.keys[key] || this.touchActions[control]);
  }

  // --- Spawn helpers ---

  _spawnShip() {
    this.ship = {
      x: this.width / 2,
      y: this.height / 2,
      angle: -Math.PI / 2, // pointing up
      vx: 0,
      vy: 0,
      thrusting: false,
      invulnerable: true,
      invulnerableTimer: INVULNERABILITY_DURATION,
      blinkTimer: 0,
      visible: true,
    };
  }

  _spawnAsteroids(count) {
    for (let i = 0; i < count; i++) {
      this._spawnAsteroid('large', null);
    }
  }

  _spawnAsteroid(size, position) {
    const radius = ASTEROID_RADII[size];
    let x, y;

    if (position) {
      x = position.x;
      y = position.y;
    } else {
      // Spawn away from ship
      const margin = 80;
      do {
        x = Math.random() * this.width;
        y = Math.random() * this.height;
      } while (
        this.ship &&
        distance(x, y, this.ship.x, this.ship.y) < radius + SHIP_SIZE + margin
      );
    }

    const speedRange = ASTEROID_SPEEDS[size];
    const speed = speedRange.min + Math.random() * (speedRange.max - speedRange.min);
    const angle = Math.random() * Math.PI * 2;

    // Generate irregular polygon vertices
    const vertexCount = 6 + Math.floor(Math.random() * 5); // 6-10 vertices
    const vertices = [];
    for (let i = 0; i < vertexCount; i++) {
      const a = (i / vertexCount) * Math.PI * 2;
      const r = radius * (0.7 + Math.random() * 0.3);
      vertices.push({ angle: a, r });
    }

    this.asteroids.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      radius,
      vertices,
      rotationAngle: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 1.5,
    });
  }

  // --- Update logic ---

  _updateShip(dt) {
    if (!this.ship) return;

    this._steerShip(dt);
    this._moveShip(dt);
    this._updateFiring(dt);
    this._updateInvulnerability(dt);
  }

  _steerShip(dt) {
    const ship = this.ship;
    if (this._isPressed('left')) ship.angle -= SHIP_ROTATION_SPEED * dt;
    if (this._isPressed('right')) ship.angle += SHIP_ROTATION_SPEED * dt;

    ship.thrusting = this._isPressed('thrust');
    if (!ship.thrusting) return;
    ship.vx += Math.cos(ship.angle) * SHIP_THRUST * dt;
    ship.vy += Math.sin(ship.angle) * SHIP_THRUST * dt;
  }

  _moveShip(dt) {
    const ship = this.ship;

    // FRICTION is a per-frame rate at 60fps, so it is raised to the number of
    // 60fps frames this step spans.
    const friction = Math.pow(FRICTION, dt * 60);
    ship.vx *= friction;
    ship.vy *= friction;

    const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
    if (speed > SHIP_MAX_SPEED) {
      const speedCap = SHIP_MAX_SPEED / speed;
      ship.vx *= speedCap;
      ship.vy *= speedCap;
    }

    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    this._wrap(ship);
  }

  _updateFiring(dt) {
    this.fireCooldown -= dt;
    if (!this._isPressed('fire') || this.fireCooldown > 0) return;
    this._fireBullet();
    this.fireCooldown = FIRE_COOLDOWN;
  }

  _updateInvulnerability(dt) {
    const ship = this.ship;
    if (!ship.invulnerable) return;

    ship.invulnerableTimer -= dt;
    ship.blinkTimer -= dt;
    if (ship.blinkTimer <= 0) {
      ship.visible = !ship.visible;
      ship.blinkTimer = BLINK_RATE;
    }
    if (ship.invulnerableTimer <= 0) {
      ship.invulnerable = false;
      ship.visible = true;
    }
  }

  _updateBullets(dt) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      this._wrap(b);

      if (b.life <= 0) {
        this.bullets.splice(i, 1);
      }
    }
  }

  _updateAsteroids(dt) {
    for (const a of this.asteroids) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.rotationAngle += a.rotationSpeed * dt;
      this._wrap(a);
    }
  }

  _fireBullet() {
    if (!this.ship) return;

    const noseX = this.ship.x + Math.cos(this.ship.angle) * SHIP_SIZE;
    const noseY = this.ship.y + Math.sin(this.ship.angle) * SHIP_SIZE;

    this.bullets.push({
      x: noseX,
      y: noseY,
      vx: Math.cos(this.ship.angle) * BULLET_SPEED + this.ship.vx * 0.3,
      vy: Math.sin(this.ship.angle) * BULLET_SPEED + this.ship.vy * 0.3,
      life: BULLET_LIFETIME,
    });
  }

  // --- Collision detection ---

  _checkBulletAsteroidCollisions() {
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const b = this.bullets[bi];

      for (let ai = this.asteroids.length - 1; ai >= 0; ai--) {
        const a = this.asteroids[ai];

        if (distance(b.x, b.y, a.x, a.y) < a.radius + BULLET_RADIUS) {
          this.bullets.splice(bi, 1);
          this.score += ASTEROID_SCORES[a.size];
          this._destroyAsteroid(ai);
          this._emitHud();
          break; // bullet is gone, move to next bullet
        }
      }
    }
  }

  _checkShipAsteroidCollisions() {
    if (!this.ship || this.ship.invulnerable) return;

    for (let ai = this.asteroids.length - 1; ai >= 0; ai--) {
      const a = this.asteroids[ai];

      if (distance(this.ship.x, this.ship.y, a.x, a.y) < a.radius + SHIP_SIZE * 0.6) {
        this._shipDeath();
        return;
      }
    }
  }

  _destroyAsteroid(index) {
    const a = this.asteroids[index];
    this.asteroids.splice(index, 1);

    const fragmentSize = SPLITS_INTO[a.size];
    if (!fragmentSize) return;

    this._spawnAsteroid(fragmentSize, { x: a.x, y: a.y });
    this._spawnAsteroid(fragmentSize, { x: a.x, y: a.y });
  }

  _shipDeath() {
    this.ship = null;
    this.lives--;

    if (this.lives <= 0) {
      this.gameOver = true;
      this._emitHud();
      return;
    }

    this._emitHud();
    this.respawnTimer = RESPAWN_DELAY;
  }

  // --- Rendering ---

  _renderShip(ctx) {
    if (!this.ship || !this.ship.visible) return;

    const { x, y, angle, thrusting } = this.ship;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Glow
    ctx.shadowColor = VIOLET;
    ctx.shadowBlur = 8;

    // Ship triangle outline
    ctx.strokeStyle = VIOLET;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(SHIP_SIZE, 0); // nose
    ctx.lineTo(-SHIP_SIZE * 0.7, -SHIP_SIZE * 0.6); // left wing
    ctx.lineTo(-SHIP_SIZE * 0.4, 0); // rear indent
    ctx.lineTo(-SHIP_SIZE * 0.7, SHIP_SIZE * 0.6); // right wing
    ctx.closePath();
    ctx.stroke();

    // Thrust flame
    if (thrusting) {
      ctx.shadowColor = ORANGE;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const flicker = 0.8 + Math.random() * 0.4;
      ctx.moveTo(-SHIP_SIZE * 0.5, -SHIP_SIZE * 0.25);
      ctx.lineTo(-SHIP_SIZE * (0.8 + 0.3 * flicker), 0);
      ctx.lineTo(-SHIP_SIZE * 0.5, SHIP_SIZE * 0.25);
      ctx.stroke();
    }

    ctx.restore();
  }

  _renderAsteroids(ctx) {
    ctx.save();
    ctx.shadowColor = CYAN;
    ctx.shadowBlur = 6;
    ctx.strokeStyle = CYAN;
    ctx.lineWidth = 1.5;

    for (const a of this.asteroids) {
      ctx.beginPath();
      for (let i = 0; i < a.vertices.length; i++) {
        const v = a.vertices[i];
        const vAngle = v.angle + a.rotationAngle;
        const px = a.x + Math.cos(vAngle) * v.r;
        const py = a.y + Math.sin(vAngle) * v.r;
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
  }

  _renderBullets(ctx) {
    ctx.save();
    ctx.shadowColor = ORANGE;
    ctx.shadowBlur = 6;
    ctx.fillStyle = ORANGE;

    for (const b of this.bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, BULLET_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // --- Utility ---

  _wrap(obj) {
    const margin = 20;
    if (obj.x < -margin) obj.x = this.width + margin;
    else if (obj.x > this.width + margin) obj.x = -margin;
    if (obj.y < -margin) obj.y = this.height + margin;
    else if (obj.y > this.height + margin) obj.y = -margin;
  }

  _emitHud() {
    emitHud(this);
  }

  _restart() {
    this.init(this.width, this.height);
  }
}
