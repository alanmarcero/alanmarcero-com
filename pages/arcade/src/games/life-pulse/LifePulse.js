import { CYAN, VIOLET, ORANGE, BG, WHITE } from '../palette';
import * as R from './LifePulseRenderer';
import { emitHud } from '../gameHud';
import { letterbox } from '../frame';
import { circlesOverlap, distance } from '../geometry';

const GAME_W = R.GAME_W;
const GAME_H = R.GAME_H;

const BULLET_SPEED = 480;
const ENEMY_SPEED = 88;
const STARTING_LIVES = 3;

// Hit radii (visuals are larger; these are fair collision cores)
const PLAYER_HIT_R = 6.5;
const BULLET_HIT_R = 3.5;
const ENEMY_BASE_R = 9;
const POWERUP_R = 8;
const BOSS_HIT_R = 32;

// FOCUS shrinks the player's core, which tightens both hits and grazes.
const FOCUS_HIT_MUL = 0.62;

const HIGH_SCORE_KEY = 'lifePulseHighScore';

// Arrows and WASD both steer; the lookup key is lower-cased first.
const KEY_ACTIONS = {
  arrowleft: 'left', a: 'left',
  arrowright: 'right', d: 'right',
  arrowup: 'up', w: 'up',
  arrowdown: 'down', s: 'down',
  ' ': 'fire', spacebar: 'fire',
  x: 'secondary', shift: 'secondary',
};

const TOUCH_ALIASES = { fire2: 'secondary' };

// Timed powers that simply run down to zero each frame.
const DECAYING_TIMERS = [
  '_laserTimer', '_homingTimer', '_focusTimer', '_chainTimer',
  '_vortexTimer', '_surgeTimer', '_chargeTimer',
];

// Powerups that only extend a timer and pay out: [timer field, seconds, points].
const TIMED_POWERUPS = {
  laser: ['_laserTimer', 13.5, 210],
  homing: ['_homingTimer', 11, 165],
  focus: ['_focusTimer', 12, 150],
  chain: ['_chainTimer', 14, 175],
  vortex: ['_vortexTimer', 8, 155],
  charge: ['_chargeTimer', 1, 170],
};

// What the spawner drops, curated to 12 so each type stays readable.
const POWERUP_POOL = ['double', 'shield', 'pulse', 'option', 'laser', 'bomb', 'focus', 'nova',
  'homing', 'chain', 'vortex', 'charge'];

const RANK_BONUS = { S: 0.35, A: 0.22, B: 0.12, C: 0.05, D: 0 };

/**
 * The end-of-run rank. Combo, kills, level, grazes, perfect waves and the run
 * multiplier all push it up; a long run pulls it down slightly, so a fast
 * clean run outranks a slow one with the same numbers.
 */
export function computeGrade({ maxCombo, kills, level, elapsed, grazeCount, perfectWaves, runScoreMulti }) {
  const seconds = Math.max(1, elapsed);
  const rating = (maxCombo * 2) + (kills * 0.6) + (level * 8) + grazeCount * 0.08
    + perfectWaves * 3 + runScoreMulti * 2 - (seconds * 0.025);
  if (rating > 65) return 'S';
  if (rating > 48) return 'A';
  if (rating > 32) return 'B';
  if (rating > 18) return 'C';
  return 'D';
}

/** The share of the final score a rank adds on top of it. */
export function rankBonusMultiplier(grade) {
  return RANK_BONUS[grade] ?? 0;
}

function randomEnemyId(range = 99999) {
  return Math.random() * range | 0;
}

export class LifePulse {
  onHudUpdate = null;

  init(width, height) {
    this.resize(width, height);

    this.score = 0;
    this.lives = STARTING_LIVES;
    this.level = 1;
    this.gameOver = false;

    this._keys = {
      left: false, right: false, up: false, down: false,
      fire: false, secondary: false,
    };
    this._fireCooldown = 0;
    this._pulseCooldown = 0;

    this._player = {
      x: 110,
      y: GAME_H / 2,
      vx: 0,
      vy: 0,
      alive: true,
      invuln: 0,
    };

    this._bullets = [];
    this._enemyBullets = [];
    this._enemies = [];
    this._particles = [];
    this._explosions = [];
    this._powerups = [];
    this._pulses = [];          // Life Pulse bombs in flight
    this._pulseWaves = [];      // expanding ring visuals on detonation
    this._scorePopups = [];     // floating +N scores
    this._options = [];         // auto-firing companion drones
    this._combo = 0;
    this._comboTimer = 0;
    this._maxCombo = 0;
    this._highScore = this._loadHighScore();
    this._lastGrazeTime = 0;
    this._grazeCount = 0;
    this._kills = 0;

    this._powerLevel = 0;       // 0 = single, 1 = double, 2 = spread
    this._powerTimer = 0;
    this._laserTimer = 0;       // piercing primary fire
    this._homingTimer = 0;      // bullets seek targets
    this._focusTimer = 0;       // tighter hitbox, wider graze
    this._chainTimer = 0;       // chained kills pay more and combos decay slower
    this._vortexTimer = 0;      // pulls enemies in and amplifies kill score
    this._surgeTimer = 0;       // post-boss difficulty ramp for an endless feel
    this._chargeTimer = 0;      // next primary is one big piercing blast
    this._pulseStock = 0;       // banked boosted Life Pulses
    this._pulseCharge = 35;     // meter 0-100; full makes the next pulse boosted
    this._novaReady = false;    // one-shot screen clear on the next secondary
    this._surviveAccum = 0;

    this._maxOptions = 2;
    this._runScoreMulti = 1;
    this._runUpgrades = 0;
    this._perfectWave = true;
    this._perfectWaves = 0;
    this._damageTakenThisWave = 0;
    this._waveBanner = 0;       // "WAVE CLEAR" flash timer
    this._formationCooldown = 0;

    this._scroll = 0;
    this._spawnTimer = 0.6;
    this._difficulty = 1.0;
    this._bossActive = false;
    this._boss = null;
    this._time = 0;
    this._gameStartTime = 0;
    this._shake = 0;
    this._wave = 1;

    this._emitHud();
  }

