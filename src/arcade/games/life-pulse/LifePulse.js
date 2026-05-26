import { CYAN, VIOLET, ORANGE, BG, WHITE, MUTED } from '../palette';

const GAME_W = 640;
const GAME_H = 360;

const PLAYER_SPEED = 220;
const BULLET_SPEED = 420;
const ENEMY_SPEED = 95;

const STARTING_LIVES = 3;

export class LifePulse {
  onHudUpdate = null;

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
      w: 18,
      h: 10,
      alive: true,
      invuln: 0,
    };

    this._bullets = [];
    this._enemyBullets = [];
    this._enemies = [];
    this._particles = [];
    this._powerups = [];
    this._powerLevel = 0;
    this._powerTimer = 0;

    this._scroll = 0;
    this._spawnTimer = 0;
    this._difficulty = 1;
    this._bossActive = false;
    this._boss = null;
    this._time = 0;

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
    this._updatePowerups(dt);
    this._spawnEnemies(dt);
    this._updateBoss(dt);
    this._checkCollisions();

    this._scroll = (this._scroll + 52 * dt) % 64;

    this._difficulty = Math.min(3.5, 1 + this.score / 2400);

    // Spawn boss after some time or high score
    if (!this._bossActive && !this._boss && this._time > 52 && Math.random() < 0.012) {
      this._spawnBoss();
    }

    this._emitHud();
  }

  _updatePlayer(dt) {
    if (!this._player.alive) return;

    let dx = 0, dy = 0;
    if (this._keys.left) dx -= 1;
    if (this._keys.right) dx += 1;
    if (this._keys.up) dy -= 1;
    if (this._keys.down) dy += 1;

    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len; dy /= len;
    }

    this._player.x += dx * PLAYER_SPEED * dt;
    this._player.y += dy * PLAYER_SPEED * dt;

    // Keep player in reasonable play area
    this._player.x = Math.max(40, Math.min(220, this._player.x));
    this._player.y = Math.max(20, Math.min(GAME_H - 20, this._player.y));

    // Firing
    this._fireCooldown -= dt;
    const fireRate = this._powerLevel > 0 ? 0.07 : 0.12;
    if (this._keys.fire && this._fireCooldown <= 0) {
      this._fireCooldown = fireRate;
      this._shoot();
    }

    this._powerTimer -= dt;
    if (this._powerTimer <= 0) this._powerLevel = 0;

    this._secondaryCooldown -= dt;
    if (this._keys.secondary && this._secondaryCooldown <= 0) {
      this._secondaryCooldown = 0.35;
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
      } else {
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
      }
    }

    // Occasional power-up
    if (Math.random() < 0.008) {
      this._powerups.push({
        x: GAME_W + 10,
        y: 50 + Math.random() * (GAME_H - 100),
        type: 'double',
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

    // Simple boss movement
    b.y = GAME_H / 2 + Math.sin(b.timer * 1.6) * 68;

    // Boss attacks
    if (b.timer % 1.1 < 0.06) {
      // Spread shot
      for (let i = -1; i <= 1; i++) {
        this._enemyBullets.push({
          x: b.x - 20,
          y: b.y + i * 18,
          vx: -170,
          vy: i * 35,
        });
      }
    }

    if (b.timer % 2.8 < 0.05 && Math.random() < 0.7) {
      // Summon helpers
      this._enemies.push({
        x: b.x - 30,
        y: b.y + (Math.random() - 0.5) * 80,
        vx: -110,
        vy: (Math.random() - 0.5) * 60,
        hp: 2,
        points: 120,
        size: 13,
        type: 'swooper',
      });
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
            this._createExplosion(this._boss.x, this._boss.y, 38);
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
    }
  }

  _createExplosion(x, y, size = 16) {
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const speed = 60 + Math.random() * 110;
      this._particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.35,
        size: 2 + Math.random() * 2.5,
      });
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
    return !(a.x + (a.w || 12) < b.x || b.x + (b.size || 12) < a.x ||
             a.y + (a.h || 8) < b.y || b.y + (b.size || 12) < a.y);
  }

  _pointInRect(px, py, r) {
    return px > r.x - 6 && px < r.x + (r.w || 16) + 6 &&
           py > r.y - 6 && py < r.y + (r.h || 10) + 6;
  }

  // ==================== RENDER ====================
  render(ctx) {
    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    // Background
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    // Scrolling stars + organic lines
    this._drawBackground(ctx);

    // Player
    if (this._player.alive) {
      const p = this._player;
      const alpha = p.invuln > 0 ? (Math.floor(p.invuln * 10) % 2 === 0 ? 0.4 : 1) : 1;
      ctx.globalAlpha = alpha;

      // Ship body
      ctx.fillStyle = this._powerLevel > 0 ? '#7cffe0' : CYAN;
      ctx.fillRect(p.x - 8, p.y - 5, 18, 10);

      // Cockpit
      ctx.fillStyle = WHITE;
      ctx.fillRect(p.x + 2, p.y - 2, 6, 4);

      // Thruster glow
      ctx.fillStyle = this._powerLevel > 0 ? ORANGE : '#ff8a5f';
      ctx.fillRect(p.x - 14, p.y - 2, 7, 4);

      if (this._powerLevel >= 2) {
        ctx.fillStyle = VIOLET;
        ctx.fillRect(p.x - 11, p.y - 7, 4, 3);
        ctx.fillRect(p.x - 11, p.y + 4, 4, 3);
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
      if (e.type === 'turret') {
        ctx.fillStyle = VIOLET;
        ctx.fillRect(e.x - 8, e.y - 8, 16, 16);
        ctx.fillStyle = ORANGE;
        ctx.fillRect(e.x - 3, e.y - 3, 6, 6);
      } else if (e.type === 'swooper') {
        ctx.fillStyle = ORANGE;
        ctx.beginPath();
        ctx.arc(e.x, e.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = CYAN;
        ctx.fillRect(e.x - 3, e.y - 3, 6, 6);
      } else {
        ctx.fillStyle = CYAN;
        ctx.fillRect(e.x - 6, e.y - 5, 12, 10);
      }
    }

    // Boss
    if (this._boss) {
      const b = this._boss;
      const healthRatio = Math.max(0.1, b.hp / b.maxHp);

      ctx.fillStyle = VIOLET;
      ctx.fillRect(b.x - 28, b.y - 22, 56, 44);

      // Organic core
      ctx.fillStyle = ORANGE;
      ctx.fillRect(b.x - 14, b.y - 10, 28 * healthRatio, 20);

      // Eyes / vents
      ctx.fillStyle = CYAN;
      ctx.fillRect(b.x - 18, b.y - 14, 6, 6);
      ctx.fillRect(b.x - 18, b.y + 8, 6, 6);
    }

    // Powerups
    ctx.fillStyle = '#ffeb3b';
    for (const p of this._powerups) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Particles
    ctx.fillStyle = WHITE;
    for (const p of this._particles) {
      ctx.globalAlpha = Math.max(0.1, p.life / 0.6);
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  _drawBackground(ctx) {
    // Stars
    ctx.fillStyle = MUTED;
    for (let i = 0; i < 42; i++) {
      const x = ((i * 37 + this._scroll * 0.6) % (GAME_W + 60)) - 30;
      const y = 20 + (i * 8.3) % (GAME_H - 40);
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    // Subtle organic background lines (Life Force feel)
    ctx.strokeStyle = 'rgba(180, 140, 220, 0.12)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      const y = 30 + i * 65 + Math.sin(this._scroll * 0.02 + i) * 12;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.quadraticCurveTo(GAME_W * 0.4, y + 18, GAME_W, y - 10);
      ctx.stroke();
    }
    ctx.lineWidth = 1;
  }

  destroy() {
    // Cleanup if needed
  }
}
