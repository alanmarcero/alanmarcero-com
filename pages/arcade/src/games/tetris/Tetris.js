import { BG, CYAN, VIOLET, ORANGE, WHITE } from '../palette';
import { emitHud } from '../gameHud';

const COLS = 10;
const ROWS = 20;

const GRID_COLOR = 'rgba(0, 240, 255, 0.06)';

const PIECE_COLORS = {
  I: CYAN,
  O: ORANGE,
  T: VIOLET,
  S: CYAN,
  Z: ORANGE,
  J: VIOLET,
  L: WHITE,
};

// SRS tetromino shapes - each piece has 4 rotation states
// Coordinates relative to piece origin
const TETROMINOES = {
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3]],
  ],
  O: [
    [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [0, 1], [1, 1]],
  ],
  T: [
    [[1, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [1, 2]],
  ],
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2]],
  ],
  Z: [
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 0], [0, 1], [1, 1], [0, 2]],
  ],
  J: [
    [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [0, 2], [1, 2]],
  ],
  L: [
    [[2, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]],
    [[0, 0], [1, 0], [1, 1], [1, 2]],
  ],
};

// SRS wall kick data
// Kicks for J, L, S, T, Z pieces
const WALL_KICKS_JLSTZ = {
  '0>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '1>0': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '1>2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '2>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '2>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '3>2': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '3>0': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '0>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};

// Kicks for I piece
const WALL_KICKS_I = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};

const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

const LINE_SCORES = [0, 100, 300, 500, 800];

const DAS_INITIAL_DELAY = 170; // ms before auto-repeat starts
const DAS_REPEAT_RATE = 50;   // ms between repeats

const LINE_CLEAR_FLASH_MS = 200;

// Seconds per gravity step, by level: ~1s at level 1, floored at 0.05s.
const DROP_INTERVALS = [
  1.0, 0.8, 0.65, 0.5, 0.4, 0.32, 0.25, 0.19, 0.14, 0.1,
  0.08, 0.07, 0.06, 0.055, 0.05,
];
const SOFT_DROP_INTERVAL = 0.05;

// Tetris maps the arrows its own way (up rotates, space hard-drops), so it
// keeps its own table rather than the arcade's default key actions.
const KEY_ACTIONS = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowDown: 'down',
  ArrowUp: 'rotate',
  ' ': 'drop',
};

const SHIFT_DIRECTIONS = { left: -1, right: 1 };

/** Seconds between gravity steps at `level`; past the table it stays at the floor. */
export function dropInterval(level) {
  return DROP_INTERVALS[Math.min(level - 1, DROP_INTERVALS.length - 1)];
}

/** Indices of every row with no empty cell, top to bottom. */
export function findFullRows(board) {
  const fullRows = [];
  board.forEach((row, index) => {
    if (row.every((cell) => cell !== null)) fullRows.push(index);
  });
  return fullRows;
}

export class Tetris {
  onHudUpdate = null;

  init(width, height) {
    this.width = width;
    this.height = height;

    // Board state: null = empty, string = color
    this.board = [];
    for (let r = 0; r < ROWS; r++) {
      this.board[r] = new Array(COLS).fill(null);
    }

    this.score = 0;
    this.level = 1;
    this.linesCleared = 0;
    this.gameOver = false;

    // Piece bag (7-bag randomizer)
    this.bag = [];

    this.current = null;
    this.currentX = 0;
    this.currentY = 0;
    this.currentRotation = 0;
    this.currentType = null;

    this.nextType = null;
    this.dropTimer = 0;
    this.softDrop = false;

    // DAS (Delayed Auto Shift) state
    this.dasDirection = 0; // -1 left, 0 none, 1 right
    this.dasTimer = 0;
    this.dasPhase = 'idle'; // 'idle' | 'initial' | 'repeat'

    this.keysHeld = { left: false, right: false };

    // Line clear animation
    this.clearingLines = null; // array of row indices being cleared
    this.clearTimer = 0;

    this._calcLayout();

    this.nextType = this._pullFromBag();
    this._spawnPiece();

    this._emitHud();
  }

  _calcLayout() {
    const w = this.width;
    const h = this.height;

    // Calculate cell size to fit the board in the canvas with some padding
    const padX = w * 0.08;
    const padY = h * 0.04;
    const availW = w - padX * 2;
    const availH = h - padY * 2;

    const cellFromW = Math.floor(availW / (COLS + 6)); // extra space for next-piece preview
    const cellFromH = Math.floor(availH / ROWS);
    this.cellSize = Math.max(1, Math.min(cellFromW, cellFromH));

    const boardW = this.cellSize * COLS;
    const boardH = this.cellSize * ROWS;

    // Center the board slightly to the left to leave room for next-piece preview
    this.boardX = Math.floor((w - boardW - this.cellSize * 5) / 2);
    this.boardY = Math.floor((h - boardH) / 2);

    // Ensure board stays on screen
    if (this.boardX < padX) this.boardX = Math.floor(padX);
    if (this.boardY < padY) this.boardY = Math.floor(padY);

    // Next-piece preview position
    this.previewX = this.boardX + boardW + this.cellSize;
    this.previewY = this.boardY;
  }