  resize(width, height) {
    this.canvasW = width;
    this.canvasH = height;
    const { scale, offsetX, offsetY } = letterbox(width, height, GAME_W, GAME_H);
    this.scale = scale;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }

  _emitHud() {
    emitHud(this, { score: Math.floor(this.score) });
  }

  // ==================== INPUT ====================
  handleKeyDown(key) {
    if (this.gameOver) return;
    this._setControl(KEY_ACTIONS[key.toLowerCase()], true);
  }

  handleKeyUp(key) {
    this._setControl(KEY_ACTIONS[key.toLowerCase()], false);
  }

  handleTouchAction(action, active) {
    if (this.gameOver) return;
    this._setControl(TOUCH_ALIASES[action] ?? action, active);
  }

  _setControl(action, active) {
    if (!action || !Object.hasOwn(this._keys, action)) return;
    this._keys[action] = active;
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
    this._checkGraze();

    this._spawnEnemies(dt);
    this._updateBoss(dt);
    this._checkCollisions();

    this._scroll = (this._scroll + 48 * dt) % 64;

    this._updateLevel();
    this._difficulty = Math.min(5.5, 1.0 + (this.level - 1) * 0.55 + this.score / 18500 + (this._surgeTimer > 0 ? 1.4 : 0));
    this._awardSurvivalBonus(dt);

    if (this._shake > 0) this._shake *= 0.79;

    this._maybeSpawnBoss();

    this._emitHud();
  }

  _updateLevel() {
    const targetLevel = Math.min(9, 1 + Math.floor(this.score / 5200) + Math.floor(this._wave / 3));
    if (targetLevel <= this.level) return;

    this.level = targetLevel;
    const levelBonus = 180 + this.level * 35;
    this.score += levelBonus;
    this._spawnScorePopup(this._player.x + 30, this._player.y - 22, levelBonus);
    this._onLevelUp();
    this._emitHud();
  }

  // From level 3 on, staying alive pays a steady trickle.
  _awardSurvivalBonus(dt) {
    this._surviveAccum += dt;
    if (this.level < 3 || this._surviveAccum <= 22) return;
    this.score += 45 + this.level * 9;
    this._surviveAccum = 0;
  }

  _maybeSpawnBoss() {
    const bossChance = 0.009 + (this.level - 1) * 0.0018;
    if (!this._bossActive && !this._boss && this._time > 38 && Math.random() < bossChance) {
      this._spawnBoss();
    }
  }

  _updatePlayer(dt) {
    if (!this._player.alive) return;

    this._movePlayer(dt);
    this._updatePrimaryFire(dt);
    this._tickPowerTimers(dt);
    this._updateSecondaryFire(dt);

    if (this._player.invuln > 0) this._player.invuln -= dt;
  }

