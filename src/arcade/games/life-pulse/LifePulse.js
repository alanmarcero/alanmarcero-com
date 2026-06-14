import { CYAN, VIOLET, ORANGE, BG, WHITE, MUTED } from '../palette';

const GAME_W = 640;
const GAME_H = 360;

// Core tuning (improved from original)
const PLAYER_SPEED = 235;
const BULLET_SPEED = 460;
const ENEMY_SPEED = 92;
const STARTING_LIVES = 3;

// Hit radii (visuals are larger; these are fair collision cores)
const PLAYER_HIT_R = 6.5;
const BULLET_HIT_R = 3.5;
const ENEMY_BASE_R = 9;
const POWERUP_R = 8;
const BOSS_HIT_R = 32;

export class LifePulse {
  onHudUpdate = null;

  constructor() {
    // Pure procedural — no external assets (eliminates white-box JPG sprites)
    // This is /loop iteration 1 (of 500). Next passes can add:
    // - More enemy types (tendril, organ, parasite)
    // - Combo multiplier + end-of-wave bonus
    // - Local high score persistence (localStorage)
    // - LifePulse.test.js with collision + progression coverage
    // - Touch secondary button mapping polish + charge visual for pulse bomb
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
    this._pulseCooldown = 0; // dedicated Life Pulse bomb

    this._player = {
      x: 110,
      y: GAME_H / 2,
      vx: 0,
      vy: 0,
      alive: true,
      invuln: 0,
      speedMul: 1,
      speedTimer: 0,
    };

    this._bullets = [];
    this._enemyBullets = [];
    this._enemies = [];
    this._particles = [];
    this._explosions = [];
    this._powerups = [];
    this._pulses = [];          // Life Pulse bombs (secondary special)
    this._scorePopups = [];     // floating +N scores

    this._powerLevel = 0;       // 0 = normal, 1 = double, 2 = spread
    this._powerTimer = 0;

    this._scroll = 0;
    this._spawnTimer = 0.6;
    this._difficulty = 1.0;
    this._bossActive = false;
    this._boss = null;
    this._time = 0;
    this._shake = 0;
    this._wave = 1;

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
    this._updatePulses(dt);
    this._updateScorePopups(dt);
    this._spawnEnemies(dt);
    this._updateBoss(dt);
    this._checkCollisions();

    this._scroll = (this._scroll + 48 * dt) % 64;

    // Real difficulty + level progression (score + wave driven)
    const targetLevel = Math.min(9, 1 + Math.floor(this.score / 5200) + Math.floor(this._wave / 3));
    if (targetLevel > this.level) {
      this.level = targetLevel;
      this._emitHud();
    }
    this._difficulty = Math.min(4.2, 1.0 + (this.level - 1) * 0.55 + this.score / 18500);

    // Screen shake decay
    if (this._shake > 0) this._shake *= 0.79;

    // Occasional boss (more likely at higher levels)
    const bossChance = 0.009 + (this.level - 1) * 0.0018;
    if (!this._bossActive && !this._boss && this._time > 38 && Math.random() < bossChance) {
      this._spawnBoss();
    }

    this._emitHud();
  }

  _updatePlayer(dt) {
    if (!this._player.alive) return;

    const p = this._player;

    // Apply temporary speed powerup
    p.speedTimer -= dt;
    const speedMul = (p.speedTimer > 0) ? 1.38 : 1.0;
    p.speedMul = speedMul;

    const accel = 1520;
    const friction = 7.2;
    const maxSpeed = 278 * speedMul;

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

    // Much more generous play area (was too cramped on left)
    const leftBound = 38;
    const rightBound = GAME_W - 58;
    const top = 26;
    const bottom = GAME_H - 26;

    if (p.x < leftBound) { p.x = leftBound; p.vx *= -0.28; }
    if (p.x > rightBound) { p.x = rightBound; p.vx *= -0.28; }
    if (p.y < top) { p.y = top; p.vy *= -0.32; }
    if (p.y > bottom) { p.y = bottom; p.vy *= -0.32; }

    // Primary fire (power level affects pattern + rate)
    this._fireCooldown -= dt;
    const baseRate = 0.105;
    const fireRate = this._powerLevel >= 1 ? 0.058 : baseRate;
    if (this._keys.fire && this._fireCooldown <= 0) {
      this._fireCooldown = fireRate;
      this._shoot();
    }

    // Power timeout
    this._powerTimer -= dt;
    if (this._powerTimer <= 0) this._powerLevel = 0;

    // Secondary = LIFE PULSE bomb (thematic special weapon)
    this._pulseCooldown -= dt;
    if (this._keys.secondary && this._pulseCooldown <= 0) {
      this._pulseCooldown = 0.95; // fairly strong, not spammy
      this._firePulseBomb();
    }

    if (this._player.invuln > 0) this._player.invuln -= dt;
  }

