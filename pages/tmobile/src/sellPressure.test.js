import {
  biggestDay, change, currentGap, daysBetween, describeChange, dormantSellers, formatChange,
  formatDays, gapRuns, gapSeries, isoBefore, longestClosedGap, medianGap,
  peakGap, periodComparison, SPELL_BREAK, saleDates, selectDays, sellerRoll, spanLabel,
  totalsBetween,
} from './sellPressure';

const day = (date, group, value, people) => ({
  date,
  week: date,
  group,
  shares: value / 100,
  value,
  txns: 1,
  people: people || [{ name: group === 'sievert' ? 'Mike Sievert' : 'Someone Else', shares: value / 100, value }],
});

const DAYS = [
  day('2025-01-06', 'sievert', 1000),
  day('2025-01-08', 'others', 500),
  day('2025-02-10', 'others', 2000),
  day('2025-06-02', 'sievert', 4000),
];

describe('date arithmetic', () => {
  it('counts whole days between two dates', () => {
    expect(daysBetween('2025-01-01', '2025-01-08')).toBe(7);
    expect(daysBetween('2025-01-08', '2025-01-01')).toBe(-7);
    expect(daysBetween('2025-01-01', '2025-01-01')).toBe(0);
  });

  it('counts across a month, a year and a leap day', () => {
    expect(daysBetween('2025-12-30', '2026-01-02')).toBe(3);
    expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2);
  });

  it('steps back a given number of days', () => {
    expect(isoBefore('2026-01-02', 3)).toBe('2025-12-30');
    expect(isoBefore('2026-03-01', 1)).toBe('2026-02-28');
  });

  it('is the inverse of daysBetween', () => {
    expect(daysBetween(isoBefore('2026-09-09', 181), '2026-09-09')).toBe(181);
  });
});

describe('selectDays', () => {
  it('keeps only the groups on screen', () => {
    expect(selectDays(DAYS, { sievert: true, others: false }).map((d) => d.date))
      .toEqual(['2025-01-06', '2025-06-02']);
    expect(selectDays(DAYS, { sievert: false, others: true }).map((d) => d.date))
      .toEqual(['2025-01-08', '2025-02-10']);
    expect(selectDays(DAYS, { sievert: true, others: true })).toHaveLength(4);
  });
});

describe('saleDates', () => {
  it('is one sorted entry per day, however many people sold on it', () => {
    const both = [...DAYS, day('2025-01-06', 'others', 300)];
    expect(saleDates(both)).toEqual(['2025-01-06', '2025-01-08', '2025-02-10', '2025-06-02']);
  });

  it('is empty for an empty selection', () => {
    expect(saleDates([])).toEqual([]);
  });
});

describe('gapRuns', () => {
  const runs = gapRuns(saleDates(DAYS), '2025-07-02');

  it('closes one run per consecutive pair, then leaves the last one open', () => {
    expect(runs.map((r) => r.days)).toEqual([2, 33, 112, 30]);
    expect(runs.filter((r) => r.open)).toHaveLength(1);
    expect(runs[runs.length - 1]).toMatchObject({ from: '2025-06-02', to: '2025-07-02', open: true });
  });

  it('has nothing to measure without a sale', () => {
    expect(gapRuns([], '2025-07-02')).toEqual([]);
  });

  it('reports a single sale as one open run', () => {
    expect(gapRuns(['2025-06-02'], '2025-07-02'))
      .toEqual([{ from: '2025-06-02', to: '2025-07-02', days: 30, open: true }]);
  });

  it('picks the open run out and the record out separately', () => {
    expect(currentGap(runs).days).toBe(30);
    expect(longestClosedGap(runs)).toMatchObject({ days: 112, from: '2025-02-10' });
  });

  it('never counts the open run as the record, however long it gets', () => {
    const long = gapRuns(saleDates(DAYS), '2030-01-01');
    expect(currentGap(long).days).toBeGreaterThan(1000);
    expect(longestClosedGap(long).days).toBe(112);
  });

  it('has no record and no current gap when nobody sold', () => {
    expect(longestClosedGap([])).toBeNull();
    expect(currentGap([])).toBeNull();
  });
});

