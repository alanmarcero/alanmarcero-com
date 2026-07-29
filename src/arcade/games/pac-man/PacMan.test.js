import { PacMan } from './PacMan';
import { TILE, PAC_START, COLS, wrapCol, isWalkable } from './maze';
import { SCORE, STARTING_LIVES } from './levels';

function advance(game, seconds, slice = 1 / 60) {
  const steps = Math.round(seconds / slice);
  for (let i = 0; i < steps; i++) game.update(slice);
}

/**
 * Run the fixed-step loop past the READY! banner and into play. Has to arrive
 * in real frame-sized slices: update() deliberately clamps a single huge dt.
 */
function beginPlay(game) {
  advance(game, 2.1);
}

describe('PacMan', () => {
  let game;
  let hud;

  beforeEach(() => {
    game = new PacMan();
    hud = null;
    game.onHudUpdate = (data) => { hud = data; };
    game.init(448, 496);
  });

  afterEach(() => game.destroy());

  describe('initial state', () => {
    it('starts with no score', () => {
      expect(game.score).toBe(0);
    });

    it('starts with three lives on level one', () => {
      expect(game.lives).toBe(STARTING_LIVES);
      expect(game.level).toBe(1);
      expect(game.gameOver).toBe(false);
    });

    it('places Pac-Man on his start tile facing left', () => {
      expect(game._pac.col).toBe(PAC_START.col);
      expect(game._pac.row).toBe(PAC_START.row);
      expect(game._pac.dir).toBe('left');
    });

    it('creates the four named ghosts', () => {
      expect(game._ghosts.map((g) => g.name)).toEqual(['blinky', 'pinky', 'inky', 'clyde']);
    });

    it('pens everyone except Blinky', () => {
      const penned = game._ghosts.filter((g) => g.state === 'house').map((g) => g.name);

      expect(penned).toEqual(['pinky', 'inky', 'clyde']);
      expect(game._ghosts.find((g) => g.name === 'blinky').state).toBe('active');
    });

    it('reports the opening HUD payload', () => {
      expect(hud).toEqual({ score: 0, lives: 3, level: 1, gameOver: false });
    });

    it('lays out all 244 pellets', () => {
      expect(game._totalDots).toBe(244);
      expect(game._dotsEaten).toBe(0);
    });
  });

  describe('the READY banner', () => {
    it('holds Pac-Man still until it clears', () => {
      const startCol = game._pac.col;
      game.update(0.5);

      expect(game._pac.col).toBe(startCol);
      expect(game._phase).toBe('ready');
    });

    it('hands over to play once it expires', () => {
      beginPlay(game);

      expect(game._phase).toBe('playing');
    });
  });

  describe('controls', () => {
    beforeEach(() => beginPlay(game));

    it('latches the requested direction from a key press', () => {
      game.handleKeyDown('ArrowRight');

      expect(game._pac.wanted).toBe('right');
    });

    it('ignores keys it does not use', () => {
      game.handleKeyDown('KeyQ');

      expect(game._pac.wanted).toBe('left');
    });

    it('accepts the same directions from touch', () => {
      game.handleTouchAction('up', true);

      expect(game._pac.wanted).toBe('up');
    });

    it('ignores a released touch', () => {
      game.handleTouchAction('up', false);

      expect(game._pac.wanted).toBe('left');
    });

    it('reverses immediately without waiting for a tile centre', () => {
      advance(game, 0.05);
      const midTile = game._pac.col;
      expect(Number.isInteger(midTile)).toBe(false);

      game.handleKeyDown('ArrowRight');
      game.update(1 / 120);

      expect(game._pac.dir).toBe('right');
    });

    it('keeps the requested turn buffered until it becomes legal', () => {
      // Down is walled off along the starting corridor, so the request must
      // survive rather than being dropped on the first failed attempt.
      game.handleKeyDown('ArrowDown');
      advance(game, 0.2);

      expect(game._pac.wanted).toBe('down');
    });

    it('moves Pac-Man left along the corridor', () => {
      const before = game._pac.col;
      advance(game, 0.3);

      expect(game._pac.col).toBeLessThan(before);
    });

    it('refuses a turn into the wall above the start tile', () => {
      game.handleKeyDown('ArrowUp');
      advance(game, 0.1);

      expect(Math.round(game._pac.row)).toBe(PAC_START.row);
    });

    it('never ends up inside a wall however it is driven', () => {
      const keys = ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'];
      const visited = [];

      for (let i = 0; i < 200; i++) {
        game.handleKeyDown(keys[i % keys.length]);
        advance(game, 0.05);
        const col = wrapCol(Math.round(game._pac.col));
        const row = Math.round(game._pac.row);
        visited.push(isWalkable(game._grid, col, row));
      }

      expect(visited).not.toContain(false);
    });
  });

  describe('eating', () => {
    beforeEach(() => beginPlay(game));

    it('scores a dot and clears it from the maze', () => {
      advance(game, 0.6);

      expect(game.score).toBeGreaterThanOrEqual(SCORE.DOT);
      expect(game._dotsEaten).toBeGreaterThan(0);
    });

    it('reports the new score to the HUD', () => {
      advance(game, 0.6);

      expect(hud.score).toBe(game.score);
    });

    it('frightens the loose ghosts when an energizer goes', () => {
      game._pac.col = 1;
      game._pac.row = 23;
      game._pac.dir = 'left';
      game._pac.wanted = 'left';
      game.update(1 / 120);

      expect(game._frightTimer).toBeGreaterThan(0);
      expect(game._ghosts.find((g) => g.name === 'blinky').state).toBe('frightened');
    });

    it('turns the ghosts around when the energizer lands', () => {
      const blinky = game._ghosts.find((g) => g.name === 'blinky');
      blinky.state = 'active';
      game._activateFrightened();

      expect(blinky.pendingReverse).toBe(true);
    });

    it('leaves ghosts alone on levels where the energizer no longer frightens', () => {
      game.level = 19;
      game._startLevel();
      beginPlay(game);
      game._activateFrightened();

      expect(game._frightTimer).toBe(0);
    });
  });

  describe('ghost chain scoring', () => {
    beforeEach(() => beginPlay(game));

    it('pays 200, 400, 800, 1600 across one energizer', () => {
      const awarded = [];
      game._activateFrightened();

      game._ghosts.forEach((ghost) => {
        ghost.state = 'frightened';
        const before = game.score;
        game._eatGhost(ghost);
        awarded.push(game.score - before);
      });

      expect(awarded).toEqual(SCORE.GHOST_CHAIN);
    });

    it('sends an eaten ghost home as eyes', () => {
      const ghost = game._ghosts[0];
      ghost.state = 'frightened';
      game._eatGhost(ghost);

      expect(ghost.state).toBe('eaten');
    });

    it('resets the chain when a new energizer starts', () => {
      game._activateFrightened();
      game._ghosts[0].state = 'frightened';
      game._eatGhost(game._ghosts[0]);
      expect(game._ghostChain).toBe(1);

      game._activateFrightened();

      expect(game._ghostChain).toBe(0);
    });
  });

  describe('losing and ending', () => {
    beforeEach(() => beginPlay(game));

    it('drops a life when a live ghost catches him', () => {
      const blinky = game._ghosts.find((g) => g.name === 'blinky');
      blinky.state = 'active';
      blinky.col = game._pac.col;
      blinky.row = game._pac.row;

      game._checkCollisions();

      expect(game.lives).toBe(STARTING_LIVES - 1);
      expect(game._phase).toBe('dying');
    });

    it('survives contact with a frightened ghost', () => {
      const blinky = game._ghosts.find((g) => g.name === 'blinky');
      blinky.state = 'frightened';
      blinky.col = game._pac.col;
      blinky.row = game._pac.row;

      game._checkCollisions();

      expect(game.lives).toBe(STARTING_LIVES);
      expect(game.score).toBe(SCORE.GHOST_CHAIN[0]);
    });

    it('ends the game when the last life goes', () => {
      game.lives = 1;
      game._losePacMan();
      advance(game, 2.0);

      expect(game.gameOver).toBe(true);
      expect(hud.gameOver).toBe(true);
    });

    it('resets the actors and keeps playing while lives remain', () => {
      game._losePacMan();
      advance(game, 2.0);

      expect(game.gameOver).toBe(false);
      expect(game._pac.col).toBe(PAC_START.col);
      expect(game._phase).toBe('ready');
    });
  });

  describe('level progression', () => {
    beforeEach(() => beginPlay(game));

    it('clears the level when the last pellet goes', () => {
      game._dotsEaten = game._totalDots - 1;
      game._pac.col = 1;
      game._pac.row = 23;
      game.update(1 / 120);

      expect(game._phase).toBe('levelClear');
    });

    it('advances to the next level and refills the maze', () => {
      game._dotsEaten = game._totalDots;
      game._phase = 'levelClear';
      game._phaseTimer = 0.01;
      advance(game, 2.0);

      expect(game.level).toBe(2);
      expect(game._dotsEaten).toBe(0);
      expect(game._totalDots).toBe(244);
    });
  });

  describe('extra life', () => {
    it('grants one at 10,000 and only once', () => {
      beginPlay(game);
      game._addScore(SCORE.EXTRA_LIFE_AT);
      expect(game.lives).toBe(STARTING_LIVES + 1);

      game._addScore(SCORE.EXTRA_LIFE_AT);

      expect(game.lives).toBe(STARTING_LIVES + 1);
    });
  });

  describe('the tunnel', () => {
    beforeEach(() => beginPlay(game));

    it('wraps Pac-Man from one mouth to the other', () => {
      game._pac.col = 0.5;
      game._pac.row = 14;
      game._pac.dir = 'left';
      game._pac.wanted = 'left';
      advance(game, 0.5);

      expect(game._pac.col).toBeGreaterThan(COLS - 4);
    });

    it('slows ghosts inside it', () => {
      const ghost = game._ghosts[0];
      ghost.state = 'active';
      ghost.row = 14;
      ghost.col = 1;

      expect(game._ghostSpeed(ghost)).toBe(game._speeds.tunnel);
    });
  });

  describe('the ghost house', () => {
    beforeEach(() => beginPlay(game));

    it('releases Pinky straight away on level 1', () => {
      game._releaseOnDotCount();

      expect(game._ghosts.find((g) => g.name === 'pinky').state).toBe('leaving');
    });

    it('holds Clyde back until sixty dots are gone', () => {
      const clyde = game._ghosts.find((g) => g.name === 'clyde');
      game._dotsEaten = 10;
      game._releaseOnDotCount();

      expect(clyde.state).toBe('house');
    });

    it('lets a stalled player trigger a release on the timeout', () => {
      advance(game, 4.5);

      const stillPenned = game._ghosts.filter((g) => g.state === 'house');
      expect(stillPenned.length).toBeLessThan(3);
    });
  });

  describe('cruise Elroy', () => {
    beforeEach(() => beginPlay(game));

    it('speeds Blinky up as the maze empties', () => {
      const blinky = game._ghosts.find((g) => g.name === 'blinky');
      const base = game._ghostSpeed(blinky);

      game._dotsEaten = game._totalDots - 20;
      game._updateElroy();

      expect(blinky.elroy).toBe(1);
      expect(game._ghostSpeed(blinky)).toBeGreaterThan(base);
    });

    it('reaches the second tier near the end', () => {
      game._dotsEaten = game._totalDots - 10;
      game._updateElroy();

      expect(game._ghosts.find((g) => g.name === 'blinky').elroy).toBe(2);
    });
  });

  describe('fruit', () => {
    beforeEach(() => beginPlay(game));

    it('appears once seventy dots are eaten', () => {
      game._dotsEaten = 69;
      game._pac.col = 1;
      game._pac.row = 23;
      game.update(1 / 120);

      expect(game._fruit).not.toBeNull();
      expect(game._fruit.name).toBe('cherry');
    });

    it('times out if it is not collected', () => {
      game._spawnFruit();
      advance(game, 10.5);

      expect(game._fruit).toBeNull();
    });

    it('scores and is recorded when collected', () => {
      game._spawnFruit();
      game._fruit.col = game._pac.col;
      game._fruit.row = game._pac.row;
      game._checkCollisions();

      expect(game.score).toBe(100);
      expect(game._fruitHistory).toEqual(['cherry']);
    });
  });

  describe('scatter and chase', () => {
    beforeEach(() => beginPlay(game));

    it('opens in scatter', () => {
      expect(game._mode).toBe('scatter');
    });

    it('flips to chase after the first seven-second wave', () => {
      advance(game, 7.2);

      expect(game._mode).toBe('chase');
    });

    it('marks every loose ghost for reversal on a mode flip', () => {
      // Checked at the flip itself: a ghost consumes the flag at the next tile
      // centre, which it can reach within a single advance.
      const blinky = game._ghosts.find((g) => g.name === 'blinky');
      const clyde = game._ghosts.find((g) => g.name === 'clyde');
      blinky.state = 'active';
      clyde.state = 'house';

      game._forceReverse();

      expect(blinky.pendingReverse).toBe(true);
      expect(clyde.pendingReverse).toBeUndefined();
    });

    it('actually turns a ghost around when the flag is consumed', () => {
      const blinky = game._ghosts.find((g) => g.name === 'blinky');
      blinky.state = 'active';
      blinky.col = 13;
      blinky.row = 11;
      blinky.dir = 'left';
      blinky.pendingReverse = true;

      game._moveGhost(blinky, 1);

      expect(blinky.dir).toBe('right');
    });

    it('suspends the wave clock while an energizer runs', () => {
      game._activateFrightened();
      const wave = game._waveTimer;
      advance(game, 1.0);

      expect(game._waveTimer).toBe(wave);
    });
  });

  describe('rendering', () => {
    function stubCtx() {
      return {
        save: jest.fn(), restore: jest.fn(), translate: jest.fn(), scale: jest.fn(),
        fillRect: jest.fn(), beginPath: jest.fn(), closePath: jest.fn(), fill: jest.fn(),
        stroke: jest.fn(), moveTo: jest.fn(), lineTo: jest.fn(), arc: jest.fn(),
        ellipse: jest.fn(), quadraticCurveTo: jest.fn(), fillText: jest.fn(),
        fillStyle: '', strokeStyle: '', lineWidth: 1, lineCap: '', font: '',
        textAlign: '', textBaseline: '',
      };
    }

    it('draws the ready screen without throwing', () => {
      expect(() => game.render(stubCtx())).not.toThrow();
    });

    it('draws mid-play without throwing', () => {
      beginPlay(game);
      advance(game, 1.0);

      expect(() => game.render(stubCtx())).not.toThrow();
    });

    it('draws the death animation without throwing', () => {
      beginPlay(game);
      game._losePacMan();

      expect(() => game.render(stubCtx())).not.toThrow();
    });

    it('draws frightened ghosts and fruit without throwing', () => {
      beginPlay(game);
      game._activateFrightened();
      game._spawnFruit();

      expect(() => game.render(stubCtx())).not.toThrow();
    });
  });

  describe('resize', () => {
    it('centres the maze in a wider canvas', () => {
      game.resize(900, 496);

      expect(game._transform.offsetX).toBeGreaterThan(0);
    });

    it('scales to fit the smaller axis', () => {
      game.resize(224, 992);

      expect(game._transform.scale).toBeCloseTo(1);
    });
  });

  describe('the fixed timestep', () => {
    it('produces the same result whatever the frame slicing', () => {
      const a = new PacMan();
      a.init(448, 496);
      const b = new PacMan();
      b.init(448, 496);

      advance(a, 3, 1 / 30);
      advance(b, 3, 1 / 240);

      expect(a._pac.col).toBeCloseTo(b._pac.col, 4);
      expect(a._pac.row).toBeCloseTo(b._pac.row, 4);
    });

    it('clamps a huge stalled frame instead of teleporting', () => {
      beginPlay(game);
      const before = game._pac.col;
      game.update(10);

      expect(Math.abs(game._pac.col - before)).toBeLessThan(COLS);
    });
  });

  describe('destroy', () => {
    it('drops the HUD callback', () => {
      game.destroy();

      expect(game.onHudUpdate).toBeNull();
    });
  });
});

describe('maze mutation', () => {
  it('does not leak eaten dots between games', () => {
    const first = new PacMan();
    first.init(448, 496);
    first.update(2.1);
    first._grid[23][1] = TILE.EMPTY;

    const second = new PacMan();
    second.init(448, 496);

    expect(second._totalDots).toBe(244);
  });
});
