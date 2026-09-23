import { CYAN, VIOLET, ORANGE, WHITE } from '../palette';
import { emitHud } from '../gameHud';
import { letterbox, drawLetterboxed, drawLevelFlash, LEVEL_TRANSITION_SECONDS } from '../frame';
import { clamp } from '../geometry';
import { actionForKey } from '../input';

const GAME_W = 480;
const GAME_H = 360;
const CELL = 15;
const COLS = Math.floor(GAME_W / CELL);
const ROWS = Math.floor(GAME_H / CELL);
const PLAYER_ZONE_ROWS = 6; // bottom rows where player can move
const PLAYER_ZONE_TOP = GAME_H - PLAYER_ZONE_ROWS * CELL;

const PLAYER_SIZE = 12;
const PLAYER_SPEED = 180;
const BULLET_SPEED = 350;
const BULLET_W = 2;
const BULLET_H = 8;
const FIRE_COOLDOWN = 0.15;

const CENTIPEDE_BASE_SPEED = 80;
const CENTIPEDE_SPEED_INCREMENT = 15;
const STARTING_SEGMENTS = 10;

const SPIDER_SPEED = 120;
const SPIDER_SIZE = 10;
const SPIDER_SPAWN_INTERVAL = 8;

const MUSHROOM_HP = 4;
const STARTING_MUSHROOMS = 25;

const STARTING_LIVES = 3;
const DEATH_PAUSE = 0.8;
const RESPAWN_INVULN = 1.5;

const SCORE_SEGMENT = 10;
const SCORE_MUSHROOM = 1;
const SCORE_SPIDER = 600;

/** Is (ax, ay) within `reachX` / `reachY` of (bx, by) on each axis? */
function withinReach(ax, ay, bx, by, reachX, reachY) {
  return Math.abs(ax - bx) < reachX && Math.abs(ay - by) < reachY;
}

export class Centipede {
  onHudUpdate = null;

  init(width, height) {
    this.canvasW = width;
    this.canvasH = height;
    this._computeTransform();

    this.score = 0;
    this.lives = STARTING_LIVES;
    this.level = 1;
    this.gameOver = false;

    this._keys = { left: false, right: false, up: false, down: false, fire: false };
    this._fireCooldown = 0;
    this._bullets = [];
    this._spiderTimer = SPIDER_SPAWN_INTERVAL;
    this._spider = null;
    this._levelTransition = false;
    this._levelTransitionTimer = 0;

    this._initPlayer();
    this._initMushrooms();
    this._initCentipede();
    this._emitHud();
  }

  _initPlayer() {
    this._player = {
      x: GAME_W / 2,
      y: GAME_H - PLAYER_SIZE * 2,
      alive: true,
      invulnTimer: 0,
    };
  }

  _initMushrooms() {
    this._mushrooms = [];
    for (let i = 0; i < STARTING_MUSHROOMS; i++) {
      const col = Math.floor(Math.random() * COLS);
      const row = Math.floor(Math.random() * (ROWS - PLAYER_ZONE_ROWS - 2)) + 2;
      // Don't stack
      if (!this._mushroomAt(col, row)) {
        this._mushrooms.push({ col, row, hp: MUSHROOM_HP });
      }
    }
  }

  _mushroomAt(col, row) {
    return this._mushrooms.find((m) => m.col === col && m.row === row && m.hp > 0);
  }

  _initCentipede() {
    this._centipedes = [];
    const segments = [];
    const speed = CENTIPEDE_BASE_SPEED + (this.level - 1) * CENTIPEDE_SPEED_INCREMENT;

    for (let i = 0; i < STARTING_SEGMENTS; i++) {
      segments.push({
        col: COLS - 1 - i,
        row: 0,
        x: (COLS - 1 - i) * CELL,
        y: 0,
      });
    }

    this._centipedes.push({
      segments,
      dir: -1, // moving left
      speed,
      moveAccum: 0,
    });
  }