  _pullFromBag() {
    if (this.bag.length === 0) {
      // Refill with shuffled set of all 7 pieces
      this.bag = [...PIECE_TYPES];
      // Fisher-Yates shuffle
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop();
  }

  _spawnPiece() {
    this.currentType = this.nextType;
    this.nextType = this._pullFromBag();
    this.currentRotation = 0;
    this.current = TETROMINOES[this.currentType][0];

    // Determine spawn position (centered horizontally, at top)
    const bounds = this._pieceBounds(this.current);
    this.currentX = Math.floor((COLS - (bounds.maxX - bounds.minX + 1)) / 2) - bounds.minX;
    this.currentY = -bounds.minY; // Start so piece top row is at row 0

    this.dropTimer = 0;

    // Check if spawn position is valid
    if (!this._isValid(this.current, this.currentX, this.currentY)) {
      this.gameOver = true;
      this._emitHud();
    }
  }

  _pieceBounds(cells) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, y] of cells) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    return { minX, maxX, minY, maxY };
  }

  _isValid(cells, offX, offY) {
    for (const [cx, cy] of cells) {
      const bx = cx + offX;
      const by = cy + offY;
      if (bx < 0 || bx >= COLS || by >= ROWS) return false;
      // Allow cells above the board (by < 0)
      if (by >= 0 && this.board[by][bx] !== null) return false;
    }
    return true;
  }

  _lockPiece() {
    const color = PIECE_COLORS[this.currentType];
    for (const [cx, cy] of this.current) {
      const bx = cx + this.currentX;
      const by = cy + this.currentY;
      if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
        this.board[by][bx] = color;
      }
    }

    const fullRows = findFullRows(this.board);
    if (fullRows.length === 0) {
      this._spawnPiece();
      return;
    }
    this.clearingLines = fullRows;
    this.clearTimer = LINE_CLEAR_FLASH_MS;
  }

  _clearLines() {
    const lines = this.clearingLines;
    const count = lines.length;

    // Remove cleared rows (from bottom to top to keep indices stable)
    const sorted = [...lines].sort((a, b) => b - a);
    for (const row of sorted) {
      this.board.splice(row, 1);
    }
    // Add empty rows at top
    for (let i = 0; i < count; i++) {
      this.board.unshift(new Array(COLS).fill(null));
    }

    this.score += (LINE_SCORES[count] || 0) * this.level;
    this.linesCleared += count;

    // Level up every 10 lines
    const newLevel = Math.floor(this.linesCleared / 10) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
    }

    this.clearingLines = null;
    this.clearTimer = 0;

    this._emitHud();
    this._spawnPiece();
  }

  _getGhostY() {
    let gy = this.currentY;
    while (this._isValid(this.current, this.currentX, gy + 1)) {
      gy++;
    }
    return gy;
  }

  _rotate(dir) {
    if (this.gameOver) return;
    if (this.currentType === 'O') return; // O doesn't rotate

    const oldRot = this.currentRotation;
    const newRot = (oldRot + dir + 4) % 4;
    const newCells = TETROMINOES[this.currentType][newRot];

    const kickKey = `${oldRot}>${newRot}`;
    const kicks = this.currentType === 'I' ? WALL_KICKS_I[kickKey] : WALL_KICKS_JLSTZ[kickKey];

    if (!kicks) return;

    for (const [kx, ky] of kicks) {
      if (this._isValid(newCells, this.currentX + kx, this.currentY - ky)) {
        this.current = newCells;
        this.currentRotation = newRot;
        this.currentX += kx;
        this.currentY -= ky; // SRS kick y is inverted from board coords
        return;
      }
    }
  }

  _moveHorizontal(dir) {
    if (this.gameOver || this.clearingLines) return;
    if (this._isValid(this.current, this.currentX + dir, this.currentY)) {
      this.currentX += dir;
    }
  }

  _hardDrop() {
    if (this.gameOver || this.clearingLines) return;
    const ghostY = this._getGhostY();
    const rowsDropped = ghostY - this.currentY;
    this.score += rowsDropped * 2; // hard drop bonus
    this.currentY = ghostY;
    this._lockPiece();
    this._emitHud();
  }

  _emitHud() {
    emitHud(this, { lives: undefined });
  }

  update(dt) {
    if (this.gameOver) return;

    // Handle line clear animation
    if (this.clearingLines) {
      this.clearTimer -= dt * 1000;
      if (this.clearTimer <= 0) {
        this._clearLines();
      }
      return;
    }

    this._updateDAS(dt);
    this._updateGravity(dt);
  }

  _updateGravity(dt) {
    const gravityInterval = dropInterval(this.level);
    const interval = this.softDrop ? Math.min(gravityInterval, SOFT_DROP_INTERVAL) : gravityInterval;
    this.dropTimer += dt;
    if (this.dropTimer < interval) return;

    this.dropTimer = 0;
    if (!this._isValid(this.current, this.currentX, this.currentY + 1)) {
      this._lockPiece();
      this._emitHud();
      return;
    }

    this.currentY++;
    if (!this.softDrop) return;
    this.score += 1; // soft drop bonus
    this._emitHud();
  }

  _resetDAS() {
    this.dasDirection = 0;
    this.dasPhase = 'idle';
    this.dasTimer = 0;
  }

  _startDAS(dir) {
    this.dasDirection = dir;
    this.dasPhase = 'initial';
    this.dasTimer = 0;
  }

  _updateDAS(dt) {
    const dir = this.keysHeld.left && !this.keysHeld.right ? -1
      : this.keysHeld.right && !this.keysHeld.left ? 1
      : 0;

    if (dir === 0) {
      this._resetDAS();
      return;
    }

    if (dir !== this.dasDirection) {
      this._startDAS(dir);
      return;
    }

    this.dasTimer += dt * 1000;

    if (this.dasPhase === 'initial') {
      if (this.dasTimer >= DAS_INITIAL_DELAY) {
        this.dasTimer -= DAS_INITIAL_DELAY;
        this.dasPhase = 'repeat';
        this._moveHorizontal(dir);
      }
    }

    if (this.dasPhase === 'repeat') {
      while (this.dasTimer >= DAS_REPEAT_RATE) {
        this.dasTimer -= DAS_REPEAT_RATE;
        this._moveHorizontal(dir);
      }
    }
  }

  render(ctx) {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, this.width, this.height);

    this._drawBoard(ctx);
    this._drawLockedCells(ctx);
    this._drawClearFlash(ctx);
    this._drawFallingPiece(ctx);
    this._drawPreview(ctx);
    this._drawGameOver(ctx);
  }

  _drawBoard(ctx) {
    const cs = this.cellSize;
    const boardW = COLS * cs;
    const boardH = ROWS * cs;
    ctx.fillStyle = 'rgba(6, 6, 14, 0.6)';
    ctx.fillRect(this.boardX, this.boardY, boardW, boardH);

    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
      const x = this.boardX + c * cs;
      ctx.beginPath();
      ctx.moveTo(x, this.boardY);
      ctx.lineTo(x, this.boardY + boardH);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      const y = this.boardY + r * cs;
      ctx.beginPath();
      ctx.moveTo(this.boardX, y);
      ctx.lineTo(this.boardX + boardW, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.boardX, this.boardY, boardW, boardH);
  }

  _drawLockedCells(ctx) {
    const cs = this.cellSize;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.board[r][c]) {
          this._drawCell(ctx, this.boardX + c * cs, this.boardY + r * cs, cs, this.board[r][c], 1.0);
        }
      }
    }
  }

  _drawClearFlash(ctx) {
    if (!this.clearingLines) return;
    const cs = this.cellSize;
    const flashAlpha = Math.min(1, this.clearTimer / LINE_CLEAR_FLASH_MS);
    for (const row of this.clearingLines) {
      ctx.fillStyle = `rgba(232, 230, 240, ${flashAlpha * 0.8})`;
      ctx.fillRect(this.boardX, this.boardY + row * cs, COLS * cs, cs);
    }
  }

  _drawFallingPiece(ctx) {
    if (this.gameOver || !this.current || this.clearingLines) return;

    const ghostY = this._getGhostY();
    if (ghostY !== this.currentY) this._drawPieceCells(ctx, ghostY, 0.2);

    ctx.save();
    ctx.shadowColor = PIECE_COLORS[this.currentType];
    ctx.shadowBlur = 6;
    this._drawPieceCells(ctx, this.currentY, 1.0);
    ctx.restore();
  }

  /** The current piece's cells at row offset `pieceY`, skipping any still above the board. */
  _drawPieceCells(ctx, pieceY, alpha) {
    const cs = this.cellSize;
    const color = PIECE_COLORS[this.currentType];
    for (const [cx, cy] of this.current) {
      const bx = cx + this.currentX;
      const by = cy + pieceY;
      if (by >= 0 && by < ROWS) {
        this._drawCell(ctx, this.boardX + bx * cs, this.boardY + by * cs, cs, color, alpha);
      }
    }
  }

  _drawGameOver(ctx) {
    if (!this.gameOver) return;
    const cs = this.cellSize;
    const boardW = COLS * cs;
    const boardH = ROWS * cs;
    ctx.fillStyle = 'rgba(14, 14, 26, 0.75)';
    ctx.fillRect(this.boardX, this.boardY, boardW, boardH);

    ctx.fillStyle = WHITE;
    ctx.font = `bold ${Math.max(14, cs * 1.2)}px "IBM Plex Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', this.boardX + boardW / 2, this.boardY + boardH / 2);
  }

  _drawCell(ctx, x, y, size, color, alpha) {
    const inset = Math.max(1, size * 0.08);

    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x + inset, y + inset, size - inset * 2, size - inset * 2);

    // Light bevel (top-left highlight)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(x + inset, y + inset, size - inset * 2, Math.max(1, inset));
    ctx.fillRect(x + inset, y + inset, Math.max(1, inset), size - inset * 2);

    // Dark bevel (bottom-right shadow)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x + inset, y + size - inset * 2, size - inset * 2, Math.max(1, inset));
    ctx.fillRect(x + size - inset * 2, y + inset, Math.max(1, inset), size - inset * 2);

    ctx.globalAlpha = 1.0;
  }

  _drawPreview(ctx) {
    if (!this.nextType) return;

    const cs = this.cellSize;
    const previewCellSize = cs * 0.8;
    const cells = TETROMINOES[this.nextType][0];
    const bounds = this._pieceBounds(cells);
    const pw = (bounds.maxX - bounds.minX + 1) * previewCellSize;
    const ph = (bounds.maxY - bounds.minY + 1) * previewCellSize;

    const boxPad = cs * 0.6;
    const boxW = previewCellSize * 4 + boxPad * 2;
    const boxH = previewCellSize * 4 + boxPad * 2;
    const boxX = this.previewX;
    const boxY = this.previewY;

    ctx.fillStyle = 'rgba(6, 6, 14, 0.6)';
    ctx.fillRect(boxX, boxY, boxW, boxH);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // "NEXT" label
    ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
    ctx.font = `bold ${Math.max(9, previewCellSize * 0.55)}px "IBM Plex Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('NEXT', boxX + boxW / 2, boxY - 4);

    // Center piece in preview box
    const offsetX = boxX + (boxW - pw) / 2 - bounds.minX * previewCellSize;
    const offsetY = boxY + (boxH - ph) / 2 - bounds.minY * previewCellSize;

    const color = PIECE_COLORS[this.nextType];
    for (const [cx, cy] of cells) {
      this._drawCell(
        ctx,
        offsetX + cx * previewCellSize,
        offsetY + cy * previewCellSize,
        previewCellSize,
        color,
        1.0
      );
    }
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this._calcLayout();
  }

  handleKeyDown(key) {
    if (this.gameOver) return;
    this._press(KEY_ACTIONS[key]);
  }

  handleKeyUp(key) {
    this._release(KEY_ACTIONS[key]);
  }

  handleTouchAction(action, active) {
    if (active) {
      this._press(action);
      return;
    }
    this._release(action);
  }

  _press(action) {
    if (Object.hasOwn(SHIFT_DIRECTIONS, action)) {
      this._pressShift(action);
      return;
    }
    if (action === 'down') this.softDrop = true;
    if (action === 'rotate') this._rotate(1);
    if (action === 'drop') this._hardDrop();
  }

  _release(action) {
    if (Object.hasOwn(SHIFT_DIRECTIONS, action)) {
      this._releaseShift(action);
      return;
    }
    if (action === 'down') this.softDrop = false;
  }

  // A held key auto-repeats keydown; the guard keeps that from stepping the
  // piece on every repeat, since DAS already owns held-key movement.
  _pressShift(side) {
    if (this.keysHeld[side]) return;
    const dir = SHIFT_DIRECTIONS[side];
    this.keysHeld[side] = true;
    this._moveHorizontal(dir);
    this._startDAS(dir);
  }

  _releaseShift(side) {
    this.keysHeld[side] = false;
    if (this.dasDirection === SHIFT_DIRECTIONS[side]) this._resetDAS();
  }

  destroy() {
    this.board = null;
    this.current = null;
    this.bag = null;
    this.clearingLines = null;
    this.onHudUpdate = null;
  }
}
