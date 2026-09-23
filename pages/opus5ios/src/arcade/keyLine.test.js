import { keyLine } from './keyLine';

describe('keyLine', () => {
  it('prints arrows by direction and every key in caps, in map order', () => {
    const game = { controls: { keyboard: { left: 'ArrowLeft', right: 'ArrowRight', fire: 'Space' } } };
    expect(keyLine(game)).toBe('LEFT · RIGHT · SPACE');
  });

  it('falls back to the mouse when a machine has no keyboard map', () => {
    expect(keyLine({})).toBe('Mouse');
    expect(keyLine({ controls: { keyboard: {} } })).toBe('Mouse');
  });
});
