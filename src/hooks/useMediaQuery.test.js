/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import useMediaQuery from './useMediaQuery';

const QUERY = '(max-width: 640px)';

/** Minimal MediaQueryList stand-in whose `matches` can be flipped. */
function mockMatchMedia(initial) {
  const listeners = new Set();
  const list = {
    matches: initial,
    addEventListener: (_event, fn) => listeners.add(fn),
    removeEventListener: (_event, fn) => listeners.delete(fn),
  };
  window.matchMedia = jest.fn(() => list);
  return {
    list,
    set(matches) {
      list.matches = matches;
      listeners.forEach((fn) => fn());
    },
    get listenerCount() {
      return listeners.size;
    },
  };
}

describe('useMediaQuery', () => {
  const original = window.matchMedia;

  afterEach(() => {
    window.matchMedia = original;
    jest.restoreAllMocks();
  });

  it('reports a matching query', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery(QUERY));
    expect(result.current).toBe(true);
  });

  it('reports a non-matching query', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery(QUERY));
    expect(result.current).toBe(false);
  });

  it('updates when the query starts matching', () => {
    const media = mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery(QUERY));

    act(() => media.set(true));
    expect(result.current).toBe(true);

    act(() => media.set(false));
    expect(result.current).toBe(false);
  });

  it('passes the query through to matchMedia', () => {
    mockMatchMedia(false);
    renderHook(() => useMediaQuery(QUERY));
    expect(window.matchMedia).toHaveBeenCalledWith(QUERY);
  });

  it('removes its listener on unmount', () => {
    const media = mockMatchMedia(false);
    const { unmount } = renderHook(() => useMediaQuery(QUERY));
    expect(media.listenerCount).toBe(1);

    unmount();
    expect(media.listenerCount).toBe(0);
  });

  it('returns false when matchMedia is unavailable', () => {
    delete window.matchMedia;
    const { result } = renderHook(() => useMediaQuery(QUERY));
    expect(result.current).toBe(false);
  });
});
