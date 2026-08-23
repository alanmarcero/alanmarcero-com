import {
  SELLER_FILTERS, DEFAULT_FILTER, visibleSeries, selectedWeeks, summarize,
  sellerTotals, formatUSD, formatShares, formatExactUSD, formatWeek, formatPrice,
} from './insiderFilters';

const sievertWeeks = [
  {
    week: '2024-02-19', close: 160, shares: 20000, value: 3200000, txns: 1,
    people: [{ name: 'Mike Sievert', shares: 20000, value: 3200000 }],
  },
];

const otherWeeks = [
  {
    week: '2024-02-19', close: 160, shares: 5000, value: 800000, txns: 2,
    people: [{ name: 'Peter Osvaldik', shares: 5000, value: 800000 }],
  },
  {
    week: '2024-05-13', close: 170, shares: 1000, value: 170000, txns: 1,
    people: [{ name: 'Mike Sievert', shares: 0, value: 0 },
      { name: 'Jon Freier', shares: 1000, value: 170000 }],
  },
];

describe('SELLER_FILTERS', () => {
  it('offers all, Sievert-only and everyone-else', () => {
    expect(SELLER_FILTERS.map((f) => f.id)).toEqual(['all', 'sievert', 'others']);
  });

  it('defaults to showing everyone', () => {
    expect(DEFAULT_FILTER).toBe('all');
  });
});

describe('visibleSeries', () => {
  it('shows both series for "all"', () => {
    expect(visibleSeries('all')).toEqual({ sievert: true, others: true });
  });

  it('isolates the CEO', () => {
    expect(visibleSeries('sievert')).toEqual({ sievert: true, others: false });
  });

  it('isolates everyone else', () => {
    expect(visibleSeries('others')).toEqual({ sievert: false, others: true });
  });

  it('shows nothing for an unknown filter', () => {
    expect(visibleSeries('nope')).toEqual({ sievert: false, others: false });
  });
});

describe('selectedWeeks', () => {
  it('tags each row with its group', () => {
    const rows = selectedWeeks('all', sievertWeeks, otherWeeks);
    expect(rows).toHaveLength(3);
    expect(rows.filter((r) => r.group === 'sievert')).toHaveLength(1);
    expect(rows.filter((r) => r.group === 'others')).toHaveLength(2);
  });

  it('returns only the CEO rows when filtered to him', () => {
    const rows = selectedWeeks('sievert', sievertWeeks, otherWeeks);
    expect(rows).toHaveLength(1);
    expect(rows[0].group).toBe('sievert');
  });

  it('returns only the other rows when filtered to everyone else', () => {
    const rows = selectedWeeks('others', sievertWeeks, otherWeeks);
    expect(rows.map((r) => r.week)).toEqual(['2024-02-19', '2024-05-13']);
    expect(rows.every((r) => r.group === 'others')).toBe(true);
  });

  it('sorts chronologically', () => {
    const rows = selectedWeeks('all', sievertWeeks, otherWeeks);
    const weeks = rows.map((r) => r.week);
    expect([...weeks].sort()).toEqual(weeks);
  });

  it('leaves the source arrays untouched', () => {
    const before = JSON.stringify(sievertWeeks);
    selectedWeeks('all', sievertWeeks, otherWeeks);
    expect(JSON.stringify(sievertWeeks)).toBe(before);
  });
});

describe('summarize', () => {
  it('counts distinct weeks, not rows', () => {
    const summary = summarize(selectedWeeks('all', sievertWeeks, otherWeeks));
    // 2024-02-19 appears in both groups but is one week
    expect(summary.weekCount).toBe(2);
  });

  it('totals shares, value and filings', () => {
    const summary = summarize(selectedWeeks('all', sievertWeeks, otherWeeks));
    expect(summary.shares).toBe(26000);
    expect(summary.value).toBe(4170000);
    expect(summary.txns).toBe(4);
  });

  it('returns zeroes for an empty selection', () => {
    expect(summarize([])).toEqual({ weekCount: 0, shares: 0, value: 0, txns: 0 });
  });
});

describe('sellerTotals', () => {
  it('adds a person up across weeks and sorts by shares', () => {
    const totals = sellerTotals(selectedWeeks('all', sievertWeeks, otherWeeks));
    expect(totals[0]).toEqual({ name: 'Mike Sievert', shares: 20000, value: 3200000 });
    expect(totals.map((t) => t.name)).toContain('Jon Freier');
  });

  it('handles no rows', () => {
    expect(sellerTotals([])).toEqual([]);
  });
});

describe('formatUSD', () => {
  it('compacts billions, millions and thousands', () => {
    expect(formatUSD(2_500_000_000)).toBe('$2.50B');
    expect(formatUSD(4_240_000)).toBe('$4.2M');
    expect(formatUSD(912_000)).toBe('$912K');
  });

  it('leaves small amounts alone', () => {
    expect(formatUSD(840)).toBe('$840');
  });
});

describe('formatShares', () => {
  it('adds thousands separators', () => {
    expect(formatShares(1011500)).toBe('1,011,500');
  });
});

describe('formatExactUSD', () => {
  it('keeps every digit for the table', () => {
    expect(formatExactUSD(3200000)).toBe('$3,200,000');
  });
});

describe('formatWeek', () => {
  it('renders a readable date', () => {
    expect(formatWeek('2024-02-19')).toBe('Feb 19, 2024');
  });

  it('drops a leading zero from the day', () => {
    expect(formatWeek('2021-08-02')).toBe('Aug 2, 2021');
  });

  it('passes through anything it cannot parse', () => {
    expect(formatWeek('not-a-date')).toBe('not-a-date');
  });
});

describe('formatPrice', () => {
  it('always shows cents', () => {
    expect(formatPrice(144.02)).toBe('$144.02');
    expect(formatPrice(136)).toBe('$136.00');
  });
});
