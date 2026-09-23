/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import useChartCursor from './useChartCursor';

const key = (k) => ({ key: k, preventDefault: jest.fn() });

function setup(props = {}) {
  const indexAtViewX = jest.fn((vx) => Math.round(vx / 100));
  const hook = renderHook((p) => useChartCursor({
    count: 10, viewWidth: 1000, indexAtViewX, ...p,
  }), { initialProps: props });
  return { ...hook, indexAtViewX };
}

describe('useChartCursor', () => {
  it('starts with no cursor', () => {
    const { result } = setup();
    expect(result.current.index).toBeNull();
  });

  it('enters from the right on the first arrow press', () => {
    const { result } = setup();
    const event = key('ArrowLeft');
    act(() => result.current.handlers.onKeyDown(event));
    expect(result.current.index).toBe(8);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('ignores keys other than the arrows', () => {
    const { result } = setup();
    const event = key('Enter');
    act(() => result.current.handlers.onKeyDown(event));
    expect(result.current.index).toBeNull();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('moves `stride` points per press and stops at the ends', () => {
    const { result } = setup({ stride: 5 });
    act(() => result.current.handlers.onKeyDown(key('ArrowLeft')));
    expect(result.current.index).toBe(4);
    act(() => result.current.handlers.onKeyDown(key('ArrowLeft')));
    expect(result.current.index).toBe(0);
    act(() => result.current.handlers.onKeyDown(key('ArrowRight')));
    expect(result.current.index).toBe(5);
  });

  it('follows the pointer in viewBox units, and clears on leave', () => {
    const { result, indexAtViewX } = setup();
    result.current.svgRef.current = {
      getBoundingClientRect: () => ({ left: 100, width: 500 }),
    };
    act(() => result.current.handlers.onPointerMove({ clientX: 250 }));
    expect(indexAtViewX).toHaveBeenCalledWith(300);
    expect(result.current.index).toBe(3);
    act(() => result.current.handlers.onPointerLeave());
    expect(result.current.index).toBeNull();
  });

  it('ignores a pointer over an unmeasured chart, or off the series', () => {
    const { result } = setup({ indexAtViewX: () => null });
    act(() => result.current.handlers.onPointerMove({ clientX: 250 }));
    result.current.svgRef.current = { getBoundingClientRect: () => ({ left: 0, width: 500 }) };
    act(() => result.current.handlers.onPointerMove({ clientX: 250 }));
    expect(result.current.index).toBeNull();
  });

  it('keeps its place when a pointer event carries no position', () => {
    const { result } = setup();
    result.current.svgRef.current = { getBoundingClientRect: () => ({ left: 0, width: 500 }) };
    act(() => result.current.handlers.onKeyDown(key('ArrowLeft')));
    act(() => result.current.handlers.onPointerMove({}));
    expect(result.current.index).toBe(8);
  });

  it('drops a cursor the series has shrunk out from under', () => {
    const { result, rerender } = setup();
    act(() => result.current.handlers.onKeyDown(key('ArrowRight')));
    expect(result.current.index).toBe(9);
    rerender({ count: 4 });
    expect(result.current.index).toBeNull();
  });
});
