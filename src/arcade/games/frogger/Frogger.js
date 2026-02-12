import { CYAN, ORANGE, BG } from '../palette';

const GAME_W = 480;
const GAME_H = 360;
const CELL = 30;
const COLS = Math.floor(GAME_W / CELL); // 16
const ROWS = 12;

const STARTING_LIVES = 3;
const MOVE_COOLDOWN = 0.12;

// Lane definitions (from top to bottom):
// Row 0: safe zone (goal slots)
// Rows 1-5: river (logs)
// Row 6: safe median
// Rows 7-10: road (vehicles)
// Row 11: start zone

const LANE_TYPES = [
  'goal',     // 0
  'river',    // 1
  'river',    // 2
  'river',    // 3
  'river',    // 4
  'river',    // 5
  'safe',     // 6
  'road',     // 7
  'road',     // 8
  'road',     // 9
  'road',     // 10
  'start',    // 11
];

const GOAL_SLOTS = 5;
const GOAL_POSITIONS = [1, 4, 7, 10, 13]; // column positions for goal slots

export class Frogger {
  onHudUpdate = null;

  init(width, height) {
    this.canvasW = width;
    this.canvasH = height;
    this._computeTransform();

    this.score = 0;
    this.lives = STARTING_LIVES;
    this.level = 1;
    this.gameOver = false;

    this._moveCooldown = 0;
    this._goalsFilled = new Array(GOAL_SLOTS).fill(false);
    this._initFrog();
    this._initLanes();
    this._emitHud();
  }

  _initFrog() {
    this._frog = {
      col: Math.floor(COLS / 2),
      row: ROWS - 1,
      dead: false,
      deathTimer: 0,
      ridingObj: null,
    };
    this._highestRow = ROWS - 1;
  }

  _initLanes() {
    this._lanes = [];
    const speedMul = 1 + (this.level - 1) * 0.2;

    // River lanes (rows 1-5): logs moving alternating directions
    const riverConfigs = [
      { speed: 40 * speedMul, dir: 1, objW: 90, gap: 130 },
      { speed: 55 * speedMul, dir: -1, objW: 60, gap: 110 },
      { speed: 35 * speedMul, dir: 1, objW: 120, gap: 160 },
      { speed: 50 * speedMul, dir: -1, objW: 60, gap: 100 },
      { speed: 45 * speedMul, dir: 1, objW: 90, gap: 140 },
    ];

    // Road lanes (rows 7-10): vehicles
    const roadConfigs = [
      { speed: 50 * speedMul, dir: -1, objW: 40, gap: 120 },
      { speed: 70 * speedMul, dir: 1, objW: 60, gap: 140 },
      { speed: 45 * speedMul, dir: -1, objW: 35, gap: 100 },
      { speed: 65 * speedMul, dir: 1, objW: 50, gap: 130 },
    ];

    for (let r = 0; r < ROWS; r++) {
      const type = LANE_TYPES[r];
      if (type === 'river') {
        const cfg = riverConfigs[r - 1];
        this._lanes[r] = this._createLane(cfg, 'log');
      } else if (type === 'road') {
        const cfg = roadConfigs[r - 7];
        this._lanes[r] = this._createLane(cfg, 'vehicle');
      } else {
        this._lanes[r] = null;
      }
    }
  }

  _createLane(cfg, objType) {
    const objects = [];
    const count = Math.ceil((GAME_W + cfg.gap) / (cfg.objW + cfg.gap)) + 1;
    for (let i = 0; i < count; i++) {
      objects.push({
        x: i * (cfg.objW + cfg.gap),
        w: cfg.objW,
      });
    }
    return { ...cfg, objType, objects };
  }

  update(dt) {
    if (this.gameOver) return;

    if (this._frog.dead) {
      this._frog.deathTimer -= dt;
      if (this._frog.deathTimer <= 0) {
        if (this.lives <= 0) {
          this.gameOver = true;
          this._emitHud();
          return;
        }
        this._initFrog();
      }
      return;
    }

    if (this._moveCooldown > 0) this._moveCooldown -= dt;

    // Move lane objects
    for (let r = 0; r < ROWS; r++) {
      const lane = this._lanes[r];
      if (!lane) continue;
      for (const obj of lane.objects) {
        obj.x += lane.speed * lane.dir * dt;
        // Wrap around
        if (lane.dir > 0 && obj.x > GAME_W + 20) {
          obj.x = -obj.w - 20;
        } else if (lane.dir < 0 && obj.x + obj.w < -20) {
          obj.x = GAME_W + 20;
        }
      }
    }

    // Frog on river — must be on a log
    const frogRow = this._frog.row;
    const frogType = LANE_TYPES[frogRow];
    this._frog.ridingObj = null;

    if (frogType === 'river') {
      const lane = this._lanes[frogRow];
      const frogX = this._frog.col * CELL;
      let onLog = false;
      for (const obj of lane.objects) {
        if (frogX + CELL > obj.x && frogX < obj.x + obj.w) {
          onLog = true;
          this._frog.ridingObj = obj;
          // Move frog with log
          const moveX = lane.speed * lane.dir * dt;
          const newCol = this._frog.col + moveX / CELL;
          this._frog.col = newCol;
          break;
        }
      }
      if (!onLog) {
        this._killFrog();
        return;
      }
      // Fell off screen
      if (this._frog.col * CELL < -CELL || this._frog.col * CELL > GAME_W) {
        this._killFrog();
        return;
      }
    }

    // Frog on road — check vehicle collision
    if (frogType === 'road') {
      const lane = this._lanes[frogRow];
      const frogX = this._frog.col * CELL;
      for (const obj of lane.objects) {
        if (frogX + CELL - 4 > obj.x && frogX + 4 < obj.x + obj.w) {
          this._killFrog();
          return;
        }
      }
    }

    // Goal check
    if (frogType === 'goal') {
      let landed = false;
      for (let i = 0; i < GOAL_SLOTS; i++) {
        const gx = GOAL_POSITIONS[i];
        if (Math.abs(Math.round(this._frog.col) - gx) <= 1 && !this._goalsFilled[i]) {
          this._goalsFilled[i] = true;
          this.score += 50;
          landed = true;
          break;
        }
      }
      if (!landed) {
        this._killFrog();
        return;
      }
      this._emitHud();
      // Check if all goals filled
      if (this._goalsFilled.every(Boolean)) {
        this.score += 100;
        this.level++;
        this._goalsFilled.fill(false);
        this._initLanes();
        this._emitHud();
      }
      this._initFrog();
    }
  }

