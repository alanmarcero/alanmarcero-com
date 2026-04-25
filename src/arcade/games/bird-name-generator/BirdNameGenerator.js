import { CYAN, VIOLET, ORANGE, BG, WHITE, MUTED } from '../palette';

const GAME_W = 480;
const GAME_H = 360;

const REAL_BIRDS = [
  // The inherently rude classics — real birds, all of them.
  'Boobie', 'Booby', 'Blue-Footed Booby', 'Red-Footed Booby', 'Masked Booby',
  'Tit', 'Great Tit', 'Blue Tit', 'Coal Tit', 'Long-Tailed Tit',
  'Bearded Tit', 'Sombre Tit', 'Marsh Tit', 'Willow Tit', 'Bushtit',
  'Penduline Tit', 'Tit-Babbler', 'Tit-Tyrant', 'Tit-Spinetail',
  'Cock', 'Woodcock', 'Cock-of-the-Rock', 'Hairy Woodpecker',
  'Shag', 'Pied Shag', 'Spotted Shag', 'Rough-Faced Shag',
  'Dickcissel', 'Horny Screamer', 'Horned Screamer', 'Hornbill',
  'Knob-Billed Duck', 'Bare-Faced Bulbul', 'Bare-Cheeked Babbler',
  'Bare-Eyed Pigeon', 'Naked-Faced Spiderhunter',
  // The merely absurd.
  'Smew', 'Hoatzin', 'Hoopoe', 'Frogmouth', 'Potoo', 'Drongo',
  'Wagtail', 'Go-Away-Bird', 'Satanic Nightjar', 'Chuck-Will\'s-Widow',
  'Whip-Poor-Will', 'Ruff', 'Twite', 'Dunnock', 'Plover', 'Snipe',
  'Cuckoo', 'Babbler', 'Loon', 'Nuthatch', 'Grebe', 'Gnatcatcher',
  'Grosbeak', 'Towhee', 'Bellbird', 'Mousebird', 'Oilbird', 'Tinamou',
  'Kakapo', 'Kookaburra', 'Bushshrike', 'Lyrebird', 'Spoonbill',
  'Limpkin', 'Bananaquit', 'Kagu', 'Akiapola\'au',
];

const PREFIXES = [
  // Mildly indecent.
  'Naked', 'Bald', 'Bare-Bottomed', 'Bare-Faced', 'Bare-Cheeked',
  'Snub-Nosed', 'Bug-Eyed', 'Bushy', 'Hairy', 'Greasy', 'Sticky',
  'Sweaty', 'Soggy', 'Damp', 'Moist', 'Limp', 'Saggy', 'Droopy',
  'Floppy', 'Wobbly', 'Clammy', 'Chunky', 'Lumpy', 'Plump',
  // Moods of ill repute.
  'Drunken', 'Hungover', 'Boozy', 'Belching', 'Snoring', 'Drooling',
  'Slobbering', 'Dribbling', 'Flatulent', 'Gassy', 'Reeking', 'Pungent',
  'Funky', 'Whiffy', 'Stinky', 'Musty', 'Ripe', 'Unwashed', 'Filthy',
  'Grubby', 'Crusty', 'Smutty', 'Saucy', 'Cheeky', 'Brazen',
  'Shameless', 'Suggestive', 'Flirtatious', 'Lecherous',
  // Lazy / dim.
  'Lazy', 'Loitering', 'Lurking', 'Bumbling', 'Befuddled',
  'Confused', 'Suspicious', 'Sneaky', 'Disgruntled', 'Indignant',
  'Hapless', 'Smug', 'Wistful', 'Anxious',
  // Real-bird-name flavor.
  'Greater', 'Lesser', 'Common', 'Magnificent', 'Resplendent',
  'Tufted', 'Crested', 'Plumed', 'Whiskered', 'Mustached',
  'Spotted', 'Speckled', 'Pied', 'Sooty', 'Dusky',
];

const BODY_PARTS = [
  'Faced', 'Breasted', 'Bellied', 'Tailed', 'Legged', 'Beaked',
  'Necked', 'Winged', 'Crowned', 'Throated', 'Rumped', 'Browed',
  'Cheeked', 'Bottomed', 'Buttocked', 'Bummed', 'Chinned',
  'Eared', 'Nosed', 'Toed', 'Whiskered', 'Mustached', 'Thighed',
  'Hipped', 'Jowled', 'Knuckled', 'Pawed', 'Knee\'d', 'Backed',
  'Ankled', 'Loined', 'Stomached',
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
  'Buttockus', 'Booblerus', 'Tittarus', 'Coccyx', 'Saggidus',
  'Floppulus', 'Nudipennis', 'Greasius', 'Crustulus', 'Gassius',
];

const LATIN_SPECIES = [
  'absurdus', 'maximus', 'ridiculosus', 'snorticus', 'derpicus',
  'chonkus', 'noodleus', 'zoomicus', 'flappingtonii', 'bonkers',
  'magnificus', 'sleepicus', 'screamicus', 'pondereus', 'mysteriosa',
  'inappropriatus', 'unwashedus', 'lecherosus', 'flatulens',
  'indecorum', 'lubricus', 'bombasticus', 'nudibottomus',
  'pretentiosus', 'questionabilis',
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
    if (r < 0.25) {
      // Color + Body-Part + Real Bird
      name = `${this._pick(COLORS)}-${this._pick(BODY_PARTS)} ${this._pick(REAL_BIRDS)}`;
    } else if (r < 0.5) {
      // Prefix + Real Bird
      name = `${this._pick(PREFIXES)} ${this._pick(REAL_BIRDS)}`;
    } else if (r < 0.75) {
      // Prefix + Color-Body-Part + Real Bird (the maximally absurd combo)
      name = `${this._pick(PREFIXES)} ${this._pick(COLORS)}-${this._pick(BODY_PARTS)} ${this._pick(REAL_BIRDS)}`;
    } else if (r < 0.92) {
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
