/**
 * Pac-Man — a from-scratch reimplementation of the 1980 arcade game.
 *
 * This file owns state and timing only. The maze, the level tables and the
 * ghost decision rules live in their own modules so they can be tested without
 * a canvas; the drawing lives in PacManRenderer.
 */

import { emitHud } from '../gameHud';
import {
  COLS, TILE, TUNNEL_ROW, PAC_START, HOUSE_DOOR, HOUSE_CENTER,
  buildGrid, tileAt, isWalkable, wrapCol, atTileCenter,
} from './maze';
import {
  VECTORS, reverseOf, chaseTarget, scatterTarget, chooseDirection,
  chooseFrightenedDirection, distanceSquared,
} from './ghostAI';
import {
  SCORE, STARTING_LIVES, FRUIT_SPAWN_DOTS, FRUIT_VISIBLE_SECS,
  speedsForLevel, wavesForLevel, frightForLevel, elroyForLevel,
  houseDotsForLevel, houseTimeoutSecs, fruitForLevel,
} from './levels';
import * as R from './PacManRenderer';

/**
 * Logic runs on a fixed step so movement is deterministic and cannot stutter
 * when requestAnimationFrame jitters. Rendering still happens once per frame.
 */
const STEP = 1 / 120;
const MAX_FRAME = 0.25;

const GHOST_NAMES = ['blinky', 'pinky', 'inky', 'clyde'];

const READY_SECS = 2.0;
const DEATH_SECS = 1.6;
const LEVEL_CLEAR_SECS = 1.8;
const GHOST_SCORE_PAUSE = 0.7;

/** Guards the centre-to-centre walk against spinning if a step is huge. */
const MAX_GHOST_HOPS = 4;
const CENTER_EPS = 1e-6;

export class PacMan {
  onHudUpdate = null;

  constructor() {
    this._accumulator = 0;
    this._canvasW = R.GAME_W;
    this._canvasH = R.GAME_H;
    this._transform = { scale: 1, offsetX: 0, offsetY: 0 };
  }

  init(width, height) {
    this.score = 0;
    this.lives = STARTING_LIVES;
    this.level = 1;
    this.gameOver = false;

    this._fruitHistory = [];
    this._extraLifeAwarded = false;
    this._startLevel();
    this.resize(width, height);
    this._emitHud();
  }

  resize(width, height) {
    this._canvasW = width;
    this._canvasH = height;
    const scale = Math.min(width / R.GAME_W, height / R.GAME_H);
    this._transform = {
      scale,
      offsetX: (width - R.GAME_W * scale) / 2,
      offsetY: (height - R.GAME_H * scale) / 2,
    };
  }

  // ---------------------------------------------------------------------
  // Level and actor setup
  // ---------------------------------------------------------------------

  _startLevel() {
    this._grid = buildGrid();
    this._dotsEaten = 0;
    this._totalDots = this._grid.flat().filter((t) => t === TILE.DOT || t === TILE.ENERGIZER).length;
    this._speeds = speedsForLevel(this.level);
    this._waves = wavesForLevel(this.level);
    this._fright = frightForLevel(this.level);
    this._elroy = elroyForLevel(this.level);
    this._houseDots = houseDotsForLevel(this.level);
    this._fruitSpawned = 0;
    this._fruit = null;
    this._resetActors();
  }

  _resetActors() {
    this._phase = 'ready';
    this._phaseTimer = READY_SECS;
    this._waveIndex = 0;
    this._waveTimer = this._waves[0];
    this._mode = 'scatter';
    this._frightTimer = 0;
    this._ghostChain = 0;
    this._scorePopup = null;
    this._globalDotTimer = 0;
    this._mouthPhase = 0;
    this._footPhase = 0;
    this._energizerBlink = 0;

    this._pac = {
      col: PAC_START.col,
      row: PAC_START.row,
      dir: PAC_START.dir,
      wanted: PAC_START.dir,
    };

    this._ghosts = GHOST_NAMES.map((name, index) => this._makeGhost(name, index));
  }

