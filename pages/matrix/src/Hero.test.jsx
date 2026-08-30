/**
 * @jest-environment jsdom
 */
import { render, screen, act } from '@testing-library/react';
import Hero, {
  describeResults,
  visibleResults,
  count,
  pluralize,
  ANNOUNCE_DELAY_MS,
} from './Hero';

const baseProps = {
  totalPatches: 1148,
  instrumentCount: 24,
  searchQuery: '',
  onSearchChange: () => {},
  resultsCount: null,
};

const liveRegion = () => document.getElementById('hero-search-announce');

/*
 * Written after a negative control, not before. The derivation behind these
 * sizes was already guarded in catalog.test.js — regress patchBandSizes to
 * `|| 64` and three tests redden. But deleting `groups={patchBandSizes}` from
 * the call site below, which removes the feature outright, left the whole
 * suite green at 1492/1492. The interesting half was guarded and the
 * connecting half was not, which is the half that silently disappears in a
 * later refactor.
 */
describe('the hero field is banded by machine', () => {
  // The real catalogue's shape: ten counted banks summing to totalPatches.
  const bandSizes = [128, 128, 128, 64, 128, 128, 100, 128, 88, 128];

  it('draws one band per counted bank, at weights that actually differ', () => {
    const { container } = render(<Hero {...baseProps} patchBandSizes={bandSizes} />);
    const bands = container.querySelectorAll('.envelope-field__band');

    expect(bands).toHaveLength(bandSizes.length);

    // Band count alone would pass if every band were drawn at one weight,
    // which is the field it replaced. The point is that mass follows size.
    const weights = new Set([...bands].map((b) => b.getAttribute('stroke-width')));
    expect(weights.size).toBeGreaterThan(1);
  });

  it('draws a single unbanded path when no sizes are supplied', () => {
    const { container } = render(<Hero {...baseProps} />);
    expect(container.querySelectorAll('.envelope-field__band')).toHaveLength(0);
  });
});

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

describe('one agreement rule, two presentations', () => {
  // The hero shows figure and noun apart; the live region shows them
  // together. They previously pluralized independently and shipped
  // "1 releases", so the rule is split from the formatting rather than
  // duplicated.
  it('agrees in number whether or not the figure is attached', () => {
    expect(pluralize(1, 'patch', 'patches')).toBe('patch');
    expect(pluralize(2, 'patch', 'patches')).toBe('patches');
    expect(count(1, 'instrument')).toBe('1 instrument');
    expect(count(24, 'instrument')).toBe('24 instruments');
  });

  it('groups thousands, so the shared rule is usable for the hero figure', () => {
    expect(count(1148, 'patch', 'patches')).toBe('1,148 patches');
  });
});

describe('Hero thesis block', () => {
  const props = {
    totalPatches: 1148,
    instrumentCount: 24,
    searchQuery: '',
    onSearchChange: () => {},
    resultsCount: null,
  };

  it('states in text what the aria-hidden field depicts', () => {
    const { container } = render(<Hero {...props} />);
    const note = container.querySelector('.hero__field-note');
    expect(note).toBeTruthy();
    expect(note.textContent).toMatch(/every patch/i);
    // The claim must not live only in the picture: the field is hidden.
    expect(container.querySelector('.hero__field').getAttribute('aria-hidden')).toBe('true');
  });

  it('pluralizes the instrument count through the shared rule', () => {
    const { container } = render(<Hero {...props} instrumentCount={1} />);
    const label = container.querySelector('.hero__count-label').textContent;
    expect(label).toMatch(/1 instrument\b/);
    expect(label).not.toMatch(/1 instruments/);
  });

  it('keeps the figure and its noun as separate elements', () => {
    const { container } = render(<Hero {...props} />);
    expect(container.querySelector('.hero__count-value').textContent).toBe('1,148');
    expect(container.querySelector('.hero__count-label').textContent).toMatch(/patches across 24 instruments/);
  });
});

describe('Hero split-colour headline (merged from the main site)', () => {
  const props = {
    totalPatches: 1148,
    instrumentCount: 24,
    searchQuery: '',
    onSearchChange: () => {},
    resultsCount: null,
  };

  // The whole safety argument for splitting the h1 is that a <span> adds no
  // text. If that ever stops being true the name breaks silently, so it is
  // asserted rather than assumed.
  it('keeps one heading whose accessible name is still the full name', () => {
    render(<Hero {...props} />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.textContent.replace(/\s+/g, ' ').trim()).toBe('Alan Marcero');
  });

  it('inks only the second word, so the split is real and not decorative', () => {
    const { container } = render(<Hero {...props} />);
    const signal = container.querySelector('.hero__title-signal');
    expect(signal).toBeTruthy();
    expect(signal.textContent).toBe('Marcero');
    // The first word must NOT be inside the accent span.
    expect(signal.textContent).not.toMatch(/Alan/);
  });

  it('scopes the merged colour to the hero, not to a shared token', () => {
    const { container } = render(<Hero {...props} />);
    // The declaration lives on .hero in hero.css; assert the element that
    // carries it exists, so a future move of the block is visible here.
    expect(container.querySelector('.hero')).toBeTruthy();
    expect(container.querySelector('.hero__title-signal').closest('.hero')).toBeTruthy();
  });
});

describe('Hero live region stays invisible', () => {
  const props = {
    totalPatches: 1148,
    instrumentCount: 24,
    searchQuery: 'nord',
    onSearchChange: () => {},
    resultsCount: { patches: 2, music: 1 },
  };

  // The two-element design exists so the same fact reaches eyes and screen
  // readers on different tempos. If the live region ever becomes visible it
  // duplicates the readout on screen, which is the one outcome the split was
  // built to avoid -- and a colour pass over this file is exactly the kind of
  // change that would do it without meaning to.
  //
  // WHAT THIS CANNOT CHECK: jsdom does not apply stylesheets, so this asserts
  // the element carries the class whose job is to hide it, not that it is
  // actually hidden. The class's contents are verified by reading hero.css.
  it('carries the offscreen class, so a colour pass cannot surface it', () => {
    const { container } = render(<Hero {...props} />);
    const region = container.querySelector('#hero-search-announce');
    expect(region).toBeTruthy();
    expect(region.classList.contains('hero__search-announce')).toBe(true);
  });

  it('is a distinct element from the visible readout, not the same node', () => {
    const { container } = render(<Hero {...props} />);
    const visible = container.querySelector('.hero__search-result');
    const spoken = container.querySelector('#hero-search-announce');
    expect(visible).not.toBe(spoken);
    // The visible one is hidden from AT; the spoken one is not.
    expect(visible.getAttribute('aria-hidden')).toBe('true');
    expect(spoken.getAttribute('aria-hidden')).toBeNull();
  });
});