  _movePlayer(dt) {
    const p = this._player;

    const accel = 1680;
    const friction = 8.5;
    const maxSpeed = 290;

    let ax = 0, ay = 0;
    if (this._keys.left) ax -= 1;
    if (this._keys.right) ax += 1;
    if (this._keys.up) ay -= 1;
    if (this._keys.down) ay += 1;

    if (ax !== 0 && ay !== 0) {
      const len = Math.sqrt(ax * ax + ay * ay);
      ax /= len; ay /= len;
    }

    p.vx += ax * accel * dt;
    p.vy += ay * accel * dt;

    p.vx *= (1 - friction * dt);
    p.vy *= (1 - friction * dt);

    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (speed > maxSpeed) {
      const s = maxSpeed / speed;
      p.vx *= s;
      p.vy *= s;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // The walls bounce the ship back a little rather than pinning it.
    const leftBound = 38;
    const rightBound = GAME_W - 58;
    const top = 26;
    const bottom = GAME_H - 26;

    if (p.x < leftBound) { p.x = leftBound; p.vx *= -0.28; }
    if (p.x > rightBound) { p.x = rightBound; p.vx *= -0.28; }
    if (p.y < top) { p.y = top; p.vy *= -0.32; }
    if (p.y > bottom) { p.y = bottom; p.vy *= -0.32; }
  }

  _updatePrimaryFire(dt) {
    this._fireCooldown -= dt;
    const fireRate = this._powerLevel >= 1 ? 0.052 : 0.095;
    if (this._keys.fire && this._fireCooldown <= 0) {
      this._fireCooldown = fireRate;
      this._shoot();
    }
  }

  _tickPowerTimers(dt) {
    this._powerTimer -= dt;
    if (this._powerTimer <= 0) this._powerLevel = 0;

    for (const timer of DECAYING_TIMERS) {
      this[timer] -= dt;
      if (this[timer] <= 0) this[timer] = 0;
    }
  }

  // Secondary spends, in order of preference: an armed NOVA, a banked pulse,
  // then a plain pulse on the longest cooldown.
  _updateSecondaryFire(dt) {
    this._pulseCooldown -= dt;
    if (!this._keys.secondary || this._pulseCooldown > 0) return;

    if (this._novaReady) {
      this._novaReady = false;
      this._fireNova();
      this._pulseCooldown = 1.2;
      return;
    }
    if (this._pulseStock > 0) {
      this._pulseStock--;
      this._pulseCooldown = 0.55;
      this._firePulseBomb(true);
      return;
    }
    this._pulseCooldown = 0.95;
    this._firePulseBomb(false);
  }

  _shoot() {
    const p = this._player;
    const baseX = p.x + 13;
    const baseY = p.y;
    const isLaser = this._laserTimer > 0;
    const isCharge = this._chargeTimer > 0;
    const piercing = isLaser || isCharge;

    if (isCharge) this._chargeTimer = 0; // one charge, one big shot

    const speed = piercing ? BULLET_SPEED * 1.2 : BULLET_SPEED;
    const life = piercing ? 2.5 : 1.65;
    const r = piercing ? BULLET_HIT_R * 1.3 : BULLET_HIT_R;
    const homing = this._homingTimer > 0;

    this._bullets.push({
      x: baseX, y: baseY,
      vx: isCharge ? speed * 0.65 : speed,
      vy: 0,
      r: isCharge ? r * 1.7 : r,
      life,
      pierce: piercing,
      laser: piercing,
      homing,
      charge: isCharge,
    });

    if (this._powerLevel >= 1 && !isCharge) {
      const spread = (this._powerLevel >= 2) ? 11 : 7;
      const spreadSpeedY = (this._powerLevel >= 2) ? 38 : 22;
      for (const side of [-1, 1]) {
        this._bullets.push({
          x: baseX - 1, y: baseY + side * spread,
          vx: speed * 0.98, vy: side * spreadSpeedY,
          r: r * 0.9,
          life: isLaser ? 1.8 : 1.35,
          pierce: isLaser,
          laser: isLaser,
          homing,
        });
      }
    }
  }

  _firePulseBomb(fromStock = false) {
    const p = this._player;
    const charged = this._pulseCharge >= 100;
    const boosted = fromStock || charged;
    if (charged) this._pulseCharge = 0;

    this._pulses.push({
      x: p.x + 10,
      y: p.y,
      vx: boosted ? 220 : 195,
      vy: (Math.random() - 0.5) * 10,
      r: boosted ? 9 : 7.5,
      life: boosted ? 0.88 : 0.75,
      detonated: false,
      boosted,
    });
    this._shake = Math.max(this._shake, boosted ? 4 : 2);
    const sparkCount = boosted ? 8 : 4;
    for (let i = 0; i < sparkCount; i++) {
      const ang = (i / sparkCount) * Math.PI * 2;
      this._particles.push({
        x: p.x + 14, y: p.y,
        vx: Math.cos(ang) * 40, vy: Math.sin(ang) * 40,
        life: 0.2, maxLife: 0.2, size: 2.5, color: CYAN, glow: true, round: true,
      });
    }
  }

  // NOVA: a radial clear around the ship that also wipes nearby bullets.
  _fireNova() {
    const p = this._player;
    const radius = 140;
    this._createExplosion(p.x, p.y, 72);
    this._shake = 28;

    let cleared = 0;
    for (let j = this._enemies.length - 1; j >= 0; j--) {
      const e = this._enemies[j];
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      if (dx * dx + dy * dy < radius * radius * 1.1) {
        const reward = Math.floor((e.points || 70) * 1.8);
        this.score += reward;
        this._spawnScorePopup(e.x, e.y, reward);
        e.hp = 0;
        cleared++;
      }
    }
    for (let j = this._enemyBullets.length - 1; j >= 0; j--) {
      const b = this._enemyBullets[j];
      if (circlesOverlap(b.x, b.y, 0, p.x, p.y, radius)) {
        this._enemyBullets.splice(j, 1);
      }
    }

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
    return computeGrade({
      maxCombo: this._maxCombo,
      kills: this._kills,
      level: this.level,
      elapsed: this._time - this._gameStartTime,
      grazeCount: this._grazeCount,
      perfectWaves: this._perfectWaves,
      runScoreMulti: this._runScoreMulti,
    });
  }

  _updateBullets(dt) {
    for (let i = this._bullets.length - 1; i >= 0; i--) {
      const b = this._bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.life !== undefined) b.life -= dt;

      if (b.homing && this._enemies.length > 0) this._steerHomingBullet(b, dt);

      if ((b.life !== undefined && b.life <= 0) || b.x > GAME_W + 24) {
        this._bullets.splice(i, 1);
      }
    }
  }