  _makeGhost(name, index) {
    // Blinky starts on the door tile already loose; the other three are penned.
    const penned = name !== 'blinky';
    const slot = { pinky: 0, inky: -1, clyde: 1 }[name] ?? 0;

    return {
      name,
      col: penned ? HOUSE_CENTER.col + slot * 2 : HOUSE_DOOR.col,
      row: penned ? HOUSE_CENTER.row : HOUSE_DOOR.row,
      dir: index % 2 === 0 ? 'left' : 'up',
      state: penned ? 'house' : 'active',
      dotCounter: 0,
      bob: 0,
      elroy: 0,
    };
  }

  // ---------------------------------------------------------------------
  // Loop
  // ---------------------------------------------------------------------

  update(dt) {
    this._accumulator += Math.min(dt, MAX_FRAME);
    while (this._accumulator >= STEP) {
      this._step(STEP);
      this._accumulator -= STEP;
    }
  }

  _step(dt) {
    this._energizerBlink = (this._energizerBlink + dt) % 0.4;

    if (this._phase === 'ready') {
      this._phaseTimer -= dt;
      if (this._phaseTimer <= 0) this._phase = 'playing';
      return;
    }

    if (this._phase === 'dying') {
      this._phaseTimer -= dt;
      if (this._phaseTimer <= 0) this._afterDeath();
      return;
    }

    if (this._phase === 'levelClear') {
      this._phaseTimer -= dt;
      if (this._phaseTimer <= 0) {
        this.level += 1;
        this._startLevel();
        this._emitHud();
      }
      return;
    }

    if (this._phase === 'ghostScore') {
      this._phaseTimer -= dt;
      if (this._phaseTimer <= 0) {
        this._phase = 'playing';
        this._scorePopup = null;
      }
      return;
    }

    if (this._phase !== 'playing') return;

    this._updateModeTimers(dt);
    this._updatePac(dt);
    this._updateGhosts(dt);
    this._updateFruit(dt);
    this._checkCollisions();
  }

  _updateModeTimers(dt) {
    if (this._frightTimer > 0) {
      this._frightTimer -= dt;
      if (this._frightTimer <= 0) {
        this._frightTimer = 0;
        this._ghostChain = 0;
        this._ghosts.forEach((g) => {
          if (g.state === 'frightened') g.state = 'active';
        });
      }
      // Scatter/chase is suspended while an energizer is running.
      return;
    }

    if (this._waveTimer === Infinity) return;

    this._waveTimer -= dt;
    if (this._waveTimer > 0) return;

    this._waveIndex += 1;
    this._waveTimer = this._waves[Math.min(this._waveIndex, this._waves.length - 1)];
    this._mode = this._mode === 'scatter' ? 'chase' : 'scatter';
    this._forceReverse();
  }

  /** A mode flip turns every loose ghost around. They never choose to reverse. */
  _forceReverse() {
    this._ghosts.forEach((g) => {
      if (g.state === 'active' || g.state === 'frightened') g.pendingReverse = true;
    });
  }

  // ---------------------------------------------------------------------
  // Pac-Man movement — buffered turns, cornering, instant reversal
  // ---------------------------------------------------------------------

