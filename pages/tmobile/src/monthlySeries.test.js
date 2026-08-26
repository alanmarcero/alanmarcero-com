import {
  DEFAULT_MEASURE, MEASURES, compactShares, compactUSD, dominantSeller, formatAmount,
  formatMonth, formatPercent, formatTick, groupAmount, measureById, monthRows,
  monthSellers, monthStack, monthStacks, monthTotals, shortMonth,
  summarizeMonths,
} from './monthlySeries';

const ALL = { sievert: true, others: true };
const CEO_ONLY = { sievert: true, others: false };

const RECORDS = [
  {
    month: '2025-01',
    sievert: { shares: 0, value: 0, txns: 0, people: [] },
    others: { shares: 0, value: 0, txns: 0, people: [] },
  },
  {
    month: '2025-02',
    sievert: {
      shares: 45000, value: 12007125, txns: 2,
      people: [{ name: 'Mike Sievert', shares: 45000, value: 12007125 }],
    },
    others: {
      shares: 60000, value: 16000000, txns: 3,
      people: [
        { name: 'Peter Osvaldik', shares: 25000, value: 6580750 },
        { name: 'Mark Wolfe Nelson', shares: 35000, value: 9419250 },
      ],
    },
  },
  {
    month: '2025-03',
    sievert: { shares: 0, value: 0, txns: 0, people: [] },
    others: {
      shares: 730, value: 191990, txns: 1,
      people: [{ name: 'Srikant M. Datar', shares: 730, value: 191990 }],
    },
  },
];

describe('measures', () => {
  it('offers the three scales, defaulting to dollars', () => {
    expect(MEASURES.map((m) => m.id)).toEqual(['value', 'shares', 'txns']);
    expect(DEFAULT_MEASURE).toBe('value');
  });

  it('falls back to the first measure for an unknown id', () => {
    expect(measureById('nonsense')).toBe(MEASURES[0]);
    expect(measureById('txns').id).toBe('txns');
  });
});

describe('groupAmount', () => {
  it('reads one group on one measure', () => {
    expect(groupAmount(RECORDS[1], 'sievert', 'shares')).toBe(45000);
    expect(groupAmount(RECORDS[1], 'others', 'txns')).toBe(3);
  });

  it('is zero for a group that is not there', () => {
    expect(groupAmount({ month: '2025-04' }, 'sievert', 'value')).toBe(0);
  });
});

describe('monthStack', () => {
  it('stacks the visible groups and totals them', () => {
    const stack = monthStack(RECORDS[1], 'shares', ALL);
    expect(stack.segments.map((s) => s.group)).toEqual(['sievert', 'others']);
    expect(stack.total).toBe(105000);
  });

  it('keeps the CEO at the bottom of the stack', () => {
    expect(monthStack(RECORDS[1], 'value', ALL).segments[0].group).toBe('sievert');
  });

  it('drops a group that did not sell rather than drawing a zero segment', () => {
    expect(monthStack(RECORDS[2], 'value', ALL).segments.map((s) => s.group))
      .toEqual(['others']);
  });

  it('honours the seller filter', () => {
    expect(monthStack(RECORDS[2], 'value', CEO_ONLY).segments).toEqual([]);
    expect(monthStack(RECORDS[1], 'value', CEO_ONLY).total).toBe(12007125);
  });

  it('gives a quiet month an empty stack, not a missing one', () => {
    const stack = monthStack(RECORDS[0], 'value', ALL);
    expect(stack.month).toBe('2025-01');
    expect(stack.segments).toEqual([]);
    expect(stack.total).toBe(0);
  });
});

describe('monthStacks', () => {
  it('keeps one slot per month, quiet months included', () => {
    expect(monthStacks(RECORDS, 'txns', ALL).map((s) => s.month))
      .toEqual(['2025-01', '2025-02', '2025-03']);
  });
});

describe('summarizeMonths', () => {
  it('finds the peak month and what share of the window it is', () => {
    const summary = summarizeMonths(monthStacks(RECORDS, 'value', ALL));
    expect(summary.peak.month).toBe('2025-02');
    expect(summary.total).toBe(28199115);
    expect(summary.peakShare).toBeCloseTo(28007125 / 28199115);
  });

  it('counts the quiet months against the window', () => {
    const summary = summarizeMonths(monthStacks(RECORDS, 'txns', ALL));
    expect(summary).toMatchObject({ monthCount: 3, activeCount: 2, quietCount: 1 });
  });

  it('measures how far the tallest month is above the shortest', () => {
    const summary = summarizeMonths(monthStacks(RECORDS, 'value', ALL));
    expect(summary.spread).toBeCloseTo(28007125 / 191990);
    expect(summarizeMonths(monthStacks(RECORDS, 'txns', ALL)).spread).toBe(5);
  });

  it('reports no peak when the selection sold nothing', () => {
    const summary = summarizeMonths(monthStacks([RECORDS[0]], 'value', ALL));
    expect(summary.peak).toBeNull();
    expect(summary.peakShare).toBe(0);
  });
});

