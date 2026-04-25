import { CYAN, VIOLET, ORANGE, BG, WHITE, MUTED } from '../palette';

const GAME_W = 480;
const GAME_H = 360;

const REAL_BIRDS = [
  'Boobie', 'Bushtit', 'Shag', 'Smew', 'Hoatzin', 'Dickcissel',
  'Knot', 'Wagtail', 'Drongo', 'Frogmouth', 'Potoo', 'Hoopoe',
  'Cock-of-the-Rock', 'Go-Away-Bird', 'Penduline Tit', 'Satanic Nightjar',
  'Ruff', 'Twite', 'Dunnock', 'Plover', 'Snipe', 'Cuckoo',
  'Babbler', 'Loon', 'Nuthatch', 'Grebe', 'Gnatcatcher', 'Woodcock',
  'Grosbeak', 'Booby', 'Tit', 'Towhee', 'Chuck-will\'s-widow',
  'Whip-poor-will', 'Bellbird', 'Mousebird', 'Oilbird', 'Tinamou',
  'Kakapo', 'Kookaburra', 'Bushshrike', 'Wattled Curassow',
  'Lyrebird', 'Spoonbill', 'Limpkin', 'Bananaquit', 'Kagu',
];

const PREFIXES = [
  'Naked', 'Fluffy', 'Greater', 'Lesser', 'Common', 'Bare-Faced',
  'Horned', 'Tufted', 'Speckled', 'Bushy', 'Hairy', 'Sooty',
  'Dusky', 'Pied', 'Spotted', 'Crested', 'Painted', 'Whiskered',
  'Bald', 'Plumed', 'Snub-Nosed', 'Bug-Eyed', 'Magnificent',
  'Resplendent', 'Drunken', 'Confused', 'Anxious', 'Suspicious',
  'Sneaky', 'Bumbling', 'Disgruntled', 'Damp', 'Squat', 'Loud',
  'Lonely', 'Hapless', 'Smug', 'Crusty', 'Wistful', 'Indignant',
  'Befuddled', 'Modest', 'Greasy', 'Sticky', 'Wobbly',
];

const BODY_PARTS = [
  'Faced', 'Breasted', 'Bellied', 'Tailed', 'Legged', 'Beaked',
  'Necked', 'Winged', 'Crowned', 'Throated', 'Rumped', 'Browed',
  'Cheeked', 'Bottomed', 'Chinned', 'Eared', 'Nosed', 'Toed',
  'Whiskered', 'Mustached',
];

const COLORS = [
  'Cyan', 'Violet', 'Crimson', 'Saffron', 'Cerulean', 'Magenta',
  'Chartreuse', 'Mauve', 'Tangerine', 'Plum', 'Olive', 'Slate',
  'Rose', 'Indigo', 'Coral', 'Mustard', 'Russet', 'Sepia',
  'Amber', 'Cobalt',
];

const LATIN_GENERA = [
  'Plumosus', 'Cantorus', 'Jocosus', 'Ridiculus', 'Floofus',
  'Squawkus', 'Bouncius', 'Goofus', 'Wobblus', 'Gribbletus',
  'Borbulus', 'Dramaticus', 'Confusius', 'Snorgulus', 'Hootensis',
];

const LATIN_SPECIES = [
  'absurdus', 'maximus', 'ridiculosus', 'snorticus', 'derpicus',
  'chonkus', 'noodleus', 'zoomicus', 'flappingtonii', 'bonkers',
  'magnificus', 'sleepicus', 'screamicus', 'pondereus', 'mysteriosa',
];

export class BirdNameGenerator {
  onHudUpdate = null;

  init(width, height) {
    this.canvasW = width;
    this.canvasH = height;
    this._computeTransform();

    this.score = 0;
    this.lives = undefined;
    this.level = 1;
    this.gameOver = false;

    this._birdsDiscovered = 0;
    this._currentBird = this._generateBird();
    this._spawnAnim = 1;
    this._idleTime = 0;
    this._promptBlink = 0;
    this._buttonHeld = false;

    this._emitHud();
  }

  _generateBird() {
    const r = Math.random();
    let name;
    if (r < 0.35) {
      // Color + Body-Part + Real Bird
      name = `${this._pick(COLORS)}-${this._pick(BODY_PARTS)} ${this._pick(REAL_BIRDS)}`;
    } else if (r < 0.7) {
      // Prefix + Real Bird
      name = `${this._pick(PREFIXES)} ${this._pick(REAL_BIRDS)}`;
    } else if (r < 0.9) {
      // Prefix + Color + Real Bird
      name = `${this._pick(PREFIXES)} ${this._pick(COLORS)} ${this._pick(REAL_BIRDS)}`;
    } else {
      // Just a real bird (the funny ones speak for themselves)
      name = this._pick(REAL_BIRDS);
    }

    const latin = `${this._pick(LATIN_GENERA)} ${this._pick(LATIN_SPECIES)}`;

    // Visual seed for the bird drawing
    return {
      name,
      latin,
      bodyColor: this._pickColor(),
      wingColor: this._pickColor(),
      beakLong: Math.random() < 0.4,
      hasCrest: Math.random() < 0.5,
      hasGlasses: Math.random() < 0.15,
      eyeSize: 1 + Math.random() * 1.5,
      bodyScale: 0.85 + Math.random() * 0.4,
    };
  }

  _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  _pickColor() {
    const palette = [CYAN, VIOLET, ORANGE];
    return palette[Math.floor(Math.random() * palette.length)];
  }

  _discover() {
    this._birdsDiscovered++;
    this.score = this._birdsDiscovered;
    this.level = 1 + Math.floor(this._birdsDiscovered / 10);
    this._currentBird = this._generateBird();
    this._spawnAnim = 0;
    this._idleTime = 0;
    this._emitHud();
  }

