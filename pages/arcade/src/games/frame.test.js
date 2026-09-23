import { letterbox, drawLetterboxed, drawLevelFlash } from './frame';
import { BG } from './palette';

function recordingContext() {
  const calls = [];
  const ctx = new Proxy({}, {
    get: (target, prop) => (prop in target ? target[prop] : (...args) => calls.push([prop, ...args])),
    set: (target, prop, value) => {
      calls.push([`set:${String(prop)}`, value]);
      return true;
    },
  });
  return { ctx, calls };
}

describe('letterbox', () => {
  it('fills a canvas of the same aspect exactly', () => {
    expect(letterbox(960, 720, 480, 360)).toEqual({ scale: 2, offsetX: 0, offsetY: 0 });
  });

  it('centres horizontally when the canvas is wider than the world', () => {
    expect(letterbox(1000, 360, 480, 360)).toEqual({ scale: 1, offsetX: 260, offsetY: 0 });
  });

  it('centres vertically when the canvas is taller than the world', () => {
    expect(letterbox(480, 560, 480, 360)).toEqual({ scale: 1, offsetX: 0, offsetY: 100 });
  });
});

describe('drawLetterboxed', () => {
  it('clears, enters world space clipped to the world, draws, then restores', () => {
    const { ctx, calls } = recordingContext();
    const drawWorld = jest.fn(() => calls.push(['drawWorld']));
    const viewport = { scale: 2, offsetX: 10, offsetY: 20 };

    drawLetterboxed(ctx, { canvasW: 980, canvasH: 760, viewport, gameW: 480, gameH: 360 }, drawWorld);

    expect(calls).toEqual([
      ['set:fillStyle', BG],
      ['fillRect', 0, 0, 980, 760],
      ['save'],
      ['translate', 10, 20],
      ['scale', 2, 2],
      ['beginPath'],
      ['rect', 0, 0, 480, 360],
      ['clip'],
      ['drawWorld'],
      ['restore'],
    ]);
  });
});

describe('drawLevelFlash', () => {
  it('washes the whole world in translucent cyan', () => {
    const { ctx, calls } = recordingContext();
    drawLevelFlash(ctx, 0, 480, 360);
    expect(calls).toEqual([
      ['set:fillStyle', 'rgba(0, 240, 255, 0.15)'],
      ['fillRect', 0, 0, 480, 360],
    ]);
  });
});
