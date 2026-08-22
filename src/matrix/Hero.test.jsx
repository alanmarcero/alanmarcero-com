/**
 * @jest-environment jsdom
 */
import { render, screen, act } from '@testing-library/react';
import Hero, { describeResults, visibleResults, ANNOUNCE_DELAY_MS } from './Hero';

const baseProps = {
  totalPatches: 1148,
  instrumentCount: 24,
  searchQuery: '',
  onSearchChange: () => {},
  resultsCount: null,
};

const liveRegion = () => document.getElementById('hero-search-announce');

describe('describeResults', () => {
  it('says nothing when there is no query', () => {
    expect(describeResults(null, '')).toBe('');
  });

  it('uses words, not zeroes, when nothing matches', () => {
    expect(describeResults({ patches: 0, music: 0 }, 'zzz')).toBe('No matches for “zzz”.');
  });

  it('agrees in number', () => {
    expect(describeResults({ patches: 1, music: 1 }, 'x')).toBe('1 bank, 1 release for “x”.');
    expect(describeResults({ patches: 2, music: 3 }, 'x')).toBe('2 banks, 3 releases for “x”.');
  });

  // The distinction the previous string could not make.
  it('omits an unknown release count rather than announcing it as zero', () => {
    const spoken = describeResults({ patches: 11, music: null }, 'nord');
    expect(spoken).toBe('11 banks for “nord”.');
    expect(spoken).not.toMatch(/release/);
    expect(spoken).not.toMatch(/\b0\b/);
  });

  it('will not claim "no matches" while the release count is unknown', () => {
    expect(describeResults({ patches: 0, music: null }, 'zzz')).toBe('No banks match “zzz”.');
  });

  it('treats undefined like null, not like zero', () => {
    expect(describeResults({ patches: 4 }, 'x')).toBe('4 banks for “x”.');
  });
});

describe('visibleResults', () => {
  it('omits releases when the count is not known', () => {
    expect(visibleResults({ patches: 11, music: null })).toBe('11 banks');
    expect(visibleResults({ patches: 11, music: 2 })).toBe('11 banks, 2 releases');
  });

  // Both prior cases used plural-safe numbers, so neither could expose a
  // missing singular. A plural-safe number in a pluralization test is a
  // test that cannot fail. These are the values that can.
  it('agrees in number for a single result', () => {
    expect(visibleResults({ patches: 1, music: 1 })).toBe('1 bank, 1 release');
    expect(visibleResults({ patches: 11, music: 1 })).toBe('11 banks, 1 release');
    expect(visibleResults({ patches: 1, music: 2 })).toBe('1 bank, 2 releases');
    expect(visibleResults({ patches: 1, music: null })).toBe('1 bank');
  });

  it('says the same numbers as the spoken text', () => {
    // The two renderers drifted once; this asserts they cannot again.
    for (const [patches, music] of [[1, 1], [1, 2], [11, 1], [2, 0]]) {
      const seen = visibleResults({ patches, music });
      const spoken = describeResults({ patches, music }, 'x');
      for (const noun of ['bank', 'banks', 'release', 'releases']) {
        expect(spoken.includes(` ${noun}`)).toBe(seen.includes(` ${noun}`));
      }
    }
  });
});

describe('Hero live region', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('does not announce until typing pauses', () => {
    render(<Hero {...baseProps} searchQuery="nord" resultsCount={{ patches: 2, music: 1 }} />);
    expect(liveRegion().textContent).toBe('');

    act(() => { jest.advanceTimersByTime(ANNOUNCE_DELAY_MS); });
    expect(liveRegion().textContent).toBe('2 banks, 1 release for “nord”.');
  });

  // The defect this slice exists for: seven keystrokes used to produce seven
  // announcements, each interrupting the last.
  it('announces once for a burst of keystrokes, not once per keystroke', () => {
    const { rerender } = render(<Hero {...baseProps} />);
    const spoken = [];

    'Prophet'.split('').forEach((_, i) => {
      const query = 'Prophet'.slice(0, i + 1);
      act(() => {
        rerender(
          <Hero {...baseProps} searchQuery={query} resultsCount={{ patches: 9 - i, music: 0 }} />,
        );
        jest.advanceTimersByTime(50);
      });
      if (liveRegion().textContent) spoken.push(liveRegion().textContent);
    });

    expect(spoken).toEqual([]);

    act(() => { jest.advanceTimersByTime(ANNOUNCE_DELAY_MS); });
    expect(liveRegion().textContent).toBe('3 banks, 0 releases for “Prophet”.');
  });

  it('clears immediately when the box is emptied, leaving no stale count', () => {
    const { rerender } = render(
      <Hero {...baseProps} searchQuery="nord" resultsCount={{ patches: 2, music: 1 }} />,
    );
    act(() => { jest.advanceTimersByTime(ANNOUNCE_DELAY_MS); });
    expect(liveRegion().textContent).not.toBe('');

    act(() => { rerender(<Hero {...baseProps} searchQuery="" resultsCount={null} />); });
    expect(liveRegion().textContent).toBe('');
  });
});

describe('Hero search wiring', () => {
  it('points the input at the announcement, and hides the duplicate readout', () => {
    const { container } = render(
      <Hero {...baseProps} searchQuery="nord" resultsCount={{ patches: 2, music: 1 }} />,
    );
    const input = screen.getByLabelText('Find your instrument');
    const describedBy = input.getAttribute('aria-describedby');

    expect(describedBy).toBe('hero-search-announce');
    expect(document.getElementById(describedBy)).toBeTruthy();
    expect(container.querySelector('.hero__search-result').getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps the live region in the DOM before there is anything to say', () => {
    render(<Hero {...baseProps} />);
    expect(liveRegion()).toBeTruthy();
    expect(liveRegion().getAttribute('role')).toBe('status');
  });
});