  update(dt) {
    this._spawnAnim = Math.min(1, this._spawnAnim + dt * 4);
    this._idleTime += dt;
    this._promptBlink = (this._promptBlink + dt) % 1.4;
  }

  resize(width, height) {
    this.canvasW = width;
    this.canvasH = height;
    this._computeTransform();
  }

  handleKeyDown(key) {
    if (this._buttonHeld) return;
    if (key === ' ' || key === 'Space' || key === 'Enter') {
      this._buttonHeld = true;
      this._discover();
    }
  }

  handleKeyUp(key) {
    if (key === ' ' || key === 'Space' || key === 'Enter') {
      this._buttonHeld = false;
    }
  }

  handleTouchAction(action, active) {
    if (action !== 'fire') return;
    if (active && !this._buttonHeld) {
      this._buttonHeld = true;
      this._discover();
    } else if (!active) {
      this._buttonHeld = false;
    }
  }

  destroy() {}

  render(ctx) {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, this.canvasW, this.canvasH);

    ctx.save();
    ctx.translate(this._offsetX, this._offsetY);
    ctx.scale(this._scale, this._scale);
    ctx.beginPath();
    ctx.rect(0, 0, GAME_W, GAME_H);
    ctx.clip();

    this._renderHeader(ctx);
    this._renderBird(ctx);
    this._renderName(ctx);
    this._renderLatin(ctx);
    this._renderPrompt(ctx);

    ctx.restore();
  }

  _renderHeader(ctx) {
    ctx.save();
    ctx.fillStyle = MUTED;
    ctx.font = '600 11px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('— FIELD GUIDE: BIRDOPEDIA —', GAME_W / 2, 14);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 34);
    ctx.lineTo(GAME_W - 40, 34);
    ctx.stroke();
    ctx.restore();
  }

  _renderBird(ctx) {
    const b = this._currentBird;
    const cx = GAME_W / 2;
    const cy = 130;

    // entry pop animation
    const pop = this._easeOutBack(this._spawnAnim);
    const scale = pop * b.bodyScale;

    // gentle bobbing once settled
    const bob = this._spawnAnim >= 1 ? Math.sin(this._idleTime * 2.5) * 2 : 0;

    ctx.save();
    ctx.translate(cx, cy + bob);
    ctx.scale(scale, scale);

    // Body (oval)
    ctx.shadowColor = b.bodyColor;
    ctx.shadowBlur = 12;
    ctx.fillStyle = b.bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 8, 32, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing (smaller oval, offset)
    ctx.shadowBlur = 6;
    ctx.fillStyle = b.wingColor;
    ctx.beginPath();
    ctx.ellipse(8, 12, 18, 14, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Head (circle)
    ctx.shadowBlur = 10;
    ctx.fillStyle = b.bodyColor;
    ctx.beginPath();
    ctx.arc(-14, -14, 18, 0, Math.PI * 2);
    ctx.fill();

    // Crest (a few spikes on top of head)
    if (b.hasCrest) {
      ctx.shadowBlur = 6;
      ctx.fillStyle = b.wingColor;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-14 + i * 5, -28);
        ctx.lineTo(-14 + i * 5 - 2, -38);
        ctx.lineTo(-14 + i * 5 + 2, -38);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Beak (triangle)
    ctx.shadowBlur = 4;
    ctx.fillStyle = ORANGE;
    ctx.beginPath();
    const beakLen = b.beakLong ? 22 : 12;
    ctx.moveTo(-30, -14);
    ctx.lineTo(-30 - beakLen, -10);
    ctx.lineTo(-30, -8);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.shadowBlur = 0;
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.arc(-18, -16, 4 * b.eyeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-18, -16, 2 * b.eyeSize, 0, Math.PI * 2);
    ctx.fill();

    // Glasses (rare)
    if (b.hasGlasses) {
      ctx.strokeStyle = WHITE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-18, -16, 7, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Feet
    ctx.strokeStyle = ORANGE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, 32);
    ctx.lineTo(-6, 42);
    ctx.moveTo(8, 32);
    ctx.lineTo(8, 42);
    ctx.stroke();

    ctx.restore();

    // shadow ellipse on the ground
    ctx.save();
    ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 50, 36 * scale, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _renderName(ctx) {
    const name = this._currentBird.name;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // shrink to fit
    let fontSize = 28;
    ctx.font = `700 ${fontSize}px "Space Grotesk", sans-serif`;
    while (ctx.measureText(name).width > GAME_W - 40 && fontSize > 12) {
      fontSize -= 1;
      ctx.font = `700 ${fontSize}px "Space Grotesk", sans-serif`;
    }

    const y = 230;

    const grad = ctx.createLinearGradient(0, y - 16, 0, y + 16);
    grad.addColorStop(0, CYAN);
    grad.addColorStop(1, VIOLET);

    ctx.shadowColor = CYAN;
    ctx.shadowBlur = 10;
    ctx.fillStyle = grad;
    ctx.fillText(name, GAME_W / 2, y);
    ctx.restore();
  }

  _renderLatin(ctx) {
    ctx.save();
    ctx.fillStyle = MUTED;
    ctx.font = 'italic 12px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this._currentBird.latin, GAME_W / 2, 258);
    ctx.restore();
  }

  _renderPrompt(ctx) {
    ctx.save();
    const visible = this._promptBlink < 0.85;
    if (visible) {
      ctx.fillStyle = CYAN;
      ctx.font = '600 11px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.shadowColor = CYAN;
      ctx.shadowBlur = 6;
      ctx.fillText('▶ PRESS [SPACE] TO DISCOVER A NEW BIRD', GAME_W / 2, GAME_H - 14);
    }
    ctx.restore();
  }

  _easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

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