  update(dt) {
    if (this.gameOver) return;

    if (this._levelTransition) {
      this._levelTransitionTimer -= dt;
      if (this._levelTransitionTimer <= 0) {
        this._levelTransition = false;
        this.level++;
        this._initCentipede();
        this._emitHud();
      }
      return;
    }

    if (!this._player.alive) {
      this._player.invulnTimer -= dt;
      if (this._player.invulnTimer <= 0) {
        this._player.alive = true;
        this._player.x = GAME_W / 2;
        this._player.y = GAME_H - PLAYER_SIZE * 2;
        this._player.invulnTimer = RESPAWN_INVULN;
      }
      return;
    }

    if (this._player.invulnTimer > 0) this._player.invulnTimer -= dt;

    this._updatePlayer(dt);
    this._updateBullets(dt);
    this._updateCentipedes(dt);
    this._updateSpider(dt);
    this._checkCollisions();

    // Check level complete
    const totalSegments = this._centipedes.reduce((sum, c) => sum + c.segments.length, 0);
    if (totalSegments === 0 && !this._levelTransition) {
      this._levelTransition = true;
      this._levelTransitionTimer = LEVEL_TRANSITION_SECONDS;
    }
  }

  _updatePlayer(dt) {
    const p = this._player;
    if (this._keys.left) p.x -= PLAYER_SPEED * dt;
    if (this._keys.right) p.x += PLAYER_SPEED * dt;
    if (this._keys.up) p.y -= PLAYER_SPEED * dt;
    if (this._keys.down) p.y += PLAYER_SPEED * dt;

    p.x = clamp(p.x, PLAYER_SIZE, GAME_W - PLAYER_SIZE);
    p.y = clamp(p.y, PLAYER_ZONE_TOP, GAME_H - PLAYER_SIZE);

    // Auto-fire
    this._fireCooldown -= dt;
    if (this._keys.fire && this._fireCooldown <= 0) {
      this._bullets.push({
        x: p.x,
        y: p.y - PLAYER_SIZE,
        w: BULLET_W,
        h: BULLET_H,
      });
      this._fireCooldown = FIRE_COOLDOWN;
    }
  }

  _updateBullets(dt) {
    for (let i = this._bullets.length - 1; i >= 0; i--) {
      this._bullets[i].y -= BULLET_SPEED * dt;
      if (this._bullets[i].y + this._bullets[i].h < 0) {
        this._bullets.splice(i, 1);
      }
    }
  }

  _updateCentipedes(dt) {
    for (const cent of this._centipedes) {
      cent.moveAccum += cent.speed * dt;

      while (cent.moveAccum >= CELL && cent.segments.length > 0) {
        cent.moveAccum -= CELL;
        const head = cent.segments[0];
        let nextCol = head.col + cent.dir;
        let nextRow = head.row;
        // Check if need to turn (edge or mushroom)
        if (nextCol < 0 || nextCol >= COLS || this._mushroomAt(nextCol, nextRow)) {
          nextRow++;
          nextCol = head.col;
          cent.dir *= -1;
        }

        // Once on the bottom row it keeps sweeping along it
        if (nextRow >= ROWS) {
          nextRow = ROWS - 1;
        }

        // Move all segments: each segment takes position of the one in front
        for (let i = cent.segments.length - 1; i > 0; i--) {
          cent.segments[i].col = cent.segments[i - 1].col;
          cent.segments[i].row = cent.segments[i - 1].row;
        }
        head.col = nextCol;
        head.row = nextRow;
      }

      // Update pixel positions
      for (const seg of cent.segments) {
        seg.x = seg.col * CELL;
        seg.y = seg.row * CELL;
      }
    }
  }

  _updateSpider(dt) {
    this._spiderTimer -= dt;

    if (!this._spider && this._spiderTimer <= 0) {
      // Spawn spider from side
      const fromLeft = Math.random() > 0.5;
      this._spider = {
        x: fromLeft ? -SPIDER_SIZE : GAME_W + SPIDER_SIZE,
        y: GAME_H - (Math.random() * PLAYER_ZONE_ROWS + 1) * CELL,
        vx: (fromLeft ? 1 : -1) * SPIDER_SPEED,
        vy: (Math.random() - 0.5) * SPIDER_SPEED,
      };
    }

    if (this._spider) {
      const s = this._spider;
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      // Bounce vertically in player zone
      if (s.y < PLAYER_ZONE_TOP || s.y > GAME_H - SPIDER_SIZE) {
        s.vy *= -1;
      }

      if (s.x < -SPIDER_SIZE * 3 || s.x > GAME_W + SPIDER_SIZE * 3) {
        this._spider = null;
        this._spiderTimer = SPIDER_SPAWN_INTERVAL;
        return;
      }

      // Spider eats mushrooms
      const m = this._mushroomAt(Math.floor(s.x / CELL), Math.floor(s.y / CELL));
      if (m) m.hp = 0;
    }
  }

