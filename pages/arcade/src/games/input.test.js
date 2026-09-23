import { actionForKey } from './input';

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
