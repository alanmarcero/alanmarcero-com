import { actionForKey, DIRECTION_STEPS } from './input';

describe('actionForKey', () => {
  it('maps the arrows to their directions', () => {
    expect(actionForKey('ArrowLeft')).toBe('left');
    expect(actionForKey('ArrowRight')).toBe('right');
    expect(actionForKey('ArrowUp')).toBe('up');
    expect(actionForKey('ArrowDown')).toBe('down');
  });

  it('maps the space bar to fire under either spelling', () => {
    expect(actionForKey(' ')).toBe('fire');
    expect(actionForKey('Space')).toBe('fire');
  });

  it('returns null for a key the arcade does not use', () => {
    expect(actionForKey('q')).toBeNull();
  });
});

describe('DIRECTION_STEPS', () => {
  it('steps one cell, with up as negative y', () => {
    expect(DIRECTION_STEPS.up).toEqual({ x: 0, y: -1 });
    expect(DIRECTION_STEPS.down).toEqual({ x: 0, y: 1 });
    expect(DIRECTION_STEPS.left).toEqual({ x: -1, y: 0 });
    expect(DIRECTION_STEPS.right).toEqual({ x: 1, y: 0 });
  });
});