describe('medianGap', () => {
  it('is the middle closed run, ignoring the open one', () => {
    expect(medianGap(gapRuns(saleDates(DAYS), '2025-07-02'))).toBe(33);
  });

  it('averages the two middles on an even count', () => {
    const runs = gapRuns(['2025-01-01', '2025-01-03', '2025-01-13', '2025-01-23', '2025-02-22'], '2025-03-01');
    // closed runs: 2, 10, 10, 30 -> middles 10 and 10
    expect(runs.filter((r) => !r.open).map((r) => r.days)).toEqual([2, 10, 10, 30]);
    expect(medianGap(runs)).toBe(10);
  });

  it('ignores the pauses that sit inside one spell of selling', () => {
    // three filings two days apart, then a real three-month pause, then two more
    const clustered = gapRuns(
      ['2025-01-06', '2025-01-08', '2025-01-10', '2025-04-10', '2025-04-12'],
      '2025-05-01',
    );
    expect(medianGap(clustered)).toBe(2);
    expect(medianGap(clustered, { longerThan: SPELL_BREAK })).toBe(90);
  });

  it('falls back to zero when every pause is inside a spell', () => {
    const tight = gapRuns(['2025-01-06', '2025-01-08'], '2025-05-01');
    expect(medianGap(tight, { longerThan: SPELL_BREAK })).toBe(0);
  });

  it('is zero when there is no closed run to take a middle of', () => {
    expect(medianGap(gapRuns(['2025-06-02'], '2025-07-02'))).toBe(0);
    expect(medianGap([])).toBe(0);
  });
});

describe('totalsBetween', () => {
  it('adds up only the sales inside the window, both ends included', () => {
    expect(totalsBetween(DAYS, '2025-01-06', '2025-02-10'))
      .toEqual({ value: 3500, shares: 35, txns: 3, days: 3, sellers: 2 });
  });

  it('counts a person once however many days they sold on', () => {
    const repeat = [day('2025-01-06', 'others', 100), day('2025-01-07', 'others', 100)];
    expect(totalsBetween(repeat, '2025-01-01', '2025-01-31').sellers).toBe(1);
  });

  it('is all zeroes for a window with no sale', () => {
    expect(totalsBetween(DAYS, '2025-03-01', '2025-05-31'))
      .toEqual({ value: 0, shares: 0, txns: 0, days: 0, sellers: 0 });
  });
});

describe('change', () => {
  it('is a signed fraction against the earlier figure', () => {
    expect(change(100, 50)).toBe(-0.5);
    expect(change(100, 150)).toBe(0.5);
    expect(change(100, 100)).toBe(0);
  });

  it('refuses to divide by a base of nothing', () => {
    expect(change(0, 50)).toBeNull();
  });
});

describe('periodComparison', () => {
  const compared = periodComparison(DAYS, '2025-07-02', 90);

  it('sets the two windows back to back, neither overlapping the other', () => {
    expect(compared.recentStart).toBe('2025-04-04');
    expect(compared.priorStart).toBe('2025-01-04');
    expect(daysBetween(compared.priorStart, compared.recentStart)).toBe(90);
  });

  it('files every sale into exactly one of the two windows', () => {
    expect(compared.recent.txns + compared.prior.txns).toBe(DAYS.length);
    expect(compared.recent.txns).toBe(1);
    expect(compared.prior.txns).toBe(3);
  });

  it('reports the change on all four figures', () => {
    expect(compared.change.value).toBeCloseTo((4000 - 3500) / 3500);
    expect(compared.change.txns).toBeCloseTo(-2 / 3);
    expect(compared.change.sellers).toBeCloseTo(-0.5);
  });
});

