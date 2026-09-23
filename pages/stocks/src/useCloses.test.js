/**
 * @jest-environment jsdom
 */
import { StrictMode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import useCloses from './useCloses';

const CLOSES = [['2025-01-01', 1]];

describe('useCloses', () => {
  it('waits until it is enabled', () => {
    const load = jest.fn(() => Promise.resolve({ CLOSES }));
    const { result } = renderHook(() => useCloses(load, false));
    expect(result.current.status).toBe('idle');
    expect(load).not.toHaveBeenCalled();
  });

  it('loads once, even under StrictMode and after scrolling away', async () => {
    const load = jest.fn(() => Promise.resolve({ CLOSES }));
    const { result, rerender } = renderHook(({ on }) => useCloses(load, on), {
      initialProps: { on: true },
      wrapper: StrictMode,
    });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.closes).toBe(CLOSES);
    rerender({ on: false });
    rerender({ on: true });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('reports a failed import', async () => {
    const load = jest.fn(() => Promise.reject(new Error('offline')));
    const { result } = renderHook(() => useCloses(load, true));
    await waitFor(() => expect(result.current.status).toBe('error'));
  });
});