  _shoot() {
    const p = this._player;
    const baseX = p.x + 13;
    const baseY = p.y;

    // Always fire center
    this._bullets.push({
      x: baseX, y: baseY,
      vx: BULLET_SPEED, vy: 0,
      r: BULLET_HIT_R,
      life: 1.65,
    });

    if (this._powerLevel >= 1) {
      const spread = (this._powerLevel >= 2) ? 11 : 7;
      const spreadSpeedY = (this._powerLevel >= 2) ? 38 : 22;
      this._bullets.push({
        x: baseX - 1, y: baseY - spread,
        vx: BULLET_SPEED * 0.98, vy: -spreadSpeedY,
        r: BULLET_HIT_R * 0.9,
        life: 1.35,
      });
      this._bullets.push({
        x: baseX - 1, y: baseY + spread,
        vx: BULLET_SPEED * 0.98, vy: spreadSpeedY,
        r: BULLET_HIT_R * 0.9,
        life: 1.35,
      });
    }
  }

  _firePulseBomb() {
    const p = this._player;
    // Launch a slow, pulsing "Life Pulse" projectile that detonates after a short distance/time
    this._pulses.push({
      x: p.x + 10,
      y: p.y,
      vx: 195,
      vy: (Math.random() - 0.5) * 12,
      r: 7.5,
      life: 0.72,       // flight time before auto-detonate
      detonated: false,
    });
    // Small launch effect
    this._createHitParticle(p.x + 14, p.y);
  }