  _killFrog() {
    this._frog.dead = true;
    this._frog.deathTimer = 0.8;
    this.lives--;
    this._emitHud();
  }

  _moveFrog(dx, dy) {
    if (this._frog.dead || this._moveCooldown > 0 || this.gameOver) return;
    const newCol = Math.round(this._frog.col) + dx;
    const newRow = this._frog.row + dy;
    if (newCol < 0 || newCol >= COLS || newRow < 0 || newRow >= ROWS) return;

    this._frog.col = newCol;
    this._frog.row = newRow;
    this._moveCooldown = MOVE_COOLDOWN;

    // Score for forward progress
    if (newRow < this._highestRow) {
      this.score += 10;
      this._highestRow = newRow;
      this._emitHud();
    }
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

    this._renderLanes(ctx);
    this._renderGoals(ctx);
    this._renderObjects(ctx);
    this._renderFrog(ctx);

    ctx.restore();
  }

  _renderLanes(ctx) {
    for (let r = 0; r < ROWS; r++) {
      const type = LANE_TYPES[r];
      const y = r * CELL;
      if (type === 'river') {
        ctx.fillStyle = 'rgba(0, 50, 100, 0.5)';
        ctx.fillRect(0, y, GAME_W, CELL);
      } else if (type === 'road') {
        ctx.fillStyle = 'rgba(40, 40, 60, 0.5)';
        ctx.fillRect(0, y, GAME_W, CELL);
      } else if (type === 'safe' || type === 'start') {
        ctx.fillStyle = 'rgba(0, 229, 255, 0.05)';
        ctx.fillRect(0, y, GAME_W, CELL);
      }
    }
  }

  _renderGoals(ctx) {
    for (let i = 0; i < GOAL_SLOTS; i++) {
      const gx = GOAL_POSITIONS[i] * CELL;
      ctx.save();
      if (this._goalsFilled[i]) {
        ctx.shadowColor = CYAN;
        ctx.shadowBlur = 6;
        ctx.fillStyle = CYAN;
      } else {
        ctx.fillStyle = 'rgba(0, 229, 255, 0.2)';
      }
      ctx.fillRect(gx, 0, CELL * 2, CELL);
      ctx.restore();
    }
  }

  _renderObjects(ctx) {
    for (let r = 0; r < ROWS; r++) {
      const lane = this._lanes[r];
      if (!lane) continue;
      const y = r * CELL;

      ctx.save();
      if (lane.objType === 'log') {
        ctx.shadowColor = CYAN;
        ctx.shadowBlur = 3;
        ctx.fillStyle = 'rgba(0, 180, 200, 0.6)';
      } else {
        ctx.shadowColor = ORANGE;
        ctx.shadowBlur = 4;
        ctx.fillStyle = ORANGE;
      }

      for (const obj of lane.objects) {
        ctx.beginPath();
        ctx.roundRect(obj.x, y + 2, obj.w, CELL - 4, 3);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _renderFrog(ctx) {
    const f = this._frog;
    if (f.dead) {
      // Death flash
      if (Math.floor(f.deathTimer * 10) % 2 === 0) return;
      ctx.save();
      ctx.fillStyle = ORANGE;
      ctx.fillRect(f.col * CELL + 2, f.row * CELL + 2, CELL - 4, CELL - 4);
      ctx.restore();
      return;
    }

    const x = f.col * CELL;
    const y = f.row * CELL;
    ctx.save();
    ctx.shadowColor = CYAN;
    ctx.shadowBlur = 8;
    ctx.fillStyle = CYAN;

    // Frog body
    ctx.beginPath();
    ctx.roundRect(x + 3, y + 3, CELL - 6, CELL - 6, 5);
    ctx.fill();

    // Eyes
    ctx.fillStyle = BG;
    ctx.fillRect(x + 7, y + 6, 4, 4);
    ctx.fillRect(x + CELL - 11, y + 6, 4, 4);

    ctx.restore();
  }

  resize(width, height) {
    this.canvasW = width;
    this.canvasH = height;
    this._computeTransform();
  }

  handleKeyDown(key) {
    if (key === 'ArrowUp') this._moveFrog(0, -1);
    if (key === 'ArrowDown') this._moveFrog(0, 1);
    if (key === 'ArrowLeft') this._moveFrog(-1, 0);
    if (key === 'ArrowRight') this._moveFrog(1, 0);
  }

  handleKeyUp(_key) {}

  handleTouchAction(action, active) {
    if (!active) return;
    if (action === 'up') this._moveFrog(0, -1);
    if (action === 'down') this._moveFrog(0, 1);
    if (action === 'left') this._moveFrog(-1, 0);
    if (action === 'right') this._moveFrog(1, 0);
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
