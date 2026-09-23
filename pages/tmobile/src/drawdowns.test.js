import {
  DEFAULT_TOP_HOLD, TOP_HOLDS, deepest, describeDrawdowns, describeHold, drawdownEpisodes,
  formatDepth, formatSpan,
  heldAtLeast, summarizeDrawdowns, topHoldById, underwater,
} from './drawdowns';

// 100 → dip to 80 → new high 110 on day 5 → dip to 99 and never back
const CLOSES = [
  ['2025-01-01', 100],
  ['2025-01-02', 90],
  ['2025-01-03', 80],
  ['2025-01-04', 95],
  ['2025-01-05', 110],
  ['2025-01-06', 105],
  ['2025-01-07', 99],
  ['2025-01-08', 104],
];

describe('underwater', () => {
  const series = underwater(CLOSES);

  it('is zero on a record close and negative below one', () => {
    expect(series[0].depth).toBe(0);
    expect(series[2].depth).toBeCloseTo(-0.2);
    expect(series[4].depth).toBe(0);
    expect(series[6].depth).toBeCloseTo(99 / 110 - 1);
  });

  it('carries the peak each close is measured from', () => {
    expect(series[3]).toMatchObject({ peak: 100, peakDate: '2025-01-01' });
    expect(series[7]).toMatchObject({ peak: 110, peakDate: '2025-01-05' });
  });

  it('keeps the first peak on a tie, as the episodes do', () => {
    const tied = underwater([['2025-01-01', 10], ['2025-01-02', 10]]);
    expect(tied[1].peakDate).toBe('2025-01-01');
  });
});

describe('drawdownEpisodes', () => {
  const episodes = drawdownEpisodes(CLOSES);

  it('finds one episode per stretch between highs that dipped', () => {
    expect(episodes).toHaveLength(2);
  });

  it('measures a closed episode from peak to its lowest close', () => {
    expect(episodes[0]).toMatchObject({
      peakDate: '2025-01-01',
      peak: 100,
      troughDate: '2025-01-03',
      trough: 80,
      recoveryDate: '2025-01-05',
      open: false,
      toBottomDays: 2,
      topDays: 4,
    });
    expect(episodes[0].depth).toBeCloseTo(-0.2);
  });

  it('leaves the last episode open and counts it to the last close', () => {
    expect(episodes[1]).toMatchObject({
      peakDate: '2025-01-05', trough: 99, open: true, recoveryDate: null, topDays: 3,
    });
  });

  it('skips a run of new highs with no dip between them', () => {
    const rising = [['2025-01-01', 1], ['2025-01-02', 2], ['2025-01-03', 3]];
    expect(drawdownEpisodes(rising)).toEqual([]);
  });

  it('handles an empty series', () => {
    expect(drawdownEpisodes([])).toEqual([]);
  });
});

describe('filters and summaries', () => {
  const episodes = drawdownEpisodes(CLOSES);

  it('keeps only tops that stood long enough', () => {
    expect(heldAtLeast(episodes, 4)).toHaveLength(1);
    expect(heldAtLeast(episodes, 0)).toHaveLength(2);
  });

  it('orders the deepest first', () => {
    expect(deepest(episodes, 1)[0].peakDate).toBe('2025-01-01');
  });

  it('summarises depth and names the open episode', () => {
    const summary = summarizeDrawdowns(episodes);
    expect(summary.count).toBe(2);
    expect(summary.deepest.trough).toBe(80);
    expect(summary.median).toBeCloseTo((-0.2 + (99 / 110 - 1)) / 2);
    expect(summary.open.peakDate).toBe('2025-01-05');
    expect(summarizeDrawdowns([])).toBeNull();
  });

  it('offers a default top-hold that exists, and falls back to the first', () => {
    expect(topHoldById(DEFAULT_TOP_HOLD).id).toBe(DEFAULT_TOP_HOLD);
    expect(topHoldById('nope')).toBe(TOP_HOLDS[0]);
    expect(TOP_HOLDS[0].days).toBe(0);
  });
});

describe('formatting', () => {
  it('formats depths with a real minus sign', () => {
    expect(formatDepth(-0.405)).toBe('−40.5%');
    expect(formatDepth(0)).toBe('0.0%');
  });

  it('reads long spans in years', () => {
    expect(formatSpan(1)).toBe('1 day');
    expect(formatSpan(90)).toBe('90 days');
    expect(formatSpan(4392)).toBe('12.0 years');
  });
});

describe('captions', () => {
  const fmt = { formatDate: (d) => d, formatPrice: (p) => `$${p}` };

  it('names the filter in words', () => {
    expect(describeHold(topHoldById('any'))).toBe('any length of time');
    expect(describeHold(topHoldById('3m'))).toBe('at least 90 days');
  });

  it('describes the deepest, the median and the open drawdown', () => {
    const text = describeDrawdowns(summarizeDrawdowns(drawdownEpisodes(CLOSES)), 'x', fmt);
    expect(text).toMatch(/^2 all-time highs held for x/);
    expect(text).toContain('\u221220.0%, from 2025-01-01 to its bottom on 2025-01-03');
    expect(text).toContain('took 4 days to close above that high again');
    expect(text).toContain('The one still open topped out at $110 on 2025-01-05');
  });

  it('says so when nothing qualifies', () => {
    expect(describeDrawdowns(null, 'at least 1 year', fmt))
      .toBe('No all-time high has stood for at least 1 year.');
  });
});