  _checkCollisions() {
    for (let bi = this._bullets.length - 1; bi >= 0; bi--) {
      const bullet = this._bullets[bi];
      const spent = this._bulletHitsMushroom(bullet)
        || this._bulletHitsSegment(bullet)
        || this._bulletHitsSpider(bullet);
      if (spent) this._bullets.splice(bi, 1);
    }

    if (this._player.alive && this._player.invulnTimer <= 0 && this._playerIsTouched()) {
      this._playerHit();
    }
  }

  _bulletHitsMushroom(b) {
    const m = this._mushroomAt(Math.floor(b.x / CELL), Math.floor(b.y / CELL));
    if (!m) return false;
    m.hp--;
    if (m.hp <= 0) {
      this.score += SCORE_MUSHROOM;
      this._emitHud();
    }
    return true;
  }

  // A shot segment leaves a mushroom behind and cuts its centipede in two.
  _bulletHitsSegment(b) {
    for (let ci = 0; ci < this._centipedes.length; ci++) {
      const segments = this._centipedes[ci].segments;
      const si = segments.findIndex((seg) =>
        withinReach(b.x, b.y, seg.x + CELL / 2, seg.y + CELL / 2, CELL / 2 + BULLET_W, CELL / 2 + BULLET_H));
      if (si < 0) continue;

      const seg = segments[si];
      this.score += SCORE_SEGMENT;
      this._emitHud();
      if (!this._mushroomAt(seg.col, seg.row)) {
        this._mushrooms.push({ col: seg.col, row: seg.row, hp: MUSHROOM_HP });
      }
      this._splitCentipede(ci, si);
      return true;
    }
    return false;
  }

  _bulletHitsSpider(b) {
    const s = this._spider;
    if (!s || !withinReach(b.x, b.y, s.x, s.y, SPIDER_SIZE + BULLET_W, SPIDER_SIZE + BULLET_H)) return false;
    this.score += SCORE_SPIDER;
    this._spider = null;
    this._spiderTimer = SPIDER_SPAWN_INTERVAL;
    this._emitHud();
    return true;
  }

  _playerIsTouched() {
    const p = this._player;
    const segmentReach = PLAYER_SIZE + CELL / 3;
    const touchedBySegment = this._centipedes.some((cent) => cent.segments.some((seg) =>
      withinReach(p.x, p.y, seg.x + CELL / 2, seg.y + CELL / 2, segmentReach, segmentReach)));
    if (touchedBySegment) return true;

    const s = this._spider;
    const spiderReach = PLAYER_SIZE + SPIDER_SIZE;
    return Boolean(s) && withinReach(p.x, p.y, s.x, s.y, spiderReach, spiderReach);
  }

  _splitCentipede(centIdx, segIdx) {
    const cent = this._centipedes[centIdx];
    const remaining = cent.segments.splice(segIdx); // remove from segIdx onward
    remaining.shift(); // remove the hit segment

    if (remaining.length > 0) {
      // Create new centipede from the tail
      this._centipedes.push({
        segments: remaining,
        dir: -cent.dir,
        speed: cent.speed,
        moveAccum: 0,
      });
    }

    // Remove empty centipedes
    if (cent.segments.length === 0) {
      this._centipedes.splice(centIdx, 1);
    }
  }

  _playerHit() {
    this.lives--;
    this._player.alive = false;
    this._player.invulnTimer = DEATH_PAUSE;
    this._bullets = [];
    this._emitHud();

    if (this.lives <= 0) {
      this.gameOver = true;
      this._emitHud();
    }
  }

  render(ctx) {
    drawLetterboxed(ctx, this._frame(), () => {
      this._renderPlayerZone(ctx);
      this._renderMushrooms(ctx);
      this._renderCentipedes(ctx);
      this._renderSpider(ctx);
      this._renderBullets(ctx);
      this._renderPlayer(ctx);

      if (this._levelTransition) drawLevelFlash(ctx, this._levelTransitionTimer, GAME_W, GAME_H);
    });
  }

  _frame() {
    return { canvasW: this.canvasW, canvasH: this.canvasH, viewport: this._viewport, gameW: GAME_W, gameH: GAME_H };
  }

