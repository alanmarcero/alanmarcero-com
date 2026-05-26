import { CYAN, VIOLET, ORANGE, BG, WHITE, MUTED } from '../palette';

const GAME_W = 640;
const GAME_H = 360;

const PLAYER_SPEED = 220;
const BULLET_SPEED = 420;
const ENEMY_SPEED = 95;

const STARTING_LIVES = 3;

export class LifePulse {
  onHudUpdate = null;

  constructor() {
    this.assets = {};
    this.assetsLoaded = false;
    this._loadAssets();
  }

  _loadAssets() {
    const assetList = [
      ['player', '/assets/arcade/life-pulse/player-ship.jpg'],
      ['boss', '/assets/arcade/life-pulse/boss.jpg'],
      ['drone', '/assets/arcade/life-pulse/enemy-drone.jpg'],
      ['turret', '/assets/arcade/life-pulse/enemy-turret.jpg'],
      ['powerDouble', '/assets/arcade/life-pulse/powerup-double.jpg'],
      ['powerShield', '/assets/arcade/life-pulse/powerup-shield.jpg'],
      // Animation frames (2nd + 3rd sets)
      ['player-thruster-1', '/assets/arcade/life-pulse/player-thruster-1.jpg'],
      ['player-thruster-2', '/assets/arcade/life-pulse/player-thruster-2.jpg'],
      ['player-thruster-3', '/assets/arcade/life-pulse/player-thruster-3.jpg'],
      ['player-thruster-4', '/assets/arcade/life-pulse/player-thruster-4.jpg'],
      ['enemy-drone-wing-1', '/assets/arcade/life-pulse/enemy-drone-wing-1.jpg'],
      ['enemy-drone-wing-2', '/assets/arcade/life-pulse/enemy-drone-wing-2.jpg'],
      ['enemy-drone-wing-3', '/assets/arcade/life-pulse/enemy-drone-wing-3.jpg'],
      ['enemy-drone-wing-4', '/assets/arcade/life-pulse/enemy-drone-wing-4.jpg'],
      ['explosion-1', '/assets/arcade/life-pulse/explosion-1.jpg'],
      ['explosion-2', '/assets/arcade/life-pulse/explosion-2.jpg'],
      ['explosion-3', '/assets/arcade/life-pulse/explosion-3.jpg'],
      ['explosion-4', '/assets/arcade/life-pulse/explosion-4.jpg'],
      ['explosion-5', '/assets/arcade/life-pulse/explosion-5.jpg'],
      ['explosion-6', '/assets/arcade/life-pulse/explosion-6.jpg'],
      ['boss-anim-1', '/assets/arcade/life-pulse/boss-anim-1.jpg'],
      ['boss-anim-2', '/assets/arcade/life-pulse/boss-anim-2.jpg'],
      ['boss-anim-3', '/assets/arcade/life-pulse/boss-anim-3.jpg'],
      ['boss-anim-4', '/assets/arcade/life-pulse/boss-anim-4.jpg'],
      // 3rd set - power states and growth pulsing
      ['player-powered1', '/assets/arcade/life-pulse/player-powered1.jpg'],
      ['player-powered2', '/assets/arcade/life-pulse/player-powered2.jpg'],
      ['player-powered-spread', '/assets/arcade/life-pulse/player-powered-spread.jpg'],
      ['player-shield', '/assets/arcade/life-pulse/player-shield.jpg'],
      ['growth-pulse-1', '/assets/arcade/life-pulse/growth-pulse-1.jpg'],
      ['growth-pulse-2', '/assets/arcade/life-pulse/growth-pulse-2.jpg'],
      ['growth-pulse-3', '/assets/arcade/life-pulse/growth-pulse-3.jpg'],
      ['growth-pulse-4', '/assets/arcade/life-pulse/growth-pulse-4.jpg'],
      ['growth-pulse-5', '/assets/arcade/life-pulse/growth-pulse-5.jpg'],
      ['background', '/assets/arcade/life-pulse/background.jpg'],
      ['background-layer2', '/assets/arcade/life-pulse/background-layer2.jpg'],
    ];

    let loaded = 0;
    const total = assetList.length;

    assetList.forEach(([key, src]) => {
      const img = new Image();
      img.onload = () => {
        loaded++;
        if (loaded === total) this.assetsLoaded = true;
      };
      img.src = src;
      this.assets[key] = img;
    });
  }

