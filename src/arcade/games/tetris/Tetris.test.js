import { Tetris } from './Tetris';

describe('Tetris', () => {
  let game;
  let hudData;

  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    game = new Tetris();
    hudData = null;
    game.onHudUpdate = (data) => { hudData = data; };
    game.init(300, 600);
  });

  afterEach(() => {
    game.destroy();
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    test('initializes with score 0', () => {
      expect(game.score).toBe(0);
    });

    test('initializes with level 1', () => {
      expect(game.level).toBe(1);
    });

    test('initializes with gameOver false', () => {
      expect(game.gameOver).toBe(false);
    });

    test('initializes board with all null cells', () => {
      const allNull = game.board.every(row => row.every(cell => cell === null));
      expect(allNull).toBe(true);
    });

    test('initializes with a current piece', () => {
      expect(game.current).not.toBeNull();
      expect(game.currentType).not.toBeNull();
    });

    test('board has 20 rows', () => {
      expect(game.board.length).toBe(20);
    });

    test('each row has 10 columns', () => {
      expect(game.board[0].length).toBe(10);
    });
  });

  describe('HUD updates', () => {
    test('fires HUD update on init', () => {
      expect(hudData).not.toBeNull();
      expect(hudData.score).toBe(0);
      expect(hudData.level).toBe(1);
      expect(hudData.gameOver).toBe(false);
    });

    test('HUD includes lives as undefined', () => {
      expect(hudData.lives).toBeUndefined();
    });
  });

  describe('Horizontal movement', () => {
    test('piece moves left when ArrowLeft pressed', () => {
      const initialX = game.currentX;
      game.handleKeyDown('ArrowLeft');
      expect(game.currentX).toBe(initialX - 1);
    });

    test('piece moves right when ArrowRight pressed', () => {
      const initialX = game.currentX;
      game.handleKeyDown('ArrowRight');
      expect(game.currentX).toBe(initialX + 1);
    });

    test('piece does not move left beyond board boundary', () => {
      for (let i = 0; i < 20; i++) {
        game.handleKeyDown('ArrowLeft');
        game.keysHeld.left = false;
      }

      const leftMostCellX = Math.min(...game.current.map(([cx]) => cx + game.currentX));
      expect(leftMostCellX).toBeGreaterThanOrEqual(0);
    });

    test('piece does not move right beyond board boundary', () => {
      for (let i = 0; i < 20; i++) {
        game.handleKeyDown('ArrowRight');
        game.keysHeld.right = false;
      }

      const rightMostCellX = Math.max(...game.current.map(([cx]) => cx + game.currentX));
      expect(rightMostCellX).toBeLessThan(10);
    });
  });

  describe('Hard drop', () => {
    test('locks piece on board when space pressed', () => {
      game.handleKeyDown(' ');

      const hasLockedCells = game.board.some(row => row.some(cell => cell !== null));
      expect(hasLockedCells).toBe(true);
    });

    test('awards points based on drop distance', () => {
      const initialScore = game.score;
      const initialY = game.currentY;
      const ghostY = game._getGhostY();
      const distance = ghostY - initialY;

      game.handleKeyDown(' ');

      expect(game.score).toBe(initialScore + distance * 2);
    });

    test('spawns new piece after hard drop', () => {
      const initialType = game.currentType;
      game.handleKeyDown(' ');

      expect(game.currentType).not.toBe(initialType);
    });
  });

  describe('Soft drop', () => {
    test('increases score by 1 when piece moves down during soft drop', () => {
      game.softDrop = true;
      const initialScore = game.score;

      const dropSpeed = game._getDropSpeed();
      game.update(dropSpeed);

      expect(game.score).toBe(initialScore + 1);
    });

    test('sets softDrop to true when ArrowDown pressed', () => {
      game.handleKeyDown('ArrowDown');
      expect(game.softDrop).toBe(true);
    });

    test('sets softDrop to false when ArrowDown released', () => {
      game.handleKeyDown('ArrowDown');
      game.handleKeyUp('ArrowDown');
      expect(game.softDrop).toBe(false);
    });
  });

  describe('Line clearing', () => {
    test('clears full line and increases score', () => {
      for (let c = 0; c < 10; c++) {
        game.board[19][c] = '#00e5ff';
      }

      const initialScore = game.score;
      const initialLines = game.linesCleared;
      game.handleKeyDown(' ');

      game.clearTimer = 0;
      game.update(0.001);

      expect(game.linesCleared).toBe(initialLines + 1);
      expect(game.score).toBeGreaterThan(initialScore);
    });

    test('sets clearingLines when full row detected', () => {
      for (let c = 0; c < 10; c++) {
        game.board[19][c] = '#00e5ff';
      }

      game.handleKeyDown(' ');

      expect(game.clearingLines).not.toBeNull();
      expect(game.clearingLines.length).toBeGreaterThan(0);
    });

    test('multiple lines cleared at once increase score more', () => {
      for (let r = 18; r < 20; r++) {
        for (let c = 0; c < 10; c++) {
          game.board[r][c] = '#00e5ff';
        }
      }

      const initialScore = game.score;
      game.handleKeyDown(' ');

      game.clearTimer = 0;
      game.update(0.001);

      expect(game.score).toBeGreaterThan(initialScore + 100);
    });
  });

  describe('Level progression', () => {
    test('level increases after 10 lines cleared', () => {
      game.linesCleared = 9;

      for (let c = 0; c < 10; c++) {
        game.board[19][c] = '#00e5ff';
      }

      game.handleKeyDown(' ');
      game.clearTimer = 0;
      game.update(0.001);

      expect(game.level).toBe(2);
    });

    test('level remains 1 when fewer than 10 lines cleared', () => {
      game.linesCleared = 5;
      expect(game.level).toBe(1);
    });

    test('level calculation is cumulative', () => {
      game.linesCleared = 25;

      for (let c = 0; c < 10; c++) {
        game.board[19][c] = '#00e5ff';
      }

      game.handleKeyDown(' ');
      game.clearTimer = 0;
      game.update(0.001);

      expect(game.level).toBe(3);
    });
  });

  describe('DAS (Delayed Auto Shift)', () => {
    test('_startDAS sets dasDirection', () => {
      game._startDAS(1);
      expect(game.dasDirection).toBe(1);
    });

    test('_startDAS sets dasPhase to initial', () => {
      game._startDAS(1);
      expect(game.dasPhase).toBe('initial');
    });

    test('_startDAS resets dasTimer to 0', () => {
      game.dasTimer = 100;
      game._startDAS(1);
      expect(game.dasTimer).toBe(0);
    });

    test('_resetDAS sets dasDirection to 0', () => {
      game.dasDirection = 1;
      game._resetDAS();
      expect(game.dasDirection).toBe(0);
    });

    test('_resetDAS sets dasPhase to idle', () => {
      game.dasPhase = 'repeat';
      game._resetDAS();
      expect(game.dasPhase).toBe('idle');
    });

    test('_resetDAS sets dasTimer to 0', () => {
      game.dasTimer = 100;
      game._resetDAS();
      expect(game.dasTimer).toBe(0);
    });

    test('DAS activates when key held', () => {
      game.handleKeyDown('ArrowLeft');
      expect(game.dasDirection).toBe(-1);
      expect(game.dasPhase).toBe('initial');
    });

    test('DAS resets when key released', () => {
      game.handleKeyDown('ArrowLeft');
      game.handleKeyUp('ArrowLeft');
      expect(game.dasDirection).toBe(0);
      expect(game.dasPhase).toBe('idle');
    });
  });

  describe('Game over', () => {
    test('game over when board is full at spawn', () => {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 10; c++) {
          game.board[r][c] = '#00e5ff';
        }
      }

      game._spawnPiece();

      expect(game.gameOver).toBe(true);
    });

    test('no horizontal movement when game over', () => {
      game.gameOver = true;
      const initialX = game.currentX;

      game.handleKeyDown('ArrowLeft');

      expect(game.currentX).toBe(initialX);
    });

    test('no hard drop when game over', () => {
      game.gameOver = true;
      const initialY = game.currentY;

      game.handleKeyDown(' ');

      expect(game.currentY).toBe(initialY);
    });
  });

  describe('Rotation', () => {
    test('rotation changes currentRotation', () => {
      game._rotate(1);

      expect(game.currentRotation).toBe(1);
    });

    test('rotation triggered by ArrowUp', () => {
      game.handleKeyDown('ArrowUp');
      expect(game.currentRotation).toBe(1);
    });

    test('O piece does not rotate', () => {
      game.currentType = 'O';
      game.currentRotation = 0;

      game._rotate(1);

      expect(game.currentRotation).toBe(0);
    });

    test('rotation wraps around to 0 after 3', () => {
      game.currentRotation = 3;
      game._rotate(1);
      expect(game.currentRotation).toBe(0);
    });
  });

  describe('Piece bag system', () => {
    test('_pullFromBag returns a piece type', () => {
      const type = game._pullFromBag();
      const validTypes = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
      expect(validTypes).toContain(type);
    });

    test('bag refills when empty', () => {
      game.bag = [];
      game._pullFromBag();
      expect(game.bag.length).toBeGreaterThan(0);
    });

    test('nextType is set on init', () => {
      expect(game.nextType).not.toBeNull();
    });
  });

  describe('Ghost piece calculation', () => {
    test('_getGhostY returns position at or below current position', () => {
      const ghostY = game._getGhostY();
      expect(ghostY).toBeGreaterThanOrEqual(game.currentY);
    });

    test('ghost Y is at bottom when no obstacles', () => {
      const ghostY = game._getGhostY();
      expect(ghostY).toBeGreaterThan(game.currentY);
    });
  });

  describe('Collision detection', () => {
    test('_isValid returns false when piece exceeds left boundary', () => {
      const cells = [[0, 0]];
      const result = game._isValid(cells, -1, 0);
      expect(result).toBe(false);
    });

    test('_isValid returns false when piece exceeds right boundary', () => {
      const cells = [[0, 0]];
      const result = game._isValid(cells, 10, 0);
      expect(result).toBe(false);
    });

    test('_isValid returns false when piece exceeds bottom boundary', () => {
      const cells = [[0, 0]];
      const result = game._isValid(cells, 0, 20);
      expect(result).toBe(false);
    });

    test('_isValid returns true for valid position', () => {
      const cells = [[0, 0]];
      const result = game._isValid(cells, 5, 10);
      expect(result).toBe(true);
    });

    test('_isValid returns false when colliding with locked piece', () => {
      game.board[10][5] = '#00e5ff';
      const cells = [[0, 0]];
      const result = game._isValid(cells, 5, 10);
      expect(result).toBe(false);
    });

    test('_isValid allows cells above board', () => {
      const cells = [[0, 0]];
      const result = game._isValid(cells, 5, -1);
      expect(result).toBe(true);
    });
  });

  describe('Update loop', () => {
    test('update does nothing when game over', () => {
      game.gameOver = true;
      const initialY = game.currentY;

      game.update(1.0);

      expect(game.currentY).toBe(initialY);
    });

    test('piece drops over time', () => {
      const initialY = game.currentY;
      const dropSpeed = game._getDropSpeed();

      game.update(dropSpeed);

      expect(game.currentY).toBe(initialY + 1);
    });

    test('update waits for line clear animation', () => {
      game.clearingLines = [19];
      game.clearTimer = 200;
      const initialScore = game.score;

      game.update(0.05);

      expect(game.clearingLines).not.toBeNull();
      expect(game.score).toBe(initialScore);
    });
  });

  describe('Touch controls', () => {
    test('handleTouchAction moves left when active', () => {
      const initialX = game.currentX;
      game.handleTouchAction('left', true);
      expect(game.currentX).toBe(initialX - 1);
    });

    test('handleTouchAction moves right when active', () => {
      const initialX = game.currentX;
      game.handleTouchAction('right', true);
      expect(game.currentX).toBe(initialX + 1);
    });

    test('handleTouchAction sets softDrop when down active', () => {
      game.handleTouchAction('down', true);
      expect(game.softDrop).toBe(true);
    });

    test('handleTouchAction rotates when rotate active', () => {
      game.handleTouchAction('rotate', true);
      expect(game.currentRotation).toBe(1);
    });

    test('handleTouchAction hard drops when drop active', () => {
      game.handleTouchAction('drop', true);
      const hasLockedCells = game.board.some(row => row.some(cell => cell !== null));
      expect(hasLockedCells).toBe(true);
    });

    test('handleTouchAction clears softDrop when down inactive', () => {
      game.softDrop = true;
      game.handleTouchAction('down', false);
      expect(game.softDrop).toBe(false);
    });
  });

  describe('Resize', () => {
    test('resize updates width and height', () => {
      game.resize(400, 800);
      expect(game.width).toBe(400);
      expect(game.height).toBe(800);
    });

    test('resize recalculates layout', () => {
      const oldCellSize = game.cellSize;
      game.resize(600, 1200);
      expect(game.cellSize).toBeGreaterThan(oldCellSize);
    });
  });

  describe('Cleanup', () => {
    test('destroy clears board reference', () => {
      game.destroy();
      expect(game.board).toBeNull();
    });

    test('destroy clears current piece reference', () => {
      game.destroy();
      expect(game.current).toBeNull();
    });

    test('destroy clears bag reference', () => {
      game.destroy();
      expect(game.bag).toBeNull();
    });

    test('destroy clears onHudUpdate callback', () => {
      game.destroy();
      expect(game.onHudUpdate).toBeNull();
    });
  });

  describe('Drop speed', () => {
    test('_getDropSpeed returns slower speed for level 1', () => {
      game.level = 1;
      const speed = game._getDropSpeed();
      expect(speed).toBe(1.0);
    });

    test('_getDropSpeed returns faster speed for higher levels', () => {
      game.level = 5;
      const speed = game._getDropSpeed();
      expect(speed).toBeLessThan(1.0);
    });

    test('_getDropSpeed has minimum speed limit', () => {
      game.level = 999;
      const speed = game._getDropSpeed();
      expect(speed).toBeGreaterThan(0);
    });
  });

  describe('Piece locking', () => {
    test('_lockPiece adds cells to board', () => {
      const emptyBefore = game.board.every(row => row.every(cell => cell === null));
      expect(emptyBefore).toBe(true);

      game.currentY = game._getGhostY();
      game._lockPiece();

      const hasLockedCells = game.board.some(row => row.some(cell => cell !== null));
      expect(hasLockedCells).toBe(true);
    });

    test('_lockPiece spawns new piece when no lines cleared', () => {
      const oldType = game.currentType;
      game.currentY = game._getGhostY();
      game._lockPiece();

      game.update(0.001);

      expect(game.currentType).not.toBe(oldType);
    });
  });

  describe('Score calculation', () => {
    test('single line clear awards correct score', () => {
      game.level = 1;
      for (let c = 0; c < 10; c++) {
        game.board[19][c] = '#00e5ff';
      }

      game.handleKeyDown(' ');
      game.clearTimer = 0;
      game.update(0.001);

      expect(game.score).toBeGreaterThanOrEqual(100);
    });

    test('line clear score scales with level', () => {
      game.level = 3;
      for (let c = 0; c < 10; c++) {
        game.board[19][c] = '#00e5ff';
      }

      game.handleKeyDown(' ');
      game.clearTimer = 0;
      game.update(0.001);

      expect(game.score).toBeGreaterThanOrEqual(300);
    });
  });

  describe('Lines cleared counter', () => {
    test('linesCleared increments when line is cleared', () => {
      const initialLines = game.linesCleared;

      for (let c = 0; c < 10; c++) {
        game.board[19][c] = '#00e5ff';
      }

      game.handleKeyDown(' ');
      game.clearTimer = 0;
      game.update(0.001);

      expect(game.linesCleared).toBe(initialLines + 1);
    });

    test('linesCleared increments by multiple when multiple lines cleared', () => {
      const initialLines = game.linesCleared;

      for (let r = 18; r < 20; r++) {
        for (let c = 0; c < 10; c++) {
          game.board[r][c] = '#00e5ff';
        }
      }

      game.handleKeyDown(' ');
      game.clearTimer = 0;
      game.update(0.001);

      expect(game.linesCleared).toBeGreaterThan(initialLines + 1);
    });
  });
});
