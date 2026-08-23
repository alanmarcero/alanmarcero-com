import { RhythmCatcher } from './RhythmCatcher';

describe('RhythmCatcher', () => {
  let game;
  let hudData;

  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    game = new RhythmCatcher();
    hudData = null;
    game.onHudUpdate = (data) => { hudData = data; };
    game.init(480, 360);
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

    test('gameOver is false', () => {
      expect(game.gameOver).toBe(false);
    });

    test('HUD callback fires on init', () => {
      expect(hudData).not.toBeNull();
      expect(hudData.score).toBe(0);
    });

    test('combo starts at 0', () => {
      expect(game._combo).toBe(0);
    });

    test('notes array is empty at start', () => {
      expect(game._notes.length).toBe(0);
    });
  });

  describe('Note spawning', () => {
    test('notes spawn over time', () => {
      game.update(1);
      expect(game._notes.length).toBeGreaterThan(0);
    });

    test('notes move downward', () => {
      game._spawnNote();
      const y1 = game._notes[0].y;
      game.update(0.1);
      expect(game._notes[0].y).toBeGreaterThan(y1);
    });

    test('notes have a lane', () => {
      game._spawnNote();
      expect(game._notes[0].lane).toBeGreaterThanOrEqual(0);
      expect(game._notes[0].lane).toBeLessThan(4);
    });
  });

  describe('Hitting notes', () => {
    test('hitting note in catch zone scores points', () => {
      game._notes.push({ lane: 0, y: 310, hit: false }); // in catch zone (CATCH_ZONE_Y = 310)
      game.handleKeyDown('ArrowLeft'); // lane 0
      expect(game.score).toBeGreaterThan(0);
    });

    test('hitting note increases combo', () => {
      game._notes.push({ lane: 0, y: 310, hit: false });
      game.handleKeyDown('ArrowLeft');
      expect(game._combo).toBe(1);
    });

    test('perfect hit gives more points than good', () => {
      game._notes.push({ lane: 0, y: 310, hit: false }); // perfect (at CATCH_ZONE_Y)
      game.handleKeyDown('ArrowLeft');
      const perfectScore = game.score;
      game.score = 0;
      game._combo = 0;
      game._notes.push({ lane: 1, y: 310 + 30, hit: false }); // good (30px off)
      game.handleKeyDown('ArrowDown');
      expect(perfectScore).toBeGreaterThan(game.score);
    });

    test('pressing key with no note does nothing', () => {
      const scoreBefore = game.score;
      game.handleKeyDown('ArrowLeft');
      expect(game.score).toBe(scoreBefore);
    });

    test('note is removed after being hit', () => {
      game._notes.push({ lane: 0, y: 310, hit: false });
      game.handleKeyDown('ArrowLeft');
      expect(game._notes.length).toBe(0);
    });
  });

  describe('Missing notes', () => {
    test('missed note resets combo', () => {
      game._combo = 5;
      game._onMiss(0);
      expect(game._combo).toBe(0);
    });

    test('3 consecutive misses costs a life', () => {
      game._onMiss(0);
      game._onMiss(0);
      game._onMiss(0);
      expect(game.lives).toBe(2);
    });

    test('notes that pass catch zone are missed', () => {
      game._spawnTimer = 999; // prevent new spawns during this tick
      game._notes.push({ lane: 0, y: 400, hit: false }); // well past catch zone
      game.update(0.01);
      expect(game._notes.length).toBe(0); // removed as missed
    });
  });

  describe('Game over', () => {
    test('game over when lives depleted', () => {
      game.lives = 1;
      game._onMiss(0);
      game._onMiss(0);
      game._onMiss(0);
      expect(game.gameOver).toBe(true);
    });

    test('update does nothing when game is over', () => {
      game.gameOver = true;
      const noteCount = game._notes.length;
      game.update(1);
      expect(game._notes.length).toBe(noteCount);
    });
  });

  describe('Combo system', () => {
    test('combo multiplier increases score', () => {
      // Build up combo
      for (let i = 0; i < 5; i++) {
        game._notes.push({ lane: 0, y: 310, hit: false });
        game.handleKeyDown('ArrowLeft');
      }
      const scoreAt5 = game.score;
      game._notes.push({ lane: 0, y: 310, hit: false });
      game.handleKeyDown('ArrowLeft');
      // 6th hit should have 2x multiplier
      const scoreGain = game.score - scoreAt5;
      expect(scoreGain).toBeGreaterThan(50); // base good is 50, with 2x = 100+
    });
  });

  describe('Level progression', () => {
    test('level increases after catching enough notes', () => {
      game._notesCaught = 19;
      game._notes.push({ lane: 0, y: 310, hit: false });
      game.handleKeyDown('ArrowLeft');
      expect(game.level).toBe(2);
    });
  });

  describe('Touch controls', () => {
    test('touch left hits lane 0', () => {
      game._notes.push({ lane: 0, y: 310, hit: false });
      game.handleTouchAction('left', true);
      expect(game._combo).toBe(1);
    });

    test('touch does nothing on release', () => {
      game._notes.push({ lane: 0, y: 310, hit: false });
      game.handleTouchAction('left', false);
      expect(game._combo).toBe(0);
    });
  });

  describe('Resize', () => {
    test('resize updates canvas dimensions', () => {
      game.resize(800, 600);
      expect(game.canvasW).toBe(800);
      expect(game.canvasH).toBe(600);
    });
  });

  describe('Destroy', () => {
    test('destroy does not crash', () => {
      expect(() => game.destroy()).not.toThrow();
    });
  });
});