  init(width, height) {
    this.canvasW = width;
    this.canvasH = height;
    this.scale = Math.min(width / GAME_W, height / GAME_H);
    this.offsetX = (width - GAME_W * this.scale) / 2;
    this.offsetY = (height - GAME_H * this.scale) / 2;

    this.score = 0;
    this.lives = STARTING_LIVES;
    this.level = 1;
    this.gameOver = false;

    this._keys = {
      left: false, right: false, up: false, down: false,
      fire: false, secondary: false
    };
    this._fireCooldown = 0;
    this._secondaryCooldown = 0;

    this._player = {
      x: 90,
      y: GAME_H / 2,
      vx: 0,
      vy: 0,
      w: 18,
      h: 10,
      alive: true,
      invuln: 0,
    };

    this._bullets = [];
    this._enemyBullets = [];
    this._enemies = [];
    this._particles = [];
    this._explosions = [];
    this._powerups = [];
    this._powerLevel = 0;
    this._powerTimer = 0;

    this._scroll = 0;
    this._spawnTimer = 0;
    this._difficulty = 1;
    this._bossActive = false;
    this._boss = null;
    this._time = 0;
    this._shake = 0;

    this._emitHud();
  }

  resize(width, height) {
    this.canvasW = width;
    this.canvasH = height;
    this.scale = Math.min(width / GAME_W, height / GAME_H);
    this.offsetX = (width - GAME_W * this.scale) / 2;
    this.offsetY = (height - GAME_H * this.scale) / 2;
  }

  _emitHud() {
    if (this.onHudUpdate) {
      this.onHudUpdate({
        score: Math.floor(this.score),
        lives: this.lives,
        level: this.level,
        gameOver: this.gameOver,
      });
    }
  }

  // ==================== INPUT ====================
  handleKeyDown(key) {
    if (this.gameOver) return;

    const k = key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') this._keys.left = true;
    if (k === 'arrowright' || k === 'd') this._keys.right = true;
    if (k === 'arrowup' || k === 'w') this._keys.up = true;
    if (k === 'arrowdown' || k === 's') this._keys.down = true;
    if (k === ' ' || k === 'spacebar') this._keys.fire = true;
    if (k === 'x' || k === 'shift') this._keys.secondary = true;
  }

  handleKeyUp(key) {
    const k = key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') this._keys.left = false;
    if (k === 'arrowright' || k === 'd') this._keys.right = false;
    if (k === 'arrowup' || k === 'w') this._keys.up = false;
    if (k === 'arrowdown' || k === 's') this._keys.down = false;
    if (k === ' ' || k === 'spacebar') this._keys.fire = false;
    if (k === 'x' || k === 'shift') this._keys.secondary = false;
  }

  handleTouchAction(action, active) {
    if (this.gameOver) return;

    if (action === 'left') this._keys.left = active;
    if (action === 'right') this._keys.right = active;
    if (action === 'up') this._keys.up = active;
    if (action === 'down') this._keys.down = active;
    if (action === 'fire') this._keys.fire = active;
    // Map secondary to a second action if available
    if (action === 'secondary' || action === 'fire2') this._keys.secondary = active;
  }

