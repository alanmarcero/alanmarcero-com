/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from '@testing-library/react';
import useReleases from './useReleases';
import { LAMBDA_URL } from '../../../../src/config';

const respondWith = (response) => {
  global.fetch = jest.fn().mockResolvedValue(response);
};

describe('useReleases', () => {
  afterEach(() => {
    delete global.fetch;
  });

  it('loads the items from the site API', async () => {
    const items = [{ title: 'Track', videoId: 'abc' }];
    respondWith({ ok: true, json: async () => ({ items }) });

    const { result } = renderHook(() => useReleases());
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(global.fetch).toHaveBeenCalledWith(LAMBDA_URL, expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(result.current.items).toEqual(items);
    expect(result.current.error).toBeNull();
  });

  it('treats a payload with no items as an empty list', async () => {
    respondWith({ ok: true, json: async () => ({}) });

    const { result } = renderHook(() => useReleases());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([]);
  });

  it('reports a failed response by its status', async () => {
    respondWith({ ok: false, status: 503 });

    const { result } = renderHook(() => useReleases());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Request failed: 503');
    expect(result.current.items).toEqual([]);
  });

  it('reports a network failure by its message', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useReleases());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('offline');
  });

  it('aborts the request when unmounted', () => {
    respondWith(new Promise(() => {}));

    const { unmount } = renderHook(() => useReleases());
    const { signal } = global.fetch.mock.calls[0][1];
    unmount();

    expect(signal.aborted).toBe(true);
  });
});
