/**
 * Space Invaders - Outrun CRT themed canvas game
 *
 * Retro Space Invaders rendered with the site's neon Outrun palette.
 * No imports - fully self-contained plain JS class.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const COLORS = {
  BG: '#0e0e1a',
  CYAN: '#00e5ff',
  VIOLET: '#b829f5',
  ORANGE: '#ff4500',
  WHITE: '#e8e6f0',
  MUTED: '#8888aa',
  SHIELD: '#00e5ff',
};

// Virtual game area (4:3 aspect ratio) - all coordinates are in this space
const GAME_W = 480;
const GAME_H = 360;

// Player
const PLAYER_W = 26;
const PLAYER_H = 14;
const PLAYER_SPEED = 160; // virtual px / sec
const PLAYER_Y_OFFSET = 24; // distance from bottom of game area
const PLAYER_BULLET_SPEED = 260;
const PLAYER_BULLET_W = 2;
const PLAYER_BULLET_H = 8;

// Aliens grid
const ALIEN_COLS = 11;
const ALIEN_ROWS = 5;
const ALIEN_W = 18;
const ALIEN_H = 12;
const ALIEN_PAD_X = 24;
const ALIEN_PAD_Y = 20;
const ALIEN_BASE_SPEED = 30; // virtual px / sec at level 1
const ALIEN_SPEED_INCREMENT = 8; // added per level
const ALIEN_DROP = 10; // how far they drop each edge bounce
const ALIEN_BULLET_SPEED = 130;
const ALIEN_BULLET_W = 2;
const ALIEN_BULLET_H = 6;
const ALIEN_FIRE_BASE_INTERVAL = 1.2; // seconds at full grid
const ALIEN_FIRE_MIN_INTERVAL = 0.25;

// Shields
const SHIELD_COUNT = 4;
const SHIELD_BLOCK = 3; // pixel block size in virtual coords
const SHIELD_ROWS = 6;
const SHIELD_COLS = 10;
const SHIELD_Y_OFFSET = 58; // from bottom

// Scoring
const SCORE_TOP = 30;
const SCORE_MID = 20;
const SCORE_BOT = 10;

// Lives
const STARTING_LIVES = 3;

// Respawn invulnerability
const RESPAWN_INVULN = 1.5; // seconds

// ---------------------------------------------------------------------------
// Alien sprite patterns (simple pixel blocks - 6x4 grids)
// 1 = filled, 0 = empty
// ---------------------------------------------------------------------------
const ALIEN_SPRITE_A = [
  [0, 1, 0, 0, 1, 0],
  [0, 0, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 0],
  [1, 0, 1, 1, 0, 1],
];

const ALIEN_SPRITE_B = [
  [1, 0, 0, 0, 0, 1],
  [0, 1, 1, 1, 1, 0],
  [1, 1, 0, 0, 1, 1],
  [0, 1, 1, 1, 1, 0],
];

const ALIEN_SPRITE_C = [
  [0, 0, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 0],
  [1, 1, 0, 0, 1, 1],
  [0, 0, 1, 1, 0, 0],
];

// Shield shape pattern (10 x 6)
const SHIELD_PATTERN = [
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
  [1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
];

// ---------------------------------------------------------------------------
// Helper: axis-aligned bounding box collision
// ---------------------------------------------------------------------------
function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// ---------------------------------------------------------------------------
// SpaceInvaders class
// ---------------------------------------------------------------------------
export class SpaceInvaders {
  /** @type {(({score: number, lives: number, level: number, gameOver: boolean}) => void) | null} */
  onHudUpdate = null;

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  init(width, height) {
    this.canvasW = width;
    this.canvasH = height;
    this._computeTransform();

    this.score = 0;
    this.lives = STARTING_LIVES;
    this.level = 1;
    this.gameOver = false;
    this._levelTransition = false;
    this._levelTransitionTimer = 0;

    this._initKeys();
    this._initPlayer();
    this._initAliens();
    this._initShields();
    this._initBullets();

    this._emitHud();
  }

  update(dt) {
    if (this.gameOver) return;

    // Level transition pause
    if (this._levelTransition) {
      this._levelTransitionTimer -= dt;
      if (this._levelTransitionTimer <= 0) {
        this._levelTransition = false;
        this._startNextLevel();
      }
      return;
    }

    this._updatePlayer(dt);
    this._updatePlayerBullets(dt);
    this._updateAliens(dt);
    this._updateAlienBullets(dt);
    this._checkCollisions();
  }

  render(ctx) {
    // Clear
    ctx.fillStyle = COLORS.BG;
    ctx.fillRect(0, 0, this.canvasW, this.canvasH);

    ctx.save();
    ctx.translate(this._offsetX, this._offsetY);
    ctx.scale(this._scale, this._scale);

    // Clip to game area
    ctx.beginPath();
    ctx.rect(0, 0, GAME_W, GAME_H);
    ctx.clip();

    this._renderShields(ctx);
    this._renderAliens(ctx);
    this._renderPlayer(ctx);
    this._renderPlayerBullets(ctx);
    this._renderAlienBullets(ctx);

    // Level transition flash
    if (this._levelTransition) {
      const alpha = 0.15 + 0.1 * Math.sin(this._levelTransitionTimer * 12);
      ctx.fillStyle = `rgba(0, 229, 255, ${alpha})`;
      ctx.fillRect(0, 0, GAME_W, GAME_H);
    }

    ctx.restore();
  }

  resize(width, height) {
    this.canvasW = width;
    this.canvasH = height;
    this._computeTransform();
  }

  handleKeyDown(key) {
    if (key === 'ArrowLeft') this._keys.left = true;
    if (key === 'ArrowRight') this._keys.right = true;
    if (key === ' ' || key === 'Space') {
      if (!this._keys.fireLock) {
        this._keys.fire = true;
        this._keys.fireLock = true;
      }
    }
  }

  handleKeyUp(key) {
    if (key === 'ArrowLeft') this._keys.left = false;
    if (key === 'ArrowRight') this._keys.right = false;
    if (key === ' ' || key === 'Space') {
      this._keys.fireLock = false;
    }
  }

  handleTouchAction(action, active) {
    if (action === 'left') this._keys.left = active;
    if (action === 'right') this._keys.right = active;
    if (action === 'fire') {
      if (active && !this._keys.fireLock) {
        this._keys.fire = true;
        this._keys.fireLock = true;
      }
      if (!active) {
        this._keys.fireLock = false;
      }
    }
  }

  destroy() {
    // Nothing async to clean up
  }

  // -----------------------------------------------------------------------
  // Internal: transform
  // -----------------------------------------------------------------------

  _computeTransform() {
    const aspect = GAME_W / GAME_H; // 4:3
    let w = this.canvasW;
    let h = this.canvasH;

    if (w / h > aspect) {
      // Canvas is wider than 4:3 - fit to height
      w = h * aspect;
    } else {
      // Canvas is taller than 4:3 - fit to width
      h = w / aspect;
    }

    this._scale = w / GAME_W;
    this._offsetX = (this.canvasW - w) / 2;
    this._offsetY = (this.canvasH - h) / 2;
  }

  // -----------------------------------------------------------------------
  // Internal: init helpers
  // -----------------------------------------------------------------------

  _initKeys() {
    this._keys = { left: false, right: false, fire: false, fireLock: false };
  }

  _initPlayer() {
    this._player = {
      x: GAME_W / 2 - PLAYER_W / 2,
      y: GAME_H - PLAYER_Y_OFFSET - PLAYER_H,
      w: PLAYER_W,
      h: PLAYER_H,
      alive: true,
      invulnTimer: 0,
    };
  }

  _initAliens() {
    const gridW = ALIEN_COLS * ALIEN_PAD_X;
    const startX = (GAME_W - gridW) / 2 + (ALIEN_PAD_X - ALIEN_W) / 2;
    const startY = 36;

    this._aliens = [];
    for (let r = 0; r < ALIEN_ROWS; r++) {
      for (let c = 0; c < ALIEN_COLS; c++) {
        let color, points, sprite;
        if (r < 2) {
          color = COLORS.ORANGE;
          points = SCORE_TOP;
          sprite = ALIEN_SPRITE_A;
        } else if (r < 4) {
          color = COLORS.VIOLET;
          points = SCORE_MID;
          sprite = ALIEN_SPRITE_B;
        } else {
          color = COLORS.CYAN;
          points = SCORE_BOT;
          sprite = ALIEN_SPRITE_C;
        }
        this._aliens.push({
          x: startX + c * ALIEN_PAD_X,
          y: startY + r * ALIEN_PAD_Y,
          w: ALIEN_W,
          h: ALIEN_H,
          row: r,
          col: c,
          alive: true,
          color,
          points,
          sprite,
        });
      }
    }

    this._alienDir = 1; // 1 = right, -1 = left
    this._alienSpeed = ALIEN_BASE_SPEED + (this.level - 1) * ALIEN_SPEED_INCREMENT;
    this._alienFireTimer = ALIEN_FIRE_BASE_INTERVAL;
    this._alienAnimTimer = 0;
    this._alienAnimFrame = 0;
  }

  _initShields() {
    this._shields = [];
    const shieldY = GAME_H - SHIELD_Y_OFFSET - SHIELD_ROWS * SHIELD_BLOCK;
    const totalShieldWidth = SHIELD_COUNT * SHIELD_COLS * SHIELD_BLOCK;
    const spacing = (GAME_W - totalShieldWidth) / (SHIELD_COUNT + 1);

    for (let s = 0; s < SHIELD_COUNT; s++) {
      const sx = spacing + s * (SHIELD_COLS * SHIELD_BLOCK + spacing);
      const blocks = [];
      for (let r = 0; r < SHIELD_ROWS; r++) {
        for (let c = 0; c < SHIELD_COLS; c++) {
          if (SHIELD_PATTERN[r][c]) {
            blocks.push({
              x: sx + c * SHIELD_BLOCK,
              y: shieldY + r * SHIELD_BLOCK,
              w: SHIELD_BLOCK,
              h: SHIELD_BLOCK,
              alive: true,
            });
          }
        }
      }
      this._shields.push(blocks);
    }
  }

  _initBullets() {
    this._playerBullets = [];
    this._alienBullets = [];
  }

  // -----------------------------------------------------------------------
  // Internal: update helpers
  // -----------------------------------------------------------------------

  _updatePlayer(dt) {
    const p = this._player;
    if (!p.alive) {
      p.invulnTimer -= dt;
      if (p.invulnTimer <= 0) {
        p.alive = true;
        p.x = GAME_W / 2 - PLAYER_W / 2;
        p.invulnTimer = RESPAWN_INVULN;
      }
      return;
    }

    if (p.invulnTimer > 0) {
      p.invulnTimer -= dt;
    }

    if (this._keys.left) p.x -= PLAYER_SPEED * dt;
    if (this._keys.right) p.x += PLAYER_SPEED * dt;

    // Clamp to game area
    if (p.x < 4) p.x = 4;
    if (p.x + p.w > GAME_W - 4) p.x = GAME_W - 4 - p.w;

    // Fire
    if (this._keys.fire) {
      this._keys.fire = false;
      if (this._playerBullets.length < 2) {
        this._playerBullets.push({
          x: p.x + p.w / 2 - PLAYER_BULLET_W / 2,
          y: p.y - PLAYER_BULLET_H,
          w: PLAYER_BULLET_W,
          h: PLAYER_BULLET_H,
        });
      }
    }
  }

  _updatePlayerBullets(dt) {
    for (let i = this._playerBullets.length - 1; i >= 0; i--) {
      const b = this._playerBullets[i];
      b.y -= PLAYER_BULLET_SPEED * dt;
      if (b.y + b.h < 0) {
        this._playerBullets.splice(i, 1);
      }
    }
  }

  _updateAliens(dt) {
    // Speed increases as aliens are destroyed
    const aliveCount = this._aliens.filter((a) => a.alive).length;
    const totalCount = ALIEN_ROWS * ALIEN_COLS;
    const speedMultiplier = 1 + (1 - aliveCount / totalCount) * 2.5;
    const speed = this._alienSpeed * speedMultiplier;

    // Animation timer
    this._alienAnimTimer += dt;
    if (this._alienAnimTimer > 0.5) {
      this._alienAnimTimer -= 0.5;
      this._alienAnimFrame = 1 - this._alienAnimFrame;
    }

    // Move sideways
    let hitEdge = false;
    for (const a of this._aliens) {
      if (!a.alive) continue;
      a.x += speed * this._alienDir * dt;
      if (a.x < 4 || a.x + a.w > GAME_W - 4) {
        hitEdge = true;
      }
    }

    // Reverse direction and drop
    if (hitEdge) {
      this._alienDir *= -1;
      for (const a of this._aliens) {
        if (!a.alive) continue;
        // Undo overshoot
        a.x += speed * this._alienDir * dt;
        a.y += ALIEN_DROP;
      }
    }

    // Check if aliens reached shield line -> game over
    const shieldLineY = GAME_H - SHIELD_Y_OFFSET - SHIELD_ROWS * SHIELD_BLOCK;
    for (const a of this._aliens) {
      if (a.alive && a.y + a.h >= shieldLineY) {
        this._triggerGameOver();
        return;
      }
    }

    // Alien firing
    this._alienFireTimer -= dt;
    if (this._alienFireTimer <= 0) {
      this._alienFire();
      // Fire interval decreases with fewer aliens
      const ratio = aliveCount / totalCount;
      this._alienFireTimer =
        ALIEN_FIRE_MIN_INTERVAL +
        (ALIEN_FIRE_BASE_INTERVAL - ALIEN_FIRE_MIN_INTERVAL) * ratio;
    }

    // Check level complete
    if (aliveCount === 0) {
      this._levelTransition = true;
      this._levelTransitionTimer = 1.0;
    }
  }

  _alienFire() {
    // Pick a random alive alien from bottom-most of each column
    const bottomAliens = [];
    for (let c = 0; c < ALIEN_COLS; c++) {
      let bottom = null;
      for (let r = ALIEN_ROWS - 1; r >= 0; r--) {
        const idx = r * ALIEN_COLS + c;
        if (this._aliens[idx] && this._aliens[idx].alive) {
          bottom = this._aliens[idx];
          break;
        }
      }
      if (bottom) bottomAliens.push(bottom);
    }

    if (bottomAliens.length === 0) return;
    const shooter = bottomAliens[Math.floor(Math.random() * bottomAliens.length)];
    this._alienBullets.push({
      x: shooter.x + shooter.w / 2 - ALIEN_BULLET_W / 2,
      y: shooter.y + shooter.h,
      w: ALIEN_BULLET_W,
      h: ALIEN_BULLET_H,
    });
  }

  _updateAlienBullets(dt) {
    for (let i = this._alienBullets.length - 1; i >= 0; i--) {
      const b = this._alienBullets[i];
      b.y += ALIEN_BULLET_SPEED * dt;
      if (b.y > GAME_H) {
        this._alienBullets.splice(i, 1);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Internal: collisions
  // -----------------------------------------------------------------------

  _checkCollisions() {
    // Player bullets vs aliens
    for (let bi = this._playerBullets.length - 1; bi >= 0; bi--) {
      const b = this._playerBullets[bi];
      let hit = false;
      for (const a of this._aliens) {
        if (!a.alive) continue;
        if (aabb(b.x, b.y, b.w, b.h, a.x, a.y, a.w, a.h)) {
          a.alive = false;
          hit = true;
          this.score += a.points;
          this._emitHud();
          break;
        }
      }
      if (hit) {
        this._playerBullets.splice(bi, 1);
      }
    }

    // Player bullets vs shields
    for (let bi = this._playerBullets.length - 1; bi >= 0; bi--) {
      const b = this._playerBullets[bi];
      let hit = false;
      for (const shield of this._shields) {
        for (const block of shield) {
          if (!block.alive) continue;
          if (aabb(b.x, b.y, b.w, b.h, block.x, block.y, block.w, block.h)) {
            block.alive = false;
            hit = true;
            break;
          }
        }
        if (hit) break;
      }
      if (hit) {
        this._playerBullets.splice(bi, 1);
      }
    }

    // Alien bullets vs player
    const p = this._player;
    if (p.alive && p.invulnTimer <= 0) {
      for (let bi = this._alienBullets.length - 1; bi >= 0; bi--) {
        const b = this._alienBullets[bi];
        if (aabb(b.x, b.y, b.w, b.h, p.x, p.y, p.w, p.h)) {
          this._alienBullets.splice(bi, 1);
          this._playerHit();
          break;
        }
      }
    }

    // Alien bullets vs shields
    for (let bi = this._alienBullets.length - 1; bi >= 0; bi--) {
      const b = this._alienBullets[bi];
      let hit = false;
      for (const shield of this._shields) {
        for (const block of shield) {
          if (!block.alive) continue;
          if (aabb(b.x, b.y, b.w, b.h, block.x, block.y, block.w, block.h)) {
            block.alive = false;
            hit = true;
            break;
          }
        }
        if (hit) break;
      }
      if (hit) {
        this._alienBullets.splice(bi, 1);
      }
    }

    // Aliens vs shields (aliens marching through shields)
    for (const a of this._aliens) {
      if (!a.alive) continue;
      for (const shield of this._shields) {
        for (const block of shield) {
          if (!block.alive) continue;
          if (aabb(a.x, a.y, a.w, a.h, block.x, block.y, block.w, block.h)) {
            block.alive = false;
          }
        }
      }
    }
  }

  _playerHit() {
    this.lives--;
    this._player.alive = false;
    this._player.invulnTimer = 0.8; // dead time before respawn

    this._emitHud();

    if (this.lives <= 0) {
      this._triggerGameOver();
    }
  }

  _triggerGameOver() {
    this.gameOver = true;
    if (this.onHudUpdate) {
      this.onHudUpdate({
        score: this.score,
        lives: this.lives,
        level: this.level,
        gameOver: true,
      });
    }
  }

  // -----------------------------------------------------------------------
  // Internal: level progression
  // -----------------------------------------------------------------------

  _startNextLevel() {
    this.level++;
    this._initAliens();
    this._initShields();
    this._initBullets();
    this._player.alive = true;
    this._player.x = GAME_W / 2 - PLAYER_W / 2;
    this._player.y = GAME_H - PLAYER_Y_OFFSET - PLAYER_H;
    this._player.invulnTimer = RESPAWN_INVULN;
    this._emitHud();
  }

  // -----------------------------------------------------------------------
  // Internal: HUD callback
  // -----------------------------------------------------------------------

  _emitHud() {
    if (this.onHudUpdate) {
      this.onHudUpdate({
        score: this.score,
        lives: this.lives,
        level: this.level,
        gameOver: false,
      });
    }
  }

  // -----------------------------------------------------------------------
  // Internal: rendering
  // -----------------------------------------------------------------------

  _renderPlayer(ctx) {
    const p = this._player;
    if (!p.alive) return;

    // Blink during invulnerability
    if (p.invulnTimer > 0 && Math.floor(p.invulnTimer * 10) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.shadowColor = COLORS.CYAN;
    ctx.shadowBlur = 8;
    ctx.fillStyle = COLORS.CYAN;

    // Ship body - simple geometric shape
    // Base rectangle
    ctx.fillRect(p.x + 2, p.y + 5, p.w - 4, p.h - 5);
    // Middle section
    ctx.fillRect(p.x + 6, p.y + 2, p.w - 12, 4);
    // Cannon
    ctx.fillRect(p.x + p.w / 2 - 1.5, p.y, 3, 5);

    ctx.restore();
  }

  _renderAliens(ctx) {
    for (const a of this._aliens) {
      if (!a.alive) continue;
      this._renderAlienSprite(ctx, a);
    }
  }

  _renderAlienSprite(ctx, alien) {
    ctx.save();
    ctx.shadowColor = alien.color;
    ctx.shadowBlur = 4;
    ctx.fillStyle = alien.color;

    const sprite = alien.sprite;
    const rows = sprite.length;
    const cols = sprite[0].length;
    const bw = alien.w / cols;
    const bh = alien.h / rows;

    // Simple animation: offset alternate frames
    const yOff = this._alienAnimFrame === 1 ? 1 : 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (sprite[r][c]) {
          ctx.fillRect(
            alien.x + c * bw,
            alien.y + r * bh + yOff,
            bw + 0.5, // slight overlap to avoid gaps
            bh + 0.5
          );
        }
      }
    }

    ctx.restore();
  }

  _renderShields(ctx) {
    ctx.save();
    ctx.fillStyle = COLORS.SHIELD;
    ctx.shadowColor = COLORS.SHIELD;
    ctx.shadowBlur = 2;

    for (const shield of this._shields) {
      for (const block of shield) {
        if (!block.alive) continue;
        ctx.fillRect(block.x, block.y, block.w, block.h);
      }
    }

    ctx.restore();
  }

  _renderPlayerBullets(ctx) {
    ctx.save();
    ctx.shadowColor = COLORS.CYAN;
    ctx.shadowBlur = 10;
    ctx.fillStyle = COLORS.CYAN;

    for (const b of this._playerBullets) {
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }

    ctx.restore();
  }

  _renderAlienBullets(ctx) {
    ctx.save();
    ctx.shadowColor = COLORS.ORANGE;
    ctx.shadowBlur = 10;
    ctx.fillStyle = COLORS.ORANGE;

    for (const b of this._alienBullets) {
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }

    ctx.restore();
  }
}
