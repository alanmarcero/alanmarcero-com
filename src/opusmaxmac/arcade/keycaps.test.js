import { ARROW_KEYS, arrowPositionFor, glyphFor, keyLayout } from './keycaps';
import { games } from '../../arcade/games/gameRegistry';

const layoutOf = (id) => keyLayout(games.find((game) => game.id === id).controls.keyboard);

describe('glyphFor', () => {
  it('prints an arrow as an arrow', () => {
    expect(glyphFor('ArrowLeft')).toBe('←');
    expect(glyphFor('ArrowRight')).toBe('→');
    expect(glyphFor('ArrowUp')).toBe('↑');
    expect(glyphFor('ArrowDown')).toBe('↓');
  });

  it('spells out a key whose name is a word', () => {
    expect(glyphFor('Space')).toBe('SPACE');
  });

  it('prints anything else as its own key, in caps', () => {
    expect(glyphFor('X')).toBe('X');
    expect(glyphFor('x')).toBe('X');
    expect(glyphFor('Enter')).toBe('ENTER');
  });

  it('has nothing to print for nothing', () => {
    expect(glyphFor()).toBe('');
    expect(glyphFor(null)).toBe('');
  });
});

describe('arrowPositionFor', () => {
  it('places the four arrows and nothing else', () => {
    expect(ARROW_KEYS.map(arrowPositionFor)).toEqual(['left', 'right', 'up', 'down']);
    expect(arrowPositionFor('Space')).toBeNull();
    expect(arrowPositionFor('X')).toBeNull();
  });
});

describe('keyLayout', () => {
  it('draws a diagram for every machine in the arcade', () => {
    games.forEach((game) => {
      const layout = keyLayout(game.controls.keyboard);
      expect(Object.keys(layout.arrows).sort()).toEqual(['down', 'left', 'right', 'up']);
      Object.values(layout.arrows).forEach((flag) => expect(typeof flag).toBe('boolean'));
      expect(layout.keyCount).toBeGreaterThan(0);
      expect(layout.spoken.length).toBeGreaterThan(0);
    });
  });

  it('shows Pong as a two-key machine', () => {
    const pong = layoutOf('pong');
    expect(pong.arrows).toEqual({ up: true, down: true, left: false, right: false });
    expect(pong.extras).toEqual([]);
    expect(pong.keyCount).toBe(2);
    expect(pong.spoken).toBe('Up, down');
  });

  it('shows Pac-Man as a four-key machine', () => {
    const pacMan = layoutOf('pac-man');
    expect(pacMan.arrows).toEqual({ up: true, down: true, left: true, right: true });
    expect(pacMan.extras).toEqual([]);
    expect(pacMan.keyCount).toBe(4);
    expect(pacMan.spoken).toBe('Left, right, up, down');
  });

  it('shows the bird generator as one key and no arrows at all', () => {
    const birds = layoutOf('bird-name-generator');
    expect(birds.arrows).toEqual({ up: false, down: false, left: false, right: false });
    expect(birds.extras).toEqual([{ key: 'Space', glyph: 'SPACE' }]);
    expect(birds.keyCount).toBe(1);
    expect(birds.spoken).toBe('Space');
  });

  it('keeps the extras in the order the game declares them', () => {
    const lifePulse = layoutOf('life-pulse');
    expect(lifePulse.extras).toEqual([
      { key: 'Space', glyph: 'SPACE' },
      { key: 'X', glyph: 'X' },
    ]);
    expect(lifePulse.keyCount).toBe(6);
    expect(lifePulse.spoken).toBe('Left, right, up, down, space, X');
  });

  it('counts caps a hand reaches for, not roles in the map', () => {
    // Tetris rotates with the up arrow, so its five roles are five keys.
    expect(layoutOf('tetris').keyCount).toBe(5);
    // Two roles on one key is still one key.
    const shared = keyLayout({ fire: 'Space', drop: 'Space', alsoDrop: 'space' });
    expect(shared.extras).toEqual([{ key: 'Space', glyph: 'SPACE' }]);
    expect(shared.keyCount).toBe(1);
    expect(shared.spoken).toBe('Space');
  });

  it('says only what the game answers to, in a sentence', () => {
    games.forEach((game) => {
      const { spoken } = keyLayout(game.controls.keyboard);
      expect(spoken).toMatch(/^[A-Z]/);
      expect(spoken).not.toMatch(/[.,;:]$/);
    });
    expect(layoutOf('space-invaders').spoken).toBe('Left, right, space');
  });

  it('answers to nothing when it is given nothing', () => {
    const empty = keyLayout();
    expect(empty.arrows).toEqual({ up: false, down: false, left: false, right: false });
    expect(empty.extras).toEqual([]);
    expect(empty.keyCount).toBe(0);
    expect(empty.spoken).toBe('');
    expect(keyLayout({})).toEqual(empty);
    expect(keyLayout(null)).toEqual(empty);
    // A role declared with no key is not a key.
    expect(keyLayout({ fire: undefined, thrust: '' })).toEqual(empty);
  });

  it('draws the same diagram every time', () => {
    games.forEach((game) => {
      expect(keyLayout(game.controls.keyboard)).toEqual(keyLayout(game.controls.keyboard));
    });
  });
});
