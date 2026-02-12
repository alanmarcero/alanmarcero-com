import { CYAN, VIOLET, ORANGE, BG, WHITE, MUTED } from '../palette';

const GAME_W = 480;
const GAME_H = 360;

const PADDLE_W = 10;
const PADDLE_H = 50;
const PADDLE_MARGIN = 20;
const PADDLE_SPEED = 220;

const BALL_SIZE = 6;
const BALL_BASE_SPEED = 200;
const BALL_SPEED_INCREMENT = 15;
const BALL_MAX_ANGLE = Math.PI / 3; // 60 degrees max

const AI_BASE_SPEED = 160;
const AI_SPEED_INCREMENT = 20;
const AI_REACTION_DELAY = 0.08; // seconds

const STARTING_LIVES = 3;
const POINTS_PER_LEVEL = 5;
const SERVE_DELAY = 0.8;

export class Pong {
  onHudUpdate = null;

  init(width, height) {
    this.canvasW = width;
    this.canvasH = height;
    this._computeTransform();

    this.score = 0;
    this.lives = STARTING_LIVES;
    this.level = 1;
    this.gameOver = false;

    this._keys = { up: false, down: false };
    this._serveTimer = SERVE_DELAY;
    this._aiReactionTimer = 0;
    this._aiTargetY = GAME_H / 2;
    this._scoreFlash = 0;

    this._initPaddles();
    this._initBall();
    this._emitHud();
  }

  _initPaddles() {
    this._player = {
      x: PADDLE_MARGIN,
      y: GAME_H / 2 - PADDLE_H / 2,
      w: PADDLE_W,
      h: PADDLE_H,
    };
    this._ai = {
      x: GAME_W - PADDLE_MARGIN - PADDLE_W,
      y: GAME_H / 2 - PADDLE_H / 2,
      w: PADDLE_W,
      h: PADDLE_H,
    };
  }

  _initBall() {
    const speed = BALL_BASE_SPEED + (this.level - 1) * BALL_SPEED_INCREMENT;
    const angle = (Math.random() - 0.5) * Math.PI / 3;
    const dir = Math.random() > 0.5 ? 1 : -1;

    this._ball = {
      x: GAME_W / 2,
      y: GAME_H / 2,
      vx: Math.cos(angle) * speed * dir,
      vy: Math.sin(angle) * speed,
      size: BALL_SIZE,
    };
  }

  update(dt) {
    if (this.gameOver) return;

    if (this._serveTimer > 0) {
      this._serveTimer -= dt;
      return;
    }

    this._updatePlayer(dt);
    this._updateAI(dt);
    this._updateBall(dt);

    if (this._scoreFlash > 0) this._scoreFlash -= dt;
  }

  _updatePlayer(dt) {
    const p = this._player;
    if (this._keys.up) p.y -= PADDLE_SPEED * dt;
    if (this._keys.down) p.y += PADDLE_SPEED * dt;
    if (p.y < 0) p.y = 0;
    if (p.y + p.h > GAME_H) p.y = GAME_H - p.h;
  }

  _updateAI(dt) {
    const ai = this._ai;
    const aiSpeed = AI_BASE_SPEED + (this.level - 1) * AI_SPEED_INCREMENT;

    // Reaction delay
    this._aiReactionTimer -= dt;
    if (this._aiReactionTimer <= 0) {
      this._aiReactionTimer = AI_REACTION_DELAY;
      // Track ball with some imprecision
      const offset = (Math.random() - 0.5) * PADDLE_H * 0.3;
      this._aiTargetY = this._ball.y + offset - ai.h / 2;
    }

    // Move toward target
    const diff = this._aiTargetY - ai.y;
    if (Math.abs(diff) > 2) {
      const move = Math.sign(diff) * Math.min(aiSpeed * dt, Math.abs(diff));
      ai.y += move;
    }

    if (ai.y < 0) ai.y = 0;
    if (ai.y + ai.h > GAME_H) ai.y = GAME_H - ai.h;
  }

  _updateBall(dt) {
    const b = this._ball;
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // Top/bottom bounce
    if (b.y - b.size < 0) {
      b.y = b.size;
      b.vy = Math.abs(b.vy);
    }
    if (b.y + b.size > GAME_H) {
      b.y = GAME_H - b.size;
      b.vy = -Math.abs(b.vy);
    }

    // Player paddle collision
    const p = this._player;
    if (b.vx < 0 && b.x - b.size <= p.x + p.w && b.x + b.size >= p.x &&
        b.y + b.size >= p.y && b.y - b.size <= p.y + p.h) {
      this._paddleBounce(p, 1);
    }

    // AI paddle collision
    const ai = this._ai;
    if (b.vx > 0 && b.x + b.size >= ai.x && b.x - b.size <= ai.x + ai.w &&
        b.y + b.size >= ai.y && b.y - b.size <= ai.y + ai.h) {
      this._paddleBounce(ai, -1);
    }

    // Ball past left (player missed)
    if (b.x + b.size < 0) {
      this.lives--;
      this._emitHud();
      if (this.lives <= 0) {
        this.gameOver = true;
        this._emitHud();
        return;
      }
      this._serveTimer = SERVE_DELAY;
      this._initBall();
    }

    // Ball past right (AI missed — player scores)
    if (b.x - b.size > GAME_W) {
      this.score++;
      this._scoreFlash = 0.3;
      if (this.score % POINTS_PER_LEVEL === 0) {
        this.level++;
      }
      this._emitHud();
      this._serveTimer = SERVE_DELAY;
      this._initBall();
    }
  }

  _paddleBounce(paddle, dirX) {
    const b = this._ball;
    const hitPos = (b.y - paddle.y) / paddle.h; // 0 to 1
    const angle = (hitPos - 0.5) * BALL_MAX_ANGLE * 2;
    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy) * 1.02; // slight speedup
    b.vx = Math.cos(angle) * speed * dirX;
    b.vy = Math.sin(angle) * speed;
    b.x = dirX > 0 ? paddle.x + paddle.w + b.size : paddle.x - b.size;
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

    this._renderCenterLine(ctx);
    this._renderPaddle(ctx, this._player, CYAN);
    this._renderPaddle(ctx, this._ai, VIOLET);
    this._renderBall(ctx);

    ctx.restore();
  }

  _renderCenterLine(ctx) {
    ctx.save();
    ctx.strokeStyle = MUTED;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(GAME_W / 2, 0);
    ctx.lineTo(GAME_W / 2, GAME_H);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  _renderPaddle(ctx, paddle, color) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = color;
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
    ctx.restore();
  }

  _renderBall(ctx) {
    const b = this._ball;
    const color = this._scoreFlash > 0 ? ORANGE : WHITE;
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = color;
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
    if (key === 'ArrowUp') this._keys.up = true;
    if (key === 'ArrowDown') this._keys.down = true;
  }

  handleKeyUp(key) {
    if (key === 'ArrowUp') this._keys.up = false;
    if (key === 'ArrowDown') this._keys.down = false;
  }

  handleTouchAction(action, active) {
    if (action === 'up') this._keys.up = active;
    if (action === 'down') this._keys.down = active;
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
