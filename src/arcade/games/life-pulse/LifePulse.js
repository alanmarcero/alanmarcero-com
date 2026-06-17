import { CYAN, VIOLET, ORANGE, BG, WHITE, MUTED } from '../palette';
import * as R from './LifePulseRenderer';

const GAME_W = R.GAME_W;
const GAME_H = R.GAME_H;

// Core tuning — pass 10: snappier feel, fairer early game
const PLAYER_SPEED = 255;
const BULLET_SPEED = 480;
const ENEMY_SPEED = 88;
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
    // Pass 10: pure procedural renderer — no JPG sprites
    this.assets = {};
    this.assetsLoaded = true;
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

    this._wave = 1;

    this._bullets = [];
    this._enemyBullets = [];
    this._enemies = [];
    this._particles = [];
    this._explosions = [];
    this._powerups = [];
    this._pulses = [];          // Life Pulse bombs (secondary special)
    this._scorePopups = [];     // floating +N scores
    this._options = [];         // auto-firing companion drones (from 'option' powerup)
    this._combo = 0;
    this._comboTimer = 0;
    this._highScore = this._loadHighScore();
    this._lastGrazeTime = 0;

    this._powerLevel = 0;       // 0 = normal, 1 = double, 2 = spread
    this._powerTimer = 0;

    // Pass 4 new temporary power states for progression depth
    this._laserTimer = 0;       // LASER powerup: piercing primary fire
    this._pulseStock = 0;       // BOMB stock: extra Life Pulse charges from powerups (gives tangible "point")
    this._homingTimer = 0;      // HOMING powerup (pass 5): bullets seek targets
    this._overchargeTimer = 0;  // OVERCHARGE powerup (pass 5): power 3 + fast + homing + laser synergy
    this._surviveAccum = 0;     // survival time scoring for "point" at high levels
    this._focusTimer = 0;       // FOCUS powerup (pass 6): precision mode - tighter hitbox + better graze
    this._novaReady = false;    // NOVA one-shot clear (pass 6) - powerful screen-clear style ability
    this._chainTimer = 0;       // CHAIN powerup (pass 7): linked hits, score chains, visual links
    this._reflectTimer = 0;     // REFLECT powerup (pass 7): reflects enemy bullets back as player shots for a time
    this._swarmTimer = 0;       // SWARM powerup (pass 8): spawns aggressive mini-parasites
    this._vortexTimer = 0;      // VORTEX powerup (pass 8): pulls enemies in + damage/score amp
    this._surgeTimer = 0;       // SURGE mode (pass 8): high difficulty ramp after milestones for endless feel + multipliers
    this._echoTimer = 0;        // ECHO powerup (pass 9)
    this._orbitTimer = 0;       // ORBIT powerup (pass 9) - enhanced companion orbit
    this._chargeTimer = 0;      // CHARGE powerup (pass 9)
    this._maxCombo = 0;
    this._gameStartTime = this._time;
    this._kills = 0;
    this._maxOptions = 2;       // upgradable for progression
    this._runScoreMulti = 1;    // run multiplier from upgrades
    this._perfectWave = true;   // for perfect clear bonuses
    this._damageTakenThisWave = 0;
    this._perfectWaves = 0;
    this._grazeCount = 0;
    this._pulseCharge = 35;       // pass 10: signature pulse meter (0-100)
    this._pulseWaves = [];        // expanding ring visuals on detonation
    this._waveBanner = 0;         // "WAVE CLEAR" flash timer
    this._formationCooldown = 0;

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
    this._updatePulseWaves(dt);
    this._updateScorePopups(dt);
    if (this._waveBanner > 0) this._waveBanner -= dt;
    if (this._formationCooldown > 0) this._formationCooldown -= dt;
    this._updateOptions(dt);
    this._updateCombo(dt);
    this._checkGraze(dt);
    this._updateSwarm(dt);

    this._spawnEnemies(dt);
    this._updateBoss(dt);
    this._checkCollisions();

    this._scroll = (this._scroll + 48 * dt) % 64;

    // Real difficulty + level progression (score + wave driven)
    const targetLevel = Math.min(9, 1 + Math.floor(this.score / 5200) + Math.floor(this._wave / 3));
    if (targetLevel > this.level) {
      this.level = targetLevel;
      const levelBonus = 180 + this.level * 35;
      this.score += levelBonus;
      this._spawnScorePopup(this._player.x + 30, this._player.y - 22, levelBonus);
      this._onLevelUp();
      this._emitHud();
    }
    this._difficulty = Math.min(5.5, 1.0 + (this.level - 1) * 0.55 + this.score / 18500 + (this._surgeTimer > 0 ? 1.4 : 0)); // SURGE ramp (pass 8)

    // Pass 5: survival time gives steady "point" at higher levels (rewards not dying)
    this._surviveAccum += dt;
    if (this.level >= 3 && this._surviveAccum > 22) {
      const bonus = 45 + this.level * 9;
      this.score += bonus;
      this._surviveAccum = 0;
    }

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

    const accel = 1680;
    const friction = 8.5;
    const maxSpeed = 290 * speedMul;

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
    const baseRate = 0.095;
    let fireRate = this._powerLevel >= 1 ? 0.052 : baseRate;
    if (this._overchargeTimer > 0) fireRate = 0.034;
    if (this._keys.fire && this._fireCooldown <= 0) {
      this._fireCooldown = fireRate;
      this._shoot();
    }

    // Power timeout
    this._powerTimer -= dt;
    if (this._powerTimer <= 0) this._powerLevel = 0;

    // Laser temporary mode (new powerful powerup)
    this._laserTimer -= dt;
    if (this._laserTimer <= 0) this._laserTimer = 0;

    // Pass 5: homing and overcharge timers
    this._homingTimer -= dt;
    if (this._homingTimer <= 0) this._homingTimer = 0;
    this._overchargeTimer -= dt;
    if (this._overchargeTimer <= 0) this._overchargeTimer = 0;
    this._focusTimer -= dt;
    if (this._focusTimer <= 0) this._focusTimer = 0;
    this._chainTimer -= dt;
    if (this._chainTimer <= 0) this._chainTimer = 0;
    this._reflectTimer -= dt;
    if (this._reflectTimer <= 0) this._reflectTimer = 0;
    this._swarmTimer -= dt;
    if (this._swarmTimer <= 0) this._swarmTimer = 0;
    this._vortexTimer -= dt;
    if (this._vortexTimer <= 0) this._vortexTimer = 0;
    this._surgeTimer -= dt;
    if (this._surgeTimer <= 0) this._surgeTimer = 0;
    this._echoTimer -= dt;
    if (this._echoTimer <= 0) this._echoTimer = 0;
    this._orbitTimer -= dt;
    if (this._orbitTimer <= 0) this._orbitTimer = 0;
    this._chargeTimer -= dt;
    if (this._chargeTimer <= 0) this._chargeTimer = 0;

    // Secondary = LIFE PULSE bomb + new NOVA (pass 6)
    this._pulseCooldown -= dt;
    const canFirePulse = this._keys.secondary && this._pulseCooldown <= 0;
    if (canFirePulse) {
      if (this._novaReady) {
        this._novaReady = false;
        this._fireNova();
        this._pulseCooldown = 1.2;
      } else if (this._pulseStock > 0) {
        this._pulseStock--;
        this._pulseCooldown = 0.55;
        this._firePulseBomb(true);
      } else {
        this._pulseCooldown = 0.95;
        this._firePulseBomb(false);
      }
    }

    if (this._player.invuln > 0) this._player.invuln -= dt;
  }

  _shoot() {
    const p = this._player;
    const baseX = p.x + 13;
    const baseY = p.y;
    const isLaser = this._laserTimer > 0;
    const isCharge = this._chargeTimer > 0;

    if (isCharge) this._chargeTimer = 0; // consume charge for big shot

    const speed = (isLaser || isCharge) ? BULLET_SPEED * 1.2 : BULLET_SPEED;
    const life = (isLaser || isCharge) ? 2.5 : 1.65;
    const r = (isLaser || isCharge) ? BULLET_HIT_R * 1.3 : BULLET_HIT_R;

    const doHoming = (this._homingTimer > 0 || this._overchargeTimer > 0);
    const doEcho = this._echoTimer > 0;

    // Center shot (piercing when laser/charge active)
    this._bullets.push({
      x: baseX, y: baseY,
      vx: isCharge ? speed * 0.65 : speed,
      vy: 0,
      r: isCharge ? r * 1.7 : r,
      life,
      pierce: isLaser || isCharge,
      laser: isLaser || isCharge,
      homing: doHoming,
      charge: isCharge,
    });

    if (this._powerLevel >= 1 && !isCharge) {
      const spread = (this._powerLevel >= 2) ? 11 : 7;
      const spreadSpeedY = (this._powerLevel >= 2) ? 38 : 22;
      this._bullets.push({
        x: baseX - 1, y: baseY - spread,
        vx: speed * 0.98, vy: -spreadSpeedY,
        r: r * 0.9,
        life: isLaser ? 1.8 : 1.35,
        pierce: isLaser,
        laser: isLaser,
        homing: doHoming,
      });
      this._bullets.push({
        x: baseX - 1, y: baseY + spread,
        vx: speed * 0.98, vy: spreadSpeedY,
        r: r * 0.9,
        life: isLaser ? 1.8 : 1.35,
        pierce: isLaser,
        laser: isLaser,
        homing: doHoming,
      });
    }

    // ECHO: fire extra delayed echo shot for chaining (pass 9)
    if (doEcho && this._echoTimer > 0) {
      this._echoTimer = Math.max(0, this._echoTimer - 1.5);
      this._bullets.push({
        x: baseX + 4, y: baseY,
        vx: speed * 0.5,
        vy: (Math.random() - 0.5) * 30,
        r: r * 0.8,
        life: life * 0.75,
        pierce: isLaser || isCharge,
        laser: isLaser || isCharge,
        homing: doHoming,
        echo: true,
      });
    }
  }

  _firePulseBomb(fromStock = false) {
    const p = this._player;
    const charged = this._pulseCharge >= 100;
    const boosted = fromStock || charged;
    if (charged) this._pulseCharge = 0;

    const life = boosted ? 0.88 : 0.75;
    const r = boosted ? 9 : 7.5;
    this._pulses.push({
      x: p.x + 10,
      y: p.y,
      vx: boosted ? 220 : 195,
      vy: (Math.random() - 0.5) * 10,
      r,
      life,
      detonated: false,
      boosted,
    });
    this._shake = Math.max(this._shake || 0, boosted ? 4 : 2);
    for (let i = 0; i < (boosted ? 8 : 4); i++) {
      const ang = (i / (boosted ? 8 : 4)) * Math.PI * 2;
      this._particles.push({
        x: p.x + 14, y: p.y,
        vx: Math.cos(ang) * 40, vy: Math.sin(ang) * 40,
        life: 0.2, maxLife: 0.2, size: 2.5, color: CYAN, glow: true, round: true,
      });
    }
  }

  _fireNova() {
    const p = this._player;
    // NOVA: massive radial clear (pass 6) - big "point" moment
    const radius = 140;
    this._createExplosion(p.x, p.y, 72);
    this._shake = 28;

    // Wipe almost everything on screen for huge satisfaction
    let cleared = 0;
    for (let j = this._enemies.length - 1; j >= 0; j--) {
      const e = this._enemies[j];
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      if (dx*dx + dy*dy < radius * radius * 1.1) {
        this.score += Math.floor((e.points || 70) * 1.8);
        this._spawnScorePopup(e.x, e.y, Math.floor((e.points || 70) * 1.8));
        e.hp = 0;
        cleared++;
      }
    }
    for (let j = this._enemyBullets.length - 1; j >= 0; j--) {
      const b = this._enemyBullets[j];
      const dx = b.x - p.x; const dy = b.y - p.y;
      if (dx*dx + dy*dy < radius * radius) {
        this._enemyBullets.splice(j, 1);
      }
    }

    // Extra ring particles + bonus for big clear
    for (let k = 0; k < 32; k++) {
      const ang = (k / 32) * Math.PI * 2;
      const sp = 55 + Math.random() * 70;
      this._particles.push({
        x: p.x, y: p.y,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        life: 0.55 + Math.random() * 0.25,
        size: 3.2 + Math.random() * 2,
        color: (k % 2 === 0) ? '#ffeb3b' : CYAN,
      });
    }
    if (cleared > 0) {
      this.score += cleared * 18;
    }
  }

  _computeGrade() {
    // Pass 7/9 performance rank for "point" and replay value (factors perfect waves and multi)
    const mc = this._maxCombo || 0;
    const k = this._kills || 0;
    const lvl = this.level || 1;
    const t = Math.max(1, (this._time - (this._gameStartTime || 0)));
    const grazeBonus = (this._grazeCount || 0) * 0.08;
    const perfect = (this._perfectWaves || 0) * 3;
    const multi = (this._runScoreMulti || 1) * 2;
    let score = (mc * 2) + (k * 0.6) + (lvl * 8) + grazeBonus + perfect + multi - (t * 0.025);
    if (score > 65) return 'S';
    if (score > 48) return 'A';
    if (score > 32) return 'B';
    if (score > 18) return 'C';
    return 'D';
  }

  _updateBullets(dt) {
    for (let i = this._bullets.length - 1; i >= 0; i--) {
      const b = this._bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.life !== undefined) b.life -= dt;

      // Pass 5: simple homing for bullets with flag (seeks nearest living enemy)
      if (b.homing && this._enemies.length > 0) {
        let nearest = null;
        let bestDist = 99999;
        for (const e of this._enemies) {
          if ((e.hp || 0) <= 0) continue;
          const dx = e.x - b.x;
          const dy = e.y - b.y;
          const d = dx * dx + dy * dy;
          if (d < bestDist && d < 180 * 180) {
            bestDist = d;
            nearest = e;
          }
        }
        if (nearest) {
          const dx = nearest.x - b.x;
          const dy = nearest.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const turn = 180 * dt; // turn speed
          b.vx += (dx / dist) * turn;
          b.vy += (dy / dist) * turn;
          // normalize speed a bit
          const sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || 1;
          const targetSp = 420;
          b.vx = (b.vx / sp) * targetSp;
          b.vy = (b.vy / sp) * targetSp;
        }
      }

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
      if (e.type === 'tendril' && e.weave) {
        // Slow weaving long threat - hard to predict
        e.vy = Math.sin(this._time * 1.6 + (e.id || 0)) * (38 * Math.abs(e.weave));
        e.vx *= 0.985; // drag
      }
      if (e.type === 'parasite') {
        // Pass 5 parasite: fast chaser toward player or option
        const target = (e.targetOption && this._options.length > 0)
          ? this._options[0]
          : this._player;
        if (target && target.alive !== false) {
          const dx = target.x - e.x;
          const dy = target.y - e.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const chase = 220;
          e.vx = (dx / dist) * chase;
          e.vy = (dy / dist) * chase;
        }
      }
      if (this._vortexTimer > 0 && e.type !== 'boss') {
        // Pass 8 VORTEX: pull enemies toward player (makes positioning matter for collision and clears)
        const dx = this._player.x - e.x;
        const dy = this._player.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const pull = 95;
        e.vx += (dx / dist) * pull * dt * 8;
        e.vy += (dy / dist) * pull * dt * 8;
        // slight damage amp while in vortex
        if (dist < 80) e.vortexAmp = (e.vortexAmp || 1) + dt * 0.8;
      }
      if (e.type === 'tendril-parasite' && e.whip !== undefined) {
        // Pass 9 hybrid: oscillating whip attack (affects vy for dodge challenge)
        e.vy = Math.sin(this._time * 3.5 + (e.id || 0)) * (55 * e.whip);
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
        const comboMul = 1 + Math.min(4, Math.floor(this._combo / 3)) * 0.2;
        let gained = Math.floor((e.points || 70) * comboMul);
        if (this._chainTimer > 0) {
          gained = Math.floor(gained * 1.6); // CHAIN powerup (pass 7) dramatically boosts chained kills for "point"
          this._combo = Math.min(15, this._combo + 1); // stronger combo feed
        }
        if (e.vortexAmp && e.vortexAmp > 1) {
          gained = Math.floor(gained * Math.min(2.2, 1 + e.vortexAmp * 0.4)); // VORTEX amp
        }
        gained = Math.floor(gained * (this._runScoreMulti || 1));
        this.score += gained;
        this._combo = Math.min(12, this._combo + 1);
        this._comboTimer = 1.9;
        this._kills = (this._kills || 0) + 1;
        this._pulseCharge = Math.min(100, (this._pulseCharge || 0) + 9);
        this._spawnScorePopup(e.x, e.y - 6, gained);

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
        if (e.isQueen) {
          // Pass 8 parasite queen death spawns swarm
          for (let s = 0; s < 4; s++) {
            this._enemies.push({
              id: Math.random() * 99999 | 0,
              x: e.x + (Math.random() - 0.5) * 18,
              y: e.y + (Math.random() - 0.5) * 18,
              vx: -ENEMY_SPEED * (0.7 + Math.random() * 0.5),
              vy: (Math.random() - 0.5) * 55,
              hp: 1,
              points: 30,
              r: 4.5,
              type: 'parasite',
              isSwarm: true,
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
    const speed = 130 + this._difficulty * 16;
    this._enemyBullets.push({
      x: e.x,
      y: e.y,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      r: 3.2,
      life: 3.2,
    });

    // Pass 6 telegraph juice for turrets (makes collision avoidable)
    if (e.type === 'turret') {
      for (let t = 0; t < 3; t++) {
        this._particles.push({
          x: e.x - 8, y: e.y,
          vx: -30 - Math.random() * 20, vy: (Math.random() - 0.5) * 25,
          life: 0.18 + Math.random() * 0.1,
          size: 2.2,
          color: ORANGE,
        });
      }
    }
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
    const radius = pulse.boosted ? 105 : 82;
    this._pulseWaves.push({
      x: pulse.x, y: pulse.y,
      age: 0, duration: 0.45,
      maxRadius: radius * 1.35,
      boosted: pulse.boosted,
    });
    const baseDmg = pulse.boosted ? 4 : 3;
    const bossDmg = pulse.boosted ? 16 : 11;
    this._createExplosion(pulse.x, pulse.y, pulse.boosted ? 54 : 46);
    this._shake = Math.max(this._shake, pulse.boosted ? 15 : 11);

    // Area damage to regular enemies
    for (let j = this._enemies.length - 1; j >= 0; j--) {
      const e = this._enemies[j];
      const dx = e.x - pulse.x;
      const dy = e.y - pulse.y;
      if (dx * dx + dy * dy < (radius + (e.r || 10)) * (radius + (e.r || 10))) {
        e.hp = (e.hp || 1) - baseDmg;
        this._createHitParticle(e.x, e.y);
        if ((e.hp || 0) <= 0) {
          this.score += (e.points || 70) * 0.6 | 0;
          this._spawnScorePopup(e.x, e.y, (e.points || 70) * 0.6 | 0);
        }
      }
    }

    // Hit boss too (core weakpoint bonus if we have the art)
    if (this._boss) {
      const dx = this._boss.x - pulse.x;
      const dy = this._boss.y - pulse.y;
      let dmg = bossDmg;
      // Bonus if near the core (pass 4 visual + mechanical synergy with new bossCore art)
      if (this.assets.bossCore) {
        const coreDx = dx - 4;
        const coreDy = dy + 2;
        if (coreDx * coreDx + coreDy * coreDy < 380) dmg += 5;
      }
      if (dx * dx + dy * dy < (radius + BOSS_HIT_R) * (radius + BOSS_HIT_R)) {
        this._boss.hp -= dmg;
        this._createHitParticle(this._boss.x, this._boss.y);
        if (this._boss.hp <= 0) {
          this._createExplosion(this._boss.x, this._boss.y, pulse.boosted ? 64 : 58);
          const clearBonus = 480 + this.level * 55;
          this.score += (pulse.boosted ? 1250 : 920) + clearBonus;
          this._spawnScorePopup(this._boss.x, this._boss.y - 10, pulse.boosted ? 1250 : 920);
          this._spawnScorePopup(320, 28, clearBonus); // wave clear "point"
          this._shake = 24;
          this._boss = null;
          this._bossActive = false;

          // Pass 6 auto milestone upgrade
          if (!this._runUpgrades) this._runUpgrades = 0;
          this._runUpgrades++;
          if (this._runUpgrades % 2 === 1) {
            this._pulseStock = (this._pulseStock || 0) + 1;
          }
          this._surgeTimer = Math.max(this._surgeTimer || 0, 22); // SURGE mode activated (pass 8)

          // Pass 9 simple run progression: auto-grant upgrade on wave clear
          this._maxOptions = Math.min(4, (this._maxOptions || 2) + 1);
          this._runScoreMulti = (this._runScoreMulti || 1) + 0.08;
          if (this._perfectWave) {
            this._perfectWaves = (this._perfectWaves || 0) + 1;
            const perfectBonus = 320 + this.level * 25;
            this.score += perfectBonus;
            this._spawnScorePopup(320, 48, perfectBonus);
          }
          this._perfectWave = true;
          this._damageTakenThisWave = 0;
          this._waveBanner = 1.8;
          this._pulseCharge = Math.min(100, (this._pulseCharge || 0) + 25);
        }
      }
    }

    // Nice expanding ring particles (more when boosted)
    const particleCount = pulse.boosted ? 26 : 18;
    for (let k = 0; k < particleCount; k++) {
      const ang = (k / particleCount) * Math.PI * 2;
      const sp = (pulse.boosted ? 46 : 38) + Math.random() * 55;
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

  _spawnFormation() {
    const d = this._difficulty;
    const count = 4 + Math.floor(d);
    const baseY = 60 + Math.random() * (GAME_H - 120);
    for (let i = 0; i < count; i++) {
      this._enemies.push({
        id: Math.random() * 99999 | 0,
        x: GAME_W + 20 + i * 28,
        y: baseY + Math.sin(i * 1.2) * 35,
        vx: -ENEMY_SPEED * (0.75 + d * 0.04),
        vy: Math.cos(i * 0.8) * 18,
        hp: 1,
        points: 70,
        r: ENEMY_BASE_R * 0.9,
        type: i % 3 === 0 ? 'swooper' : 'drone',
      });
    }
  }

  _spawnEnemies(dt) {
    this._spawnTimer -= dt;

    // Spawn cadence tightens with difficulty and level
    const baseRate = Math.max(0.38, 0.9 / this._difficulty);
    const spawnInterval = baseRate + Math.random() * 0.25;

    if (this._spawnTimer <= 0) {
      this._spawnTimer = spawnInterval;
      if (this._surgeTimer > 0) this._spawnTimer *= 0.55;
      this._wave += 0.08;

      // Formation waves every ~8 wave ticks
      if (this._formationCooldown <= 0 && Math.floor(this._wave) % 8 === 0 && Math.random() < 0.35) {
        this._spawnFormation();
        this._formationCooldown = 6;
        return;
      }

      const y = 32 + Math.random() * (GAME_H - 64);
      const roll = Math.random();
      const d = this._difficulty;

      // Pass 10: fixed spawn weights (growth was unreachable due to duplicate branch)
      if (roll < 0.34) {
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
      } else if (roll < 0.54) {
        this._enemies.push({
          id: Math.random() * 99999 | 0,
          x: GAME_W + 26,
          y: 46 + Math.random() * (GAME_H - 92),
          vx: -ENEMY_SPEED * (1.05 + d * 0.05),
          vy: 0,
          hp: 1,
          points: 95,
          r: ENEMY_BASE_R * 1.05,
          type: 'swooper',
        });
      } else if (roll < 0.68) {
        this._enemies.push({
          id: Math.random() * 99999 | 0,
          x: GAME_W + 22, y,
          vx: -ENEMY_SPEED * (0.55 + Math.random() * 0.1),
          vy: 0,
          hp: 2 + (d > 2 ? 1 : 0),
          points: 145,
          r: ENEMY_BASE_R * 1.25,
          type: 'turret',
        });
      } else if (roll < 0.78) {
        this._enemies.push({
          id: Math.random() * 99999 | 0,
          x: GAME_W + 28, y,
          vx: -ENEMY_SPEED * 0.45,
          vy: (Math.random() - 0.5) * 15,
          hp: 4,
          points: 195,
          r: ENEMY_BASE_R * 1.55,
          type: 'growth',
          split: true,
        });
      } else if (roll < 0.86) {
        // New fast spiker (armored aggressive, from new Grok Imagine asset)
        const spikerElite = d > 2.8 && Math.random() < 0.4;
        this._enemies.push({
          id: Math.random() * 99999 | 0,
          x: GAME_W + 14, y,
          vx: -ENEMY_SPEED * (1.65 + d * 0.08),
          vy: (Math.random() - 0.5) * 22,
          hp: spikerElite ? 3 : 2,
          points: spikerElite ? 165 : 115,
          r: ENEMY_BASE_R * 0.95,
          type: 'spiker',
          elite: spikerElite,
        });
      } else if (roll < 0.93) {
        // Tendril - long weaving biological threat (new Grok Imagine asset + unique behavior)
        this._enemies.push({
          id: Math.random() * 99999 | 0,
          x: GAME_W + 32, y,
          vx: -ENEMY_SPEED * 0.38,
          vy: (Math.random() - 0.5) * 9,
          hp: 6,
          points: 165,
          r: ENEMY_BASE_R * 1.25,
          type: 'tendril',
          weave: (Math.random() - 0.5) * 2.2,
        });
      } else if (d > 2.8 && Math.random() < 0.6) {
        // Parasite (pass 5/8): small fast chaser, annoying, targets player/options. Rare queen variant (bigger, spawns on death)
        const isQueen = d > 3.2 && Math.random() < 0.18;
        this._enemies.push({
          id: Math.random() * 99999 | 0,
          x: GAME_W + 12, y,
          vx: -ENEMY_SPEED * (1.9 + d * 0.1),
          vy: (Math.random() - 0.5) * 30,
          hp: isQueen ? 4 : 1,
          points: isQueen ? 210 : 80,
          r: isQueen ? ENEMY_BASE_R * 1.35 : ENEMY_BASE_R * 0.65,
          type: 'parasite',
          targetOption: Math.random() < 0.4,
          isQueen,
        });
      } else if (d > 3.0 && Math.random() < 0.25) {
        // Pass 9 new hybrid enemy from fresh asset: tendril-parasite with whip behavior
        this._enemies.push({
          id: Math.random() * 99999 | 0,
          x: GAME_W + 20, y,
          vx: -ENEMY_SPEED * (0.9 + d * 0.05),
          vy: (Math.random() - 0.5) * 25,
          hp: 3,
          points: 135,
          r: ENEMY_BASE_R * 1.1,
          type: 'tendril-parasite',
          whip: Math.random() * 3,
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

    // Pass 10: curated powerup pool — fewer types, more readable
    if (Math.random() < 0.034) {
      const pool = ['double', 'shield', 'pulse', 'option', 'laser', 'bomb', 'focus', 'nova',
        'homing', 'chain', 'vortex', 'charge'];
      const type = pool[Math.floor(Math.random() * pool.length)];
      this._powerups.push({
        x: GAME_W + 14,
        y: 44 + Math.random() * (GAME_H - 88),
        type,
        life: 9,
      });
    }
  }

  _updatePulseWaves(dt) {
    for (let i = this._pulseWaves.length - 1; i >= 0; i--) {
      this._pulseWaves[i].age += dt;
      if (this._pulseWaves[i].age >= this._pulseWaves[i].duration) {
        this._pulseWaves.splice(i, 1);
      }
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
          let dmg = b.laser ? 2 : 1;
          // Pass 5: center hit bonus (precision feels good, addresses "hit collision" complaint)
          const centerDist = Math.sqrt(dx * dx + dy * dy);
          if (centerDist < er * 0.45) {
            dmg += 1;
            this.score += 8; // small precision bonus
            this._shake = Math.max(this._shake || 0, 2.5); // hitstop feel for precision
            // Pass 8 crit zone bonus for biological enemies (growth/tendril/parasite) using weakpoint art
            if (['growth', 'tendril', 'parasite'].includes(e.type)) {
              dmg += 1;
              this.score += 12;
              this._createHitParticle(b.x, b.y); // extra pop on crit
            }
          }
          e.hp = (e.hp || 1) - dmg;
          e.lastHit = this._time;
          this._createHitParticle(b.x, b.y);

          // Pass 4: piercing / laser bullets continue through enemies (unless life low)
          if (b.pierce && b.life > 0.2) {
            b.life *= 0.7; // decay life on pierce
            // don't splice - continues
          } else {
            this._bullets.splice(i, 1);
          }
          break;
        }
      }
    }

    // Pass 7 collision skill expression: overcharge/high power cancels enemy bullets with player bullets (bullet hell defense)
    if (this._overchargeTimer > 0 || this._laserTimer > 0) {
      for (let i = this._bullets.length - 1; i >= 0; i--) {
        const pb = this._bullets[i];
        for (let j = this._enemyBullets.length - 1; j >= 0; j--) {
          const eb = this._enemyBullets[j];
          const dx = pb.x - eb.x;
          const dy = pb.y - eb.y;
          if (dx * dx + dy * dy < 70) { // generous cancel radius during power mode
            this._enemyBullets.splice(j, 1);
            this.score += 3;
            this._createHitParticle(eb.x, eb.y);
            // player bullet continues (or reduce life slightly)
            if (pb.life !== undefined) pb.life *= 0.85;
          }
        }
      }
    }

    // Enemy bullets vs player (fair circle hit on core) - focus shrinks hitbox for better collision feel
    const focusMul = (this._focusTimer > 0) ? 0.62 : 1.0;
    const playerHitR = PLAYER_HIT_R * focusMul;

    if (this._player.alive && this._player.invuln <= 0) {
      for (let i = this._enemyBullets.length - 1; i >= 0; i--) {
        const b = this._enemyBullets[i];
        const br = b.r || 3;
        const dx = b.x - this._player.x;
        const dy = b.y - this._player.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < (br + playerHitR) * (br + playerHitR)) {
          if (this._reflectTimer > 0) {
            // Pass 7 REFLECT: turn enemy bullet into friendly piercing shot going back
            this._bullets.push({
              x: this._player.x + 8,
              y: this._player.y,
              vx: 380,
              vy: (Math.random() - 0.5) * 40,
              r: 3.5,
              life: 1.4,
              pierce: true,
              laser: true,
            });
            this._enemyBullets.splice(i, 1);
            this.score += 6;
          } else {
            this._hitPlayer();
            this._enemyBullets.splice(i, 1);
          }
        } else if (this._focusTimer > 5 && d2 < (br + 22) * (br + 22)) {
          // Pass 8 FOCUS PHASE: at high focus, phase through and destroy nearby enemy bullets (skill expression, no hit)
          this._enemyBullets.splice(i, 1);
          this.score += 3;
          this._createHitParticle(b.x, b.y);
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
        if (dx * dx + dy * dy < (er + playerHitR) * (er + playerHitR)) {
          this._hitPlayer();
          e.hp = 0;
          if (e.type === 'tendril-parasite') {
            // extra whip push effect for collision feedback
            this._player.vx += (dx > 0 ? -80 : 80);
            this._createExplosion(this._player.x, this._player.y, 12);
          }
        }
      }
    }

    // Parasites (pass 5) are extra annoying on contact
    for (let i = this._enemies.length - 1; i >= 0; i--) {
      const e = this._enemies[i];
      if (e.type !== 'parasite') continue;
      const er = e.r || 6;
      const dx = e.x - this._player.x;
      const dy = e.y - this._player.y;
      if (dx * dx + dy * dy < (er + PLAYER_HIT_R + 2) * (er + PLAYER_HIT_R + 2)) {
        if (this._player.invuln <= 0) {
          this._hitPlayer();
        }
        e.hp = 0;
      }
    }

    // Options are fragile — contact with enemies destroys the drone but hurts the enemy
    for (let i = this._options.length - 1; i >= 0; i--) {
      const o = this._options[i];
      for (let j = this._enemies.length - 1; j >= 0; j--) {
        const e = this._enemies[j];
        const er = e.r || ENEMY_BASE_R;
        const dx = e.x - o.x;
        const dy = e.y - o.y;
        if (dx * dx + dy * dy < (er + 5) * (er + 5)) {
          this._options.splice(i, 1);
          e.hp = (e.hp || 1) - 1;
          this._createHitParticle(o.x, o.y);
          break;
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
            const clearBonus = 480 + this.level * 55;
            this.score += 880 + clearBonus;
            this._spawnScorePopup(this._boss.x, this._boss.y - 8, 880);
            this._spawnScorePopup(320, 28, clearBonus);
            this._shake = 19;
            this._boss = null;
            this._bossActive = false;

            if (!this._runUpgrades) this._runUpgrades = 0;
            this._runUpgrades++;
            if (this._runUpgrades % 2 === 1) {
              this._pulseStock = (this._pulseStock || 0) + 1;
            }
            this._surgeTimer = Math.max(this._surgeTimer || 0, 22); // SURGE mode activated (pass 8)

            // Pass 9 simple run progression: auto-grant upgrade on wave clear
            this._maxOptions = Math.min(4, (this._maxOptions || 2) + 1);
            this._runScoreMulti = (this._runScoreMulti || 1) + 0.08;
            if (this._perfectWave) {
              this._perfectWaves = (this._perfectWaves || 0) + 1;
              const perfectBonus = 320 + this.level * 25;
              this.score += perfectBonus;
              this._spawnScorePopup(320, 48, perfectBonus);
              this._createExplosion(320, 50, 52); // use perfect burst art via size
            }
            this._perfectWave = true;
            this._damageTakenThisWave = 0;
            this._waveBanner = 1.8;
            this._pulseCharge = Math.min(100, (this._pulseCharge || 0) + 25);
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

    this._perfectWave = false;
    this._damageTakenThisWave = (this._damageTakenThisWave || 0) + 1;

    if (this.lives <= 0) {
      this.gameOver = true;
      this._saveHighScore(this.score);
      // Pass 8: final rank bonus score for "point"
      const g = this._computeGrade();
      const rankMul = (g === 'S' ? 0.35 : g === 'A' ? 0.22 : g === 'B' ? 0.12 : g === 'C' ? 0.05 : 0);
      const rankBonus = Math.floor(this.score * rankMul);
      this.score += rankBonus;
      this._spawnScorePopup(this._player.x, this._player.y - 30, rankBonus);
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
    } else if (type === 'option') {
      // Spawn a companion drone (classic powerup fantasy) - respects upgradable max
      const maxOpt = this._maxOptions || 2;
      if (this._options.length < maxOpt) {
        this._options.push({
          x: this._player.x - 28,
          y: this._player.y + (this._options.length - 0.5) * 16,
          fireTimer: 0.2,
        });
      }
      this.score += 140;
      this._spawnScorePopup(this._player.x, this._player.y - 18, 140);
    } else if (type === 'laser') {
      // New LASER powerup (pass 4) - temporary piercing high-damage primary
      this._laserTimer = Math.max(this._laserTimer, 13.5);
      this.score += 210;
      this._spawnScorePopup(this._player.x, this._player.y - 18, 210);
    } else if (type === 'bomb') {
      // BOMB powerup gives extra Life Pulse charges - gives real resource "point" and decision making
      this._pulseStock = Math.min(5, (this._pulseStock || 0) + 2);
      this.score += 175;
      this._spawnScorePopup(this._player.x, this._player.y - 18, 175);
    } else if (type === 'homing') {
      // HOMING powerup (pass 5): bullets curve toward enemies
      this._homingTimer = Math.max(this._homingTimer, 11);
      this.score += 165;
      this._spawnScorePopup(this._player.x, this._player.y - 18, 165);
    } else if (type === 'overcharge') {
      // OVERCHARGE (pass 5): max power fantasy, fast fire + laser + homing synergy
      this._overchargeTimer = Math.max(this._overchargeTimer, 9);
      this._powerLevel = 3;
      this._laserTimer = Math.max(this._laserTimer, 9);
      this._homingTimer = Math.max(this._homingTimer, 9);
      this.score += 280;
      this._spawnScorePopup(this._player.x, this._player.y - 18, 280);
    } else if (type === 'nova') {
      // NOVA (pass 6): powerful one-shot big radial clear (bigger than bomb)
      this._novaReady = true;
      this.score += 195;
      this._spawnScorePopup(this._player.x, this._player.y - 18, 195);
    } else if (type === 'focus') {
      // FOCUS (pass 6): precision mode - tighter player hitbox (better collision feel), enhanced graze, slight fire bonus
      this._focusTimer = Math.max(this._focusTimer, 12);
      this.score += 150;
      this._spawnScorePopup(this._player.x, this._player.y - 18, 150);
    } else if (type === 'chain') {
      // CHAIN (pass 7): linked hits dramatically increase combo and score chains for "point"
      this._chainTimer = Math.max(this._chainTimer, 14);
      this.score += 175;
      this._spawnScorePopup(this._player.x, this._player.y - 18, 175);
    } else if (type === 'reflect') {
      // REFLECT (pass 7): reflects incoming enemy bullets back as friendly shots (great defense + offense synergy)
      this._reflectTimer = Math.max(this._reflectTimer, 10);
      this.score += 160;
      this._spawnScorePopup(this._player.x, this._player.y - 18, 160);
    } else if (type === 'swarm') {
      // SWARM (pass 8): spawns 3-4 aggressive mini-parasites that hunt enemies (great for clearing + point)
      this._swarmTimer = Math.max(this._swarmTimer, 9);
      this.score += 140;
      this._spawnScorePopup(this._player.x, this._player.y - 18, 140);
      // immediate mini spawns for feel
      for (let s = 0; s < 3; s++) {
        this._enemies.push({
          id: Math.random() * 99999 | 0,
          x: this._player.x + 10 + (s - 1) * 8,
          y: this._player.y + (Math.random() - 0.5) * 12,
          vx: -60,
          vy: (Math.random() - 0.5) * 40,
          hp: 1,
          points: 25,
          r: 4,
          type: 'parasite',
          isSwarm: true,
        });
      }
    } else if (type === 'vortex') {
      // VORTEX (pass 8): pulls enemies toward player + amp damage/score when close (risk/reward + collision skill)
      this._vortexTimer = Math.max(this._vortexTimer, 8);
      this.score += 155;
      this._spawnScorePopup(this._player.x, this._player.y - 18, 155);
    } else if (type === 'echo') {
      // ECHO (pass 9): next several shots fire an extra delayed echo for chaining
      this._echoTimer = Math.max(this._echoTimer, 6);
      this.score += 145;
      this._spawnScorePopup(this._player.x, this._player.y - 18, 145);
    } else if (type === 'orbit') {
      // ORBIT (pass 9): spawns additional orbiting mini-drones that auto-fire (stacks with options for progression)
      this._orbitTimer = Math.max(this._orbitTimer, 10);
      // immediate spawn of 1-2 orbiters (reuse option style but tagged)
      for (let o = 0; o < 2; o++) {
        this._options.push({
          x: this._player.x - 20 - o * 5,
          y: this._player.y + (o - 0.5) * 14,
          fireTimer: 0.3,
          isOrbit: true,
        });
      }
      this.score += 160;
      this._spawnScorePopup(this._player.x, this._player.y - 18, 160);
    } else if (type === 'charge') {
      // CHARGE (pass 9): next primary is a big powerful piercing charge blast (high collision impact + point)
      this._chargeTimer = Math.max(this._chargeTimer, 1); // consumed on next shot
      this.score += 170;
      this._spawnScorePopup(this._player.x, this._player.y - 18, 170);
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
        life: (isBig ? 0.42 : 0.28) + Math.random() * 0.22,
        maxLife: (isBig ? 0.42 : 0.28) + Math.random() * 0.22,
        size: (isBig ? 3.2 : 2.2) + Math.random() * 1.6,
        color: (i % 4 === 0) ? VIOLET : (i % 3 === 0 ? ORANGE : WHITE),
        glow: isBig,
        round: true,
      });
    }
    if (isBig) this._shake = Math.max(this._shake, 13);
  }

  _createHitParticle(x, y) {
    this._particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 90,
      vy: (Math.random() - 0.5) * 90,
      life: 0.18,
      maxLife: 0.18,
      size: 2.8,
      color: CYAN,
      glow: true,
      round: true,
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

  // ==================== RENDER (pass 10 — procedural bio-lab aesthetic) ====================
  render(ctx) {
    ctx.save();

    const shakeX = (Math.random() - 0.5) * this._shake * 0.85;
    const shakeY = (Math.random() - 0.5) * this._shake * 0.85;
    ctx.translate(this.offsetX + shakeX, this.offsetY + shakeY);
    ctx.scale(this.scale, this.scale);
    ctx.imageSmoothingEnabled = true;

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    R.drawBackground(ctx, {
      time: this._time,
      scroll: this._scroll,
      pulseCharge: this._pulseCharge,
    });

    if (this._vortexTimer > 0) {
      R.drawVortexField(ctx, this._player, this._time);
    }

    for (const wave of this._pulseWaves) {
      R.drawPulseWave(ctx, wave, this._time);
    }

    for (const e of this._enemies) {
      R.drawEnemy(ctx, e, this._time);
    }

    R.drawBoss(ctx, this._boss, this._time);

    for (const p of this._powerups) {
      R.drawPowerup(ctx, p, this._time);
    }

    for (const pulse of this._pulses) {
      R.drawPulseBomb(ctx, pulse, this._time);
    }

    for (const ex of this._explosions) {
      R.drawExplosion(ctx, ex, this._time);
    }

    for (const b of this._enemyBullets) {
      R.drawEnemyBullet(ctx, b);
    }

    for (const b of this._bullets) {
      R.drawBullet(ctx, b);
    }

    R.drawOptions(ctx, this._options, this._time);
    R.drawPlayer(ctx, {
      player: this._player,
      time: this._time,
      powerLevel: this._powerLevel,
      timers: {
        overcharge: this._overchargeTimer,
        laser: this._laserTimer,
        focus: this._focusTimer,
      },
    });

    R.drawParticles(ctx, this._particles);
    R.drawScorePopups(ctx, this._scorePopups);

    R.drawHud(ctx, {
      combo: this._combo,
      comboTimer: this._comboTimer,
      highScore: this._highScore,
      gameOver: this.gameOver,
      time: this._time,
      gameStartTime: this._gameStartTime,
      kills: this._kills,
      maxCombo: this._maxCombo,
      perfectWaves: this._perfectWaves,
      grazeCount: this._grazeCount,
      damageTakenThisWave: this._damageTakenThisWave,
      runScoreMulti: this._runScoreMulti,
      pulseCharge: this._pulseCharge,
      pulseStock: this._pulseStock,
      novaReady: this._novaReady,
      wave: this._wave,
      waveBanner: this._waveBanner,
      powerLevel: this._powerLevel,
      powerTimer: this._powerTimer,
      level: this.level,
      score: this.score,
      timers: {
        laser: this._laserTimer,
        homing: this._homingTimer,
        overcharge: this._overchargeTimer,
        focus: this._focusTimer,
        chain: this._chainTimer,
        reflect: this._reflectTimer,
        vortex: this._vortexTimer,
        surge: this._surgeTimer,
      },
      computeGrade: () => this._computeGrade(),
    });

    ctx.restore();

    // Post-process vignette in screen space
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    R.drawPost(ctx, this.canvasW, this.canvasH);
    ctx.restore();
  }

  destroy() {
    // No timers or listeners to clean
  }

  // ==================== NEW SYSTEMS (pass 3) ====================

  _loadHighScore() {
    try {
      const v = localStorage.getItem('lifePulseHighScore');
      return v ? parseInt(v, 10) : 0;
    } catch (e) { return 0; }
  }

  _saveHighScore(score) {
    try {
      if (score > (this._highScore || 0)) {
        this._highScore = score;
        localStorage.setItem('lifePulseHighScore', String(score));
      }
    } catch (e) {}
  }

  _updateCombo(dt) {
    if (this._combo > this._maxCombo) this._maxCombo = this._combo;
    const decay = (this._chainTimer > 0) ? dt * 0.6 : dt; // CHAIN (pass 7) makes combos last longer for big point runs
    if (this._comboTimer > 0) {
      this._comboTimer -= decay;
    } else if (this._combo > 0) {
      this._combo = Math.max(0, this._combo - 1);
      if (this._combo === 0) this._comboTimer = 0;
    }
  }

  _updateOptions(dt) {
    const p = this._player;
    for (let i = this._options.length - 1; i >= 0; i--) {
      const o = this._options[i];
      // Trail / follow player with lag and slight sine orbit
      const targetX = p.x - 22;
      const targetY = p.y + Math.sin(this._time * 4 + i) * 18;
      o.x += (targetX - o.x) * 0.12;
      o.y += (targetY - o.y) * 0.12;

      // Auto fire weak shots
      o.fireTimer = (o.fireTimer || 0) - dt;
      if (o.fireTimer <= 0) {
        o.fireTimer = 0.38;
        this._bullets.push({
          x: o.x + 6,
          y: o.y,
          vx: BULLET_SPEED * 0.82,
          vy: 0,
          r: BULLET_HIT_R * 0.7,
          life: 1.1,
          fromOption: true,
        });
      }

      // Cull if too far or player dead
      if (!p.alive || o.x < -30) {
        this._options.splice(i, 1);
      }
    }
  }

  _updateSwarm(dt) {
    // Pass 8 SWARM: while active, periodically spawn aggressive mini parasites that hunt (reuse parasite type with isSwarm flag)
    if (this._swarmTimer <= 0) return;
    // simple periodic spawns (3-4 total feel, not spammy)
    if (Math.random() < 0.18 * dt * 12) {
      const count = 1 + (this._overchargeTimer > 0 ? 1 : 0);
      for (let s = 0; s < count; s++) {
        this._enemies.push({
          id: Math.random() * 99999 | 0,
          x: this._player.x - 15 - s * 6,
          y: this._player.y + (s - 0.5) * 10,
          vx: -70,
          vy: (Math.random() - 0.5) * 55,
          hp: 1,
          points: 22,
          r: 4.2,
          type: 'parasite',
          isSwarm: true,
        });
      }
    }
  }

  _checkGraze(dt) {
    // Small bonus + visual for near-misses (gives "point" and skill feel)
    // Focus (pass 6) greatly increases graze window for precision play
    if (!this._player.alive || this._player.invuln > 0) return;
    const now = this._time;
    if (now - this._lastGrazeTime < 0.12) return;

    const px = this._player.x;
    const py = this._player.y;
    const focusMul = (this._focusTimer > 0) ? 0.62 : 1.0;
    const pHit = PLAYER_HIT_R * focusMul;
    let grazed = false;

    for (const e of this._enemies) {
      const er = (e.r || ENEMY_BASE_R) * 1.65;
      const dx = e.x - px;
      const dy = e.y - py;
      const dist2 = dx * dx + dy * dy;
      if (dist2 > (pHit + 3) * (pHit + 3) && dist2 < er * er) {
        grazed = true;
        break;
      }
    }

    if (!grazed) {
      for (const b of this._enemyBullets) {
        const br = b.r || 3.5;
        const dx = b.x - px;
        const dy = b.y - py;
        const dist2 = dx * dx + dy * dy;
        const grazeRadius = (this._focusTimer > 0) ? 26 : 18;
        if (dist2 > (pHit + 2) * (pHit + 2) && dist2 < (br + grazeRadius) * (br + grazeRadius)) {
          grazed = true;
          break;
        }
      }
    }

    if (grazed) {
      this._lastGrazeTime = now;
      this._grazeCount = (this._grazeCount || 0) + 1;
      const grazeScore = (this._focusTimer > 0) ? 9 : 5;
      this.score += grazeScore;
      this._pulseCharge = Math.min(100, (this._pulseCharge || 0) + 3);
      this._createHitParticle(px + 12 + Math.random() * 6, py + (Math.random() - 0.5) * 8);
    }
  }

  _onLevelUp() {
    // Juice on level up
    this._shake = Math.max(this._shake || 0, 6);
    for (let i = 0; i < 14; i++) {
      const ang = Math.random() * Math.PI * 2;
      this._particles.push({
        x: this._player.x + 10,
        y: this._player.y,
        vx: Math.cos(ang) * (40 + Math.random() * 50),
        vy: Math.sin(ang) * (40 + Math.random() * 50),
        life: 0.5 + Math.random() * 0.3,
        size: 2.2,
        color: (i % 2 === 0) ? CYAN : VIOLET,
      });
    }
  }
}