describe('gapSeries', () => {
  const weeks = ['2025-01-06', '2025-01-13', '2025-01-20', '2025-01-27'];

  it('starts only once the selection has actually sold', () => {
    const series = gapSeries(weeks, ['2025-01-13'], '2025-01-27');
    expect(series.map((p) => p.week)).toEqual(['2025-01-13', '2025-01-20', '2025-01-27']);
  });

  it('falls to zero on the week of a sale and climbs while nobody sells', () => {
    const series = gapSeries(weeks, ['2025-01-06', '2025-01-20'], '2025-01-27');
    expect(series.map((p) => p.days)).toEqual([0, 7, 0, 7]);
  });

  it('names the sale each point is counting from', () => {
    const series = gapSeries(weeks, ['2025-01-06', '2025-01-20'], '2025-01-27');
    expect(series[1].since).toBe('2025-01-06');
    expect(series[3].since).toBe('2025-01-20');
  });

  it('reads the last point at the as-of date, so it matches the headline gap', () => {
    const series = gapSeries(weeks, ['2025-01-06'], '2025-01-29');
    const last = series[series.length - 1];
    expect(last.days).toBe(23);
    expect(last.days).toBe(currentGap(gapRuns(['2025-01-06'], '2025-01-29')).days);
  });

  it('counts a mid-week sale from its own date, not from its Monday', () => {
    const series = gapSeries(weeks, ['2025-01-15'], '2025-01-27');
    expect(series.map((p) => [p.week, p.days])).toEqual([['2025-01-20', 5], ['2025-01-27', 12]]);
  });

  it('draws nothing for a selection that never sold', () => {
    expect(gapSeries(weeks, [], '2025-01-27')).toEqual([]);
    expect(peakGap([])).toBe(0);
  });

  it('peaks at the tallest tooth', () => {
    expect(peakGap(gapSeries(weeks, ['2025-01-06'], '2025-01-27'))).toBe(21);
  });
});

describe('sellerRoll', () => {
  const roll = sellerRoll([
    day('2025-01-06', 'others', 500, [{ name: 'Ada', shares: 5, value: 500 }]),
    day('2025-03-06', 'others', 900, [
      { name: 'Ada', shares: 4, value: 400 }, { name: 'Bo', shares: 5, value: 500 },
    ]),
  ]);

  it('is one row per person, biggest seller first', () => {
    expect(roll.map((r) => r.name)).toEqual(['Ada', 'Bo']);
    expect(roll[0]).toMatchObject({ value: 900, shares: 9, txns: 2 });
  });

  it('keeps the first and last day each of them sold', () => {
    expect(roll[0]).toMatchObject({ first: '2025-01-06', last: '2025-03-06' });
    expect(roll[1]).toMatchObject({ first: '2025-03-06', last: '2025-03-06' });
  });

  it('finds who has gone quiet since a cutoff', () => {
    expect(dormantSellers(roll, '2025-02-01').map((r) => r.name)).toEqual([]);
    expect(dormantSellers(roll, '2025-04-01').map((r) => r.name)).toEqual(['Ada', 'Bo']);
  });
});

describe('biggestDay', () => {
  it('is the largest day in the window, with its share of the window', () => {
    const top = biggestDay(DAYS, '2025-01-01', '2025-12-31');
    expect(top.date).toBe('2025-06-02');
    expect(top.share).toBeCloseTo(4000 / 7500);
  });

  it('is bounded by the window it is asked about', () => {
    expect(biggestDay(DAYS, '2025-01-01', '2025-01-31').date).toBe('2025-01-06');
    expect(biggestDay(DAYS, '2025-03-01', '2025-05-01')).toBeNull();
  });

  it('reads a lone sale as the whole window', () => {
    expect(biggestDay(DAYS, '2025-06-01', '2025-06-30').share).toBe(1);
  });
});

describe('formatting', () => {
  it('does not write "1 days"', () => {
    expect(formatDays(1)).toBe('1 day');
    expect(formatDays(112)).toBe('112 days');
  });

  it('signs a change and spells one out', () => {
    expect(formatChange(-0.6444)).toBe('-64%');
    expect(formatChange(0.12)).toBe('+12%');
    expect(formatChange(null)).toBe('—');
    expect(describeChange(-0.6444)).toBe('down 64%');
    expect(describeChange(0.12)).toBe('up 12%');
    expect(describeChange(0)).toBe('unchanged');
    expect(describeChange(null)).toBe('not comparable');
  });

  it('reads a span in months, or in whole years where that is cleaner', () => {
    expect(spanLabel(182)).toBe('6 months');
    expect(spanLabel(365)).toBe('1 year');
    expect(spanLabel(90)).toBe('3 months');
  });
});