  // ==================== UPDATE ====================
  update(dt) {
    if (this.gameOver) return;

    this._time += dt;

    this._updatePlayer(dt);
    this._updateBullets(dt);
    this._updateEnemies(dt);
    this._updateEnemyBullets(dt);
    this._updateParticles(dt);
    this._updateExplosions(dt);
    this._updatePowerups(dt);
    this._spawnEnemies(dt);
    this._updateBoss(dt);
    this._checkCollisions();

    this._scroll = (this._scroll + 52 * dt) % 64;

    this._difficulty = Math.min(3.5, 1 + this.score / 2400);

    // Screen shake decay
    if (this._shake > 0) this._shake *= 0.82;

    // Spawn boss after some time or high score
    if (!this._bossActive && !this._boss && this._time > 52 && Math.random() < 0.012) {
      this._spawnBoss();
    }

    this._emitHud();
  }

  _updatePlayer(dt) {
    if (!this._player.alive) return;

    const p = this._player;
    const accel = 1450;
    const friction = 6.5;
    const maxSpeed = 265;

    let ax = 0, ay = 0;
    if (this._keys.left) ax -= 1;
    if (this._keys.right) ax += 1;
    if (this._keys.up) ay -= 1;
    if (this._keys.down) ay += 1;

    // Normalize diagonal
    if (ax !== 0 && ay !== 0) {
      const len = Math.sqrt(ax * ax + ay * ay);
      ax /= len; ay /= len;
    }

    p.vx += ax * accel * dt;
    p.vy += ay * accel * dt;

    // Friction
    p.vx *= (1 - friction * dt);
    p.vy *= (1 - friction * dt);

    // Clamp speed
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (speed > maxSpeed) {
      const s = maxSpeed / speed;
      p.vx *= s;
      p.vy *= s;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Bounds with soft walls
    const leftBound = 32;
    const rightBound = 235;
    const top = 22;
    const bottom = GAME_H - 22;

    if (p.x < leftBound) { p.x = leftBound; p.vx *= -0.3; }
    if (p.x > rightBound) { p.x = rightBound; p.vx *= -0.3; }
    if (p.y < top) { p.y = top; p.vy *= -0.35; }
    if (p.y > bottom) { p.y = bottom; p.vy *= -0.35; }

    // Firing
    this._fireCooldown -= dt;
    const fireRate = this._powerLevel > 0 ? 0.065 : 0.115;
    if (this._keys.fire && this._fireCooldown <= 0) {
      this._fireCooldown = fireRate;
      this._shoot();
    }

    this._powerTimer -= dt;
    if (this._powerTimer <= 0) this._powerLevel = 0;

    this._secondaryCooldown -= dt;
    if (this._keys.secondary && this._secondaryCooldown <= 0) {
      this._secondaryCooldown = 0.32;
      this._shootSecondary();
    }

    if (this._player.invuln > 0) this._player.invuln -= dt;
  }

  _shoot() {
    const spread = this._powerLevel >= 1 ? 14 : 0;

    this._bullets.push({
      x: this._player.x + 16,
      y: this._player.y,
      vx: BULLET_SPEED,
      vy: 0,
      w: 9,
      h: 3,
      life: 1.7,
    });

    if (this._powerLevel >= 2) {
      this._bullets.push({
        x: this._player.x + 14,
        y: this._player.y - spread,
        vx: BULLET_SPEED,
        vy: -28,
        w: 7,
        h: 2,
        life: 1.4,
      });
      this._bullets.push({
        x: this._player.x + 14,
        y: this._player.y + spread,
        vx: BULLET_SPEED,
        vy: 28,
        w: 7,
        h: 2,
        life: 1.4,
      });
    }
  }

  _shootSecondary() {
    // Simple forward missile
    this._bullets.push({
      x: this._player.x + 12,
      y: this._player.y + 4,
      vx: BULLET_SPEED * 0.85,
      vy: 0,
      w: 10,
      h: 5,
      life: 1.8,
      secondary: true,
    });
  }

  _updateBullets(dt) {
    for (let i = this._bullets.length - 1; i >= 0; i--) {
      const b = this._bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      if (b.life <= 0 || b.x > GAME_W + 20) {
        this._bullets.splice(i, 1);
      }
    }
  }

  _updateEnemyBullets(dt) {
    for (let i = this._enemyBullets.length - 1; i >= 0; i--) {
      const b = this._enemyBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (b.x < -20 || b.y < -20 || b.y > GAME_H + 20) {
        this._enemyBullets.splice(i, 1);
      }
    }
  }

  _updateEnemies(dt) {
    for (let i = this._enemies.length - 1; i >= 0; i--) {
      const e = this._enemies[i];
      e.x += e.vx * dt;
      e.y += e.vy * dt;

      // Simple behaviors
      if (e.type === 'swooper') {
        e.vy = Math.sin(e.y * 0.025) * 80;
      }

      if (e.type === 'turret' && Math.random() < 0.018 * this._difficulty) {
        this._enemyShoot(e);
      }

      if (e.x < -40) {
        this._enemies.splice(i, 1);
        continue;
      }

      // Remove if dead
      if (e.hp <= 0) {
        this._createExplosion(e.x, e.y, e.size || 14);

        // Growth splits into smaller threats
        if (e.split) {
          for (let s = 0; s < 2; s++) {
            this._enemies.push({
              x: e.x + (Math.random() - 0.5) * 18,
              y: e.y + (Math.random() - 0.5) * 18,
              vx: -ENEMY_SPEED * (0.7 + Math.random() * 0.5),
              vy: (Math.random() - 0.5) * 55,
              hp: 1,
              points: 55,
              size: 9,
              type: 'drone',
            });
          }
        }

        this.score += e.points || 80;
        this._enemies.splice(i, 1);
      }
    }
  }

  _enemyShoot(e) {
    const dx = this._player.x - e.x;
    const dy = this._player.y - e.y;
    const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));