  _renderPlayerZone(ctx) {
    const y = GAME_H - PLAYER_ZONE_ROWS * CELL;
    ctx.fillStyle = 'rgba(0, 240, 255, 0.03)';
    ctx.fillRect(0, y, GAME_W, PLAYER_ZONE_ROWS * CELL);
  }

  _renderMushrooms(ctx) {
    for (const m of this._mushrooms) {
      if (m.hp <= 0) continue;
      const x = m.col * CELL;
      const y = m.row * CELL;
      const alpha = m.hp / MUSHROOM_HP;

      ctx.save();
      ctx.shadowColor = VIOLET;
      ctx.shadowBlur = 3;
      ctx.fillStyle = `rgba(200, 64, 255, ${0.3 + 0.7 * alpha})`;
      ctx.beginPath();
      // Mushroom shape: half circle on top, rectangle stem
      ctx.arc(x + CELL / 2, y + CELL / 3, CELL / 2.5, Math.PI, 0);
      ctx.fillRect(x + CELL / 2 - 2, y + CELL / 3, 4, CELL / 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _renderCentipedes(ctx) {
    for (const cent of this._centipedes) {
      for (let i = cent.segments.length - 1; i >= 0; i--) {
        const seg = cent.segments[i];
        const isHead = i === 0;
        const x = seg.x + CELL / 2;
        const y = seg.y + CELL / 2;

        ctx.save();
        ctx.shadowColor = isHead ? ORANGE : VIOLET;
        ctx.shadowBlur = isHead ? 6 : 3;
        ctx.fillStyle = isHead ? ORANGE : VIOLET;
        ctx.beginPath();
        ctx.arc(x, y, CELL / 2 - 1, 0, Math.PI * 2);
        ctx.fill();

        if (isHead) {
          // Eyes
          ctx.fillStyle = WHITE;
          ctx.beginPath();
          ctx.arc(x - 3, y - 2, 2, 0, Math.PI * 2);
          ctx.arc(x + 3, y - 2, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
  }

  _renderSpider(ctx) {
    if (!this._spider) return;
    const s = this._spider;
    ctx.save();
    ctx.shadowColor = ORANGE;
    ctx.shadowBlur = 6;
    ctx.fillStyle = ORANGE;

    // Spider body (two circles)
    ctx.beginPath();
    ctx.arc(s.x, s.y, SPIDER_SIZE * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s.x, s.y + SPIDER_SIZE * 0.4, SPIDER_SIZE * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Legs (simple lines)
    ctx.strokeStyle = ORANGE;
    ctx.lineWidth = 1.5;
    for (let i = -1; i <= 1; i += 2) {
      for (let j = -1; j <= 1; j += 1) {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + i * SPIDER_SIZE, s.y + j * SPIDER_SIZE * 0.6);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  _renderBullets(ctx) {
    ctx.save();
    ctx.shadowColor = CYAN;
    ctx.shadowBlur = 8;
    ctx.fillStyle = CYAN;
    for (const b of this._bullets) {
      ctx.fillRect(b.x - b.w / 2, b.y, b.w, b.h);
    }
    ctx.restore();
  }

  _renderPlayer(ctx) {
    const p = this._player;
    if (!p.alive) return;
    if (p.invulnTimer > 0 && Math.floor(p.invulnTimer * 10) % 2 === 0) return;

    ctx.save();
    ctx.shadowColor = CYAN;
    ctx.shadowBlur = 8;
    ctx.fillStyle = CYAN;

    // Ship triangle
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - PLAYER_SIZE);
    ctx.lineTo(p.x - PLAYER_SIZE * 0.7, p.y + PLAYER_SIZE * 0.4);
    ctx.lineTo(p.x + PLAYER_SIZE * 0.7, p.y + PLAYER_SIZE * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  resize(width, height) {
    this.canvasW = width;
    this.canvasH = height;
    this._computeTransform();
  }

  handleKeyDown(key) {
    this._setControl(actionForKey(key), true);
  }

  handleKeyUp(key) {
    this._setControl(actionForKey(key), false);
  }

  handleTouchAction(action, active) {
    this._setControl(action, active);
  }

  _setControl(action, active) {
    if (Object.hasOwn(this._keys, action)) this._keys[action] = active;
  }

  destroy() {}

  _computeTransform() {
    this._viewport = letterbox(this.canvasW, this.canvasH, GAME_W, GAME_H);
  }

  _emitHud() {
    emitHud(this);
  }
}