  _updateBullets(dt) {
    for (let i = this._bullets.length - 1; i >= 0; i--) {
      const b = this._bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.life !== undefined) b.life -= dt;

      if ((b.life !== undefined && b.life <= 0) || b.x > GAME_W + 24) {
        this._bullets.splice(i, 1);
      }
    }
  }

  _updateEnemyBullets(dt) {
    for (let i = this._enemyBullets.length - 1; i >= 0; i--) {
      const b = this._enemyBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.life !== undefined) b.life -= dt;

      if (b.x < -22 || b.y < -18 || b.y > GAME_H + 18) {
        this._enemyBullets.splice(i, 1);
      }
    }
  }

  _updateEnemies(dt) {
    for (let i = this._enemies.length - 1; i >= 0; i--) {
      const e = this._enemies[i];
      e.x += e.vx * dt;
      e.y += e.vy * dt;

      // Behaviors
      if (e.type === 'swooper') {
        e.vy = Math.sin(this._time * 3.8 + e.y * 0.09) * 72;
      }
      if (e.type === 'growth') {
        // gentle organic pulse bob
        e.vy = Math.sin(this._time * 2.2 + e.id * 0.7) * 18;
      }

      // Turrets fire predictively (with telegraph via random chance)
      if (e.type === 'turret' && Math.random() < 0.021 * this._difficulty) {
        this._enemyShoot(e);
      }

      if (e.x < -48) {
        this._enemies.splice(i, 1);
        continue;
      }

      if ((e.hp || 0) <= 0) {
        const size = e.r || e.size || 13;
        this._createExplosion(e.x, e.y, size * 1.15);
        this.score += (e.points || 70);
        this._spawnScorePopup(e.x, e.y - 6, e.points || 70);

        // Splitting growths (biological theme)
        if (e.split) {
          for (let s = 0; s < 2; s++) {
            const sr = ENEMY_BASE_R * 0.72;
            this._enemies.push({
              id: Math.random() * 9999 | 0,
              x: e.x + (Math.random() - 0.5) * 13,
              y: e.y + (Math.random() - 0.5) * 13,
              vx: -ENEMY_SPEED * (0.82 + Math.random() * 0.38),
              vy: (Math.random() - 0.5) * 48,
              hp: 1,
              points: 45,
              r: sr,
              type: 'drone',
            });
          }
        }

        this._enemies.splice(i, 1);
      }
    }
  }

  _enemyShoot(e) {
    const dx = this._player.x - e.x;
    const dy = this._player.y - e.y;
    const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));

    // Slight predictive + speed scaled by difficulty
    const speed = 155 + this._difficulty * 18;
    this._enemyBullets.push({
      x: e.x,
      y: e.y,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      r: 3.2,
      life: 3.2,
    });
  }

  _updateParticles(dt) {
    for (let i = this._particles.length - 1; i >= 0; i--) {
      const p = this._particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.vx *= 0.975;
      p.vy *= 0.975;

      if (p.life <= 0) this._particles.splice(i, 1);
    }
  }

  _updateExplosions(dt) {
    for (let i = this._explosions.length - 1; i >= 0; i--) {
      const ex = this._explosions[i];
      ex.age += dt;
      if (ex.age >= ex.duration) {
        this._explosions.splice(i, 1);
      }
    }
  }

  _updatePowerups(dt) {
    for (let i = this._powerups.length - 1; i >= 0; i--) {
      const p = this._powerups[i];
      p.x -= 68 * dt;
      p.life = (p.life || 7.5) - dt;
      // gentle bob
      p.y += Math.sin(p.life * 3.5) * 0.6 * dt * 60;

      if (p.x < -24 || p.life <= 0) {
        this._powerups.splice(i, 1);
      }
    }
  }

  _updatePulses(dt) {
    for (let i = this._pulses.length - 1; i >= 0; i--) {
      const pulse = this._pulses[i];
      pulse.x += pulse.vx * dt;
      pulse.y += pulse.vy * dt;
      pulse.life -= dt;
      pulse.vy *= 0.985; // slight drag

      // Auto detonate or on leaving screen
      if (pulse.life <= 0 || pulse.x > GAME_W + 30) {
        this._detonatePulse(pulse);
        this._pulses.splice(i, 1);
      }
    }
  }

  _detonatePulse(pulse) {
    // Big satisfying radial Life Pulse blast — damages enemies + boss in radius
    const radius = 78;
    this._createExplosion(pulse.x, pulse.y, 46);
    this._shake = Math.max(this._shake, 11);

    // Area damage to regular enemies
    for (let j = this._enemies.length - 1; j >= 0; j--) {
      const e = this._enemies[j];
      const dx = e.x - pulse.x;
      const dy = e.y - pulse.y;
      if (dx * dx + dy * dy < (radius + (e.r || 10)) * (radius + (e.r || 10))) {
        e.hp = (e.hp || 1) - 3;
        this._createHitParticle(e.x, e.y);
        if ((e.hp || 0) <= 0) {
          this.score += (e.points || 70) * 0.6 | 0;
          this._spawnScorePopup(e.x, e.y, (e.points || 70) * 0.6 | 0);
        }
      }
    }

    // Hit boss too
    if (this._boss) {
      const dx = this._boss.x - pulse.x;
      const dy = this._boss.y - pulse.y;
      if (dx * dx + dy * dy < (radius + BOSS_HIT_R) * (radius + BOSS_HIT_R)) {
        this._boss.hp -= 11;
        this._createHitParticle(this._boss.x, this._boss.y);
        if (this._boss.hp <= 0) {
          this._createExplosion(this._boss.x, this._boss.y, 58);
          this.score += 920;
          this._spawnScorePopup(this._boss.x, this._boss.y - 10, 920);
          this._shake = 22;
          this._boss = null;
          this._bossActive = false;
        }
      }
    }

    // Nice expanding ring particles
    for (let k = 0; k < 18; k++) {
      const ang = (k / 18) * Math.PI * 2;
      const sp = 38 + Math.random() * 55;
      this._particles.push({
        x: pulse.x, y: pulse.y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: 0.38 + Math.random() * 0.18,
        size: 2.6 + Math.random() * 1.6,
        color: (k % 3 === 0) ? VIOLET : CYAN,
      });
    }
  }

  _updateScorePopups(dt) {
    for (let i = this._scorePopups.length - 1; i >= 0; i--) {
      const sp = this._scorePopups[i];
      sp.y -= 38 * dt;
      sp.life -= dt;
      if (sp.life <= 0) this._scorePopups.splice(i, 1);
    }
  }

  _spawnEnemies(dt) {
    this._spawnTimer -= dt;

    // Spawn cadence tightens with difficulty and level
    const baseRate = Math.max(0.32, 0.82 / this._difficulty);
    const spawnInterval = baseRate + Math.random() * 0.28;

    if (this._spawnTimer <= 0) {
      this._spawnTimer = spawnInterval;
      this._wave += 0.08; // slow wave progress even without kills

      const y = 32 + Math.random() * (GAME_H - 64);

      const roll = Math.random();
      const d = this._difficulty;

      // New enemy mix with proper radii (no more white boxes or loose rects)
      if (roll < 0.38) {
        // Basic organic drone
        this._enemies.push({
          id: Math.random() * 99999 | 0,
          x: GAME_W + 18, y,
          vx: -ENEMY_SPEED * (0.88 + Math.random() * 0.32),
          vy: (Math.random() - 0.5) * 26,
          hp: 1,
          points: 65,
          r: ENEMY_BASE_R,
          type: 'drone',
        });
      } else if (roll < 0.62) {
        // Swooper (sine wave)
        this._enemies.push({
          id: Math.random() * 99999 | 0,
          x: GAME_W + 26,
          y: 46 + Math.random() * (GAME_H - 92),
          vx: -ENEMY_SPEED * (1.08 + d * 0.06),
          vy: 0,
          hp: 1,
          points: 95,
          r: ENEMY_BASE_R * 1.05,
          type: 'swooper',
        });
      } else if (roll < 0.82) {
        // Turret (fires homing-ish shots)
        this._enemies.push({
          id: Math.random() * 99999 | 0,
          x: GAME_W + 22, y,
          vx: -ENEMY_SPEED * (0.58 + Math.random() * 0.1),
          vy: 0,
          hp: 2 + (d > 2 ? 1 : 0),
          points: 145,
          r: ENEMY_BASE_R * 1.25,
          type: 'turret',
        });
      } else if (roll < 0.94) {
        // Growth / splitter (core of the "Life" theme)
        this._enemies.push({
          id: Math.random() * 99999 | 0,
          x: GAME_W + 28, y,
          vx: -ENEMY_SPEED * 0.48,
          vy: (Math.random() - 0.5) * 15,
          hp: 4,
          points: 195,
          r: ENEMY_BASE_R * 1.55,
          type: 'growth',
          split: true,
        });
      } else {
        // Fast aggressive "cell" at higher levels
        this._enemies.push({
          id: Math.random() * 99999 | 0,
          x: GAME_W + 16, y,
          vx: -ENEMY_SPEED * (1.35 + d * 0.09),
          vy: (Math.random() - 0.5) * 40,
          hp: 1,
          points: 55,
          r: ENEMY_BASE_R * 0.82,
          type: 'drone',
        });
      }

      // Occasional spiker (armored fast threat) — unlocked with difficulty
      if (d > 1.8 && Math.random() < 0.12) {
        this._enemies.push({
          id: Math.random() * 99999 | 0,
          x: GAME_W + 14, y: y * 0.9 + 12,
          vx: -ENEMY_SPEED * (1.55 + d * 0.07),
          vy: (Math.random() - 0.5) * 18,
          hp: 2,
          points: 80,
          r: ENEMY_BASE_R * 0.9,
          type: 'drone',
        });
      }
    }

    // More generous + varied powerups (the original complaint)
    if (Math.random() < 0.019) {
      const r = Math.random();
      let type = 'double';
      if (r < 0.28) type = 'shield';
      else if (r < 0.48) type = 'speed';
      else if (r < 0.68) type = 'pulse';
      else if (r < 0.82 && this.level >= 3) type = 'double';

      this._powerups.push({
        x: GAME_W + 14,
        y: 44 + Math.random() * (GAME_H - 88),
        type,
        life: 8.5,
      });
    }
  }

  _spawnBoss() {
    this._bossActive = true;
    const hp = Math.floor(42 + this._difficulty * 11 + this.level * 2.5);
    this._boss = {
      x: GAME_W + 72,
      y: GAME_H / 2,
      hp,
      maxHp: hp,
      phase: 0,
      timer: 0,
      vx: -28,
      r: BOSS_HIT_R,
    };
  }

  _updateBoss(dt) {
    if (!this._boss) return;

    const b = this._boss;
    b.timer += dt;

    // Entry fly-in
    if (b.x > GAME_W - 118) {
      b.x += b.vx * dt;
      return;
    }
    b.vx = 0;

    const healthRatio = b.hp / b.maxHp;
    if (b.phase === 0 && healthRatio < 0.42) {
      b.phase = 1;
      b.timer = 0;
    }

    // Organic pulsing movement
    const freq = (b.phase === 0 ? 1.35 : 2.35);
    const amp = (b.phase === 0 ? 58 : 44);
    b.y = GAME_H / 2 + Math.sin(b.timer * freq) * amp + (b.phase === 1 ? Math.sin(b.timer * 4.1) * 14 : 0);

    // Attacks (more dangerous at phase 2 + higher difficulty)
    const atkMul = 1 + (this._difficulty - 1) * 0.2;
    if (b.phase === 0) {
      if (b.timer % 1.1 < 0.055) {
        for (let i = -1; i <= 1; i++) {
          this._enemyBullets.push({
            x: b.x - 26, y: b.y + i * 15,
            vx: -172 * atkMul, vy: i * 33,
            r: 3.8,
          });
        }
      }
      if (b.timer % 2.55 < 0.045 && Math.random() < 0.78) {
        this._enemies.push({
          id: Math.random() * 99999 | 0,
          x: b.x - 22, y: b.y + (Math.random() - 0.5) * 58,
          vx: -98, vy: (Math.random() - 0.5) * 44,
          hp: 2, points: 85, r: ENEMY_BASE_R * 1.05, type: 'swooper',
        });
      }
    } else {
      if (b.timer % 0.58 < 0.05) {
        this._enemyBullets.push({
          x: b.x - 22, y: b.y,
          vx: -205 * atkMul, vy: (Math.random() - 0.5) * 62,
          r: 3.5,
        });
      }
      if (b.timer % 1.75 < 0.055) {
        for (let i = -2; i <= 2; i += 2) {
          this._enemyBullets.push({
            x: b.x - 16, y: b.y + i * 11,
            vx: -158, vy: i * 29,
            r: 3.2,
          });
        }
      }
      if (b.timer % 2.85 < 0.05 && Math.random() < 0.9) {
        this._enemies.push({
          id: Math.random() * 99999 | 0,
          x: b.x - 16, y: b.y + (Math.random() - 0.5) * 18,
          vx: -79, vy: (Math.random() - 0.5) * 26,
          hp: 3, points: 155, r: ENEMY_BASE_R * 1.4, type: 'growth', split: true,
        });
      }
    }
  }

  _checkCollisions() {
    // Player bullets vs enemies (circle)
    for (let i = this._bullets.length - 1; i >= 0; i--) {
      const b = this._bullets[i];
      const br = b.r || BULLET_HIT_R;

      for (let j = this._enemies.length - 1; j >= 0; j--) {
        const e = this._enemies[j];
        const er = e.r || ENEMY_BASE_R;
        const dx = b.x - e.x;
        const dy = b.y - e.y;
        if (dx * dx + dy * dy < (br + er) * (br + er)) {
          e.hp = (e.hp || 1) - 1;
          this._createHitParticle(b.x, b.y);
          this._bullets.splice(i, 1);
          break;
        }
      }
    }

    // Enemy bullets vs player (fair circle hit on core)
    if (this._player.alive && this._player.invuln <= 0) {
      for (let i = this._enemyBullets.length - 1; i >= 0; i--) {
        const b = this._enemyBullets[i];
        const br = b.r || 3;
        const dx = b.x - this._player.x;
        const dy = b.y - this._player.y;
        if (dx * dx + dy * dy < (br + PLAYER_HIT_R) * (br + PLAYER_HIT_R)) {
          this._hitPlayer();
          this._enemyBullets.splice(i, 1);
        }
      }
    }

    // Enemies touching player core
    if (this._player.alive && this._player.invuln <= 0) {
      for (let i = this._enemies.length - 1; i >= 0; i--) {
        const e = this._enemies[i];
        const er = e.r || ENEMY_BASE_R;
        const dx = e.x - this._player.x;
        const dy = e.y - this._player.y;
        if (dx * dx + dy * dy < (er + PLAYER_HIT_R) * (er + PLAYER_HIT_R)) {
          this._hitPlayer();
          e.hp = 0;
        }
      }
    }

    // Player collects powerups (nice + audible feel via particles)
    for (let i = this._powerups.length - 1; i >= 0; i--) {
      const p = this._powerups[i];
      const dx = p.x - this._player.x;
      const dy = p.y - this._player.y;
      if (dx * dx + dy * dy < (POWERUP_R + PLAYER_HIT_R + 3) * (POWERUP_R + PLAYER_HIT_R + 3)) {
        this._applyPowerup(p.type);
        // Collect juice
        for (let k = 0; k < 7; k++) {
          const ang = Math.random() * Math.PI * 2;
          this._particles.push({
            x: p.x, y: p.y,
            vx: Math.cos(ang) * (30 + Math.random() * 35),
            vy: Math.sin(ang) * (30 + Math.random() * 35),
            life: 0.26 + Math.random() * 0.15,
            size: 2.2,
            color: (p.type === 'shield') ? '#7cffe0' : ORANGE,
          });
        }
        this._powerups.splice(i, 1);
      }
    }

    // Player bullets vs boss (circle)
    if (this._boss) {
      for (let i = this._bullets.length - 1; i >= 0; i--) {
        const b = this._bullets[i];
        const br = b.r || BULLET_HIT_R;
        const dx = b.x - this._boss.x;
        const dy = b.y - this._boss.y;
        if (dx * dx + dy * dy < (br + (this._boss.r || BOSS_HIT_R)) * (br + (this._boss.r || BOSS_HIT_R))) {
          this._boss.hp -= 1;
          this._createHitParticle(b.x, b.y);
          this._bullets.splice(i, 1);

          if (this._boss.hp <= 0) {
            this._createExplosion(this._boss.x, this._boss.y, 52);
            this._shake = 19;
            this.score += 880;
            this._spawnScorePopup(this._boss.x, this._boss.y - 8, 880);
            this._boss = null;
            this._bossActive = false;
          }
        }
      }
    }
  }

  _hitPlayer() {
    this._player.invuln = 1.9;
    this.lives -= 1;
    this._createExplosion(this._player.x, this._player.y, 23);
    this._shake = Math.max(this._shake, 8);

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
      this._powerTimer = 16.5;
      this.score += 155;
      this._spawnScorePopup(this._player.x, this._player.y - 18, 155);
    } else if (type === 'shield') {
      this._player.invuln = Math.max(this._player.invuln || 0, 5.8);
      this.score += 195;
      this._spawnScorePopup(this._player.x, this._player.y - 18, 195);
    } else if (type === 'speed') {
      this._player.speedTimer = Math.max(this._player.speedTimer || 0, 9.5);
      this.score += 125;
      this._spawnScorePopup(this._player.x, this._player.y - 18, 125);
    } else if (type === 'pulse') {
      // Instant deploy a Life Pulse for the player (thematic)
      this._pulses.push({
        x: this._player.x + 18,
        y: this._player.y,
        vx: 210,
        vy: 0,
        r: 7.5,
        life: 0.55,
        detonated: false,
      });
      this.score += 90;
    }
  }

  _createExplosion(x, y, size = 16) {
    const isBig = size > 26;
    this._explosions.push({ x, y, age: 0, duration: isBig ? 0.58 : 0.32, size });

    const count = isBig ? 18 : 11;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.7;
      const speed = (isBig ? 42 : 28) + Math.random() * (isBig ? 95 : 68);
      this._particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: (isBig ? 0.38 : 0.24) + Math.random() * 0.22,
        size: (isBig ? 2.8 : 1.9) + Math.random() * 1.6,
        color: (i % 4 === 0) ? VIOLET : (i % 3 === 0 ? ORANGE : WHITE),
      });
    }
    if (isBig) this._shake = Math.max(this._shake, 13);
  }

  _createHitParticle(x, y) {
    this._particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 74,
      vy: (Math.random() - 0.5) * 74,
      life: 0.16,
      size: 2.4,
      color: CYAN,
    });
  }

  _spawnScorePopup(x, y, amount) {
    this._scorePopups.push({
      x, y,
      amount: Math.floor(amount),
      life: 0.9,
    });
  }

  // ---- Circle collision helpers (much better than old rects) ----
  _circlesOverlap(ax, ay, ar, bx, by, br) {
    const dx = ax - bx;
    const dy = ay - by;
    return (dx * dx + dy * dy) < (ar + br) * (ar + br);
  }

  // ==================== RENDER (pure procedural — no JPGs, no white boxes) ====================
  render(ctx) {
    ctx.save();

    // Screen shake
    const shakeX = (Math.random() - 0.5) * this._shake * 0.85;
    const shakeY = (Math.random() - 0.5) * this._shake * 0.85;
    ctx.translate(this.offsetX + shakeX, this.offsetY + shakeY);
    ctx.scale(this.scale, this.scale);

    ctx.imageSmoothingEnabled = false;

    // Base
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    this._drawBackground(ctx);

    // === PLAYER (biological ship) ===
    if (this._player.alive) {
      const p = this._player;
      const flicker = p.invuln > 0 ? ((Math.floor(this._time * 18) % 2) === 0 ? 0.42 : 1) : 1;
      ctx.globalAlpha = flicker;

      const px = p.x;
      const py = p.y;
      const power = this._powerLevel;
      const boosted = p.speedTimer > 0;

      // Main body (smooth organic hull)
      ctx.fillStyle = power >= 1 ? '#a3fff0' : CYAN;
      ctx.beginPath();
      ctx.moveTo(px + 11, py);
      ctx.lineTo(px - 9, py - 7.5);
      ctx.lineTo(px - 11, py);
      ctx.lineTo(px - 9, py + 7.5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = WHITE;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // "Vein" details
      ctx.strokeStyle = VIOLET;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(px - 3, py - 3.5);
      ctx.lineTo(px + 5, py);
      ctx.moveTo(px - 3, py + 3.5);
      ctx.lineTo(px + 5, py);
      ctx.stroke();

      // Cockpit / core glow
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.arc(px + 2, py, 3.2, 0, Math.PI * 2);
      ctx.fill();

      // Power level pods / wings
      if (power >= 1) {
        ctx.fillStyle = ORANGE;
        ctx.beginPath();
        ctx.arc(px - 2, py - 8.5, 2.6, 0, Math.PI * 2);
        ctx.arc(px - 2, py + 8.5, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      if (power >= 2) {
        ctx.fillStyle = VIOLET;
        ctx.beginPath();
        ctx.arc(px - 6, py - 10.5, 2.2, 0, Math.PI * 2);
        ctx.arc(px - 6, py + 10.5, 2.2, 0, Math.PI * 2);
        ctx.fill();
        // extra spread barrels visual
        ctx.strokeStyle = CYAN;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(px + 5, py - 4);
        ctx.lineTo(px + 9, py - 7);
        ctx.moveTo(px + 5, py + 4);
        ctx.lineTo(px + 9, py + 7);
        ctx.stroke();
      }

      // Animated thrusters (flickering organic flame)
      const tPhase = (this._time * 11) % 1;
      const tLen = 5.5 + Math.sin(this._time * 19) * 1.8 + tPhase * 2.2;
      ctx.fillStyle = ORANGE;
      ctx.beginPath();
      ctx.moveTo(px - 10, py - 2.5);
      ctx.lineTo(px - 10 - tLen, py);
      ctx.lineTo(px - 10, py + 2.5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = (tPhase > 0.5) ? WHITE : VIOLET;
      ctx.beginPath();
      ctx.moveTo(px - 10, py - 1.2);
      ctx.lineTo(px - 10 - tLen * 0.65, py);
      ctx.lineTo(px - 10, py + 1.2);
      ctx.closePath();
      ctx.fill();

      // Extra speed lines when boosted
      if (boosted) {
        ctx.strokeStyle = 'rgba(255,240,210,0.75)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          const off = i * 3.5;
          ctx.beginPath();
          ctx.moveTo(px - 14 - off, py - 3 - i);
          ctx.lineTo(px - 22 - off * 1.6, py - 1);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(px - 14 - off, py + 3 + i);
          ctx.lineTo(px - 22 - off * 1.6, py + 1);
          ctx.stroke();
        }
      }

      // Shield bubble (strong visual)
      if (p.invuln > 2.8) {
        ctx.strokeStyle = '#a0fff4';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(px + 0.5, py, 15.5 + Math.sin(this._time * 6) * 1.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
      }

      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
    }

    // === PLAYER BULLETS (bio energy) ===
    ctx.fillStyle = CYAN;
    for (const b of this._bullets) {
      const len = (b.vy === 0) ? 7.5 : 5.5;
      ctx.fillRect(b.x - 1.5, b.y - 1.2, len, 2.4);
      // small bright head
      ctx.fillStyle = WHITE;
      ctx.fillRect(b.x + 4, b.y - 0.7, 2.5, 1.4);
      ctx.fillStyle = CYAN;
    }

    // === ENEMY BULLETS (spores / venom) ===
    ctx.fillStyle = ORANGE;
    for (const b of this._enemyBullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2.8, 0, Math.PI * 2);
      ctx.fill();
      // faint tail
      ctx.globalAlpha = 0.45;
      ctx.fillRect(b.x + 2, b.y - 1, 5, 2);
      ctx.globalAlpha = 1;
    }

    // === ENEMIES (organic / biological) ===
    for (const e of this._enemies) {
      const ex = e.x;
      const ey = e.y;
      const er = e.r || ENEMY_BASE_R;
      const pulse = Math.sin(this._time * 5.5 + (e.id || 0)) * 0.5 + 1;

      if (e.type === 'turret') {
        // Armored turret with "eye"
        ctx.fillStyle = VIOLET;
        ctx.fillRect(ex - er * 0.9, ey - er * 0.65, er * 1.85, er * 1.3);
        ctx.fillStyle = '#3a2a4a';
        ctx.fillRect(ex - er * 0.55, ey - er * 0.35, er * 1.1, er * 0.7);
        ctx.fillStyle = ORANGE;
        ctx.beginPath();
        ctx.arc(ex - 2, ey, 3.5, 0, Math.PI * 2);
        ctx.fill();
        // barrels
        ctx.fillStyle = MUTED;
        ctx.fillRect(ex - er * 1.15, ey - 2, 5, 4);
      } else if (e.type === 'growth') {
        // Pulsing biological growth / cell cluster (core of theme)
        const pScale = 0.82 + (pulse - 0.5) * 0.22;
        ctx.fillStyle = 'rgba(120, 255, 200, 0.35)';
        ctx.beginPath();
        ctx.arc(ex, ey, er * pScale * 1.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = CYAN;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(ex, ey, er * pScale, 0, Math.PI * 2);
        ctx.stroke();

        // inner organs
        ctx.fillStyle = VIOLET;
        ctx.beginPath();
        ctx.arc(ex - 3, ey - 2, 3.5 * pScale, 0, Math.PI * 2);
        ctx.arc(ex + 4, ey + 3, 3 * pScale, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = WHITE;
        ctx.beginPath();
        ctx.arc(ex + 1, ey - 1, 2 * pScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1;
      } else {
        // Drone / Swooper — cell with cilia
        ctx.fillStyle = (e.type === 'swooper') ? '#7dd4ff' : CYAN;
        ctx.beginPath();
        ctx.arc(ex, ey, er * (e.type === 'swooper' ? 0.95 : 1), 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = WHITE;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(ex, ey, er * 0.62, 0, Math.PI * 2);
        ctx.stroke();

        // nucleus
        ctx.fillStyle = (e.type === 'swooper') ? VIOLET : '#112';
        ctx.beginPath();
        ctx.arc(ex + 1, ey, 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Waving tendrils / cilia (alive feel)
        ctx.strokeStyle = MUTED;
        ctx.lineWidth = 1.1;
        const wob = Math.sin(this._time * 7 + (e.id || 1) * 1.3) * 1.6;
        for (let t = -1; t <= 1; t += 2) {
          ctx.beginPath();
          ctx.moveTo(ex - er * 0.6, ey + t * 3.5);
          ctx.quadraticCurveTo(ex - er * 1.35, ey + t * (5 + wob), ex - er * 1.9, ey + t * (2 + wob * 0.6));
          ctx.stroke();
        }
        ctx.lineWidth = 1;
      }
    }

    // === BOSS (large organic horror) ===
    if (this._boss) {
      const b = this._boss;
      const bx = b.x;
      const by = b.y;
      const hpRatio = Math.max(0.2, b.hp / b.maxHp);

      // Main mass
      ctx.fillStyle = VIOLET;
      ctx.beginPath();
      ctx.ellipse(bx, by, 29, 21, 0, 0, Math.PI * 2);
      ctx.fill();

      // Segmented ridges
      ctx.strokeStyle = '#4a2a66';
      ctx.lineWidth = 2.5;
      for (let s = -1; s <= 1; s++) {
        ctx.beginPath();
        ctx.ellipse(bx + s * 9, by, 10, 18 * hpRatio, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Pulsing "hearts"
      const heartPulse = 3.5 + Math.sin(this._time * 3.8) * 1.3;
      ctx.fillStyle = ORANGE;
      ctx.beginPath();
      ctx.arc(bx - 7, by - 5, heartPulse, 0, Math.PI * 2);
      ctx.arc(bx + 8, by + 4, heartPulse * 0.85, 0, Math.PI * 2);
      ctx.fill();

      // Multiple glowing "eyes"
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.arc(bx - 12, by - 7, 2.8, 0, Math.PI * 2);
      ctx.arc(bx + 11, by - 8, 2.4, 0, Math.PI * 2);
      ctx.arc(bx - 2, by + 9, 2.1, 0, Math.PI * 2);
      ctx.fill();

      // Tendrils / feelers on sides (animated)
      ctx.strokeStyle = CYAN;
      ctx.lineWidth = 1.8;
      const t = this._time * 4.2;
      for (let i = 0; i < 4; i++) {
        const ty = by - 13 + i * 8.5;
        const tx = bx - 27 - Math.sin(t + i) * 5;
        ctx.beginPath();
        ctx.moveTo(bx - 26, ty);
        ctx.quadraticCurveTo(tx - 4, ty + Math.sin(t * 1.6 + i) * 3, tx - 11, ty + Math.cos(t + i * 2) * 2);
        ctx.stroke();
      }
      ctx.lineWidth = 1;
    }

    // === POWERUPS (distinct & juicy) ===
    for (const p of this._powerups) {
      const px = p.x;
      const py = p.y;
      const bob = Math.sin(p.life * 4) * 1.5;

      if (p.type === 'double') {
        // Double shot — two fused orbs
        ctx.fillStyle = '#ffe66b';
        ctx.beginPath();
        ctx.arc(px - 3.5, py + bob, 4.8, 0, Math.PI * 2);
        ctx.arc(px + 4, py + bob, 4.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = ORANGE;
        ctx.beginPath();
        ctx.arc(px, py + bob, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'shield') {
        // Shield powerup
        ctx.strokeStyle = '#7cffe0';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(px, py + bob, 7.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#7cffe0';
        ctx.beginPath();
        ctx.arc(px, py + bob, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1;
      } else if (p.type === 'speed') {
        // Speed — forward chevrons
        ctx.strokeStyle = '#ffeb3b';
        ctx.lineWidth = 2.2;
        for (let i = 0; i < 3; i++) {
          const ox = -2 + i * 3.5;
          ctx.beginPath();
          ctx.moveTo(px + ox, py - 5 + bob);
          ctx.lineTo(px + ox + 5, py + bob);
          ctx.lineTo(px + ox, py + 5 + bob);
          ctx.stroke();
        }
        ctx.lineWidth = 1;
      } else if (p.type === 'pulse') {
        // Life Pulse collectible
        const pr = 5.5 + Math.sin(this._time * 7) * 1.1;
        ctx.strokeStyle = CYAN;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(px, py + bob, pr, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(px, py + bob, pr * 0.55, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = WHITE;
        ctx.beginPath();
        ctx.arc(px, py + bob, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1;
      }
    }

    // === LIFE PULSE BOMBS (in flight) ===
    for (const pulse of this._pulses) {
      const pr = pulse.r + Math.sin(this._time * 22) * 1.3;
      ctx.fillStyle = 'rgba(140, 255, 235, 0.6)';
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, pr, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = WHITE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, pr * 0.65, 0, Math.PI * 2);
      ctx.stroke();

      // inner rotating detail
      ctx.strokeStyle = VIOLET;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pulse.x + Math.cos(this._time * 9) * 3, pulse.y + Math.sin(this._time * 9) * 3, 2.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    // === EXPLOSIONS (age-based rings + we already emit the debris particles) ===
    for (const ex of this._explosions) {
      const prog = ex.age / ex.duration;
      const rad = (ex.size || 18) * (0.6 + prog * 1.35);
      const alpha = Math.max(0.12, 1 - prog * 1.05);

      ctx.globalAlpha = alpha * 0.85;
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, rad, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = WHITE;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, rad * 0.55, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = VIOLET;
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, rad * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;

    // === PARTICLES (with optional color) ===
    for (const p of this._particles) {
      const a = Math.max(0.08, Math.min(1, p.life / 0.5));
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color || WHITE;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // === SCORE POPUPS ===
    ctx.font = 'bold 10px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    for (const sp of this._scorePopups) {
      const a = Math.max(0.1, sp.life / 0.85);
      ctx.globalAlpha = a;
      ctx.fillStyle = ORANGE;
      ctx.fillText('+' + sp.amount, sp.x, sp.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';

    ctx.restore();
  }

  _drawBackground(ctx) {
    // Deep organic parallax "blood vessel / cell" field — fully procedural

    // Very slow distant layer (veins + faint grid)
    ctx.strokeStyle = 'rgba(90, 88, 130, 0.22)';
    ctx.lineWidth = 1.5;
    const s1 = this._scroll * 0.6;
    for (let i = 0; i < 5; i++) {
      const x = ((i * 137 - s1) % (GAME_W + 90)) - 45;
      ctx.beginPath();
      ctx.moveTo(x, 10);
      ctx.quadraticCurveTo(x + 38, GAME_H * 0.33, x - 12, GAME_H * 0.72);
      ctx.quadraticCurveTo(x + 55, GAME_H * 0.9, x + 22, GAME_H - 8);
      ctx.stroke();
    }

    // Pulsing distant cells
    ctx.fillStyle = 'rgba(120, 200, 255, 0.09)';
    for (let i = 0; i < 22; i++) {
      const x = ((i * 29 + this._scroll * 0.18) % (GAME_W + 50)) - 25;
      const y = 14 + ((i * 17) % (GAME_H - 28));
      const pr = 1.6 + Math.sin(this._time * 1.3 + i) * 0.7;
      ctx.beginPath();
      ctx.arc(x, y, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mid layer — faster moving vessel walls / membranes
    ctx.strokeStyle = 'rgba(160, 120, 255, 0.15)';
    ctx.lineWidth = 1;
    const s2 = this._scroll * 1.35;
    for (let i = 0; i < 7; i++) {
      const x = ((i * 83 - s2) % (GAME_W + 120)) - 60;
      ctx.beginPath();
      ctx.moveTo(x, 4);
      ctx.lineTo(x + 19, GAME_H * 0.5);
      ctx.lineTo(x - 7, GAME_H - 4);
      ctx.stroke();
    }

    // Foreground subtle scan / horizontal flow lines (CRT friendly)
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let y = 18; y < GAME_H - 12; y += 19) {
      const phase = ((y * 0.8 + this._scroll * 2.6) % 38) - 19;
      ctx.beginPath();
      ctx.moveTo(phase, y);
      ctx.lineTo(GAME_W - 12 + phase * 0.3, y);
      ctx.stroke();
    }
  }

  destroy() {
    // No timers or listeners to clean
  }
}
