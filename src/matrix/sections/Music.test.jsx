/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import Music from './Music';
// jest.mock below is hoisted above these imports, so this receives the mock.
import useMusic from '../hooks/useMusic';

/**
 * The hook is mocked; the two pure functions are NOT. The design has to hold
 * at 0, 1 and N releases and during a cold fetch, and "it looked right when
 * I loaded it" is a claim about one count. These are the other counts.
 */
jest.mock('../hooks/useMusic', () => {
  const actual = jest.requireActual('../hooks/useMusic');
  return {
    __esModule: true,
    ...actual,
    default: jest.fn(),
  };
});

const item = (title, videoId) => ({ title, videoId });

const NINE = [
  item('Alan-M - Famicom', 'a'),
  item('Johnson & Corbett Vs. Alan-M - Ibiza Sun (Aramanja Remix)', 'b'),
  item('Sean Tyas - Melbourne (Alan-M Remix)', 'c'),
  item('Johnson & Corbett Vs. Alan-M - Ibiza Sun (Original Mix)', 'd'),
  item('Alan-M - Sakura', 'e'),
  item('Alan-M - Remember Me (Cressida Remix)', 'f'),
  item('Alan-M - Remember Me', 'g'),
  item('Alan-M - Nothing Forgotten', 'h'),
  item('Alan-M - Famicom (Temple 1 Remix)', 'i'),
];

const state = (over = {}) => ({ items: [], loading: false, error: null, ...over });

const renderMusic = (hookState, props = {}) => {
  useMusic.mockReturnValue(hookState);
  const onVisibleCountChange = jest.fn();
  const utils = render(
    <Music searchQuery="" onVisibleCountChange={onVisibleCountChange} {...props} />,
  );
  return { ...utils, onVisibleCountChange };
};

afterEach(() => jest.clearAllMocks());

describe('the count it publishes to the hero', () => {
  it('reports null while loading — never 0, which would state a false count', () => {
    const { onVisibleCountChange } = renderMusic(state({ loading: true }));
    expect(onVisibleCountChange).toHaveBeenCalledWith(null);
  });

  it('reports null on error', () => {
    const { onVisibleCountChange } = renderMusic(state({ error: 'boom' }));
    expect(onVisibleCountChange).toHaveBeenCalledWith(null);
  });

  it('reports RELEASES, not works, once settled', () => {
    // Nine releases collapse to six works. The hero says "releases", so
    // grouping must not silently redefine the number it speaks aloud.
    const { onVisibleCountChange } = renderMusic(state({ items: NINE }));
    expect(onVisibleCountChange).toHaveBeenCalledWith(9);
  });

  it('reports 0 for a genuinely empty settled list', () => {
    const { onVisibleCountChange } = renderMusic(state({ items: [] }));
    expect(onVisibleCountChange).toHaveBeenCalledWith(0);
  });
});

describe('it holds at every count', () => {
  it('N: renders six works for nine releases', () => {
    renderMusic(state({ items: NINE }));
    expect(document.querySelectorAll('.work')).toHaveLength(6);
    expect(document.querySelectorAll('.take')).toHaveLength(9);
  });

  it('N: marks exactly the three works that have a second take', () => {
    renderMusic(state({ items: NINE }));
    expect(document.querySelectorAll('.work--multi')).toHaveLength(3);
  });

  it('one release renders one work and no multi treatment', () => {
    renderMusic(state({ items: [item('Alan-M - Sakura', 'e')] }));
    expect(document.querySelectorAll('.work')).toHaveLength(1);
    expect(document.querySelectorAll('.work--multi')).toHaveLength(0);
    expect(screen.getByText('Sakura')).toBeTruthy();
  });

  it('zero releases from a successful fetch says so, rather than rendering nothing', () => {
    renderMusic(state({ items: [] }));
    expect(screen.getByText(/No releases are listed right now/i)).toBeTruthy();
    expect(document.querySelectorAll('.work')).toHaveLength(0);
  });

  it('a search matching nothing is reported as the search, not as an empty catalogue', () => {
    renderMusic(state({ items: NINE }), { searchQuery: 'zzzznotathing' });
    expect(screen.getByText(/No releases match/i)).toBeTruthy();
    expect(screen.queryByText(/No releases are listed right now/i)).toBeNull();
  });

  it('mid-fetch shows a skeleton shaped like the real list and hides it from AT', () => {
    renderMusic(state({ loading: true }));
    expect(screen.getByRole('status')).toBeTruthy();
    const list = document.querySelector('.worklist');
    expect(list.getAttribute('aria-hidden')).toBe('true');
    expect(document.querySelectorAll('.work--pending').length).toBeGreaterThan(0);
  });

  it('an error explains that the banks above are unaffected', () => {
    renderMusic(state({ error: 'nope' }));
    expect(screen.getByText(/did not load/i)).toBeTruthy();
    expect(document.querySelectorAll('.work')).toHaveLength(0);
  });
});

describe('what the parse makes visible', () => {
  it('groups the two Famicom takes under one work', () => {
    renderMusic(state({ items: NINE }));
    expect(screen.getAllByText('Famicom')).toHaveLength(1);
    expect(screen.getByText('Temple 1 Remix')).toBeTruthy();
  });

  it('labels an unversioned take "Original"', () => {
    renderMusic(state({ items: [item('Alan-M - Sakura', 'e')] }));
    expect(screen.getByText('Original')).toBeTruthy();
  });

  it('flags a track he remixed as his remix', () => {
    renderMusic(state({ items: [item('Sean Tyas - Melbourne (Alan-M Remix)', 'c')] }));
    expect(document.querySelector('.take--remixer')).toBeTruthy();
    expect(screen.getByText('his remix')).toBeTruthy();
    expect(screen.getByText('Sean Tyas')).toBeTruthy();
  });

  it('does not flag a track someone else remixed as his', () => {
    renderMusic(state({ items: [item('Alan-M - Remember Me (Cressida Remix)', 'f')] }));
    expect(document.querySelector('.take--remixer')).toBeNull();
    expect(document.querySelector('.take--remixed')).toBeTruthy();
  });

  it('searches artist and version, not just title', () => {
    renderMusic(state({ items: NINE }), { searchQuery: 'Sean Tyas' });
    expect(document.querySelectorAll('.work')).toHaveLength(1);
    expect(screen.getByText('Melbourne')).toBeTruthy();
  });
});

describe('the facade stays a facade', () => {
  it('loads no iframe until asked', () => {
    renderMusic(state({ items: NINE }));
    expect(document.querySelectorAll('iframe')).toHaveLength(0);
  });

  it('loads exactly one iframe when one take is played', () => {
    renderMusic(state({ items: NINE }));
    fireEvent.click(screen.getByRole('button', { name: /Play Alan-M - Sakura/i }));
    expect(document.querySelectorAll('iframe')).toHaveLength(1);
  });

  it('keeps the visible cue inside the accessible name (WCAG 2.5.3)', () => {
    renderMusic(state({ items: NINE }));
    for (const button of screen.getAllByRole('button')) {
      const name = button.getAttribute('aria-label') || button.textContent;
      expect(name.toLowerCase()).toContain(button.textContent.trim().toLowerCase());
    }
  });
});