  // Turn toward the nearest living enemy within range, holding a fixed speed.
  _steerHomingBullet(b, dt) {
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
    if (!nearest) return;

    const dx = nearest.x - b.x;
    const dy = nearest.y - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const turn = 180 * dt;
    b.vx += (dx / dist) * turn;
    b.vy += (dy / dist) * turn;
    const sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || 1;
    const targetSp = 420;
    b.vx = (b.vx / sp) * targetSp;
    b.vy = (b.vy / sp) * targetSp;
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

      this._steerEnemy(e, dt);

      if (e.type === 'turret' && Math.random() < 0.021 * this._difficulty) {
        this._enemyShoot(e);
      }

      if (e.x < -48) {
        this._enemies.splice(i, 1);
        continue;
      }

      if ((e.hp || 0) <= 0) {
        this._killEnemy(e);
        this._enemies.splice(i, 1);
      }
    }
  }

  _steerEnemy(e, dt) {
    if (e.type === 'swooper') {
      e.vy = Math.sin(this._time * 3.8 + e.y * 0.09) * 72;
    }
    if (e.type === 'growth') {
      e.vy = Math.sin(this._time * 2.2 + e.id * 0.7) * 18;
    }
    if (e.type === 'tendril' && e.weave) {
      // A slow, drag-damped weave that is hard to predict.
      e.vy = Math.sin(this._time * 1.6 + (e.id || 0)) * (38 * Math.abs(e.weave));
      e.vx *= 0.985;
    }
    if (e.type === 'parasite') {
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
      const dx = this._player.x - e.x;
      const dy = this._player.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const pull = 95;
      e.vx += (dx / dist) * pull * dt * 8;
      e.vy += (dy / dist) * pull * dt * 8;
      // Enemies held close in the vortex are worth more when killed.
      if (dist < 80) e.vortexAmp = (e.vortexAmp || 1) + dt * 0.8;
    }
    if (e.type === 'tendril-parasite' && e.whip !== undefined) {
      e.vy = Math.sin(this._time * 3.5 + (e.id || 0)) * (55 * e.whip);
    }
  }

  _killEnemy(e) {
    const size = e.r || e.size || 13;
    this._createExplosion(e.x, e.y, size * 1.15);
    const gained = this._killReward(e);
    this.score += gained;
    this._combo = Math.min(12, this._combo + 1);
    this._comboTimer = 1.9;
    this._kills += 1;
    this._pulseCharge = Math.min(100, this._pulseCharge + 9);
    this._spawnScorePopup(e.x, e.y - 6, gained);

    if (e.split) this._spawnSplitDrones(e);
    if (e.isQueen) this._spawnQueenBrood(e);
  }

  _killReward(e) {
    const comboMul = 1 + Math.min(4, Math.floor(this._combo / 3)) * 0.2;
    let gained = Math.floor((e.points || 70) * comboMul);
    if (this._chainTimer > 0) {
      gained = Math.floor(gained * 1.6);
      this._combo = Math.min(15, this._combo + 1);
    }
    if (e.vortexAmp && e.vortexAmp > 1) {
      gained = Math.floor(gained * Math.min(2.2, 1 + e.vortexAmp * 0.4));
    }
    return Math.floor(gained * this._runScoreMulti);
  }

  // Growths split into two drones when they die.
  _spawnSplitDrones(e) {
    for (let s = 0; s < 2; s++) {
      this._enemies.push({
        id: randomEnemyId(9999),
        x: e.x + (Math.random() - 0.5) * 13,
        y: e.y + (Math.random() - 0.5) * 13,
        vx: -ENEMY_SPEED * (0.82 + Math.random() * 0.38),
        vy: (Math.random() - 0.5) * 48,
        hp: 1,
        points: 45,
        r: ENEMY_BASE_R * 0.72,
        type: 'drone',
      });
    }
  }

  // A parasite queen bursts into a swarm of four.
  _spawnQueenBrood(e) {
    for (let s = 0; s < 4; s++) {
      this._enemies.push({
        id: randomEnemyId(),
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

  _enemyShoot(e) {
    const dx = this._player.x - e.x;
    const dy = this._player.y - e.y;
    const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));

    const speed = 130 + this._difficulty * 16;
    this._enemyBullets.push({
      x: e.x,
      y: e.y,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      r: 3.2,
      life: 3.2,
    });

    // A muzzle flash telegraphs turret fire so it can be dodged.
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
      pulse.vy *= 0.985;

      if (pulse.life <= 0 || pulse.x > GAME_W + 30) {
        this._detonatePulse(pulse);
        this._pulses.splice(i, 1);
      }
    }
  }

  // A radial blast that damages every enemy and the boss inside its radius.
  _detonatePulse(pulse) {
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

    for (let j = this._enemies.length - 1; j >= 0; j--) {
      const e = this._enemies[j];
      if (circlesOverlap(e.x, e.y, e.r || 10, pulse.x, pulse.y, radius)) {
        e.hp = (e.hp || 1) - baseDmg;
        this._createHitParticle(e.x, e.y);
        if ((e.hp || 0) <= 0) {
          const reward = (e.points || 70) * 0.6 | 0;
          this.score += reward;
          this._spawnScorePopup(e.x, e.y, reward);
        }
      }
    }

    if (this._boss && circlesOverlap(this._boss.x, this._boss.y, BOSS_HIT_R, pulse.x, pulse.y, radius)) {
      this._boss.hp -= bossDmg;
      this._createHitParticle(this._boss.x, this._boss.y);
      if (this._boss.hp <= 0) {
        this._defeatBoss({
          explosionSize: pulse.boosted ? 64 : 58,
          killScore: pulse.boosted ? 1250 : 920,
          popupLift: 10,
          shake: 24,
          perfectBurst: false,
        });
      }
    }

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

  /**
   * A boss kill ends the wave: kill and clear bonuses, and the run's
   * between-wave upgrades — a banked pulse every other boss, SURGE, one more
   * option slot, a slightly higher score multiplier, and a perfect-wave bonus
   * if no damage was taken since the last one.
   */
  _defeatBoss({ explosionSize, killScore, popupLift, shake, perfectBurst }) {
    const boss = this._boss;
    this._createExplosion(boss.x, boss.y, explosionSize);
    const clearBonus = 480 + this.level * 55;
    this.score += killScore + clearBonus;
    this._spawnScorePopup(boss.x, boss.y - popupLift, killScore);
    this._spawnScorePopup(320, 28, clearBonus);
    this._shake = shake;
    this._boss = null;
    this._bossActive = false;

    this._runUpgrades++;
    if (this._runUpgrades % 2 === 1) {
      this._pulseStock += 1;
    }
    this._surgeTimer = Math.max(this._surgeTimer, 22);

    this._maxOptions = Math.min(4, this._maxOptions + 1);
    this._runScoreMulti += 0.08;
    if (this._perfectWave) {
      this._perfectWaves += 1;
      const perfectBonus = 320 + this.level * 25;
      this.score += perfectBonus;
      this._spawnScorePopup(320, 48, perfectBonus);
      if (perfectBurst) this._createExplosion(320, 50, 52);
    }
    this._perfectWave = true;
    this._damageTakenThisWave = 0;
    this._waveBanner = 1.8;
    this._pulseCharge = Math.min(100, this._pulseCharge + 25);
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
        id: randomEnemyId(),
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
      this._spawnRandomEnemy(y, Math.random());
      this._maybeSpawnEscort(y);
    }

    this._maybeDropPowerup();
  }

  // `roll` picks the enemy kind; the later kinds also need the difficulty
  // to have climbed far enough.
  _spawnRandomEnemy(y, roll) {
    const d = this._difficulty;

    if (roll < 0.34) {
      this._enemies.push({
        id: randomEnemyId(),
        x: GAME_W + 18, y,
        vx: -ENEMY_SPEED * (0.88 + Math.random() * 0.32),
        vy: (Math.random() - 0.5) * 26,
        hp: 1,
        points: 65,
        r: ENEMY_BASE_R,
        type: 'drone',
      });
      return;
    }
    if (roll < 0.54) {
      this._enemies.push({
        id: randomEnemyId(),
        x: GAME_W + 26,
        y: 46 + Math.random() * (GAME_H - 92),
        vx: -ENEMY_SPEED * (1.05 + d * 0.05),
        vy: 0,
        hp: 1,
        points: 95,
        r: ENEMY_BASE_R * 1.05,
        type: 'swooper',
      });
      return;
    }
    if (roll < 0.68) {
      this._enemies.push({
        id: randomEnemyId(),
        x: GAME_W + 22, y,
        vx: -ENEMY_SPEED * (0.55 + Math.random() * 0.1),
        vy: 0,
        hp: 2 + (d > 2 ? 1 : 0),
        points: 145,
        r: ENEMY_BASE_R * 1.25,
        type: 'turret',
      });
      return;
    }
    if (roll < 0.78) {
      this._enemies.push({
        id: randomEnemyId(),
        x: GAME_W + 28, y,
        vx: -ENEMY_SPEED * 0.45,
        vy: (Math.random() - 0.5) * 15,
        hp: 4,
        points: 195,
        r: ENEMY_BASE_R * 1.55,
        type: 'growth',
        split: true,
      });
      return;
    }
    if (roll < 0.86) {
      // Fast armoured spiker; an elite variant appears once difficulty climbs.
      const spikerElite = d > 2.8 && Math.random() < 0.4;
      this._enemies.push({
        id: randomEnemyId(),
        x: GAME_W + 14, y,
        vx: -ENEMY_SPEED * (1.65 + d * 0.08),
        vy: (Math.random() - 0.5) * 22,
        hp: spikerElite ? 3 : 2,
        points: spikerElite ? 165 : 115,
        r: ENEMY_BASE_R * 0.95,
        type: 'spiker',
        elite: spikerElite,
      });
      return;
    }
    if (roll < 0.93) {
      this._enemies.push({
        id: randomEnemyId(),
        x: GAME_W + 32, y,
        vx: -ENEMY_SPEED * 0.38,
        vy: (Math.random() - 0.5) * 9,
        hp: 6,
        points: 165,
        r: ENEMY_BASE_R * 1.25,
        type: 'tendril',
        weave: (Math.random() - 0.5) * 2.2,
      });
      return;
    }
    if (d > 2.8 && Math.random() < 0.6) {
      // A small fast chaser that hunts the player or an option; the rare
      // queen is bigger and bursts into a swarm on death.
      const isQueen = d > 3.2 && Math.random() < 0.18;
      this._enemies.push({
        id: randomEnemyId(),
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
      return;
    }
    if (d > 3.0 && Math.random() < 0.25) {
      this._enemies.push({
        id: randomEnemyId(),
        x: GAME_W + 20, y,
        vx: -ENEMY_SPEED * (0.9 + d * 0.05),
        vy: (Math.random() - 0.5) * 25,
        hp: 3,
        points: 135,
        r: ENEMY_BASE_R * 1.1,
        type: 'tendril-parasite',
        whip: Math.random() * 3,
      });
      return;
    }
    this._enemies.push({
      id: randomEnemyId(),
      x: GAME_W + 16, y,
      vx: -ENEMY_SPEED * (1.35 + d * 0.09),
      vy: (Math.random() - 0.5) * 40,
      hp: 1,
      points: 55,
      r: ENEMY_BASE_R * 0.82,
      type: 'drone',
    });
  }

  // Past a little difficulty, a fast drone sometimes rides in alongside.
  _maybeSpawnEscort(y) {
    if (!(this._difficulty > 1.8 && Math.random() < 0.12)) return;
    this._enemies.push({
      id: randomEnemyId(),
      x: GAME_W + 14, y: y * 0.9 + 12,
      vx: -ENEMY_SPEED * (1.55 + this._difficulty * 0.07),
      vy: (Math.random() - 0.5) * 18,
      hp: 2,
      points: 80,
      r: ENEMY_BASE_R * 0.9,
      type: 'drone',
    });
  }

  _maybeDropPowerup() {
    if (Math.random() >= 0.034) return;
    const type = POWERUP_POOL[Math.floor(Math.random() * POWERUP_POOL.length)];
    this._powerups.push({
      x: GAME_W + 14,
      y: 44 + Math.random() * (GAME_H - 88),
      type,
      life: 9,
    });
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

    const freq = (b.phase === 0 ? 1.35 : 2.35);
    const amp = (b.phase === 0 ? 58 : 44);
    b.y = GAME_H / 2 + Math.sin(b.timer * freq) * amp + (b.phase === 1 ? Math.sin(b.timer * 4.1) * 14 : 0);

    const atkMul = 1 + (this._difficulty - 1) * 0.2;
    if (b.phase === 0) {
      this._bossOpeningAttacks(b, atkMul);
      return;
    }
    this._bossEnragedAttacks(b, atkMul);
  }

  _bossOpeningAttacks(b, atkMul) {
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
        id: randomEnemyId(),
        x: b.x - 22, y: b.y + (Math.random() - 0.5) * 58,
        vx: -98, vy: (Math.random() - 0.5) * 44,
        hp: 2, points: 85, r: ENEMY_BASE_R * 1.05, type: 'swooper',
      });
    }
  }

  _bossEnragedAttacks(b, atkMul) {
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
        id: randomEnemyId(),
        x: b.x - 16, y: b.y + (Math.random() - 0.5) * 18,
        vx: -79, vy: (Math.random() - 0.5) * 26,
        hp: 3, points: 155, r: ENEMY_BASE_R * 1.4, type: 'growth', split: true,
      });
    }
  }

  _playerHitRadius() {
    return PLAYER_HIT_R * (this._focusTimer > 0 ? FOCUS_HIT_MUL : 1.0);
  }

  _checkCollisions() {
    this._collideBulletsWithEnemies();
    if (this._laserTimer > 0) this._cancelEnemyBullets();

    const playerHitR = this._playerHitRadius();
    if (this._player.alive && this._player.invuln <= 0) this._collideEnemyBulletsWithPlayer(playerHitR);
    if (this._player.alive && this._player.invuln <= 0) this._collideEnemiesWithPlayer(playerHitR);

    this._collideParasitesWithPlayer();
    this._collideOptionsWithEnemies();
    this._collectPowerups();
    if (this._boss) this._collideBulletsWithBoss();
  }

  _collideBulletsWithEnemies() {
    for (let i = this._bullets.length - 1; i >= 0; i--) {
      const b = this._bullets[i];
      const br = b.r || BULLET_HIT_R;

      for (let j = this._enemies.length - 1; j >= 0; j--) {
        const e = this._enemies[j];
        const er = e.r || ENEMY_BASE_R;
        if (!circlesOverlap(b.x, b.y, br, e.x, e.y, er)) continue;

        e.hp = (e.hp || 1) - this._bulletDamage(b, e, er);
        e.lastHit = this._time;
        this._createHitParticle(b.x, b.y);

        // Piercing shots carry on through, losing life each time.
        if (b.pierce && b.life > 0.2) {
          b.life *= 0.7;
        } else {
          this._bullets.splice(i, 1);
        }
        break;
      }
    }
  }

  // A hit near the centre does extra damage; on an enemy with a weakpoint,
  // more again.
  _bulletDamage(b, e, er) {
    let dmg = b.laser ? 2 : 1;
    if (distance(b.x, b.y, e.x, e.y) >= er * 0.45) return dmg;

    dmg += 1;
    this.score += 8;
    this._shake = Math.max(this._shake, 2.5);
    if (R.WEAKPOINT_TYPES.includes(e.type)) {
      dmg += 1;
      this.score += 12;
      this._createHitParticle(b.x, b.y);
    }
    return dmg;
  }

  // While lasering, player shots knock enemy bullets out.
  _cancelEnemyBullets() {
    for (let i = this._bullets.length - 1; i >= 0; i--) {
      const pb = this._bullets[i];
      for (let j = this._enemyBullets.length - 1; j >= 0; j--) {
        const eb = this._enemyBullets[j];
        const dx = pb.x - eb.x;
        const dy = pb.y - eb.y;
        if (dx * dx + dy * dy < 70) {
          this._enemyBullets.splice(j, 1);
          this.score += 3;
          this._createHitParticle(eb.x, eb.y);
          if (pb.life !== undefined) pb.life *= 0.85;
        }
      }
    }
  }

  _collideEnemyBulletsWithPlayer(playerHitR) {
    const p = this._player;
    for (let i = this._enemyBullets.length - 1; i >= 0; i--) {
      const b = this._enemyBullets[i];
      const br = b.r || 3;
      if (circlesOverlap(b.x, b.y, br, p.x, p.y, playerHitR)) {
        this._hitPlayer();
        this._enemyBullets.splice(i, 1);
      } else if (this._focusTimer > 5 && circlesOverlap(b.x, b.y, br, p.x, p.y, 22)) {
        // Deep in FOCUS the ship phases through near misses and pops them.
        this._enemyBullets.splice(i, 1);
        this.score += 3;
        this._createHitParticle(b.x, b.y);
      }
    }
  }

  _collideEnemiesWithPlayer(playerHitR) {
    for (let i = this._enemies.length - 1; i >= 0; i--) {
      const e = this._enemies[i];
      const er = e.r || ENEMY_BASE_R;
      if (!circlesOverlap(e.x, e.y, er, this._player.x, this._player.y, playerHitR)) continue;

      this._hitPlayer();
      e.hp = 0;
      if (e.type === 'tendril-parasite') {
        this._player.vx += (e.x - this._player.x > 0 ? -80 : 80);
        this._createExplosion(this._player.x, this._player.y, 12);
      }
    }
  }

  // Parasites die on contact even through invulnerability, with a wider reach.
  _collideParasitesWithPlayer() {
    for (let i = this._enemies.length - 1; i >= 0; i--) {
      const e = this._enemies[i];
      if (e.type !== 'parasite') continue;
      const er = e.r || 6;
      if (!circlesOverlap(e.x, e.y, er + PLAYER_HIT_R, this._player.x, this._player.y, 2)) continue;
      if (this._player.invuln <= 0) {
        this._hitPlayer();
      }
      e.hp = 0;
    }
  }

  // Options are fragile: contact destroys the drone but hurts the enemy.
  _collideOptionsWithEnemies() {
    for (let i = this._options.length - 1; i >= 0; i--) {
      const o = this._options[i];
      for (let j = this._enemies.length - 1; j >= 0; j--) {
        const e = this._enemies[j];
        const er = e.r || ENEMY_BASE_R;
        if (circlesOverlap(e.x, e.y, er, o.x, o.y, 5)) {
          this._options.splice(i, 1);
          e.hp = (e.hp || 1) - 1;
          this._createHitParticle(o.x, o.y);
          break;
        }
      }
    }
  }

  _collectPowerups() {
    for (let i = this._powerups.length - 1; i >= 0; i--) {
      const p = this._powerups[i];
      if (!circlesOverlap(p.x, p.y, POWERUP_R, this._player.x, this._player.y, PLAYER_HIT_R + 3)) continue;

      this._applyPowerup(p.type);
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

  _collideBulletsWithBoss() {
    for (let i = this._bullets.length - 1; i >= 0; i--) {
      const b = this._bullets[i];
      const br = b.r || BULLET_HIT_R;
      const boss = this._boss;
      if (!circlesOverlap(b.x, b.y, br, boss.x, boss.y, boss.r || BOSS_HIT_R)) continue;

      boss.hp -= 1;
      this._createHitParticle(b.x, b.y);
      this._bullets.splice(i, 1);

      if (boss.hp <= 0) {
        this._defeatBoss({
          explosionSize: 52,
          killScore: 880,
          popupLift: 8,
          shake: 19,
          perfectBurst: true,
        });
        // The boss is gone; the remaining bullets have nothing to hit.
        return;
      }
    }
  }

  _hitPlayer() {
    this._player.invuln = 1.9;
    this.lives -= 1;
    this._createExplosion(this._player.x, this._player.y, 23);
    this._shake = Math.max(this._shake, 8);

    this._perfectWave = false;
    this._damageTakenThisWave += 1;

    if (this.lives <= 0) this._endRun();
    this._emitHud();
  }

  // Bank the high score before the rank bonus lands, then pay the bonus.
  _endRun() {
    this.gameOver = true;
    this._saveHighScore(this.score);
    const rankBonus = Math.floor(this.score * rankBonusMultiplier(this._computeGrade()));
    this.score += rankBonus;
    this._spawnScorePopup(this._player.x, this._player.y - 30, rankBonus);
  }

  _awardPowerupPoints(points) {
    this.score += points;
    this._spawnScorePopup(this._player.x, this._player.y - 18, points);
  }

  _applyPowerup(type) {
    if (Object.hasOwn(TIMED_POWERUPS, type)) {
      const [timer, seconds, points] = TIMED_POWERUPS[type];
      this[timer] = Math.max(this[timer], seconds);
      this._awardPowerupPoints(points);
      return;
    }

    switch (type) {
      case 'double':
        this._powerLevel = Math.min(2, this._powerLevel + 1);
        this._powerTimer = 16.5;
        this._awardPowerupPoints(155);
        return;
      case 'shield':
        this._player.invuln = Math.max(this._player.invuln, 5.8);
        this._awardPowerupPoints(195);
        return;
      case 'pulse':
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
        return;
      case 'option':
        if (this._options.length < this._maxOptions) {
          this._options.push({
            x: this._player.x - 28,
            y: this._player.y + (this._options.length - 0.5) * 16,
            fireTimer: 0.2,
          });
        }
        this._awardPowerupPoints(140);
        return;
      case 'bomb':
        this._pulseStock = Math.min(5, this._pulseStock + 2);
        this._awardPowerupPoints(175);
        return;
      case 'nova':
        this._novaReady = true;
        this._awardPowerupPoints(195);
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

  // ==================== RENDER ====================
  render(ctx) {
    ctx.save();

    const shakeX = (Math.random() - 0.5) * this._shake * 0.85;
    const shakeY = (Math.random() - 0.5) * this._shake * 0.85;
    ctx.translate(this.offsetX + shakeX, this.offsetY + shakeY);
    ctx.scale(this.scale, this.scale);
    ctx.imageSmoothingEnabled = true;

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    this._renderWorld(ctx);
    R.drawHud(ctx, this._hudState());

    ctx.restore();

    // Post-process vignette in screen space
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    R.drawPost(ctx, this.canvasW, this.canvasH);
    ctx.restore();
  }

  _renderWorld(ctx) {
    R.drawBackground(ctx, {
      time: this._time,
      scroll: this._scroll,
      pulseCharge: this._pulseCharge,
    });

    if (this._vortexTimer > 0) {
      R.drawVortexField(ctx, this._player, this._time);
    }

    for (const wave of this._pulseWaves) R.drawPulseWave(ctx, wave);
    for (const e of this._enemies) R.drawEnemy(ctx, e, this._time);
    R.drawBoss(ctx, this._boss, this._time);
    for (const p of this._powerups) R.drawPowerup(ctx, p, this._time);
    for (const pulse of this._pulses) R.drawPulseBomb(ctx, pulse, this._time);
    for (const ex of this._explosions) R.drawExplosion(ctx, ex);
    for (const b of this._enemyBullets) R.drawEnemyBullet(ctx, b);
    for (const b of this._bullets) R.drawBullet(ctx, b);

    R.drawOptions(ctx, this._options);
    R.drawPlayer(ctx, {
      player: this._player,
      time: this._time,
      powerLevel: this._powerLevel,
      timers: {
        laser: this._laserTimer,
        focus: this._focusTimer,
      },
    });

    R.drawParticles(ctx, this._particles);
    R.drawScorePopups(ctx, this._scorePopups);
  }

  _hudState() {
    return {
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
        focus: this._focusTimer,
        chain: this._chainTimer,
        vortex: this._vortexTimer,
        surge: this._surgeTimer,
      },
      computeGrade: () => this._computeGrade(),
    };
  }

  destroy() {}

  // ==================== PERSISTENCE & SCORING SYSTEMS ====================

  _loadHighScore() {
    try {
      const v = localStorage.getItem(HIGH_SCORE_KEY);
      return v ? parseInt(v, 10) : 0;
    } catch { return 0; }
  }

  _saveHighScore(score) {
    try {
      if (score > (this._highScore || 0)) {
        this._highScore = score;
        localStorage.setItem(HIGH_SCORE_KEY, String(score));
      }
    } catch {
      // Private mode / quota — the high score is best-effort, never block play.
    }
  }

  _updateCombo(dt) {
    if (this._combo > this._maxCombo) this._maxCombo = this._combo;
    const decay = (this._chainTimer > 0) ? dt * 0.6 : dt;
    if (this._comboTimer > 0) {
      this._comboTimer -= decay;
      return;
    }
    if (this._combo > 0) {
      this._combo = Math.max(0, this._combo - 1);
      if (this._combo === 0) this._comboTimer = 0;
    }
  }

  _updateOptions(dt) {
    const p = this._player;
    for (let i = this._options.length - 1; i >= 0; i--) {
      const o = this._options[i];
      // Trail the player with lag and a slight sine orbit
      const targetX = p.x - 22;
      const targetY = p.y + Math.sin(this._time * 4 + i) * 18;
      o.x += (targetX - o.x) * 0.12;
      o.y += (targetY - o.y) * 0.12;

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

      if (!p.alive || o.x < -30) {
        this._options.splice(i, 1);
      }
    }
  }

  // A near miss (inside the graze ring, outside the hit core) pays a little
  // score and pulse charge, at most once every 0.12s. FOCUS widens the ring.
  _checkGraze() {
    if (!this._player.alive || this._player.invuln > 0) return;
    const now = this._time;
    if (now - this._lastGrazeTime < 0.12) return;

    const px = this._player.x;
    const py = this._player.y;
    if (!this._isGrazing(px, py, this._playerHitRadius())) return;

    this._lastGrazeTime = now;
    this._grazeCount += 1;
    this.score += (this._focusTimer > 0) ? 9 : 5;
    this._pulseCharge = Math.min(100, this._pulseCharge + 3);
    this._createHitParticle(px + 12 + Math.random() * 6, py + (Math.random() - 0.5) * 8);
  }

  _isGrazing(px, py, hitR) {
    for (const e of this._enemies) {
      const er = (e.r || ENEMY_BASE_R) * 1.65;
      const dx = e.x - px;
      const dy = e.y - py;
      const dist2 = dx * dx + dy * dy;
      if (dist2 > (hitR + 3) * (hitR + 3) && dist2 < er * er) return true;
    }

    const grazeRadius = (this._focusTimer > 0) ? 26 : 18;
    for (const b of this._enemyBullets) {
      const br = b.r || 3.5;
      const dx = b.x - px;
      const dy = b.y - py;
      const dist2 = dx * dx + dy * dy;
      if (dist2 > (hitR + 2) * (hitR + 2) && dist2 < (br + grazeRadius) * (br + grazeRadius)) return true;
    }
    return false;
  }

  _onLevelUp() {
    this._shake = Math.max(this._shake, 6);
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
