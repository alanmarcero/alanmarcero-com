import { CYAN, VIOLET, ORANGE, BG, WHITE, MUTED } from '../palette';

// ---------------------------------------------------------------------------
// Virtual game area — maze is 28x31 tiles, keep square tiles
// ---------------------------------------------------------------------------
const COLS = 28;
const ROWS = 31;
const TILE = 16; // virtual pixels per tile
const GAME_W = COLS * TILE; // 448
const GAME_H = ROWS * TILE; // 496

// ---------------------------------------------------------------------------
// Maze layout  0=dot, 1=wall, 2=empty, 3=power pellet, 4=ghost pen, 5=gate
// ---------------------------------------------------------------------------
const MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
  [1,3,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,3,1],
  [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
  [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,0,1,1,1,1,1,2,1,1,2,1,1,1,1,1,0,1,1,1,1,1,1],
  [1,1,1,1,1,1,0,1,1,1,1,1,2,1,1,2,1,1,1,1,1,0,1,1,1,1,1,1],
  [1,1,1,1,1,1,0,1,1,2,2,2,2,2,2,2,2,2,2,1,1,0,1,1,1,1,1,1],
  [1,1,1,1,1,1,0,1,1,2,1,1,1,5,5,1,1,1,2,1,1,0,1,1,1,1,1,1],
  [1,1,1,1,1,1,0,2,2,2,1,4,4,4,4,4,4,1,2,2,2,0,1,1,1,1,1,1],
  [2,2,2,2,2,2,0,1,1,2,1,4,4,4,4,4,4,1,2,1,1,0,2,2,2,2,2,2],
  [1,1,1,1,1,1,0,1,1,2,1,4,4,4,4,4,4,1,2,1,1,0,1,1,1,1,1,1],
  [1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1],
  [1,1,1,1,1,1,0,1,1,2,2,2,2,2,2,2,2,2,2,1,1,0,1,1,1,1,1,1],
  [1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
  [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
  [1,3,0,0,1,1,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,1,1,0,0,3,1],
  [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
  [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
  [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
  [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// ---------------------------------------------------------------------------
// Directions
// ---------------------------------------------------------------------------
const DIR = {
  LEFT:  { x: -1, y:  0 },
  RIGHT: { x:  1, y:  0 },
  UP:    { x:  0, y: -1 },
  DOWN:  { x:  0, y:  1 },
  NONE:  { x:  0, y:  0 },
};

// ---------------------------------------------------------------------------
// Speeds (tiles per second)
// ---------------------------------------------------------------------------
const PAC_SPEED_BASE = 8.0;
const GHOST_SPEED_BASE = 7.0;
const GHOST_SPEED_FRIGHTENED = 4.5;
const GHOST_SPEED_TUNNEL = 4.0;
const GHOST_SPEED_PEN = 3.0;

// Mode timing: [scatter, chase] pairs — times in seconds
const MODE_TIMINGS = [7, 20, 7, 20, 5, 20, 5, Infinity];

// Frightened duration
const FRIGHT_TIME = 7;
const FRIGHT_FLASH_TIME = 2; // last N seconds of fright = flashing

// Ghost pen release delays (seconds from level start)
const PEN_RELEASE = [0, 3, 7, 12];

// Starting positions (tile coords)
const PAC_START = { col: 14, row: 22 };
const GHOST_STARTS = [
  { col: 14, row: 11 },  // Blinky — starts outside pen
  { col: 14, row: 14 },  // Pinky — in pen
  { col: 12, row: 14 },  // Inky — in pen
  { col: 16, row: 14 },  // Clyde — in pen
];
const GHOST_COLORS = [ORANGE, VIOLET, CYAN, WHITE];
const GHOST_NAMES = ['Blinky', 'Pinky', 'Inky', 'Clyde'];

// Scatter targets (corners)
const SCATTER_TARGETS = [
  { col: 25, row: 0  },  // Blinky — top right
  { col: 2,  row: 0  },  // Pinky — top left
  { col: 27, row: 30 },  // Inky — bottom right
  { col: 0,  row: 30 },  // Clyde — bottom left
];

const STARTING_LIVES = 3;
const DOT_SCORE = 10;
const PELLET_SCORE = 50;
const GHOST_EAT_SCORES = [200, 400, 800, 1600];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function isWalkable(col, row) {
  if (row < 0 || row >= ROWS) return false;
  // Wrap-around tunnel — allow off-screen on row 14
  if (col < 0 || col >= COLS) return row === 14;
  const t = MAZE[row][col];
  // Pac-Man cannot enter walls, ghost pen, or gate
  return t !== 1 && t !== 4 && t !== 5;
}

function canGhostWalk(col, row, ghost) {
  if (row < 0 || row >= ROWS) return false;
  if (col < 0 || col >= COLS) return row === 14;
  const t = MAZE[row][col];
  if (t === 1) return false;
  // Ghosts can pass through gate only when leaving pen
  if (t === 5) return ghost.state === 'leaving_pen' || ghost.state === 'eaten';
  return true;
}

function tileDistance(c1, r1, c2, r2) {
  const dc = c1 - c2;
  const dr = r1 - r2;
  return Math.sqrt(dc * dc + dr * dr);
}

function opposite(dir) {
  if (dir === DIR.LEFT) return DIR.RIGHT;
  if (dir === DIR.RIGHT) return DIR.LEFT;
  if (dir === DIR.UP) return DIR.DOWN;
  if (dir === DIR.DOWN) return DIR.UP;
  return DIR.NONE;
}

// ---------------------------------------------------------------------------
// PacMan class
// ---------------------------------------------------------------------------
export class PacMan {
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

    this._keys = { up: false, down: false, left: false, right: false };
    this._nextDir = DIR.NONE;
    this._currentDir = DIR.NONE;
    this._mouthAngle = 0;
    this._mouthOpen = true;
    this._mouthTimer = 0;
    this._pelletTimer = 0;

    this._buildDots();
    this._initPacMan();
    this._initGhosts();
    this._initMode();

    this._deathTimer = 0;
    this._dying = false;
    this._levelTransition = false;
    this._levelTransitionTimer = 0;
    this._demoMode = true;
    this._demoTimer = 0;

    this._emitHud();
  }

  update(dt) {
    if (this.gameOver) return;

    // Cap dt to avoid physics jumps
    if (dt > 0.05) dt = 0.05;

    // Level transition pause
    if (this._levelTransition) {
      this._levelTransitionTimer -= dt;
      if (this._levelTransitionTimer <= 0) {
        this._levelTransition = false;
        this._startNextLevel();
      }
      return;
    }

    // Death animation
    if (this._dying) {
      this._deathTimer -= dt;
      if (this._deathTimer <= 0) {
        this._dying = false;
        if (this.lives <= 0) {
          this._triggerGameOver();
          return;
        }
        this._initPacMan();
        this._initGhosts();
        this._initMode();
      }
      return;
    }

    this._updateInput();
    this._updatePacMan(dt);
    this._updateMode(dt);
    this._updateGhosts(dt);
    this._checkCollisions();

    // Mouth animation
    this._mouthTimer += dt;
    if (this._mouthTimer > 0.06) {
      this._mouthTimer = 0;
      this._mouthAngle += this._mouthOpen ? 0.08 : -0.08;
      if (this._mouthAngle > 0.8) this._mouthOpen = false;
      if (this._mouthAngle < 0.05) this._mouthOpen = true;
    }

    // Power pellet pulse
    this._pelletTimer += dt;
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

    this._renderMaze(ctx);
    this._renderDots(ctx);
    this._renderGhosts(ctx);
    if (!this._dying) {
      this._renderPacMan(ctx);
    } else {
      this._renderDeathAnim(ctx);
    }

    // Level transition flash
    if (this._levelTransition) {
      const alpha = 0.12 + 0.08 * Math.sin(this._levelTransitionTimer * 14);
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
    this._demoMode = false;
    if (key === 'ArrowLeft') this._keys.left = true;
    if (key === 'ArrowRight') this._keys.right = true;
    if (key === 'ArrowUp') this._keys.up = true;
    if (key === 'ArrowDown') this._keys.down = true;
  }

  handleKeyUp(key) {
    if (key === 'ArrowLeft') this._keys.left = false;
    if (key === 'ArrowRight') this._keys.right = false;
    if (key === 'ArrowUp') this._keys.up = false;
    if (key === 'ArrowDown') this._keys.down = false;
  }

  handleTouchAction(action, active) {
    this._demoMode = false;
    if (action === 'left') this._keys.left = active;
    if (action === 'right') this._keys.right = active;
    if (action === 'up') this._keys.up = active;
    if (action === 'down') this._keys.down = active;
  }

  destroy() {
    // Nothing async to clean up
  }

  // -----------------------------------------------------------------------
  // Transform: letterbox the game area onto the canvas
  // -----------------------------------------------------------------------

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

  // -----------------------------------------------------------------------
  // Init helpers
  // -----------------------------------------------------------------------

  _buildDots() {
    this._dots = [];
    this._totalDots = 0;
    for (let r = 0; r < ROWS; r++) {
      this._dots[r] = [];
      for (let c = 0; c < COLS; c++) {
        const t = MAZE[r][c];
        if (t === 0 || t === 3) {
          this._dots[r][c] = t === 3 ? 3 : 1; // 1=dot, 3=pellet
          this._totalDots++;
        } else {
          this._dots[r][c] = 0;
        }
      }
    }
    this._dotsEaten = 0;
  }

  _initPacMan() {
    this._pac = {
      col: PAC_START.col,
      row: PAC_START.row,
      x: PAC_START.col * TILE + TILE / 2,
      y: PAC_START.row * TILE + TILE / 2,
      dir: DIR.LEFT,
      nextDir: DIR.LEFT,
      moving: false,
    };
    this._currentDir = DIR.LEFT;
    this._nextDir = DIR.LEFT;
  }

  _initGhosts() {
    this._ghosts = [];
    for (let i = 0; i < 4; i++) {
      const s = GHOST_STARTS[i];
      this._ghosts.push({
        col: s.col,
        row: s.row,
        x: s.col * TILE + TILE / 2,
        y: s.row * TILE + TILE / 2,
        dir: i === 0 ? DIR.LEFT : DIR.UP,
        color: GHOST_COLORS[i],
        name: GHOST_NAMES[i],
        index: i,
        state: i === 0 ? 'active' : 'in_pen',
        penTimer: PEN_RELEASE[i],
        frightened: false,
        eaten: false,
        flashOn: false,
      });
    }
    this._ghostEatCount = 0;
  }

  _initMode() {
    this._modeIndex = 0;
    this._modeTimer = MODE_TIMINGS[0];
    this._isChase = false; // start in scatter
    this._frightTimer = 0;
    this._frightActive = false;
  }

  // -----------------------------------------------------------------------
  // Input mapping
  // -----------------------------------------------------------------------

  _updateInput() {
    if (this._demoMode) {
      this._demoAI();
      return;
    }
    if (this._keys.left) this._nextDir = DIR.LEFT;
    else if (this._keys.right) this._nextDir = DIR.RIGHT;
    else if (this._keys.up) this._nextDir = DIR.UP;
    else if (this._keys.down) this._nextDir = DIR.DOWN;
  }

  // -----------------------------------------------------------------------
  // Demo AI — simple autonomous Pac-Man
  // -----------------------------------------------------------------------

  _demoAI() {
    const p = this._pac;
    const col = Math.round((p.x - TILE / 2) / TILE);
    const row = Math.round((p.y - TILE / 2) / TILE);

    // Only decide at tile centers
    const cx = col * TILE + TILE / 2;
    const cy = row * TILE + TILE / 2;
    if (Math.abs(p.x - cx) > 1 || Math.abs(p.y - cy) > 1) return;

    const dirs = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];
    const rev = opposite(this._currentDir);
    const valid = dirs.filter(d => {
      if (d === rev) return false;
      const nc = col + d.x;
      const nr = row + d.y;
      return isWalkable(nc, nr);
    });

    if (valid.length === 0) {
      this._nextDir = rev;
      return;
    }

    // Prefer direction with a dot
    const withDot = valid.filter(d => {
      const nc = col + d.x;
      const nr = row + d.y;
      if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS) {
        return this._dots[nr][nc] > 0;
      }
      return false;
    });

    if (withDot.length > 0) {
      // Prefer continuing straight if it has a dot
      if (withDot.includes(this._currentDir)) {
        this._nextDir = this._currentDir;
      } else {
        this._nextDir = withDot[Math.floor(Math.random() * withDot.length)];
      }
    } else if (valid.includes(this._currentDir)) {
      this._nextDir = this._currentDir;
    } else {
      this._nextDir = valid[Math.floor(Math.random() * valid.length)];
    }
  }

  // -----------------------------------------------------------------------
  // Pac-Man movement
  // -----------------------------------------------------------------------

  _updatePacMan(dt) {
    const p = this._pac;
    const speed = (PAC_SPEED_BASE + (this.level - 1) * 0.3) * TILE;

    // Snap to tile center for easier turning
    const tileX = Math.round((p.x - TILE / 2) / TILE);
    const tileY = Math.round((p.y - TILE / 2) / TILE);
    const centerX = tileX * TILE + TILE / 2;
    const centerY = tileY * TILE + TILE / 2;

    // At or near tile center, try next direction
    const threshold = speed * dt + 1;
    if (Math.abs(p.x - centerX) < threshold && Math.abs(p.y - centerY) < threshold) {
      // Try turning to the buffered direction
      const nc = tileX + this._nextDir.x;
      const nr = tileY + this._nextDir.y;
      if (isWalkable(nc, nr)) {
        this._currentDir = this._nextDir;
        p.x = centerX;
        p.y = centerY;
      }
    }

    // Check if can continue in current direction
    const aheadC = tileX + this._currentDir.x;
    const aheadR = tileY + this._currentDir.y;
    const canContinue = isWalkable(aheadC, aheadR);

    // Moving along the current direction
    if (this._currentDir !== DIR.NONE && canContinue) {
      p.x += this._currentDir.x * speed * dt;
      p.y += this._currentDir.y * speed * dt;
      p.moving = true;
    } else if (this._currentDir !== DIR.NONE) {
      // Hit a wall — snap to center
      p.x = centerX;
      p.y = centerY;
      p.moving = false;
    }

    // Wrap tunnel
    if (p.x < -TILE / 2) p.x += COLS * TILE;
    if (p.x > COLS * TILE + TILE / 2) p.x -= COLS * TILE;

    // Update tile position
    p.col = Math.round((p.x - TILE / 2) / TILE);
    p.row = Math.round((p.y - TILE / 2) / TILE);

    // Eat dots
    const dc = p.col;
    const dr = p.row;
    if (dc >= 0 && dc < COLS && dr >= 0 && dr < ROWS) {
      if (this._dots[dr][dc] === 1) {
        this._dots[dr][dc] = 0;
        this.score += DOT_SCORE;
        this._dotsEaten++;
        this._emitHud();
      } else if (this._dots[dr][dc] === 3) {
        this._dots[dr][dc] = 0;
        this.score += PELLET_SCORE;
        this._dotsEaten++;
        this._activateFrightened();
        this._emitHud();
      }
    }

    // Check level complete
    if (this._dotsEaten >= this._totalDots) {
      this._levelTransition = true;
      this._levelTransitionTimer = 1.5;
    }
  }

  // -----------------------------------------------------------------------
  // Mode / frightened
  // -----------------------------------------------------------------------

  _updateMode(dt) {
    if (this._frightActive) {
      this._frightTimer -= dt;
      // Flash ghosts near end
      const flashing = this._frightTimer < FRIGHT_FLASH_TIME;
      for (const g of this._ghosts) {
        if (g.frightened && !g.eaten) {
          g.flashOn = flashing && Math.floor(this._frightTimer * 6) % 2 === 0;
        }
      }
      if (this._frightTimer <= 0) {
        this._frightActive = false;
        for (const g of this._ghosts) {
          g.frightened = false;
          g.flashOn = false;
        }
      }
      return;
    }

    this._modeTimer -= dt;
    if (this._modeTimer <= 0) {
      this._modeIndex++;
      if (this._modeIndex >= MODE_TIMINGS.length) {
        this._modeIndex = MODE_TIMINGS.length - 1;
      }
      this._modeTimer = MODE_TIMINGS[this._modeIndex];
      this._isChase = this._modeIndex % 2 === 1;
      // Ghosts reverse direction on mode switch
      for (const g of this._ghosts) {
        if (g.state === 'active') {
          g.dir = opposite(g.dir);
        }
      }
    }
  }

  _activateFrightened() {
    this._frightActive = true;
    this._frightTimer = FRIGHT_TIME;
    this._ghostEatCount = 0;
    for (const g of this._ghosts) {
      if (g.state === 'active') {
        g.frightened = true;
        g.flashOn = false;
        g.dir = opposite(g.dir);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Ghost updates
  // -----------------------------------------------------------------------

  _updateGhosts(dt) {
    for (const g of this._ghosts) {
      if (g.state === 'in_pen') {
        this._updateGhostInPen(g, dt);
      } else if (g.state === 'leaving_pen') {
        this._updateGhostLeavingPen(g, dt);
      } else if (g.state === 'eaten') {
        this._updateGhostEaten(g, dt);
      } else {
        this._updateGhostActive(g, dt);
      }
    }
  }

  _updateGhostInPen(g, dt) {
    // Bobble up and down
    g.y += (g.dir.y || 1) * GHOST_SPEED_PEN * TILE * dt;
    const minY = 13 * TILE + TILE / 2;
    const maxY = 15 * TILE + TILE / 2;
    if (g.y < minY) { g.y = minY; g.dir = DIR.DOWN; }
    if (g.y > maxY) { g.y = maxY; g.dir = DIR.UP; }

    g.penTimer -= dt;
    if (g.penTimer <= 0) {
      g.state = 'leaving_pen';
      g.x = 14 * TILE + TILE / 2; // center of gate
      g.dir = DIR.UP;
    }
  }

  _updateGhostLeavingPen(g, dt) {
    const targetX = 14 * TILE + TILE / 2;
    const targetY = 11 * TILE + TILE / 2;
    const speed = GHOST_SPEED_PEN * TILE;

    // First move to center column
    if (Math.abs(g.x - targetX) > 1) {
      g.x += (g.x < targetX ? 1 : -1) * speed * dt;
    } else {
      g.x = targetX;
      g.y -= speed * dt;
    }

    if (g.y <= targetY) {
      g.y = targetY;
      g.col = 14;
      g.row = 11;
      g.state = 'active';
      g.dir = DIR.LEFT;
    }
  }

  _updateGhostEaten(g, dt) {
    // Rush back to pen
    const speed = PAC_SPEED_BASE * 2 * TILE;
    const targetCol = 14;
    const targetRow = 14;

    this._moveGhostToward(g, targetCol, targetRow, speed, dt);

    if (Math.abs(g.col - targetCol) <= 0 && Math.abs(g.row - targetRow) <= 0 &&
        Math.abs(g.x - (targetCol * TILE + TILE / 2)) < 2 &&
        Math.abs(g.y - (targetRow * TILE + TILE / 2)) < 2) {
      g.eaten = false;
      g.frightened = false;
      g.state = 'leaving_pen';
      g.x = targetCol * TILE + TILE / 2;
      g.y = targetRow * TILE + TILE / 2;
    }
  }

  _updateGhostActive(g, dt) {
    // Determine speed
    let speed;
    const inTunnel = g.row === 14 && (g.col < 6 || g.col > 21);
    if (g.frightened) {
      speed = GHOST_SPEED_FRIGHTENED;
    } else if (inTunnel) {
      speed = GHOST_SPEED_TUNNEL;
    } else {
      speed = GHOST_SPEED_BASE + (this.level - 1) * 0.4;
    }
    speed *= TILE;

    // Get target tile
    const target = g.frightened ? this._randomTarget(g) : this._getGhostTarget(g);

    this._moveGhostToward(g, target.col, target.row, speed, dt);
  }

  _moveGhostToward(g, targetCol, targetRow, speed, dt) {
    const col = Math.round((g.x - TILE / 2) / TILE);
    const row = Math.round((g.y - TILE / 2) / TILE);
    const centerX = col * TILE + TILE / 2;
    const centerY = row * TILE + TILE / 2;
    const threshold = speed * dt + 1;

    if (Math.abs(g.x - centerX) < threshold && Math.abs(g.y - centerY) < threshold) {
      g.x = centerX;
      g.y = centerY;
      g.col = col;
      g.row = row;

      // Pick next direction at intersection
      const dirs = [DIR.UP, DIR.LEFT, DIR.DOWN, DIR.RIGHT];
      const rev = opposite(g.dir);

      let bestDir = g.dir;
      let bestDist = Infinity;

      for (const d of dirs) {
        if (d === rev) continue;
        const nc = col + d.x;
        const nr = row + d.y;
        if (!canGhostWalk(nc, nr, g)) continue;
        const dist = tileDistance(nc, nr, targetCol, targetRow);
        if (dist < bestDist) {
          bestDist = dist;
          bestDir = d;
        }
      }

      // If no direction found (dead end), reverse
      if (bestDist === Infinity) {
        bestDir = rev;
      }

      g.dir = bestDir;
    }

    // Move
    g.x += g.dir.x * speed * dt;
    g.y += g.dir.y * speed * dt;

    // Tunnel wrapping
    if (g.x < -TILE / 2) g.x += COLS * TILE;
    if (g.x > COLS * TILE + TILE / 2) g.x -= COLS * TILE;

    g.col = Math.round((g.x - TILE / 2) / TILE);
    g.row = Math.round((g.y - TILE / 2) / TILE);
  }

  _getGhostTarget(g) {
    if (!this._isChase) {
      return SCATTER_TARGETS[g.index];
    }

    const pc = this._pac.col;
    const pr = this._pac.row;
    const pd = this._currentDir;

    switch (g.index) {
      case 0: // Blinky — targets pac directly
        return { col: pc, row: pr };
      case 1: { // Pinky — 4 tiles ahead of pac
        let tc = pc + pd.x * 4;
        let tr = pr + pd.y * 4;
        // Original bug: if pac faces up, also offset left by 4
        if (pd === DIR.UP) tc -= 4;
        return { col: tc, row: tr };
      }
      case 2: { // Inky — mirror of Blinky relative to 2 ahead of pac
        const ahead2c = pc + pd.x * 2;
        const ahead2r = pr + pd.y * 2;
        const bc = this._ghosts[0].col;
        const br = this._ghosts[0].row;
        return { col: ahead2c * 2 - bc, row: ahead2r * 2 - br };
      }
      case 3: { // Clyde — chase when >8 tiles, else scatter
        const dist = tileDistance(g.col, g.row, pc, pr);
        if (dist > 8) return { col: pc, row: pr };
        return SCATTER_TARGETS[3];
      }
      default:
        return { col: pc, row: pr };
    }
  }

  _randomTarget(_g) {
    // Frightened mode: pick random direction at intersections
    // We encode this as a random target far away
    return {
      col: Math.floor(Math.random() * COLS),
      row: Math.floor(Math.random() * ROWS),
    };
  }

  // -----------------------------------------------------------------------
  // Collisions
  // -----------------------------------------------------------------------

  _checkCollisions() {
    const p = this._pac;
    for (const g of this._ghosts) {
      if (g.state !== 'active') continue;
      const dist = Math.abs(p.x - g.x) + Math.abs(p.y - g.y);
      if (dist < TILE * 0.8) {
        if (g.frightened && !g.eaten) {
          // Eat ghost
          g.eaten = true;
          g.frightened = false;
          g.state = 'eaten';
          this.score += GHOST_EAT_SCORES[Math.min(this._ghostEatCount, 3)];
          this._ghostEatCount++;
          this._emitHud();
        } else if (!g.eaten) {
          // Pac-Man dies
          this._dying = true;
          this._deathTimer = 1.0;
          this.lives--;
          this._emitHud();
        }
      }
    }
  }

  // -----------------------------------------------------------------------
  // Level progression
  // -----------------------------------------------------------------------

  _startNextLevel() {
    this.level++;
    this._buildDots();
    this._initPacMan();
    this._initGhosts();
    this._initMode();
    this._emitHud();
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
  // Rendering: Maze
  // -----------------------------------------------------------------------

  _renderMaze(ctx) {
    ctx.save();
    ctx.strokeStyle = CYAN;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = CYAN;
    ctx.shadowBlur = 6;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = MAZE[r][c];
        if (t !== 1) continue;

        const x = c * TILE;
        const y = r * TILE;

        // Draw wall segments — check neighbors and draw edges facing paths
        const top    = r > 0 && MAZE[r - 1][c] !== 1;
        const bottom = r < ROWS - 1 && MAZE[r + 1][c] !== 1;
        const left   = c > 0 && MAZE[r][c - 1] !== 1;
        const right  = c < COLS - 1 && MAZE[r][c + 1] !== 1;

        if (top) { ctx.beginPath(); ctx.moveTo(x, y + 0.5); ctx.lineTo(x + TILE, y + 0.5); ctx.stroke(); }
        if (bottom) { ctx.beginPath(); ctx.moveTo(x, y + TILE - 0.5); ctx.lineTo(x + TILE, y + TILE - 0.5); ctx.stroke(); }
        if (left) { ctx.beginPath(); ctx.moveTo(x + 0.5, y); ctx.lineTo(x + 0.5, y + TILE); ctx.stroke(); }
        if (right) { ctx.beginPath(); ctx.moveTo(x + TILE - 0.5, y); ctx.lineTo(x + TILE - 0.5, y + TILE); ctx.stroke(); }
      }
    }

    // Ghost gate
    ctx.strokeStyle = VIOLET;
    ctx.shadowColor = VIOLET;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(13 * TILE, 12 * TILE + TILE);
    ctx.lineTo(15 * TILE, 12 * TILE + TILE);
    ctx.stroke();

    ctx.restore();
  }

  // -----------------------------------------------------------------------
  // Rendering: Dots & pellets
  // -----------------------------------------------------------------------

  _renderDots(ctx) {
    ctx.save();
    ctx.fillStyle = CYAN;
    ctx.shadowColor = CYAN;
    ctx.shadowBlur = 2;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const d = this._dots[r][c];
        if (d === 0) continue;

        const cx = c * TILE + TILE / 2;
        const cy = r * TILE + TILE / 2;

        if (d === 1) {
          // Small dot
          ctx.beginPath();
          ctx.arc(cx, cy, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (d === 3) {
          // Power pellet — pulsing
          const pulse = 3.5 + Math.sin(this._pelletTimer * 6) * 1.5;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(cx, cy, pulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 2;
        }
      }
    }
    ctx.restore();
  }

  // -----------------------------------------------------------------------
  // Rendering: Pac-Man
  // -----------------------------------------------------------------------

  _renderPacMan(ctx) {
    const p = this._pac;
    ctx.save();
    ctx.fillStyle = ORANGE;
    ctx.shadowColor = ORANGE;
    ctx.shadowBlur = 10;

    const cx = p.x;
    const cy = p.y;
    const radius = TILE * 0.55;

    // Determine mouth angle from direction
    let angle = 0; // facing right
    if (this._currentDir === DIR.LEFT) angle = Math.PI;
    else if (this._currentDir === DIR.UP) angle = -Math.PI / 2;
    else if (this._currentDir === DIR.DOWN) angle = Math.PI / 2;

    const mouth = p.moving ? this._mouthAngle : 0.15;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, angle + mouth, angle + Math.PI * 2 - mouth);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  _renderDeathAnim(ctx) {
    const p = this._pac;
    ctx.save();
    ctx.fillStyle = ORANGE;
    ctx.shadowColor = ORANGE;
    ctx.shadowBlur = 10;

    const progress = 1 - (this._deathTimer / 1.0);
    const radius = TILE * 0.55;
    const spread = progress * Math.PI;

    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, -Math.PI / 2 + spread, -Math.PI / 2 + Math.PI * 2 - spread);
    ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // -----------------------------------------------------------------------
  // Rendering: Ghosts
  // -----------------------------------------------------------------------

  _renderGhosts(ctx) {
    for (const g of this._ghosts) {
      if (g.state === 'in_pen' || g.state === 'leaving_pen') {
        this._renderGhostBody(ctx, g, g.color);
      } else if (g.eaten) {
        this._renderGhostEyes(ctx, g);
      } else if (g.frightened) {
        const color = g.flashOn ? WHITE : MUTED;
        this._renderFrightenedGhost(ctx, g, color);
      } else {
        this._renderGhostBody(ctx, g, g.color);
      }
    }
  }

  _renderGhostBody(ctx, g, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;

    const cx = g.x;
    const cy = g.y;
    const r = TILE * 0.55;

    // Rounded top
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.15, r, Math.PI, 0);

    // Body sides
    const bottom = cy + r * 0.75;
    ctx.lineTo(cx + r, bottom);

    // Wavy bottom (3 waves)
    const wave = r / 3;
    for (let i = 2; i >= -3; i--) {
      const wx = cx + r - (3 - i) * wave;
      const wy = bottom + ((i + 3) % 2 === 0 ? -wave * 0.5 : wave * 0.3);
      ctx.lineTo(wx, wy);
    }

    ctx.lineTo(cx - r, bottom);
    ctx.lineTo(cx - r, cy - r * 0.15);
    ctx.closePath();
    ctx.fill();

    // Eyes
    ctx.shadowBlur = 0;
    this._renderGhostEyes(ctx, g);
    ctx.restore();
  }

  _renderGhostEyes(ctx, g) {
    const cx = g.x;
    const cy = g.y;
    const eyeR = TILE * 0.14;
    const pupilR = TILE * 0.07;

    // Eye direction offset
    let dx = 0, dy = 0;
    if (g.dir === DIR.LEFT) dx = -pupilR;
    else if (g.dir === DIR.RIGHT) dx = pupilR;
    else if (g.dir === DIR.UP) dy = -pupilR;
    else if (g.dir === DIR.DOWN) dy = pupilR;

    // Left eye white
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.arc(cx - TILE * 0.17, cy - TILE * 0.1, eyeR, 0, Math.PI * 2);
    ctx.fill();

    // Right eye white
    ctx.beginPath();
    ctx.arc(cx + TILE * 0.17, cy - TILE * 0.1, eyeR, 0, Math.PI * 2);
    ctx.fill();

    // Left pupil
    ctx.fillStyle = BG;
    ctx.beginPath();
    ctx.arc(cx - TILE * 0.17 + dx, cy - TILE * 0.1 + dy, pupilR, 0, Math.PI * 2);
    ctx.fill();

    // Right pupil
    ctx.beginPath();
    ctx.arc(cx + TILE * 0.17 + dx, cy - TILE * 0.1 + dy, pupilR, 0, Math.PI * 2);
    ctx.fill();
  }

  _renderFrightenedGhost(ctx, g, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;

    const cx = g.x;
    const cy = g.y;
    const r = TILE * 0.55;

    // Same body shape
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.15, r, Math.PI, 0);
    const bottom = cy + r * 0.75;
    ctx.lineTo(cx + r, bottom);

    const wave = r / 3;
    for (let i = 2; i >= -3; i--) {
      const wx = cx + r - (3 - i) * wave;
      const wy = bottom + ((i + 3) % 2 === 0 ? -wave * 0.5 : wave * 0.3);
      ctx.lineTo(wx, wy);
    }

    ctx.lineTo(cx - r, bottom);
    ctx.lineTo(cx - r, cy - r * 0.15);
    ctx.closePath();
    ctx.fill();

    // Frightened eyes — simple small dots
    ctx.shadowBlur = 0;
    ctx.fillStyle = WHITE;
    const eyeR = TILE * 0.08;
    ctx.beginPath();
    ctx.arc(cx - TILE * 0.15, cy - TILE * 0.08, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + TILE * 0.15, cy - TILE * 0.08, eyeR, 0, Math.PI * 2);
    ctx.fill();

    // Wavy mouth
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const mouthY = cy + TILE * 0.15;
    ctx.moveTo(cx - TILE * 0.25, mouthY);
    for (let i = 0; i < 4; i++) {
      const mx = cx - TILE * 0.25 + (i + 0.5) * (TILE * 0.125);
      const my = mouthY + (i % 2 === 0 ? -TILE * 0.06 : TILE * 0.06);
      ctx.lineTo(mx, my);
    }
    ctx.lineTo(cx + TILE * 0.25, mouthY);
    ctx.stroke();

    ctx.restore();
  }
}