  _updatePac(dt) {
    const pac = this._pac;
    const speed = (this._frightTimer > 0 ? this._speeds.pacFright : this._speeds.pac) * dt;

    this._mouthPhase = (this._mouthPhase + dt * 9) % (Math.PI * 2);

    // A reversal is always legal and takes effect immediately — no waiting for
    // a tile centre. This is most of what makes the controls feel responsive.
    if (pac.wanted === reverseOf(pac.dir)) {
      pac.dir = pac.wanted;
    }

    // Cornering: the requested turn is taken as soon as the destination tile is
    // open, while Pac-Man is still short of the centre. He tracks onto the new
    // axis early, cutting the corner. Ghosts cannot do this, so it is a real
    // and earned speed advantage.
    if (pac.wanted !== pac.dir && this._canTurn(pac, pac.wanted)) {
      const axisIsVertical = pac.wanted === 'up' || pac.wanted === 'down';
      if (axisIsVertical) pac.col = Math.round(pac.col);
      if (!axisIsVertical) pac.row = Math.round(pac.row);
      pac.dir = pac.wanted;
    }

    const v = VECTORS[pac.dir];
    const nextCol = pac.col + v.col * speed;
    const nextRow = pac.row + v.row * speed;

    const blocked = this._blockedAhead(pac, nextCol, nextRow);
    if (blocked) {
      // Settle exactly on the centre of the tile we are stopped in.
      pac.col = Math.round(pac.col);
      pac.row = Math.round(pac.row);
    }
    if (!blocked) {
      pac.col = wrapCol(nextCol);
      pac.row = nextRow;
    }

    // Always eat, including when stopped against a wall — the arcade still
    // credits the pellet on the tile Pac-Man is standing on.
    this._eatTileUnder(pac);
  }

  /**
   * A turn is available when we are close enough to a tile centre and the tile
   * on the requested side is open. The generous epsilon is the pre-turn window:
   * press early and the turn is remembered rather than dropped.
   */
  _canTurn(actor, dir) {
    const turningVertical = dir === 'up' || dir === 'down';
    const alongAxis = turningVertical ? actor.col : actor.row;
    if (!atTileCenter(alongAxis, 0.35)) return false;

    const v = VECTORS[dir];
    const col = Math.round(actor.col) + v.col;
    const row = Math.round(actor.row) + v.row;
    return isWalkable(this._grid, col, row);
  }

  _blockedAhead(actor, nextCol, nextRow) {
    const v = VECTORS[actor.dir];
    // Look at the tile the leading edge is about to enter.
    const probeCol = Math.round(nextCol + v.col * 0.5);
    const probeRow = Math.round(nextRow + v.row * 0.5);
    if (probeRow === Math.round(actor.row) && probeCol === wrapCol(Math.round(actor.col))) return false;
    return !isWalkable(this._grid, probeCol, probeRow);
  }

  _eatTileUnder(pac) {
    if (!atTileCenter(pac.col, 0.3) || !atTileCenter(pac.row, 0.3)) return;

    const col = wrapCol(Math.round(pac.col));
    const row = Math.round(pac.row);
    const tile = tileAt(this._grid, col, row);
    if (tile !== TILE.DOT && tile !== TILE.ENERGIZER) return;

    this._grid[row][col] = TILE.EMPTY;
    this._dotsEaten += 1;
    this._addScore(tile === TILE.ENERGIZER ? SCORE.ENERGIZER : SCORE.DOT);
    this._releaseOnDotCount();
    this._updateElroy();

    if (tile === TILE.ENERGIZER) this._activateFrightened();
    if (FRUIT_SPAWN_DOTS.includes(this._dotsEaten)) this._spawnFruit();

    if (this._dotsEaten >= this._totalDots) {
      this._phase = 'levelClear';
      this._phaseTimer = LEVEL_CLEAR_SECS;
    }
  }

  _addScore(points) {
    this.score += points;
    if (!this._extraLifeAwarded && this.score >= SCORE.EXTRA_LIFE_AT) {
      this._extraLifeAwarded = true;
      this.lives += 1;
    }
    this._emitHud();
  }

  _activateFrightened() {
    if (this._fright.secs <= 0) return;
    this._frightTimer = this._fright.secs;
    this._ghostChain = 0;
    this._ghosts.forEach((g) => {
      if (g.state === 'active') {
        g.state = 'frightened';
        g.pendingReverse = true;
      }
    });
  }

