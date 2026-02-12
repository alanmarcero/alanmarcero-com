import { CYAN, VIOLET, ORANGE, BG } from '../palette';

const GAME_W = 480;
const GAME_H = 360;

const LANES = 4;
const LANE_W = 60;
const LANE_GAP = 10;
const TOTAL_LANES_W = LANES * LANE_W + (LANES - 1) * LANE_GAP;
const LANES_X = (GAME_W - TOTAL_LANES_W) / 2;

const CATCH_ZONE_Y = GAME_H - 50;
const CATCH_ZONE_H = 16;
const PERFECT_WINDOW = 20;
const GOOD_WINDOW = 40;

const NOTE_SIZE = 20;
const NOTE_BASE_SPEED = 150;
const NOTE_SPEED_INCREMENT = 15;

const SPAWN_BASE_INTERVAL = 0.5;
const SPAWN_MIN_INTERVAL = 0.2;
const NOTES_PER_LEVEL = 20;

const STARTING_LIVES = 3;
const MISS_STREAK_LIMIT = 3;

const SCORE_PERFECT = 100;
const SCORE_GOOD = 50;

const LANE_KEYS = ['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight'];
const LANE_TOUCH = ['left', 'down', 'up', 'right'];
const LANE_COLORS = [CYAN, VIOLET, ORANGE, CYAN];

export class RhythmCatcher {
  onHudUpdate = null;

  init(width, height) {
    this.canvasW = width;
    this.canvasH = height;
    this._computeTransform();

    this.score = 0;
    this.lives = STARTING_LIVES;
    this.level = 1;
    this.gameOver = false;

    this._notes = [];
    this._effects = [];
    this._combo = 0;
    this._maxCombo = 0;
    this._missStreak = 0;
    this._spawnTimer = 0;
    this._spawnInterval = SPAWN_BASE_INTERVAL;
    this._notesCaught = 0;
    this._totalNotesSpawned = 0;
    this._patternIndex = 0;

    this._generatePattern();
    this._emitHud();
  }

  _generatePattern() {
    // Pre-generate a sequence of lane indices that feels rhythmic
    this._pattern = [];
    const patterns = [
      [0, 1, 2, 3],           // cascade right
      [3, 2, 1, 0],           // cascade left
      [0, 3, 1, 2],           // outside-in
      [1, 2, 1, 2],           // alternating center
      [0, 0, 3, 3],           // doubles
      [0, 2, 1, 3],           // zigzag
      [1, 3, 0, 2],           // cross
      [2, 2, 0, 0],           // doubles reverse
    ];

    for (let i = 0; i < 10; i++) {
      const p = patterns[Math.floor(Math.random() * patterns.length)];
      this._pattern.push(...p);
    }
  }

  update(dt) {
    if (this.gameOver) return;

    const speed = NOTE_BASE_SPEED + (this.level - 1) * NOTE_SPEED_INCREMENT;

    // Spawn notes
    this._spawnTimer -= dt;
    if (this._spawnTimer <= 0) {
      this._spawnNote();
      this._spawnInterval = Math.max(
        SPAWN_MIN_INTERVAL,
        SPAWN_BASE_INTERVAL - (this.level - 1) * 0.03
      );
      this._spawnTimer = this._spawnInterval;
    }

    // Move notes
    for (let i = this._notes.length - 1; i >= 0; i--) {
      const note = this._notes[i];
      note.y += speed * dt;

      // Missed — went past catch zone
      if (note.y > CATCH_ZONE_Y + CATCH_ZONE_H + GOOD_WINDOW) {
        this._notes.splice(i, 1);
        this._onMiss(note.lane);
      }
    }

    // Update effects
    for (let i = this._effects.length - 1; i >= 0; i--) {
      this._effects[i].timer -= dt;
      if (this._effects[i].timer <= 0) {
        this._effects.splice(i, 1);
      }
    }
  }

  _spawnNote() {
    const lane = this._pattern[this._patternIndex % this._pattern.length];
    this._patternIndex++;
    this._totalNotesSpawned++;

    this._notes.push({
      lane,
      y: -NOTE_SIZE,
      hit: false,
    });
  }

