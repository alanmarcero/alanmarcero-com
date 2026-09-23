import { monthlyCaption, quietCaption } from './captions';

const halfYearOf = (recentValue, recentTxns, priorValue, change) => ({
  span: 182,
  recent: { value: recentValue, txns: recentTxns },
  prior: { value: priorValue },
  change: { value: change },
});

const PRESSURE = {
  current: { from: '2025-06-02', days: 10 },
  record: { days: 112 },
  median: 73,
  halfYear: halfYearOf(4000000, 3, 10000000, -0.6),
  year: { change: { txns: -0.5 } },
  topDay: null,
};

describe('quietCaption', () => {
  it('reads the open quiet against the record and the half-year before', () => {
    expect(quietCaption(PRESSURE, '2025-06-12')).toBe(
      'Each tooth falls to the floor on a sale and climbs while nobody sells, so a wide '
      + 'tooth is a quiet stretch. The one on the right is still open: 10 days as of '
      + 'Jun 12, 2025, against a previous longest of 112 days and a typical 73 days '
      + 'between spells of selling. Over the last 6 months this selection sold $4.0M '
      + 'across 3 filings, down 60% on the $10.0M of the 6 months before. ',
    );
  });

  it('leaves the record out when there is none', () => {
    expect(quietCaption({ ...PRESSURE, record: null }, '2025-06-12'))
      .toContain('10 days as of Jun 12, 2025. Over the last');
  });

  it('names a day the trailing year leans on, and only then', () => {
    const topDay = {
      date: '2025-02-12', share: 0.42, value: 119700000, people: [{ name: 'Raul Claure' }],
    };
    expect(quietCaption({ ...PRESSURE, topDay }, '2025-06-12')).toMatch(
      /leans on a single day — Feb 12, 2025 is 42% of it \(Raul Claure, \$119\.7M\).*down 50% on the year/,
    );
    expect(quietCaption({ ...PRESSURE, topDay: { ...topDay, share: 0.39 } }, '2025-06-12'))
      .not.toMatch(/leans on/);
  });

  it('says so when nobody sold', () => {
    expect(quietCaption({ ...PRESSURE, current: null }, '2025-06-12'))
      .toBe('Nobody in this selection sold in the window, so there is no stretch to measure.');
  });
});

describe('monthlyCaption', () => {
  const summary = {
    peak: { month: '2026-02', total: 150000000 },
    peakShare: 0.42,
    total: 357000000,
    quietCount: 5,
    monthCount: 25,
    spread: 4,
  };
  const base = { summary, measure: 'value', seller: null, quietLead: 'Nobody sold in' };

  it('quotes the peak, its share and the quiet months', () => {
    expect(monthlyCaption(base)).toBe(
      'Feb 2026 is 42% of the $357.0M in this window. Nobody sold in 5 of the 25 months. '
      + 'The table below has every figure at full precision.',
    );
  });

  it('attributes the peak when one seller holds it', () => {
    expect(monthlyCaption({ ...base, seller: { name: 'Mike Sievert' } }))
      .toContain('in this window, mostly Mike Sievert.');
  });

  it('owns up to the hairline floor once the spread is wide', () => {
    expect(monthlyCaption({ ...base, summary: { ...summary, spread: 20 } }))
      .toContain('25 months, and a month with a sale is drawn at least a hairline tall');
  });

  it('says so when nobody sold', () => {
    expect(monthlyCaption({ ...base, summary: { ...summary, peak: null } }))
      .toBe('Nobody in this selection sold during the window.');
  });
});
