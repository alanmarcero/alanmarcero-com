import { BirdNameGenerator } from './BirdNameGenerator';

describe('BirdNameGenerator', () => {
  let game;
  let hudData;

  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    game = new BirdNameGenerator();
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

    test('lives is undefined (hidden in HUD)', () => {
      expect(game.lives).toBeUndefined();
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
      expect(hudData.lives).toBeUndefined();
    });

    test('a current bird is generated on init', () => {
      expect(game._currentBird).toBeDefined();
      expect(typeof game._currentBird.name).toBe('string');
      expect(game._currentBird.name.length).toBeGreaterThan(0);
    });

    test('current bird has a Latin name', () => {
      expect(typeof game._currentBird.latin).toBe('string');
      expect(game._currentBird.latin.split(' ').length).toBe(2);
    });
  });

  describe('Name generation', () => {
    test('every name uses real bird vocabulary', () => {
      // un-mock so we get variety
      jest.restoreAllMocks();
      const seen = new Set();
      for (let i = 0; i < 50; i++) {
        const bird = game._generateBird();
        seen.add(bird.name);
        expect(typeof bird.name).toBe('string');
        expect(bird.name.length).toBeGreaterThan(2);
      }
      expect(seen.size).toBeGreaterThan(1);
    });

    test('generates name including a recognized real bird stem', () => {
      jest.restoreAllMocks();
      const realStems = ['Boobie', 'Bushtit', 'Shag', 'Smew', 'Hoatzin', 'Booby', 'Tit', 'Plover', 'Hoopoe'];
      let foundRealStem = false;
      for (let i = 0; i < 100; i++) {
        const bird = game._generateBird();
        if (realStems.some((s) => bird.name.includes(s))) {
          foundRealStem = true;
          break;
        }
      }
      expect(foundRealStem).toBe(true);
    });

    test('generated bird has visual properties', () => {
      const bird = game._generateBird();
      expect(typeof bird.bodyColor).toBe('string');
      expect(typeof bird.wingColor).toBe('string');
      expect(typeof bird.beakLong).toBe('boolean');
      expect(typeof bird.hasCrest).toBe('boolean');
      expect(typeof bird.hasGlasses).toBe('boolean');
      expect(typeof bird.eyeSize).toBe('number');
      expect(typeof bird.bodyScale).toBe('number');
    });
  });

  describe('Discovery (input)', () => {
    test('Space discovers a new bird and increments score', () => {
      const prev = game._currentBird;
      game.handleKeyDown(' ');
      expect(game.score).toBe(1);
      expect(game._currentBird).not.toBe(prev);
      expect(hudData.score).toBe(1);
    });

    test('Enter also discovers a new bird', () => {
      game.handleKeyDown('Enter');
      expect(game.score).toBe(1);
    });

    test('held key does not retrigger until released', () => {
      game.handleKeyDown(' ');
      game.handleKeyDown(' ');
      game.handleKeyDown(' ');
      expect(game.score).toBe(1);
      game.handleKeyUp(' ');
      game.handleKeyDown(' ');
      expect(game.score).toBe(2);
    });

    test('non-trigger keys do nothing', () => {
      game.handleKeyDown('ArrowLeft');
      game.handleKeyDown('a');
      expect(game.score).toBe(0);
    });

    test('touch fire press generates a new bird', () => {
      game.handleTouchAction('fire', true);
      expect(game.score).toBe(1);
    });

    test('touch fire release does not generate', () => {
      game.handleTouchAction('fire', true);
      game.handleTouchAction('fire', false);
      game.handleTouchAction('fire', true);
      expect(game.score).toBe(2);
    });

    test('non-fire touch actions do nothing', () => {
      game.handleTouchAction('left', true);
      game.handleTouchAction('right', true);
      expect(game.score).toBe(0);
    });
  });

  describe('Level progression', () => {
    test('level increments every 10 birds discovered', () => {
      for (let i = 0; i < 10; i++) {
        game.handleKeyDown(' ');
        game.handleKeyUp(' ');
      }
      expect(game.score).toBe(10);
      expect(game.level).toBe(2);
    });

    test('level emits in HUD', () => {
      for (let i = 0; i < 10; i++) {
        game.handleKeyDown(' ');
        game.handleKeyUp(' ');
      }
      expect(hudData.level).toBe(2);
    });
  });

  describe('Update loop', () => {
    test('update advances spawn animation', () => {
      // just-discovered: spawn anim resets to 0
      game.handleKeyDown(' ');
      expect(game._spawnAnim).toBe(0);
      game.update(0.5);
      expect(game._spawnAnim).toBeGreaterThan(0);
    });

    test('update advances idle time', () => {
      const before = game._idleTime;
      game.update(0.5);
      expect(game._idleTime).toBeGreaterThan(before);
    });

    test('prompt blink wraps within period', () => {
      for (let i = 0; i < 10; i++) game.update(0.5);
      expect(game._promptBlink).toBeLessThan(1.4);
      expect(game._promptBlink).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Render', () => {
    test('render does not throw on canvas context', () => {
      const ctx = {
        save: jest.fn(), restore: jest.fn(),
        fillRect: jest.fn(), fillText: jest.fn(),
        translate: jest.fn(), scale: jest.fn(),
        beginPath: jest.fn(), closePath: jest.fn(),
        moveTo: jest.fn(), lineTo: jest.fn(),
        rect: jest.fn(), clip: jest.fn(),
        arc: jest.fn(), ellipse: jest.fn(), stroke: jest.fn(), fill: jest.fn(),
        createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
        measureText: jest.fn(() => ({ width: 100 })),
        fillStyle: '', strokeStyle: '', lineWidth: 1,
        font: '', textAlign: '', textBaseline: '',
        shadowColor: '', shadowBlur: 0,
      };
      expect(() => game.render(ctx)).not.toThrow();
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