  /** Blinky's two speed-ups as the maze empties. */
  _updateElroy() {
    const remaining = this._totalDots - this._dotsEaten;
    const blinky = this._ghosts.find((g) => g.name === 'blinky');
    if (!blinky) return;
    if (remaining <= this._elroy.dots2) blinky.elroy = 2;
    else if (remaining <= this._elroy.dots1) blinky.elroy = 1;
    else blinky.elroy = 0;
  }

  // ---------------------------------------------------------------------
  // Ghosts
  // ---------------------------------------------------------------------

  _updateGhosts(dt) {
    this._footPhase = (this._footPhase + dt * 6) % 1;
    this._globalDotTimer += dt;
    if (this._globalDotTimer >= houseTimeoutSecs(this.level)) {
      this._globalDotTimer = 0;
      this._releaseNextGhost();
    }

    this._ghosts.forEach((ghost) => this._updateGhost(ghost, dt));
  }

  _updateGhost(ghost, dt) {
    if (ghost.state === 'house') return this._bobInHouse(ghost, dt);
    if (ghost.state === 'leaving') return this._leaveHouse(ghost, dt);

    const speed = this._ghostSpeed(ghost) * dt;
    this._moveGhost(ghost, speed);

    if (ghost.state === 'eaten' && this._reachedDoor(ghost)) {
      ghost.state = 'leaving';
      ghost.col = HOUSE_DOOR.col;
      ghost.row = HOUSE_CENTER.row;
    }
  }

  _ghostSpeed(ghost) {
    if (ghost.state === 'eaten') return this._speeds.eyes;
    if (ghost.state === 'frightened') return this._speeds.ghostFright;
    if (Math.round(ghost.row) === TUNNEL_ROW && this._inTunnel(ghost)) return this._speeds.tunnel;

    const elroyBonus = ghost.name === 'blinky' && ghost.elroy > 0 ? ghost.elroy * 0.04 : 0;
    return this._speeds.ghost * (1 + elroyBonus);
  }

  _inTunnel(ghost) {
    const col = ghost.col;
    return col < 6 || col > COLS - 7;
  }

  _bobInHouse(ghost, dt) {
    ghost.bob += dt * 2;
    ghost.row = HOUSE_CENTER.row + Math.sin(ghost.bob) * 0.35;
  }

  _leaveHouse(ghost, dt) {
    const speed = this._speeds.ghost * dt;
    // Slide to the door column first, then rise through the door.
    if (Math.abs(ghost.col - HOUSE_DOOR.col) > 0.05) {
      ghost.col += Math.sign(HOUSE_DOOR.col - ghost.col) * Math.min(speed, Math.abs(HOUSE_DOOR.col - ghost.col));
      return;
    }
    ghost.col = HOUSE_DOOR.col;
    ghost.row -= speed;
    if (ghost.row <= HOUSE_DOOR.row) {
      ghost.row = HOUSE_DOOR.row;
      ghost.state = this._frightTimer > 0 ? 'frightened' : 'active';
      ghost.dir = 'left';
    }
  }

  /**
   * Ghosts decide only on entering a tile. Between decisions they travel in a
   * straight line, which is why they cannot cut corners the way Pac-Man can.
   */
  _moveGhost(ghost, speed) {
    // Advance centre to centre. A ghost commits to a direction at a tile
    // centre and travels in a straight line to the next one, so the step has
    // to land exactly on each centre it passes rather than stride over it —
    // otherwise the decision point is missed and it walks into a wall.
    let remaining = speed;
    let hops = 0;

    while (remaining > 0 && hops < MAX_GHOST_HOPS) {
      hops += 1;
      const v = VECTORS[ghost.dir];
      const onCol = v.col !== 0;
      const axis = onCol ? ghost.col : ghost.row;
      const heading = onCol ? v.col : v.row;

      const nextCenter = heading > 0
        ? Math.floor(axis + CENTER_EPS) + 1
        : Math.ceil(axis - CENTER_EPS) - 1;
      const toCenter = Math.abs(nextCenter - axis);

      if (remaining < toCenter) {
        ghost.col = wrapCol(ghost.col + v.col * remaining);
        ghost.row += v.row * remaining;
        return;
      }

      ghost.col = wrapCol(ghost.col + v.col * toCenter);
      ghost.row += v.row * toCenter;
      remaining -= toCenter;

      const tile = { col: wrapCol(Math.round(ghost.col)), row: Math.round(ghost.row) };

      if (ghost.pendingReverse) {
        ghost.pendingReverse = false;
        ghost.dir = reverseOf(ghost.dir);
        continue;
      }

      ghost.dir = this._decideGhostDirection(ghost, tile);
    }
  }