    this._enemyBullets.push({
      x: e.x,
      y: e.y,
      vx: (dx / dist) * 160,
      vy: (dy / dist) * 160,
    });
  }

  _updateParticles(dt) {
    for (let i = this._particles.length - 1; i >= 0; i--) {
      const p = this._particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.vx *= 0.98;
      p.vy *= 0.98;

      if (p.life <= 0) this._particles.splice(i, 1);
    }
  }

  _updateExplosions(dt) {
    for (let i = this._explosions.length - 1; i >= 0; i--) {
      const ex = this._explosions[i];
      ex.age += dt;

      // Map age to frame (1-6)
      const progress = ex.age / ex.duration;
      ex.frame = Math.min(6, Math.max(1, Math.floor(progress * 6) + 1));

      if (ex.age >= ex.duration) {
        this._explosions.splice(i, 1);
      }
    }
  }

  _updatePowerups(dt) {
    for (let i = this._powerups.length - 1; i >= 0; i--) {
      const p = this._powerups[i];
      p.x -= 70 * dt;
      p.life = (p.life || 6) - dt;

      if (p.x < -20 || p.life <= 0) {
        this._powerups.splice(i, 1);
      }
    }
  }

  _spawnEnemies(dt) {
    this._spawnTimer -= dt;

    const baseRate = 0.9 / this._difficulty;

    if (this._spawnTimer <= 0) {
      this._spawnTimer = baseRate + Math.random() * 0.4;

      const y = 40 + Math.random() * (GAME_H - 80);

      // Mix of enemy types
      const roll = Math.random();

      if (roll < 0.45) {
        // Basic drone
        this._enemies.push({
          x: GAME_W + 20,
          y,
          vx: -ENEMY_SPEED * (0.9 + Math.random() * 0.4),
          vy: (Math.random() - 0.5) * 30,
          hp: 1,
          points: 60,
          size: 11,
          type: 'drone',
        });
      } else if (roll < 0.75) {
        // Swooper
        this._enemies.push({
          x: GAME_W + 30,
          y: y * 0.6 + 30,
          vx: -ENEMY_SPEED * 1.15,
          vy: 0,
          hp: 1,
          points: 90,
          size: 12,
          type: 'swooper',
        });
      } else if (roll < 0.88) {
        // Turret / spawner
        this._enemies.push({
          x: GAME_W + 25,
          y,
          vx: -ENEMY_SPEED * 0.65,
          vy: 0,
          hp: 3,
          points: 140,
          size: 16,
          type: 'turret',
        });
      } else {
        // Biological growth (splits into smaller enemies when destroyed)
        this._enemies.push({
          x: GAME_W + 30,
          y,
          vx: -ENEMY_SPEED * 0.55,
          vy: (Math.random() - 0.5) * 18,
          hp: 5,
          points: 210,
          size: 19,
          type: 'growth',
          split: true,
        });
      }
    }

    // Occasional power-up
    if (Math.random() < 0.0075) {
      const type = Math.random() < 0.65 ? 'double' : 'shield';
      this._powerups.push({
        x: GAME_W + 10,
        y: 50 + Math.random() * (GAME_H - 100),
        type,
      });
    }
  }

  _spawnBoss() {
    this._bossActive = true;
    this._boss = {
      x: GAME_W + 60,
      y: GAME_H / 2,
      hp: 48 + Math.floor(this._difficulty * 8),
      maxHp: 48 + Math.floor(this._difficulty * 8),
      phase: 0,
      timer: 0,
      vx: -32,
    };
  }

  _updateBoss(dt) {
    if (!this._boss) return;

    const b = this._boss;
    b.timer += dt;

    // Entry
    if (b.x > GAME_W - 110) {
      b.x += b.vx * dt;
      return;
    }

    b.vx = 0;

    const healthRatio = b.hp / b.maxHp;

    // Phase change
    if (b.phase === 0 && healthRatio < 0.45) {
      b.phase = 1;
      b.timer = 0;
    }

    // Movement
    const freq = b.phase === 0 ? 1.55 : 2.1;
    const amp = b.phase === 0 ? 62 : 48;
    b.y = GAME_H / 2 + Math.sin(b.timer * freq) * amp + (b.phase === 1 ? Math.sin(b.timer * 3.2) * 18 : 0);

    // Attacks
    if (b.phase === 0) {
      if (b.timer % 1.05 < 0.05) {
        for (let i = -1; i <= 1; i++) {
          this._enemyBullets.push({
            x: b.x - 22,
            y: b.y + i * 16,
            vx: -175,
            vy: i * 38,
          });
        }
      }
      if (b.timer % 2.6 < 0.04 && Math.random() < 0.75) {
        this._enemies.push({
          x: b.x - 25,
          y: b.y + (Math.random() - 0.5) * 70,
          vx: -105,
          vy: (Math.random() - 0.5) * 50,
          hp: 2,
          points: 95,
          size: 12,
          type: 'swooper',
        });
      }
    } else {
      // Phase 2 — more aggressive
      if (b.timer % 0.65 < 0.05) {
        this._enemyBullets.push({
          x: b.x - 20,
          y: b.y,
          vx: -195,
          vy: (Math.random() - 0.5) * 70,
        });
      }
      if (b.timer % 1.9 < 0.06) {
        for (let i = -2; i <= 2; i += 2) {
          this._enemyBullets.push({
            x: b.x - 18,
            y: b.y + i * 12,
            vx: -160,
            vy: i * 32,
          });
        }
      }
      if (b.timer % 3.1 < 0.05) {
        this._enemies.push({
          x: b.x - 18,
          y: b.y,
          vx: -85,
          vy: (Math.random() - 0.5) * 30,
          hp: 3,
          points: 160,
          size: 14,
          type: 'growth',
          split: true,
        });
      }
    }
  }

  _checkCollisions() {
    // Player bullets vs enemies
    for (let i = this._bullets.length - 1; i >= 0; i--) {
      const b = this._bullets[i];

      for (let j = this._enemies.length - 1; j >= 0; j--) {
        const e = this._enemies[j];
        if (this._rectsOverlap(b, e)) {
          e.hp = (e.hp || 1) - (b.secondary ? 2 : 1);
          this._createHitParticle(b.x, b.y);
          this._bullets.splice(i, 1);
          break;
        }
      }
    }

    // Enemy bullets vs player
    if (this._player.alive && this._player.invuln <= 0) {
      for (let i = this._enemyBullets.length - 1; i >= 0; i--) {
        const b = this._enemyBullets[i];
        if (this._pointInRect(b.x, b.y, this._player)) {
          this._hitPlayer();
          this._enemyBullets.splice(i, 1);
        }
      }
    }

    // Enemies vs player
    if (this._player.alive && this._player.invuln <= 0) {
      for (let i = this._enemies.length - 1; i >= 0; i--) {
        const e = this._enemies[i];
        if (this._rectsOverlap(e, this._player)) {
          this._hitPlayer();
          e.hp = 0;
        }
      }
    }

    // Player vs powerups
    for (let i = this._powerups.length - 1; i >= 0; i--) {
      const p = this._powerups[i];
      if (this._pointInRect(p.x, p.y, this._player)) {
        this._applyPowerup(p.type);
        this._powerups.splice(i, 1);
      }
    }

    // Player bullets vs boss
    if (this._boss) {
      for (let i = this._bullets.length - 1; i >= 0; i--) {
        const b = this._bullets[i];
        if (this._pointInRect(b.x, b.y, this._boss)) {
          this._boss.hp -= (b.secondary ? 3 : 1);
          this._createHitParticle(b.x, b.y);
          this._bullets.splice(i, 1);

          if (this._boss.hp <= 0) {
            this._createExplosion(this._boss.x, this._boss.y, 42);
            this._shake = 18;
            this.score += 850;
            this._boss = null;
            this._bossActive = false;
          }
        }
      }
    }
  }

  _hitPlayer() {
    this._player.invuln = 1.8;
    this.lives -= 1;
    this._createExplosion(this._player.x, this._player.y, 22);
    this._shake = Math.max(this._shake, 7);

    if (this.lives <= 0) {
      this.gameOver = true;
      this._emitHud();
    } else {
      this._emitHud();
    }
  }

  _applyPowerup(type) {
    if (type === 'double') {
      this._powerLevel = Math.min(2, this._powerLevel + 1);
      this._powerTimer = 18;
      this.score += 180;
    } else if (type === 'shield') {
      this._player.invuln = Math.max(this._player.invuln, 6.5);
      this.score += 220;
    }
  }

  _createExplosion(x, y, size = 16) {
    const isBig = size > 25;

    // Use animated sprite explosion for big ones (3rd set)
    if (isBig) {
      this._explosions.push({
        x,
        y,
        frame: 1,
        age: 0,
        duration: 0.65, // 6 frames over ~0.65s (slower, more readable)
      });
      this._shake = Math.max(this._shake, 14);
    } else {
      // Keep small particle explosions for regular hits
      const count = 10;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
        const speed = 50 + Math.random() * 90;
        this._particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.22 + Math.random() * 0.25,
          size: 1.8 + Math.random() * 2,
        });
      }
    }
  }

  _createHitParticle(x, y) {
    this._particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 80,
      vy: (Math.random() - 0.5) * 80,
      life: 0.18,
      size: 2.5,
    });
  }

  _rectsOverlap(a, b) {
    const aw = a.w || 11;
    const ah = a.h || 7;
    const bw = b.size || b.w || 11;
    const bh = b.size || b.h || 11;

    return !(a.x + aw * 0.5 < b.x - bw * 0.5 ||
             b.x + bw * 0.5 < a.x - aw * 0.5 ||
             a.y + ah * 0.5 < b.y - bh * 0.5 ||
             b.y + bh * 0.5 < a.y - ah * 0.5);
  }

  _pointInRect(px, py, r) {
    const rw = r.w || r.size || 12;
    const rh = r.h || r.size || 12;
    return px > r.x - rw * 0.45 && px < r.x + rw * 0.45 &&
           py > r.y - rh * 0.45 && py < r.y + rh * 0.45;
  }

  // ==================== RENDER ====================
  render(ctx) {
    ctx.save();

    // Apply screen shake
    const shakeX = (Math.random() - 0.5) * this._shake * 0.9;
    const shakeY = (Math.random() - 0.5) * this._shake * 0.9;
    ctx.translate(this.offsetX + shakeX, this.offsetY + shakeY);
    ctx.scale(this.scale, this.scale);

    // Crisp pixel art rendering
    ctx.imageSmoothingEnabled = false;

    // Background
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    // Scrolling stars + organic lines
    this._drawBackground(ctx);

    // Player
    if (this._player.alive) {
      const p = this._player;
      const alpha = p.invuln > 0 ? (Math.floor(p.invuln * 10) % 2 === 0 ? 0.45 : 1) : 1;
      ctx.globalAlpha = alpha;

      // Player ship with power state visuals (3rd set)
      let playerImg = this.assets.player;
      let pw = 28, ph = 18;

      if (this._powerLevel >= 2) {
        const spreadImg = this.assets['player-powered-spread'];
        if (spreadImg && spreadImg.complete) {
          playerImg = spreadImg;
          pw = 32; ph = 20;
        }
      } else if (this._powerLevel >= 1) {
        const poweredImg = this.assets['player-powered1'];
        if (poweredImg && poweredImg.complete) {
          playerImg = poweredImg;
          pw = 30; ph = 18;
        }
      }

      if (playerImg && playerImg.complete) {
        ctx.drawImage(playerImg, p.x - pw/2, p.y - ph/2, pw, ph);
      } else {
        // Fallback basic ship
        ctx.fillStyle = this._powerLevel > 0 ? '#7cffe0' : CYAN;
        ctx.fillRect(p.x - 8, p.y - 5, 18, 10);
        ctx.fillStyle = WHITE;
        ctx.fillRect(p.x + 2, p.y - 2, 6, 4);
      }

      // Thruster animation (2nd set)
      const thrusterFrame = Math.floor((this._time * 7) % 4) + 1;
      const thrusterImg = this.assets[`player-thruster-${thrusterFrame}`];
      if (thrusterImg && thrusterImg.complete) {
        ctx.drawImage(thrusterImg, p.x - 18, p.y - 5, 12, 10);
      }

      // Power level visual upgrades (fallback only)
      if (!playerImg || !playerImg.complete) {
        if (this._powerLevel >= 1) {
          ctx.fillStyle = ORANGE;
          ctx.fillRect(p.x - 16, p.y - 2, 5, 4);
        }
        if (this._powerLevel >= 2) {
          ctx.fillStyle = VIOLET;
          ctx.fillRect(p.x - 19, p.y - 6, 3, 3);
          ctx.fillRect(p.x - 19, p.y + 3, 3, 3);
        }
      }

      // Shield effect
      if (p.invuln > 3.2) {
        ctx.strokeStyle = '#7cffe0';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x + 1, p.y, 17, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
      }

      ctx.globalAlpha = 1;
    }

    // Bullets
    ctx.fillStyle = CYAN;
    for (const b of this._bullets) {
      ctx.fillRect(b.x, b.y - 1.5, b.w || 8, b.h || 3);
    }

    // Enemy bullets
    ctx.fillStyle = ORANGE;
    for (const b of this._enemyBullets) {
      ctx.fillRect(b.x - 2, b.y - 2, 5, 5);
    }

    // Enemies
    for (const e of this._enemies) {
      let img = null;
      let w = 18, h = 14;

      if (e.type === 'turret') {
        img = this.assets.turret;
        w = 22; h = 18;
      } else if (e.type === 'swooper' || e.type === 'drone') {
        // Use wing flap animation (2nd set)
        const wingFrame = Math.floor((this._time * 5.5) % 4) + 1;
        img = this.assets[`enemy-drone-wing-${wingFrame}`];
        w = 18; h = 14;
      } else if (e.type === 'growth') {
        // Use pulsing animation for growth enemy (3rd set)
        const pulseFrame = Math.floor((this._time * 4.5) % 5) + 1;
        img = this.assets[`growth-pulse-${pulseFrame}`];
        w = 24; h = 20;
      } else {
        img = this.assets.drone;
        w = 18; h = 14;
      }

      if (img && img.complete) {
        ctx.drawImage(img, e.x - w/2, e.y - h/2, w, h);
      } else {
        // Fallback procedural
        ctx.fillStyle = e.type === 'turret' ? VIOLET : CYAN;
        ctx.fillRect(e.x - 6, e.y - 5, 12, 10);
      }
    }

    // Boss
    if (this._boss) {
      const b = this._boss;
      const bossImg = this.assets.boss;

      if (bossImg && bossImg.complete) {
        const w = 72;
        const h = 54;
        ctx.drawImage(bossImg, b.x - w/2, b.y - h/2, w, h);
      } else {
        // Fallback
        ctx.fillStyle = VIOLET;
        ctx.fillRect(b.x - 28, b.y - 22, 56, 44);
        ctx.fillStyle = ORANGE;
        ctx.fillRect(b.x - 14, b.y - 10, 28, 20);
      }
    }

    // Powerups
    for (const p of this._powerups) {
      const img = p.type === 'shield' ? this.assets.powerShield : this.assets.powerDouble;
      const size = p.type === 'shield' ? 14 : 13;

      if (img && img.complete) {
        ctx.drawImage(img, p.x - size/2, p.y - size/2, size, size);
      } else {
        ctx.fillStyle = p.type === 'shield' ? '#7cffe0' : '#ffeb3b';
        ctx.beginPath();
        ctx.arc(p.x, p.y, size/2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Animated explosions (3rd set - 6 frames)
    for (const ex of this._explosions) {
      const img = this.assets[`explosion-${ex.frame}`];
      if (img && img.complete) {
        const size = 36 + (ex.frame - 1) * 4; // grow slightly with frame
        ctx.drawImage(img, ex.x - size/2, ex.y - size/2, size, size);
      }
    }

    // Particles (small hits)
    ctx.fillStyle = WHITE;
    for (const p of this._particles) {
      ctx.globalAlpha = Math.max(0.1, p.life / 0.6);
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  _drawBackground(ctx) {
    const bg1 = this.assets.background;
    const bg2 = this.assets['background-layer2'];

    // Layer 1 - Distant organic background (slowest scroll)
    if (bg1 && bg1.complete) {
      const scroll1 = (this._scroll * 12) % GAME_W;
      ctx.drawImage(bg1, -scroll1, 0, GAME_W, GAME_H);
      ctx.drawImage(bg1, GAME_W - scroll1, 0, GAME_W, GAME_H);
    } else {
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, GAME_W, GAME_H);
    }

    // Layer 2 - Closer organic details (faster parallax)
    if (bg2 && bg2.complete) {
      ctx.globalAlpha = 0.55;
      const scroll2 = (this._scroll * 28) % GAME_W;
      ctx.drawImage(bg2, -scroll2, 0, GAME_W, GAME_H);
      ctx.drawImage(bg2, GAME_W - scroll2, 0, GAME_W, GAME_H);
      ctx.globalAlpha = 1;
    }

    // Distant stars (very slow)
    ctx.fillStyle = 'rgba(240, 238, 248, 0.28)';
    for (let i = 0; i < 36; i++) {
      const x = ((i * 39 + this._scroll * 0.22) % (GAME_W + 60)) - 30;
      const y = 18 + ((i * 10.1) % (GAME_H - 36));
      ctx.fillRect(x, y, 1, 1);
    }
  }

  destroy() {
    // Cleanup if needed
  }
}
