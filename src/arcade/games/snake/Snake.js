import { CYAN, VIOLET, ORANGE, BG } from '../palette';

const GAME_W = 480;
const GAME_H = 360;
const CELL = 15;
const COLS = Math.floor(GAME_W / CELL);
const ROWS = Math.floor(GAME_H / CELL);

const BASE_MOVE_INTERVAL = 0.15; // seconds between moves
const MIN_MOVE_INTERVAL = 0.06;
const SPEED_DECREASE = 0.005; // per food eaten
const FOOD_SCORE = 10;
const LEVEL_UP_THRESHOLD = 10; // food per level

export class Snake {
  onHudUpdate = null;

  init(width, height) {
    this.canvasW = width;
    this.canvasH = height;
    this._computeTransform();

    this.score = 0;
    this.lives = 1;
    this.level = 1;
    this.gameOver = false;

    this._direction = { x: 1, y: 0 };
    this._nextDirection = { x: 1, y: 0 };
    this._moveTimer = 0;
    this._moveInterval = BASE_MOVE_INTERVAL;
    this._foodEaten = 0;

    // Snake starts in center
    const cx = Math.floor(COLS / 2);
    const cy = Math.floor(ROWS / 2);
    this._segments = [
      { x: cx, y: cy },
      { x: cx - 1, y: cy },
      { x: cx - 2, y: cy },
    ];

    this._spawnFood();
    this._emitHud();
  }

  _spawnFood() {
    const occupied = new Set(this._segments.map((s) => `${s.x},${s.y}`));
    const free = [];
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        if (!occupied.has(`${x},${y}`)) free.push({ x, y });
      }
    }
    if (free.length === 0) {
      // Win condition — board full
      this.gameOver = true;
      this._emitHud();
      return;
    }
    this._food = free[Math.floor(Math.random() * free.length)];
  }

  update(dt) {
    if (this.gameOver) return;

    this._moveTimer += dt;
    if (this._moveTimer >= this._moveInterval) {
      this._moveTimer -= this._moveInterval;
      this._move();
    }
  }

  _move() {
    this._direction = { ...this._nextDirection };
    const head = this._segments[0];
    const nx = head.x + this._direction.x;
    const ny = head.y + this._direction.y;

    // Wall collision
    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) {
      this._triggerGameOver();
      return;
    }

    // Self collision
    for (let i = 0; i < this._segments.length; i++) {
      if (this._segments[i].x === nx && this._segments[i].y === ny) {
        this._triggerGameOver();
        return;
      }
    }

    this._segments.unshift({ x: nx, y: ny });

    // Food check
    if (this._food && nx === this._food.x && ny === this._food.y) {
      this.score += FOOD_SCORE;
      this._foodEaten++;

      // Speed up
      this._moveInterval = Math.max(
        MIN_MOVE_INTERVAL,
        BASE_MOVE_INTERVAL - this._foodEaten * SPEED_DECREASE
      );

      // Level up
      if (this._foodEaten % LEVEL_UP_THRESHOLD === 0) {
        this.level++;
      }

      this._emitHud();
      this._spawnFood();
    } else {
      this._segments.pop();
    }
  }

  _triggerGameOver() {
    this.lives = 0;
    this.gameOver = true;
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

    this._renderGrid(ctx);
    this._renderFood(ctx);
    this._renderSnake(ctx);

    ctx.restore();
  }

  _renderGrid(ctx) {
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, ROWS * CELL);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL);
      ctx.lineTo(COLS * CELL, y * CELL);
      ctx.stroke();
    }
  }

  _renderFood(ctx) {
    if (!this._food) return;
    ctx.save();
    ctx.shadowColor = ORANGE;
    ctx.shadowBlur = 10;
    ctx.fillStyle = ORANGE;
    ctx.beginPath();
    ctx.arc(
      this._food.x * CELL + CELL / 2,
      this._food.y * CELL + CELL / 2,
      CELL / 2 - 1,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  }

  _renderSnake(ctx) {
    for (let i = this._segments.length - 1; i >= 0; i--) {
      const s = this._segments[i];
      const t = i / this._segments.length;

      ctx.save();
      if (i === 0) {
        ctx.shadowColor = CYAN;
        ctx.shadowBlur = 8;
        ctx.fillStyle = CYAN;
      } else {
        ctx.shadowColor = VIOLET;
        ctx.shadowBlur = 4;
        // Gradient from violet (head end) to dark (tail)
        const alpha = 0.4 + 0.6 * (1 - t);
        ctx.fillStyle = `rgba(184, 41, 245, ${alpha})`;
      }

      const pad = 1;
      ctx.beginPath();
      ctx.roundRect(s.x * CELL + pad, s.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, 3);
      ctx.fill();
      ctx.restore();
    }
  }

  resize(width, height) {
    this.canvasW = width;
    this.canvasH = height;
    this._computeTransform();
  }

  handleKeyDown(key) {
    const d = this._direction;
    if (key === 'ArrowUp' && d.y !== 1) this._nextDirection = { x: 0, y: -1 };
    if (key === 'ArrowDown' && d.y !== -1) this._nextDirection = { x: 0, y: 1 };
    if (key === 'ArrowLeft' && d.x !== 1) this._nextDirection = { x: -1, y: 0 };
    if (key === 'ArrowRight' && d.x !== -1) this._nextDirection = { x: 1, y: 0 };
  }

  handleKeyUp(_key) {}

  handleTouchAction(action, active) {
    if (!active) return;
    const d = this._direction;
    if (action === 'up' && d.y !== 1) this._nextDirection = { x: 0, y: -1 };
    if (action === 'down' && d.y !== -1) this._nextDirection = { x: 0, y: 1 };
    if (action === 'left' && d.x !== 1) this._nextDirection = { x: -1, y: 0 };
    if (action === 'right' && d.x !== -1) this._nextDirection = { x: 1, y: 0 };
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
