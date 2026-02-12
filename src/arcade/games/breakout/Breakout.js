import { CYAN, VIOLET, ORANGE, BG, WHITE } from '../palette';

const GAME_W = 480;
const GAME_H = 360;

const PADDLE_W = 60;
const PADDLE_H = 10;
const PADDLE_SPEED = 250;
const PADDLE_Y = GAME_H - 30;

const BALL_SIZE = 6;
const BALL_BASE_SPEED = 200;
const BALL_SPEED_INCREMENT = 20;

const BRICK_ROWS = 6;
const BRICK_COLS = 10;
const BRICK_W = 40;
const BRICK_H = 14;
const BRICK_PAD_X = 4;
const BRICK_PAD_Y = 4;
const BRICK_TOP = 50;

const STARTING_LIVES = 3;
const RESPAWN_DELAY = 1;

const ROW_COLORS = [ORANGE, ORANGE, VIOLET, VIOLET, CYAN, CYAN];
const ROW_SCORES = [7, 7, 5, 5, 3, 1];

function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export class Breakout {
  onHudUpdate = null;

  init(width, height) {
    this.canvasW = width;
    this.canvasH = height;
    this._computeTransform();

    this.score = 0;
    this.lives = STARTING_LIVES;
    this.level = 1;
    this.gameOver = false;

    this._keys = { left: false, right: false, launch: false };
    this._initPaddle();
    this._initBall();
    this._initBricks();
    this._respawnTimer = 0;
    this._levelTransition = false;
    this._levelTransitionTimer = 0;

    this._emitHud();
  }

  _initPaddle() {
    this._paddle = {
      x: GAME_W / 2 - PADDLE_W / 2,
      y: PADDLE_Y,
      w: PADDLE_W,
      h: PADDLE_H,
    };
  }

  _initBall() {
    this._ball = {
      x: GAME_W / 2,
      y: PADDLE_Y - BALL_SIZE,
      vx: 0,
      vy: 0,
      size: BALL_SIZE,
      launched: false,
    };
  }

  _initBricks() {
    this._bricks = [];
    const totalW = BRICK_COLS * (BRICK_W + BRICK_PAD_X) - BRICK_PAD_X;
    const startX = (GAME_W - totalW) / 2;

    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        this._bricks.push({
          x: startX + c * (BRICK_W + BRICK_PAD_X),
          y: BRICK_TOP + r * (BRICK_H + BRICK_PAD_Y),
          w: BRICK_W,
          h: BRICK_H,
          alive: true,
          color: ROW_COLORS[r],
          points: ROW_SCORES[r],
        });
      }
    }
  }

  update(dt) {
    if (this.gameOver) return;

    if (this._levelTransition) {
      this._levelTransitionTimer -= dt;
      if (this._levelTransitionTimer <= 0) {
        this._levelTransition = false;
        this._startNextLevel();
      }
      return;
    }

    if (this._respawnTimer > 0) {
      this._respawnTimer -= dt;
      if (this._respawnTimer <= 0) {
        this._initBall();
      }
      return;
    }

    this._updatePaddle(dt);
    this._updateBall(dt);
    this._checkCollisions();
  }

  _updatePaddle(dt) {
    const p = this._paddle;
    if (this._keys.left) p.x -= PADDLE_SPEED * dt;
    if (this._keys.right) p.x += PADDLE_SPEED * dt;
    if (p.x < 0) p.x = 0;
    if (p.x + p.w > GAME_W) p.x = GAME_W - p.w;
  }

  _updateBall(dt) {
    const b = this._ball;

    if (!b.launched) {
      b.x = this._paddle.x + this._paddle.w / 2;
      b.y = PADDLE_Y - b.size;
      if (this._keys.launch) {
        b.launched = true;
        const speed = BALL_BASE_SPEED + (this.level - 1) * BALL_SPEED_INCREMENT;
        b.vx = speed * 0.7;
        b.vy = -speed;
        this._keys.launch = false;
      }
      return;
    }

    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // Wall bounces
    if (b.x - b.size < 0) {
      b.x = b.size;
      b.vx = Math.abs(b.vx);
    }
    if (b.x + b.size > GAME_W) {
      b.x = GAME_W - b.size;
      b.vx = -Math.abs(b.vx);
    }
    if (b.y - b.size < 0) {
      b.y = b.size;
      b.vy = Math.abs(b.vy);
    }

    // Ball fell below paddle
    if (b.y > GAME_H + 20) {
      this._loseLife();
    }
  }

  _checkCollisions() {
    const b = this._ball;
    if (!b.launched) return;

    // Ball vs paddle
    const p = this._paddle;
    if (b.vy > 0 && aabb(b.x - b.size, b.y - b.size, b.size * 2, b.size * 2, p.x, p.y, p.w, p.h)) {
      b.vy = -Math.abs(b.vy);
      b.y = p.y - b.size;
      // Adjust angle based on hit position
      const hitPos = (b.x - p.x) / p.w; // 0 to 1
      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      const angle = (hitPos - 0.5) * Math.PI * 0.7; // -63 to +63 degrees
      b.vx = Math.sin(angle) * speed;
      b.vy = -Math.abs(Math.cos(angle) * speed);
    }

    // Ball vs bricks
    for (let i = this._bricks.length - 1; i >= 0; i--) {
      const brick = this._bricks[i];
      if (!brick.alive) continue;
      if (aabb(b.x - b.size, b.y - b.size, b.size * 2, b.size * 2, brick.x, brick.y, brick.w, brick.h)) {
        brick.alive = false;
        this.score += brick.points;
        this._emitHud();

        // Determine bounce direction
        const overlapLeft = (b.x + b.size) - brick.x;
        const overlapRight = (brick.x + brick.w) - (b.x - b.size);
        const overlapTop = (b.y + b.size) - brick.y;
        const overlapBottom = (brick.y + brick.h) - (b.y - b.size);
        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);

        if (minOverlapX < minOverlapY) {
          b.vx = -b.vx;
        } else {
          b.vy = -b.vy;
        }
        break; // One brick per frame
      }
    }

    // Check level complete
    if (this._bricks.every((brick) => !brick.alive)) {
      this._levelTransition = true;
      this._levelTransitionTimer = 1.0;
    }
  }

  _loseLife() {
    this.lives--;
    this._emitHud();
    if (this.lives <= 0) {
      this.gameOver = true;
      this._emitHud();
      return;
    }
    this._respawnTimer = RESPAWN_DELAY;
  }

  _startNextLevel() {
    this.level++;
    this._initBricks();
    this._initBall();
    this._emitHud();
  }

  render(ctx) {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, this.canvasW, this.canvasH);

    ctx.save();
    ctx.translate(this._offsetX, this._offsetY);
    ctx.scale(this._scale, this._scale);
    ctx.beginPath();
    ctx.rect(0, 0, GAME_W, GAME_H);
    ctx.clip();

    this._renderBricks(ctx);
    this._renderPaddle(ctx);
    this._renderBall(ctx);

    if (this._levelTransition) {
      const alpha = 0.15 + 0.1 * Math.sin(this._levelTransitionTimer * 12);
      ctx.fillStyle = `rgba(0, 229, 255, ${alpha})`;
      ctx.fillRect(0, 0, GAME_W, GAME_H);
    }

    ctx.restore();
  }

  _renderBricks(ctx) {
    for (const brick of this._bricks) {
      if (!brick.alive) continue;
      ctx.save();
      ctx.shadowColor = brick.color;
      ctx.shadowBlur = 4;
      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
      // Inner highlight
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(brick.x, brick.y, brick.w, brick.h / 3);
      ctx.restore();
    }
  }

  _renderPaddle(ctx) {
    const p = this._paddle;
    ctx.save();
    ctx.shadowColor = CYAN;
    ctx.shadowBlur = 8;
    ctx.fillStyle = CYAN;
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, p.h, 4);
    ctx.fill();
    ctx.restore();
  }

  _renderBall(ctx) {
    const b = this._ball;
    ctx.save();
    ctx.shadowColor = WHITE;
    ctx.shadowBlur = 10;
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
    ctx.fill();
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
    if (key === ' ' || key === 'Space') this._keys.launch = true;
  }

  handleKeyUp(key) {
    if (key === 'ArrowLeft') this._keys.left = false;
    if (key === 'ArrowRight') this._keys.right = false;
    if (key === ' ' || key === 'Space') this._keys.launch = false;
  }

  handleTouchAction(action, active) {
    if (action === 'left') this._keys.left = active;
    if (action === 'right') this._keys.right = active;
    if (action === 'fire' || action === 'action') {
      if (active) this._keys.launch = true;
    }
  }

  destroy() {}

  _computeTransform() {
    const aspect = GAME_W / GAME_H;
    let w = this.canvasW;
    let h = this.canvasH;
    if (w / h > aspect) {
      w = h * aspect;
    } else {
      h = w / aspect;
    }
    this._scale = w / GAME_W;
    this._offsetX = (this.canvasW - w) / 2;
    this._offsetY = (this.canvasH - h) / 2;
  }

  _emitHud() {
    if (this.onHudUpdate) {
      this.onHudUpdate({
        score: this.score,
        lives: this.lives,
        level: this.level,
        gameOver: this.gameOver,
      });
    }
  }
}