  _decideGhostDirection(ghost, tile) {
    if (ghost.state === 'frightened') {
      return chooseFrightenedDirection({ grid: this._grid, tile, currentDir: ghost.dir });
    }

    return chooseDirection({
      grid: this._grid,
      tile,
      currentDir: ghost.dir,
      target: this._ghostTarget(ghost, tile),
      // Only the eyes may pass back through the house door.
      doorPassable: ghost.state === 'eaten',
    });
  }

  _ghostTarget(ghost, tile) {
    if (ghost.state === 'eaten') return { col: HOUSE_DOOR.col, row: HOUSE_DOOR.row };

    // Elroy Blinky ignores scatter and keeps hunting.
    const chasing = this._mode === 'chase' || (ghost.name === 'blinky' && ghost.elroy > 0);
    if (!chasing) return scatterTarget(ghost.name);

    const blinky = this._ghosts.find((g) => g.name === 'blinky');
    return chaseTarget(ghost.name, {
      pacTile: { col: Math.round(this._pac.col), row: Math.round(this._pac.row) },
      pacDir: this._pac.dir,
      blinkyTile: { col: Math.round(blinky.col), row: Math.round(blinky.row) },
      ghostTile: tile,
    });
  }

  _reachedDoor(ghost) {
    return distanceSquared(
      { col: ghost.col, row: ghost.row },
      { col: HOUSE_DOOR.col, row: HOUSE_DOOR.row },
    ) < 0.25;
  }

  _releaseOnDotCount() {
    this._globalDotTimer = 0;
    const order = ['pinky', 'inky', 'clyde'];
    const next = order.find((name) => this._ghosts.find((g) => g.name === name && g.state === 'house'));
    if (!next) return;
    if (this._dotsEaten >= this._houseDots[next]) this._release(next);
  }

  _releaseNextGhost() {
    const penned = this._ghosts.find((g) => g.state === 'house');
    if (penned) this._release(penned.name);
  }

  _release(name) {
    const ghost = this._ghosts.find((g) => g.name === name);
    if (ghost && ghost.state === 'house') ghost.state = 'leaving';
  }

  // ---------------------------------------------------------------------
  // Fruit, collisions, life cycle
  // ---------------------------------------------------------------------

  _spawnFruit() {
    this._fruitSpawned += 1;
    const { name, points } = fruitForLevel(this.level);
    this._fruit = { col: 13.5, row: 17, name, points, timer: FRUIT_VISIBLE_SECS };
  }

  _updateFruit(dt) {
    if (!this._fruit) return;
    this._fruit.timer -= dt;
    if (this._fruit.timer <= 0) this._fruit = null;
  }

  _checkCollisions() {
    const pac = this._pac;

    if (this._fruit && this._overlaps(pac, this._fruit)) {
      this._addScore(this._fruit.points);
      this._fruitHistory.push(this._fruit.name);
      this._scorePopup = { col: this._fruit.col, row: this._fruit.row, value: this._fruit.points };
      this._fruit = null;
    }

    this._ghosts.forEach((ghost) => {
      if (ghost.state === 'eaten' || ghost.state === 'house' || ghost.state === 'leaving') return;
      if (!this._overlaps(pac, ghost)) return;

      if (ghost.state === 'frightened') {
        this._eatGhost(ghost);
        return;
      }
      this._losePacMan();
    });
  }