describe('monthSellers', () => {
  it('merges both groups, biggest seller first', () => {
    expect(monthSellers(RECORDS[1], ALL).map((s) => s.name))
      .toEqual(['Mike Sievert', 'Mark Wolfe Nelson', 'Peter Osvaldik']);
  });

  it('tags each seller with the group whose colour they wear', () => {
    const [first] = monthSellers(RECORDS[1], ALL);
    expect(first.group).toBe('sievert');
  });

  it('narrows with the filter', () => {
    expect(monthSellers(RECORDS[1], CEO_ONLY).map((s) => s.name))
      .toEqual(['Mike Sievert']);
  });
});

describe('dominantSeller', () => {
  it('names a seller only when they are over half the month', () => {
    // Feb: Sievert 45,000 of 105,000 shares — a plurality, not a majority
    expect(dominantSeller(RECORDS[1], ALL, 'shares')).toBeNull();
    // Mar: one person sold, so they are the month
    expect(dominantSeller(RECORDS[2], ALL, 'value'))
      .toEqual({ name: 'Srikant M. Datar', share: 1 });
  });

  it('attributes a filtered month to whoever is left', () => {
    expect(dominantSeller(RECORDS[1], CEO_ONLY, 'shares').name).toBe('Mike Sievert');
  });

  it('will not attribute a filings count to a person', () => {
    // the roll-up counts filings per month, not per seller
    expect(dominantSeller(RECORDS[2], ALL, 'txns')).toBeNull();
  });

  it('is nothing for a month with no sale', () => {
    expect(dominantSeller(RECORDS[0], ALL, 'value')).toBeNull();
  });
});

describe('monthTotals', () => {
  it('reports every measure at once for the visible groups', () => {
    expect(monthTotals(RECORDS[1], ALL))
      .toEqual({ shares: 105000, value: 28007125, txns: 5 });
    expect(monthTotals(RECORDS[1], CEO_ONLY))
      .toEqual({ shares: 45000, value: 12007125, txns: 2 });
  });
});

describe('monthRows', () => {
  it('keeps only the months that had a sale', () => {
    expect(monthRows(RECORDS, ALL).map((r) => r.month)).toEqual(['2025-02', '2025-03']);
  });

  it('drops a month whose only seller is filtered out', () => {
    expect(monthRows(RECORDS, CEO_ONLY).map((r) => r.month)).toEqual(['2025-02']);
  });
});

describe('formatting', () => {
  it('compacts dollars without a dead decimal', () => {
    expect(compactUSD(160_000_000)).toBe('$160M');
    expect(compactUSD(2_500_000)).toBe('$2.5M');
    expect(compactUSD(250_000)).toBe('$250K');
    expect(compactUSD(840)).toBe('$840');
    expect(compactUSD(1_200_000_000)).toBe('$1.2B');
  });

  it('compacts share counts the same way', () => {
    expect(compactShares(800_000)).toBe('800K');
    expect(compactShares(47_500)).toBe('47.5K');
    expect(compactShares(730)).toBe('730');
  });

  it('formats an axis tick per measure', () => {
    expect(formatTick('value', 40_000_000)).toBe('$40M');
    expect(formatTick('shares', 200_000)).toBe('200K');
    expect(formatTick('txns', 4)).toBe('4');
  });

  it('spells a tooltip figure out further than a tick', () => {
    expect(formatAmount('value', 12_007_125)).toBe('$12.0M');
    expect(formatAmount('shares', 45_000)).toBe('45,000');
    expect(formatAmount('txns', 1)).toBe('1 filing');
    expect(formatAmount('txns', 3)).toBe('3 filings');
  });

  it('names a month', () => {
    expect(formatMonth('2026-02')).toBe('Feb 2026');
    expect(shortMonth('2026-02')).toBe('Feb');
    expect(formatMonth('nope')).toBe('nope');
  });

  it('rounds the one share figure the caption quotes', () => {
    expect(formatPercent(0.4207)).toBe('42%');
    expect(formatPercent(0)).toBe('0%');
  });
});
