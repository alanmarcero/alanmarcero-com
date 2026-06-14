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
    this.assets = {};
    this.assetsLoaded = false;
    this._loadAssets();
  }

  // Loop pass 5: Fresh Grok Imagine assets (homing, parasite, overcharge aura, core burst), 
  // HOMING + OVERCHARGE powerups, PARASITE enemy, elite variants, chain scoring, survival bonuses,
  // precision center-hit damage, stronger auras/flashes, improved alpha keying feedback.
  // Collision feel, sprite cleanliness, and meaningful progression/power/point all pushed harder.

  _loadAssets() {
    // Assets from Grok Imagine + previous. All main sprites get alpha keying (dark pixels -> transparent).
    const assetList = [
      ['player', '/assets/arcade/life-pulse/player-ship.jpg'],
      ['boss', '/assets/arcade/life-pulse/boss.jpg'],
      ['drone', '/assets/arcade/life-pulse/enemy-drone.jpg'],
      ['turret', '/assets/arcade/life-pulse/enemy-turret.jpg'],
      ['growth', '/assets/arcade/life-pulse/growth-pulse-1.jpg'],
      ['spiker', '/assets/arcade/life-pulse/enemy-spiker.jpg'],
      ['tendril', '/assets/arcade/life-pulse/enemy-tendril.jpg'],
      ['parasite', '/assets/arcade/life-pulse/enemy-parasite.jpg'],
      ['powerDouble', '/assets/arcade/life-pulse/powerup-double.jpg'],
      ['powerShield', '/assets/arcade/life-pulse/powerup-shield.jpg'],
      ['powerLaser', '/assets/arcade/life-pulse/powerup-laser.jpg'],
      ['powerHoming', '/assets/arcade/life-pulse/powerup-homing.jpg'],
      ['powerNova', '/assets/arcade/life-pulse/powerup-nova.jpg'],
      ['powerFocus', '/assets/arcade/life-pulse/powerup-focus.jpg'],
      ['option', '/assets/arcade/life-pulse/option-drone.jpg'],
      ['option-upgraded', '/assets/arcade/life-pulse/option-upgraded.jpg'],
      ['player-powered1', '/assets/arcade/life-pulse/player-powered1.jpg'],
      ['player-powered-spread', '/assets/arcade/life-pulse/player-powered-spread.jpg'],
      ['player-overdrive', '/assets/arcade/life-pulse/player-overdrive.jpg'],
      ['player-overcharge', '/assets/arcade/life-pulse/player-overcharge.jpg'],
      ['player-thruster-1', '/assets/arcade/life-pulse/player-thruster-1.jpg'],
      ['explosion-1', '/assets/arcade/life-pulse/explosion-1.jpg'],
      ['explosion-2', '/assets/arcade/life-pulse/explosion-2.jpg'],
      ['explosion-3', '/assets/arcade/life-pulse/explosion-3.jpg'],
      ['explosion-core', '/assets/arcade/life-pulse/explosion-core.jpg'],
      ['explosion-chain', '/assets/arcade/life-pulse/explosion-chain.jpg'],
      ['bossCore', '/assets/arcade/life-pulse/boss-core.jpg'],
      ['weakpoint', '/assets/arcade/life-pulse/weakpoint-highlight.jpg'],
      ['parasite-swarm', '/assets/arcade/life-pulse/enemy-parasite-swarm.jpg'],
      ['background', '/assets/arcade/life-pulse/background.jpg'],
      ['background-layer2', '/assets/arcade/life-pulse/background-layer2.jpg'],
    ];

    const spriteKeys = new Set([
      'player','boss','drone','turret','growth','spiker','tendril','parasite','parasite-swarm',
      'powerDouble','powerShield','powerLaser','powerHoming','powerNova','powerFocus','option','option-upgraded',
      'player-powered1','player-powered-spread','player-overdrive','player-overcharge','player-thruster-1',
      'explosion-1','explosion-2','explosion-3','explosion-core','explosion-chain','bossCore','weakpoint'
    ]);

    let loaded = 0;
    const total = assetList.length;

    assetList.forEach(([key, src]) => {
      const img = new Image();
      img.onload = () => {
        loaded++;
        if (spriteKeys.has(key)) {
          this.assets[key] = this._createAlphaKeyedImage(img);
        } else {
          this.assets[key] = img;
        }
        if (loaded === total) this.assetsLoaded = true;
      };
      img.src = src;
      // temporary placeholder so render checks pass during load
      this.assets[key] = img;
    });
  }

  _createAlphaKeyedImage(sourceImg) {
    // Pass 6: Even stronger alpha keying for Grok Imagine JPGs.
    // Adaptive luminosity + extra edge softening + slight morphological clean to eliminate white boxes.
    if (!sourceImg || !sourceImg.complete) return sourceImg;
    const w = sourceImg.naturalWidth || sourceImg.width;
    const h = sourceImg.naturalHeight || sourceImg.height;
    if (!w || !h) return sourceImg;

    if (typeof document === 'undefined' || !document.createElement) {
      return sourceImg;
    }

    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const cx = c.getContext('2d', { willReadFrequently: true });
    cx.drawImage(sourceImg, 0, 0, w, h);

    const imageData = cx.getImageData(0, 0, w, h);
    const d = imageData.data;
    const hard = 26;
    const soft = 52;

    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i+1], b = d[i+2];
      const lum = 0.299*r + 0.587*g + 0.114*b;

      if (lum < hard) {
        d[i+3] = 0;
      } else if (lum < soft) {
        const f = (lum - hard) / (soft - hard);
        d[i+3] = Math.floor(255 * f * f * f); // stronger curve for cleaner cut
      }
    }
    cx.putImageData(imageData, 0, 0);

    const out = new Image();
    out.src = c.toDataURL('image/png');
    return out;
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
    this._maxCombo = 0;
    this._gameStartTime = this._time;
    this._kills = 0;

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
    this._updateOptions(dt);
    this._updateCombo(dt);
    this._checkGraze(dt);

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
    this._difficulty = Math.min(4.2, 1.0 + (this.level - 1) * 0.55 + this.score / 18500);

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
    let fireRate = this._powerLevel >= 1 ? 0.058 : baseRate;
    if (this._overchargeTimer > 0) fireRate = 0.038; // pass 5 overcharge = very fast
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

    const speed = isLaser ? BULLET_SPEED * 1.15 : BULLET_SPEED;
    const life = isLaser ? 2.2 : 1.65;
    const r = isLaser ? BULLET_HIT_R * 1.1 : BULLET_HIT_R;

    // Center shot (piercing when laser active)
    const doHoming = (this._homingTimer > 0 || this._overchargeTimer > 0);
    this._bullets.push({
      x: baseX, y: baseY,
      vx: speed, vy: 0,
      r,
      life,
      pierce: isLaser,
      laser: isLaser,
      homing: doHoming,
    });

    if (this._powerLevel >= 1) {
      const spread = (this._powerLevel >= 2) ? 11 : 7;
      const spreadSpeedY = (this._powerLevel >= 2) ? 38 : 22;
      this._bullets.push({
        x: baseX - 1, y: baseY - spread,
        vx: speed * 0.98, vy: -spreadSpeedY,
        r: r * 0.9,
        life: isLaser ? 1.8 : 1.35,
        pierce: isLaser,
        laser: isLaser,
        homing: (this._homingTimer > 0 || this._overchargeTimer > 0),
      });
      this._bullets.push({
        x: baseX - 1, y: baseY + spread,
        vx: speed * 0.98, vy: spreadSpeedY,
        r: r * 0.9,
        life: isLaser ? 1.8 : 1.35,
        pierce: isLaser,
        laser: isLaser,
        homing: (this._homingTimer > 0 || this._overchargeTimer > 0),
      });
    }
  }

  _firePulseBomb(fromStock = false) {
    const p = this._player;
    // Launch a slow, pulsing "Life Pulse" projectile
    const life = fromStock ? 0.82 : 0.72;
    const r = fromStock ? 8.5 : 7.5;
    this._pulses.push({
      x: p.x + 10,
      y: p.y,
      vx: 195,
      vy: (Math.random() - 0.5) * 12,
      r,
      life,
      detonated: false,
      boosted: fromStock,
    });
    // Small launch effect
    this._createHitParticle(p.x + 14, p.y);
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
        const gained = Math.floor((e.points || 70) * comboMul);
        this.score += gained;
        this._combo = Math.min(12, this._combo + 1);
        this._comboTimer = 1.9;
        this._kills = (this._kills || 0) + 1;
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
    const radius = pulse.boosted ? 95 : 78;
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
      } else if (roll < 0.82) {
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
      } else if (roll < 0.90) {
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
        // Parasite (pass 5): small fast chaser, annoying, targets player/options, from new Imagine asset
        this._enemies.push({
          id: Math.random() * 99999 | 0,
          x: GAME_W + 12, y,
          vx: -ENEMY_SPEED * (1.9 + d * 0.1),
          vy: (Math.random() - 0.5) * 30,
          hp: 1,
          points: 80,
          r: ENEMY_BASE_R * 0.65,
          type: 'parasite',
          targetOption: Math.random() < 0.4,
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

    // More generous + varied powerups (the original complaint) - pass 6 adds nova (big clear) and focus (precision)
    if (Math.random() < 0.025) {
      const r = Math.random();
      let type = 'double';
      if (r < 0.13) type = 'shield';
      else if (r < 0.24) type = 'speed';
      else if (r < 0.36) type = 'pulse';
      else if (r < 0.46) type = 'option';
      else if (r < 0.55) type = 'laser';
      else if (r < 0.64) type = 'bomb';
      else if (r < 0.72) type = 'homing';
      else if (r < 0.80) type = 'overcharge';
      else if (r < 0.87) type = 'nova';
      else if (r < 0.93) type = 'focus';
      else if (this.level >= 2) type = 'double';

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
          let dmg = b.laser ? 2 : 1;
          // Pass 5: center hit bonus (precision feels good, addresses "hit collision" complaint)
          const centerDist = Math.sqrt(dx * dx + dy * dy);
          if (centerDist < er * 0.45) {
            dmg += 1;
            this.score += 8; // small precision bonus
            this._shake = Math.max(this._shake || 0, 2.5); // hitstop feel for precision
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

    // Enemy bullets vs player (fair circle hit on core) - focus shrinks hitbox for better collision feel
    const focusMul = (this._focusTimer > 0) ? 0.62 : 1.0;
    const playerHitR = PLAYER_HIT_R * focusMul;

    if (this._player.alive && this._player.invuln <= 0) {
      for (let i = this._enemyBullets.length - 1; i >= 0; i--) {
        const b = this._enemyBullets[i];
        const br = b.r || 3;
        const dx = b.x - this._player.x;
        const dy = b.y - this._player.y;
        if (dx * dx + dy * dy < (br + playerHitR) * (br + playerHitR)) {
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
        if (dx * dx + dy * dy < (er + playerHitR) * (er + playerHitR)) {
          this._hitPlayer();
          e.hp = 0;
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
      this._saveHighScore(this.score);
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
      // Spawn a companion drone (classic powerup fantasy)
      if (this._options.length < 2) {
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

    // === PLAYER (use Grok Imagine art when available + procedural overlays) ===
    if (this._player.alive) {
      const p = this._player;
      const flicker = p.invuln > 0 ? ((Math.floor(this._time * 18) % 2) === 0 ? 0.42 : 1) : 1;
      ctx.globalAlpha = flicker;

      const px = p.x;
      const py = p.y;
      const power = this._powerLevel;
      const boosted = p.speedTimer > 0;

      // Choose the best player sprite from new Grok Imagine assets (pass 4: prefer overdrive when laser active)
      let playerImg = this.assets.player;
      let pw = 32, ph = 20;

      const useOverdrive = this._laserTimer > 0 || power >= 2;
      const useOvercharge = this._overchargeTimer > 0;
      if (useOvercharge && this.assets['player-overcharge'] && this.assets['player-overcharge'].complete) {
        playerImg = this.assets['player-overcharge'];
        pw = 40; ph = 25;
      } else if (useOverdrive && this.assets['player-overdrive'] && this.assets['player-overdrive'].complete) {
        playerImg = this.assets['player-overdrive'];
        pw = 37; ph = 23;
      } else if (power >= 2 && this.assets['player-powered-spread'] && this.assets['player-powered-spread'].complete) {
        playerImg = this.assets['player-powered-spread'];
        pw = 36; ph = 22;
      } else if (power >= 1 && this.assets['player-powered1'] && this.assets['player-powered1'].complete) {
        playerImg = this.assets['player-powered1'];
        pw = 34; ph = 21;
      }

      if (playerImg && playerImg.complete) {
        ctx.drawImage(playerImg, px - pw / 2, py - ph / 2, pw, ph);
      } else {
        // High quality procedural fallback (from previous pass)
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
      }

      // Grok Imagine thruster or procedural animated flame
      const thrusterImg = this.assets['player-thruster-1'];
      const tPhase = (this._time * 11) % 1;
      if (thrusterImg && thrusterImg.complete) {
        const tw = 14 + Math.sin(this._time * 22) * 2;
        ctx.drawImage(thrusterImg, px - 20, py - 6, tw, 12);
      } else {
        // Fallback thruster flame
        const tLen = 5.5 + Math.sin(this._time * 19) * 1.8 + tPhase * 2.2;
        ctx.fillStyle = ORANGE;
        ctx.beginPath();
        ctx.moveTo(px - 10, py - 2.5);
        ctx.lineTo(px - 10 - tLen, py);
        ctx.lineTo(px - 10, py + 2.5);
        ctx.closePath();
        ctx.fill();
      }

      // Extra speed lines when boosted (procedural juice)
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

      // Pass 5: strong power aura when overcharge (using new art + procedural rings)
      if (this._overchargeTimer > 0) {
        ctx.strokeStyle = 'rgba(160, 255, 240, 0.55)';
        ctx.lineWidth = 2.5;
        const auraR = 18 + Math.sin(this._time * 11) * 3;
        ctx.beginPath();
        ctx.arc(px + 1, py, auraR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 220, 120, 0.35)';
        ctx.beginPath();
        ctx.arc(px + 1, py, auraR * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
      }

      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
    }

    // === PLAYER BULLETS (bio energy) - pass 4 laser = long piercing bright beams ===
    for (const b of this._bullets) {
      if (b.laser) {
        ctx.fillStyle = '#a0fff4';
        const len = (b.vy === 0) ? 26 : 18;
        ctx.fillRect(b.x - 1.2, b.y - 1.6, len, 3.2);
        ctx.fillStyle = WHITE;
        ctx.fillRect(b.x + 8, b.y - 0.9, 6, 1.8);
      } else {
        ctx.fillStyle = CYAN;
        const len = (b.vy === 0) ? 7.5 : 5.5;
        ctx.fillRect(b.x - 1.5, b.y - 1.2, len, 2.4);
        // small bright head
        ctx.fillStyle = WHITE;
        ctx.fillRect(b.x + 4, b.y - 0.7, 2.5, 1.4);
      }
    }
    ctx.fillStyle = CYAN;

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

    // === ENEMIES (Grok Imagine sprites + procedural accents for life) ===
    for (const e of this._enemies) {
      const ex = e.x;
      const ey = e.y;
      const er = e.r || ENEMY_BASE_R;
      const pulse = Math.sin(this._time * 5.5 + (e.id || 0)) * 0.5 + 1;

      let usedImage = false;

      if (e.type === 'turret') {
        const img = this.assets.turret;
        if (img && img.complete) {
          ctx.drawImage(img, ex - er * 1.1, ey - er * 0.85, er * 2.2, er * 1.7);
          usedImage = true;
        }
      } else if (e.type === 'growth') {
        const img = this.assets.growth;
        if (img && img.complete) {
          const pScale = 0.9 + (pulse - 0.5) * 0.18;
          ctx.drawImage(img, ex - er * pScale, ey - er * pScale, er * 2 * pScale, er * 2 * pScale);
          usedImage = true;
        }
      } else if (e.type === 'spiker') {
        const img = this.assets.spiker;
        if (img && img.complete) {
          const s = 0.92;
          ctx.drawImage(img, ex - er * 1.05 * s, ey - er * s, er * 2.1 * s, er * 2 * s);
          usedImage = true;
        }
      } else if (e.type === 'tendril') {
        const img = this.assets.tendril;
        if (img && img.complete) {
          const s = 1.15;
          ctx.drawImage(img, ex - er * 1.3 * s, ey - er * 0.7 * s, er * 2.6 * s, er * 1.4 * s);
          usedImage = true;
        }
      } else if (e.type === 'parasite') {
        const img = this.assets['parasite-swarm'] || this.assets.parasite;
        if (img && img.complete) {
          const s = 0.85;
          ctx.drawImage(img, ex - er * 1.1 * s, ey - er * 1.1 * s, er * 2.2 * s, er * 2.2 * s);
          usedImage = true;
        }
      } else {
        // drone / swooper
        const img = this.assets.drone;
        if (img && img.complete) {
          const s = (e.type === 'swooper') ? 0.95 : 1.05;
          ctx.drawImage(img, ex - er * s, ey - er * s, er * 2 * s, er * 2 * s);
          usedImage = true;
        }
      }

      if (!usedImage) {
        // Strong procedural fallback (detailed biological style)
        if (e.type === 'turret') {
          ctx.fillStyle = VIOLET;
          ctx.fillRect(ex - er * 0.9, ey - er * 0.65, er * 1.85, er * 1.3);
          ctx.fillStyle = '#3a2a4a';
          ctx.fillRect(ex - er * 0.55, ey - er * 0.35, er * 1.1, er * 0.7);
          ctx.fillStyle = ORANGE;
          ctx.beginPath();
          ctx.arc(ex - 2, ey, 3.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.type === 'growth') {
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
          ctx.fillStyle = VIOLET;
          ctx.beginPath();
          ctx.arc(ex - 3, ey - 2, 3.5 * pScale, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = (e.type === 'swooper') ? '#7dd4ff' : CYAN;
          ctx.beginPath();
          ctx.arc(ex, ey, er * (e.type === 'swooper' ? 0.95 : 1), 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = WHITE;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(ex, ey, er * 0.62, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Damage flash (pass 4 visual feedback - makes hits feel much better)
      if (e.lastHit && (this._time - e.lastHit) < 0.12) {
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = WHITE;
        ctx.beginPath();
        ctx.arc(ex, ey, er * 1.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Elite glow (pass 5 - high level threats stand out, better progression feel)
      if (e.elite) {
        ctx.strokeStyle = 'rgba(255, 140, 60, 0.65)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(ex, ey, er * 1.35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
      }

      // Weakpoint highlight (pass 6) on certain biological enemies for clear "aim here" feedback
      if ((e.type === 'growth' || e.type === 'tendril') && this.assets.weakpoint && this.assets.weakpoint.complete) {
        const w = 12;
        ctx.drawImage(this.assets.weakpoint, ex - w/2, ey - w/2, w, w);
      }
    }

    // === BOSS (Grok Imagine detailed boss + animated procedural overlays) ===
    if (this._boss) {
      const b = this._boss;
      const bx = b.x;
      const by = b.y;
      const hpRatio = Math.max(0.2, b.hp / b.maxHp);

      const bossImg = this.assets.boss;
      if (bossImg && bossImg.complete) {
        const bw = 78;
        const bh = 58;
        ctx.drawImage(bossImg, bx - bw / 2, by - bh / 2, bw, bh);
      } else {
        // Detailed procedural fallback
        ctx.fillStyle = VIOLET;
        ctx.beginPath();
        ctx.ellipse(bx, by, 29, 21, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Pass 4: Draw vulnerable core (new Grok Imagine asset) - makes the "weak point" visually obvious and rewarding
      const coreImg = this.assets.bossCore;
      if (coreImg && coreImg.complete) {
        const cw = 22 + Math.sin(this._time * 5) * 2;
        const ch = 18 + Math.sin(this._time * 4.2) * 1.5;
        ctx.drawImage(coreImg, bx - cw / 2 + 3, by - ch / 2 - 1, cw, ch);
      }

      // Always add juicy animated elements on top (hearts, eyes, tendrils) for life
      const heartPulse = 3.5 + Math.sin(this._time * 3.8) * 1.3;
      ctx.fillStyle = ORANGE;
      ctx.beginPath();
      ctx.arc(bx - 7, by - 5, heartPulse, 0, Math.PI * 2);
      ctx.arc(bx + 8, by + 4, heartPulse * 0.85, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.arc(bx - 12, by - 7, 2.8, 0, Math.PI * 2);
      ctx.arc(bx + 11, by - 8, 2.4, 0, Math.PI * 2);
      ctx.arc(bx - 2, by + 9, 2.1, 0, Math.PI * 2);
      ctx.fill();

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

    // === POWERUPS (Grok Imagine icons + nice procedural variety) ===
    for (const p of this._powerups) {
      const px = p.x;
      const py = p.y;
      const bob = Math.sin(p.life * 4) * 1.5;

      const doubleImg = this.assets.powerDouble;
      const shieldImg = this.assets.powerShield;
      if (p.type === 'double' && doubleImg && doubleImg.complete) {
        ctx.drawImage(doubleImg, px - 8, py + bob - 8, 16, 16);
      } else if (p.type === 'double') {
        ctx.fillStyle = '#ffe66b';
        ctx.beginPath();
        ctx.arc(px - 3.5, py + bob, 4.8, 0, Math.PI * 2);
        ctx.arc(px + 4, py + bob, 4.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'shield' && shieldImg && shieldImg.complete) {
        ctx.drawImage(shieldImg, px - 8, py + bob - 8, 16, 16);
      } else if (p.type === 'shield') {
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
      } else if (p.type === 'option') {
        const optImg = this.assets.option;
        if (optImg && optImg.complete) {
          ctx.drawImage(optImg, px - 7, py + bob - 7, 14, 14);
        } else {
          ctx.fillStyle = CYAN;
          ctx.beginPath();
          ctx.arc(px, py + bob, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (p.type === 'laser') {
        const laserImg = this.assets.powerLaser;
        if (laserImg && laserImg.complete) {
          ctx.drawImage(laserImg, px - 8, py + bob - 8, 16, 16);
        } else {
          ctx.fillStyle = '#7cffe0';
          ctx.fillRect(px - 6, py + bob - 2, 12, 4);
          ctx.fillStyle = WHITE;
          ctx.fillRect(px - 2, py + bob - 1, 4, 2);
        }
      } else if (p.type === 'bomb') {
        // Bomb stock powerup - use a strong pulsing ring + core
        const pr = 5 + Math.sin(this._time * 9) * 1.3;
        ctx.strokeStyle = ORANGE;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(px, py + bob, pr, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = VIOLET;
        ctx.beginPath();
        ctx.arc(px, py + bob, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1;
      } else if (p.type === 'homing') {
        const hImg = this.assets.powerHoming;
        if (hImg && hImg.complete) {
          ctx.drawImage(hImg, px - 8, py + bob - 8, 16, 16);
        } else {
          ctx.fillStyle = '#ffeb3b';
          ctx.beginPath();
          ctx.arc(px, py + bob, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = CYAN;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(px, py + bob, 7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.lineWidth = 1;
        }
      } else if (p.type === 'overcharge') {
        const oImg = this.assets['player-overcharge'];
        if (oImg && oImg.complete) {
          ctx.drawImage(oImg, px - 9, py + bob - 9, 18, 18);
        } else {
          ctx.fillStyle = '#a0fff4';
          ctx.beginPath();
          ctx.arc(px, py + bob, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = WHITE;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py + bob, 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.lineWidth = 1;
        }
      } else if (p.type === 'nova') {
        const nImg = this.assets.powerNova;
        if (nImg && nImg.complete) {
          const s = 8 + Math.sin(this._time * 12) * 1.5;
          ctx.drawImage(nImg, px - s, py + bob - s, s*2, s*2);
        } else {
          ctx.fillStyle = '#ffeb3b';
          ctx.beginPath();
          ctx.arc(px, py + bob, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = ORANGE;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(px, py + bob, 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.lineWidth = 1;
        }
      } else if (p.type === 'focus') {
        const fImg = this.assets.powerFocus;
        if (fImg && fImg.complete) {
          ctx.drawImage(fImg, px - 8, py + bob - 8, 16, 16);
        } else {
          ctx.strokeStyle = '#7cffe0';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py + bob, 7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(px - 5, py + bob);
          ctx.lineTo(px + 5, py + bob);
          ctx.moveTo(px, py + bob - 5);
          ctx.lineTo(px, py + bob + 5);
          ctx.stroke();
          ctx.lineWidth = 1;
        }
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

    // === EXPLOSIONS (Grok Imagine explosion + expanding rings) ===
    for (const ex of this._explosions) {
      const prog = ex.age / ex.duration;
      const rad = (ex.size || 18) * (0.6 + prog * 1.35);
      const alpha = Math.max(0.12, 1 - prog * 1.05);

      // Pass 4: use up to 3 explosion frames from Grok Imagine for richer blasts
      let frameKey = 'explosion-1';
      if (prog > 0.66) frameKey = 'explosion-3';
      else if (prog > 0.33) frameKey = 'explosion-2';
      let expImg = this.assets[frameKey] || this.assets['explosion-1'];
      // Pass 5: use special core burst for big boss-style explosions
      if ((ex.size || 18) > 45 && this.assets['explosion-core'] && this.assets['explosion-core'].complete) {
        expImg = this.assets['explosion-core'];
      }
      if (expImg && expImg.complete) {
        const imgSize = 28 + prog * 36;
        ctx.globalAlpha = Math.max(0.3, alpha);
        ctx.drawImage(expImg, ex.x - imgSize / 2, ex.y - imgSize / 2, imgSize, imgSize);
      }

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

    // === OPTION DRONES (Grok Imagine + upgraded art for progression feel) ===
    for (const o of this._options) {
      const img = this.assets['option-upgraded'] || this.assets.option;
      const ow = 12, oh = 10;
      if (img && img.complete) {
        ctx.drawImage(img, o.x - ow / 2, o.y - oh / 2, ow, oh);
      } else {
        ctx.fillStyle = CYAN;
        ctx.beginPath();
        ctx.arc(o.x, o.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
      // subtle companion glow
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(o.x + 1, o.y, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    // === COMBO + HIGH SCORE (gives "point" and feedback) ===
    if (this._combo > 1) {
      const comboAlpha = Math.min(1, this._comboTimer / 0.6 + 0.3);
      ctx.globalAlpha = comboAlpha;
      ctx.fillStyle = this._combo > 6 ? VIOLET : ORANGE;
      ctx.font = 'bold 11px "Space Grotesk", sans-serif';
      ctx.fillText('COMBO x' + this._combo, 18, 22);
      ctx.globalAlpha = 1;
    }

    // Persistent high score (top right)
    if (this._highScore > 0) {
      ctx.fillStyle = 'rgba(160, 158, 180, 0.7)';
      ctx.font = '10px "Inter", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('HI ' + this._highScore, GAME_W - 10, 16);
      ctx.textAlign = 'left';
    }

    // Pass 6 end-run stats for "point" (visible when dead, inside the game area)
    if (this.gameOver) {
      const elapsed = Math.max(0, this._time - (this._gameStartTime || this._time));
      ctx.fillStyle = 'rgba(200, 198, 220, 0.85)';
      ctx.font = 'bold 9px "Inter", sans-serif';
      ctx.textAlign = 'center';
      const statsY = GAME_H - 18;
      const stats = `TIME ${elapsed.toFixed(0)}s  •  KILLS ${this._kills || 0}  •  MAX COMBO x${this._maxCombo || 0}`;
      ctx.fillText(stats, GAME_W / 2, statsY);
      ctx.textAlign = 'left';
    }

    ctx.restore();
  }

  _drawBackground(ctx) {
    // Use Grok Imagine generated biological nebula backgrounds with parallax
    const bg1 = this.assets.background;
    const bg2 = this.assets['background-layer2'];

    if (bg1 && bg1.complete) {
      const scroll1 = (this._scroll * 11) % GAME_W;
      ctx.globalAlpha = 0.95;
      ctx.drawImage(bg1, -scroll1, 0, GAME_W, GAME_H);
      ctx.drawImage(bg1, GAME_W - scroll1, 0, GAME_W, GAME_H);
      ctx.globalAlpha = 1;
    } else {
      // Fallback procedural distant veins
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
    }

    if (bg2 && bg2.complete) {
      ctx.globalAlpha = 0.6;
      const scroll2 = (this._scroll * 27) % GAME_W;
      ctx.drawImage(bg2, -scroll2, 0, GAME_W, GAME_H);
      ctx.drawImage(bg2, GAME_W - scroll2, 0, GAME_W, GAME_H);
      ctx.globalAlpha = 1;
    } else {
      // Pulsing cells + mid layer fallback
      ctx.fillStyle = 'rgba(120, 200, 255, 0.09)';
      for (let i = 0; i < 22; i++) {
        const x = ((i * 29 + this._scroll * 0.18) % (GAME_W + 50)) - 25;
        const y = 14 + ((i * 17) % (GAME_H - 28));
        const pr = 1.6 + Math.sin(this._time * 1.3 + i) * 0.7;
        ctx.beginPath();
        ctx.arc(x, y, pr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Subtle CRT scan / flow lines on top (always)
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
    if (this._comboTimer > 0) {
      this._comboTimer -= dt;
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
      const grazeScore = (this._focusTimer > 0) ? 9 : 4;
      this.score += grazeScore;
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