  _overlaps(a, b) {
    return distanceSquared({ col: a.col, row: a.row }, { col: b.col, row: b.row }) < 0.64;
  }

  _eatGhost(ghost) {
    const points = SCORE.GHOST_CHAIN[Math.min(this._ghostChain, SCORE.GHOST_CHAIN.length - 1)];
    this._ghostChain += 1;
    this._addScore(points);
    ghost.state = 'eaten';
    ghost.pendingReverse = false;
    this._scorePopup = { col: ghost.col, row: ghost.row, value: points };
    this._phase = 'ghostScore';
    this._phaseTimer = GHOST_SCORE_PAUSE;
  }

  _losePacMan() {
    this.lives -= 1;
    this._phase = 'dying';
    this._phaseTimer = DEATH_SECS;
    this._emitHud();
  }

  _afterDeath() {
    if (this.lives <= 0) {
      this.gameOver = true;
      this._phase = 'gameOver';
      this._emitHud();
      return;
    }
    this._resetActors();
  }

  // ---------------------------------------------------------------------
  // Input
  // ---------------------------------------------------------------------

  handleKeyDown(key) {
    const dir = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[key];
    if (dir) this._pac.wanted = dir;
  }

  handleKeyUp() {
    // Direction is latched until another is requested; releasing a key does nothing.
  }

  handleTouchAction(action, active) {
    if (!active) return;
    if (['left', 'right', 'up', 'down'].includes(action)) this._pac.wanted = action;
  }

  destroy() {
    this.onHudUpdate = null;
  }

  _emitHud() {
    emitHud(this);
  }

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------

  render(ctx) {
    const { scale, offsetX, offsetY } = this._transform;
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this._canvasW, this._canvasH);
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const clearing = this._phase === 'levelClear';
    R.drawMaze(ctx, this._grid, { flashWhite: clearing && Math.floor(this._phaseTimer * 6) % 2 === 0 });
    R.drawPellets(ctx, this._grid, this._energizerBlink < 0.26);

    if (this._fruit) R.drawFruit(ctx, this._fruit);

    const dying = this._phase === 'dying';
    if (!dying && this._phase !== 'ghostScore') {
      this._renderPac(ctx, false);
    }
    if (dying) this._renderPac(ctx, true);

    if (!dying) this._renderGhosts(ctx);
    if (this._scorePopup) R.drawScorePopup(ctx, this._scorePopup);

    // No in-canvas GAME OVER: the arcade shell already draws its own overlay,
    // and two of them stacked reads as a rendering glitch.
    if (this._phase === 'ready') R.drawCenteredText(ctx, 'READY!', 17, R.COLORS.ready);

    R.drawStatusRow(ctx, { lives: this.lives, fruitHistory: this._fruitHistory });
    ctx.restore();
  }

  _renderPac(ctx, dying) {
    const openness = dying ? 0 : (Math.sin(this._mouthPhase) + 1) / 2;
    R.drawPac(ctx, {
      col: this._pac.col,
      row: this._pac.row,
      dir: this._pac.dir,
      mouth: openness,
      dying,
      deathProgress: dying ? 1 - this._phaseTimer / DEATH_SECS : 0,
    });
  }

  _renderGhosts(ctx) {
    // Flash white over the closing seconds of an energizer as the warning.
    const flashWindow = this._fright.flashes > 0 && this._frightTimer > 0 && this._frightTimer < 2;
    const flashing = flashWindow && Math.floor(this._frightTimer * 6) % 2 === 0;

    this._ghosts.forEach((ghost) => {
      R.drawGhost(ctx, ghost, { flashing, footPhase: this._footPhase });
    });
  }
}
