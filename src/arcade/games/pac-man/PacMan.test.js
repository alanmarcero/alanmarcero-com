import { PacMan } from './PacMan';

describe('PacMan', () => {
  let game;
  let hudData;

  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    game = new PacMan();
    hudData = null;
    game.onHudUpdate = (data) => { hudData = data; };
    game.init(448, 496);
  });

  afterEach(() => {
    game.destroy();
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    test('score starts at 0', () => {
      expect(game.score).toBe(0);
    });

    test('lives starts at 3', () => {
      expect(game.lives).toBe(3);
    });

    test('level starts at 1', () => {
      expect(game.level).toBe(1);
    });

    test('gameOver starts as false', () => {
      expect(game.gameOver).toBe(false);
    });
  });

  describe('HUD updates', () => {
    test('fires HUD update on init', () => {
      expect(hudData).toEqual({
        score: 0,
        lives: 3,
        level: 1,
        gameOver: false,
      });
    });
  });

  describe('Pac-Man starting position', () => {
    test('starts at column 14', () => {
      expect(game._pac.col).toBe(14);
    });

    test('starts at row 22', () => {
      expect(game._pac.row).toBe(22);
    });
  });

  describe('Keyboard input', () => {
    test('disables demo mode on key press', () => {
      game.handleKeyDown('ArrowLeft');
      expect(game._demoMode).toBe(false);
    });
  });

  describe('Touch input', () => {
    test('disables demo mode on touch action', () => {
      game.handleTouchAction('left', true);
      expect(game._demoMode).toBe(false);
    });
  });

  describe('Eating dots', () => {
    test('increases score by 10 when eating a dot', () => {
      const col = 14;
      const row = 22;
      game._dots[row][col] = 1;
      game._pac.col = col;
      game._pac.row = row;
      const initialScore = game.score;

      game._updatePacMan(0.001);

      expect(game.score).toBe(initialScore + 10);
    });

    test('removes dot from board when eaten', () => {
      const col = 14;
      const row = 22;
      game._dots[row][col] = 1;
      game._pac.col = col;
      game._pac.row = row;

      game._updatePacMan(0.001);

      expect(game._dots[row][col]).toBe(0);
    });

    test('increments dots eaten counter', () => {
      const col = 14;
      const row = 22;
      game._dots[row][col] = 1;
      game._pac.col = col;
      game._pac.row = row;
      const initialDotsEaten = game._dotsEaten;

      game._updatePacMan(0.001);

      expect(game._dotsEaten).toBe(initialDotsEaten + 1);
    });
  });

  describe('Eating power pellets', () => {
    test('increases score by 50 when eating a power pellet', () => {
      const col = 14;
      const row = 22;
      game._dots[row][col] = 3;
      game._pac.col = col;
      game._pac.row = row;
      const initialScore = game.score;

      game._updatePacMan(0.001);

      expect(game.score).toBe(initialScore + 50);
    });

    test('activates frightened mode', () => {
      const col = 14;
      const row = 22;
      game._dots[row][col] = 3;
      game._pac.col = col;
      game._pac.row = row;

      game._updatePacMan(0.001);

      expect(game._frightActive).toBe(true);
    });

    test('removes pellet from board when eaten', () => {
      const col = 14;
      const row = 22;
      game._dots[row][col] = 3;
      game._pac.col = col;
      game._pac.row = row;

      game._updatePacMan(0.001);

      expect(game._dots[row][col]).toBe(0);
    });
  });

  describe('Frightened mode', () => {
    test('sets active ghosts to frightened', () => {
      game._activateFrightened();

      const activeGhosts = game._ghosts.filter(g => g.state === 'active');
      activeGhosts.forEach(ghost => {
        expect(ghost.frightened).toBe(true);
      });
    });

    test('sets frightened timer to 7 seconds', () => {
      game._activateFrightened();

      expect(game._frightTimer).toBe(7);
    });

    test('resets ghost eat count', () => {
      game._ghostEatCount = 2;

      game._activateFrightened();

      expect(game._ghostEatCount).toBe(0);
    });
  });

  describe('Eating ghosts', () => {
    test('gives 200 points for first ghost', () => {
      const ghost = game._ghosts[0];
      ghost.state = 'active';
      ghost.frightened = true;
      ghost.eaten = false;
      game._pac.x = ghost.x;
      game._pac.y = ghost.y;
      game._ghostEatCount = 0;
      const initialScore = game.score;

      game._checkCollisions();

      expect(game.score).toBe(initialScore + 200);
    });

    test('gives 400 points for second ghost', () => {
      const ghost = game._ghosts[0];
      ghost.state = 'active';
      ghost.frightened = true;
      ghost.eaten = false;
      game._pac.x = ghost.x;
      game._pac.y = ghost.y;
      game._ghostEatCount = 1;
      const initialScore = game.score;

      game._checkCollisions();

      expect(game.score).toBe(initialScore + 400);
    });

    test('gives 800 points for third ghost', () => {
      const ghost = game._ghosts[0];
      ghost.state = 'active';
      ghost.frightened = true;
      ghost.eaten = false;
      game._pac.x = ghost.x;
      game._pac.y = ghost.y;
      game._ghostEatCount = 2;
      const initialScore = game.score;

      game._checkCollisions();

      expect(game.score).toBe(initialScore + 800);
    });

    test('gives 1600 points for fourth ghost', () => {
      const ghost = game._ghosts[0];
      ghost.state = 'active';
      ghost.frightened = true;
      ghost.eaten = false;
      game._pac.x = ghost.x;
      game._pac.y = ghost.y;
      game._ghostEatCount = 3;
      const initialScore = game.score;

      game._checkCollisions();

      expect(game.score).toBe(initialScore + 1600);
    });

    test('increments ghost eat count', () => {
      const ghost = game._ghosts[0];
      ghost.state = 'active';
      ghost.frightened = true;
      ghost.eaten = false;
      game._pac.x = ghost.x;
      game._pac.y = ghost.y;
      const initialCount = game._ghostEatCount;

      game._checkCollisions();

      expect(game._ghostEatCount).toBe(initialCount + 1);
    });

    test('marks ghost as eaten', () => {
      const ghost = game._ghosts[0];
      ghost.state = 'active';
      ghost.frightened = true;
      ghost.eaten = false;
      game._pac.x = ghost.x;
      game._pac.y = ghost.y;

      game._checkCollisions();

      expect(ghost.eaten).toBe(true);
    });

    test('changes ghost state to eaten', () => {
      const ghost = game._ghosts[0];
      ghost.state = 'active';
      ghost.frightened = true;
      ghost.eaten = false;
      game._pac.x = ghost.x;
      game._pac.y = ghost.y;

      game._checkCollisions();

      expect(ghost.state).toBe('eaten');
    });
  });

  describe('Pac-Man death', () => {
    test('reduces lives when colliding with non-frightened ghost', () => {
      const ghost = game._ghosts[0];
      ghost.state = 'active';
      ghost.frightened = false;
      ghost.eaten = false;
      game._pac.x = ghost.x;
      game._pac.y = ghost.y;
      const initialLives = game.lives;

      game._checkCollisions();

      expect(game.lives).toBe(initialLives - 1);
    });

    test('sets dying flag when colliding with ghost', () => {
      const ghost = game._ghosts[0];
      ghost.state = 'active';
      ghost.frightened = false;
      ghost.eaten = false;
      game._pac.x = ghost.x;
      game._pac.y = ghost.y;

      game._checkCollisions();

      expect(game._dying).toBe(true);
    });

    test('sets death timer when dying', () => {
      const ghost = game._ghosts[0];
      ghost.state = 'active';
      ghost.frightened = false;
      ghost.eaten = false;
      game._pac.x = ghost.x;
      game._pac.y = ghost.y;

      game._checkCollisions();

      expect(game._deathTimer).toBe(1.0);
    });
  });

  describe('Game over', () => {
    test('triggers game over when lives depleted', () => {
      game.lives = 0;
      game._dying = true;
      game._deathTimer = 0.001;

      game.update(0.05);

      expect(game.gameOver).toBe(true);
    });

    test('sends game over HUD update', () => {
      game.lives = 0;
      game._dying = true;
      game._deathTimer = 0.001;

      game.update(0.05);

      expect(hudData.gameOver).toBe(true);
    });
  });

  describe('Level completion', () => {
    test('triggers level transition when all dots eaten', () => {
      game._dotsEaten = game._totalDots - 1;
      const col = 14;
      const row = 22;
      game._dots[row][col] = 1;
      game._pac.col = col;
      game._pac.row = row;

      game._updatePacMan(0.001);

      expect(game._levelTransition).toBe(true);
    });

    test('sets level transition timer', () => {
      game._dotsEaten = game._totalDots - 1;
      const col = 14;
      const row = 22;
      game._dots[row][col] = 1;
      game._pac.col = col;
      game._pac.row = row;

      game._updatePacMan(0.001);

      expect(game._levelTransitionTimer).toBe(1.5);
    });

    test('increments level after transition completes', () => {
      game._levelTransition = true;
      game._levelTransitionTimer = 0.001;
      const initialLevel = game.level;

      game.update(0.05);

      expect(game.level).toBe(initialLevel + 1);
    });
  });

  describe('Mode timer', () => {
    test('decreases mode timer when update is called', () => {
      const initialTimer = game._modeTimer;

      game._updateMode(1);

      expect(game._modeTimer).toBe(initialTimer - 1);
    });

    test('switches to chase mode after first scatter', () => {
      game._modeIndex = 0;
      game._modeTimer = 0;

      game._updateMode(0.1);

      expect(game._isChase).toBe(true);
    });
  });

  describe('Ghost initialization', () => {
    test('initializes 4 ghosts', () => {
      expect(game._ghosts.length).toBe(4);
    });

    test('Blinky starts active', () => {
      expect(game._ghosts[0].state).toBe('active');
    });

    test('Pinky starts in pen', () => {
      expect(game._ghosts[1].state).toBe('in_pen');
    });

    test('Inky starts in pen', () => {
      expect(game._ghosts[2].state).toBe('in_pen');
    });

    test('Clyde starts in pen', () => {
      expect(game._ghosts[3].state).toBe('in_pen');
    });
  });

  describe('Frightened timer', () => {
    test('decreases when frightened mode is active', () => {
      game._frightActive = true;
      game._frightTimer = 5;

      game._updateMode(1);

      expect(game._frightTimer).toBe(4);
    });

    test('deactivates frightened mode when timer expires', () => {
      game._frightActive = true;
      game._frightTimer = 0.5;

      game._updateMode(1);

      expect(game._frightActive).toBe(false);
    });

    test('sets ghosts to not frightened when timer expires', () => {
      game._frightActive = true;
      game._frightTimer = 0.5;
      game._ghosts[0].frightened = true;

      game._updateMode(1);

      expect(game._ghosts[0].frightened).toBe(false);
    });
  });

  describe('Ghost pen release', () => {
    test('releases ghost from pen when pen timer expires', () => {
      const ghost = game._ghosts[1];
      ghost.penTimer = 0.5;

      game._updateGhostInPen(ghost, 1);

      expect(ghost.state).toBe('leaving_pen');
    });

    test('centers ghost on gate when leaving pen', () => {
      const ghost = game._ghosts[1];
      ghost.penTimer = 0.5;

      game._updateGhostInPen(ghost, 1);

      expect(ghost.x).toBe(14 * 16 + 8);
    });
  });

  describe('Canvas resizing', () => {
    test('updates canvas width', () => {
      game.resize(800, 600);

      expect(game.canvasW).toBe(800);
    });

    test('updates canvas height', () => {
      game.resize(800, 600);

      expect(game.canvasH).toBe(600);
    });
  });

  describe('Key up handling', () => {
    test('releases left key', () => {
      game._keys.left = true;

      game.handleKeyUp('ArrowLeft');

      expect(game._keys.left).toBe(false);
    });

    test('releases right key', () => {
      game._keys.right = true;

      game.handleKeyUp('ArrowRight');

      expect(game._keys.right).toBe(false);
    });

    test('releases up key', () => {
      game._keys.up = true;

      game.handleKeyUp('ArrowUp');

      expect(game._keys.up).toBe(false);
    });

    test('releases down key', () => {
      game._keys.down = true;

      game.handleKeyUp('ArrowDown');

      expect(game._keys.down).toBe(false);
    });
  });

  describe('Touch release handling', () => {
    test('releases left touch', () => {
      game._keys.left = true;

      game.handleTouchAction('left', false);

      expect(game._keys.left).toBe(false);
    });

    test('releases right touch', () => {
      game._keys.right = true;

      game.handleTouchAction('right', false);

      expect(game._keys.right).toBe(false);
    });

    test('releases up touch', () => {
      game._keys.up = true;

      game.handleTouchAction('up', false);

      expect(game._keys.up).toBe(false);
    });

    test('releases down touch', () => {
      game._keys.down = true;

      game.handleTouchAction('down', false);

      expect(game._keys.down).toBe(false);
    });
  });
});