  _tryHitLane(lane) {
    if (this.gameOver) return;

    // Find closest note in this lane within catch window
    let bestNote = null;
    let bestDist = Infinity;

    for (const note of this._notes) {
      if (note.lane !== lane || note.hit) continue;
      const dist = Math.abs(note.y - CATCH_ZONE_Y);
      if (dist < GOOD_WINDOW && dist < bestDist) {
        bestNote = note;
        bestDist = dist;
      }
    }

    if (!bestNote) return; // No note to hit

    bestNote.hit = true;
    this._notes = this._notes.filter((n) => n !== bestNote);

    const laneX = LANES_X + lane * (LANE_W + LANE_GAP) + LANE_W / 2;

    if (bestDist <= PERFECT_WINDOW) {
      this._combo++;
      this._missStreak = 0;
      const multiplier = Math.min(Math.floor(this._combo / 5) + 1, 4);
      this.score += SCORE_PERFECT * multiplier;
      this._effects.push({ type: 'perfect', x: laneX, y: CATCH_ZONE_Y, timer: 0.5 });
    } else {
      this._combo++;
      this._missStreak = 0;
      const multiplier = Math.min(Math.floor(this._combo / 5) + 1, 4);
      this.score += SCORE_GOOD * multiplier;
      this._effects.push({ type: 'good', x: laneX, y: CATCH_ZONE_Y, timer: 0.4 });
    }

    this._notesCaught++;
    if (this._maxCombo < this._combo) this._maxCombo = this._combo;

    // Level up
    if (this._notesCaught % NOTES_PER_LEVEL === 0) {
      this.level++;
      this._generatePattern();
    }

    this._emitHud();
  }

  _onMiss(lane) {
    this._combo = 0;
    this._missStreak++;
    const laneX = LANES_X + lane * (LANE_W + LANE_GAP) + LANE_W / 2;
    this._effects.push({ type: 'miss', x: laneX, y: CATCH_ZONE_Y, timer: 0.4 });

    if (this._missStreak >= MISS_STREAK_LIMIT) {
      this.lives--;
      this._missStreak = 0;
      this._emitHud();

      if (this.lives <= 0) {
        this.gameOver = true;
        this._emitHud();
      }
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
    this._renderCatchZone(ctx);
    this._renderNotes(ctx);
    this._renderEffects(ctx);
    this._renderCombo(ctx);

    ctx.restore();
  }

  _renderLanes(ctx) {
    for (let i = 0; i < LANES; i++) {
      const x = LANES_X + i * (LANE_W + LANE_GAP);
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fillRect(x, 0, LANE_W, GAME_H);

      // Lane dividers
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_H);
      ctx.stroke();
    }
  }

  _renderCatchZone(ctx) {
    ctx.save();
    ctx.shadowColor = CYAN;
    ctx.shadowBlur = 6;

    for (let i = 0; i < LANES; i++) {
      const x = LANES_X + i * (LANE_W + LANE_GAP);
      ctx.strokeStyle = LANE_COLORS[i];
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, CATCH_ZONE_Y, LANE_W - 4, CATCH_ZONE_H);
    }
    ctx.restore();
  }

  _renderNotes(ctx) {
    for (const note of this._notes) {
      const x = LANES_X + note.lane * (LANE_W + LANE_GAP) + LANE_W / 2;
      const color = LANE_COLORS[note.lane];

      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x - NOTE_SIZE / 2, note.y - NOTE_SIZE / 2, NOTE_SIZE, NOTE_SIZE, 4);
      ctx.fill();
      ctx.restore();
    }
  }

  _renderEffects(ctx) {
    for (const effect of this._effects) {
      const alpha = effect.timer / 0.5;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '600 14px "Inter", sans-serif';

      if (effect.type === 'perfect') {
        ctx.shadowColor = CYAN;
        ctx.shadowBlur = 8;
        ctx.fillStyle = `rgba(0, 229, 255, ${alpha})`;
        ctx.fillText('PERFECT', effect.x, effect.y - 10 - (1 - alpha) * 20);
      } else if (effect.type === 'good') {
        ctx.shadowColor = VIOLET;
        ctx.shadowBlur = 6;
        ctx.fillStyle = `rgba(184, 41, 245, ${alpha})`;
        ctx.fillText('GOOD', effect.x, effect.y - 10 - (1 - alpha) * 20);
      } else {
        ctx.fillStyle = `rgba(255, 69, 0, ${alpha})`;
        ctx.fillText('MISS', effect.x, effect.y - 10 - (1 - alpha) * 20);
      }
      ctx.restore();
    }
  }

  _renderCombo(ctx) {
    if (this._combo >= 2) {
      ctx.save();
      ctx.textAlign = 'right';
      ctx.font = '700 18px "Space Grotesk", sans-serif';
      ctx.shadowColor = ORANGE;
      ctx.shadowBlur = 6;
      ctx.fillStyle = ORANGE;
      ctx.fillText(`${this._combo}x COMBO`, GAME_W - 20, 30);
      ctx.restore();
    }
  }

  resize(width, height) {
    this.canvasW = width;
    this.canvasH = height;
    this._computeTransform();
  }

  handleKeyDown(key) {
    const lane = LANE_KEYS.indexOf(key);
    if (lane >= 0) this._tryHitLane(lane);
  }

  handleKeyUp(_key) {}

  handleTouchAction(action, active) {
    if (!active) return;
    const lane = LANE_TOUCH.indexOf(action);
    if (lane >= 0) this._tryHitLane(lane);
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
