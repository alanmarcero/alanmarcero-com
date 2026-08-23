import {
  TMUS_META, TMUS_WEEKLY, SIEVERT_SELL_WEEKS, OTHER_SELL_WEEKS,
} from './tmusInsiderSales';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const allSellWeeks = [...SIEVERT_SELL_WEEKS, ...OTHER_SELL_WEEKS];

describe('TMUS_META', () => {
  it('names both sources', () => {
    expect(TMUS_META.priceSource).toMatch(/Yahoo/i);
    expect(TMUS_META.insiderSource).toMatch(/Form 4/i);
  });

  it('excludes Deutsche Telekom, and only Deutsche Telekom', () => {
    expect(TMUS_META.excludedFilers).toEqual(['DEUTSCHE TELEKOM AG']);
  });

  it('covers a five-year window', () => {
    const start = new Date(TMUS_META.windowStart);
    const end = new Date(TMUS_META.windowEnd);
    const years = (end - start) / (365.25 * 24 * 3600 * 1000);
    expect(years).toBeGreaterThan(4.9);
    expect(years).toBeLessThan(5.2);
  });
});

describe('TMUS_WEEKLY', () => {
  it('holds about five years of weekly closes', () => {
    // 5 years ~= 261 weeks; allow for exchange holidays
    expect(TMUS_WEEKLY.length).toBeGreaterThan(255);
    expect(TMUS_WEEKLY.length).toBeLessThan(266);
  });

  it('is strictly chronological with no duplicate weeks', () => {
    const weeks = TMUS_WEEKLY.map((p) => p.week);
    expect(new Set(weeks).size).toBe(weeks.length);
    expect([...weeks].sort()).toEqual(weeks);
  });

  it('spans exactly the window the metadata advertises', () => {
    expect(TMUS_WEEKLY[0].week).toBe(TMUS_META.windowStart);
    expect(TMUS_WEEKLY[TMUS_WEEKLY.length - 1].week).toBe(TMUS_META.windowEnd);
  });

  it('anchors every week to a Monday', () => {
    TMUS_WEEKLY.forEach((p) => {
      expect(ISO_DATE.test(p.week)).toBe(true);
      expect(new Date(`${p.week}T00:00:00Z`).getUTCDay()).toBe(1);
    });
  });

  it('carries a plausible positive close for every week', () => {
    TMUS_WEEKLY.forEach((p) => {
      expect(p.close).toBeGreaterThan(50);
      expect(p.close).toBeLessThan(500);
    });
  });
});

describe('sell weeks', () => {
  it('records sales in both groups', () => {
    expect(SIEVERT_SELL_WEEKS.length).toBeGreaterThan(0);
    expect(OTHER_SELL_WEEKS.length).toBeGreaterThan(0);
  });

  it('only ever lands on a week that exists in the price series', () => {
    const priced = new Set(TMUS_WEEKLY.map((p) => p.week));
    allSellWeeks.forEach((w) => expect(priced.has(w.week)).toBe(true));
  });

  it('quotes the same close as the price series for that week', () => {
    const closeByWeek = new Map(TMUS_WEEKLY.map((p) => [p.week, p.close]));
    allSellWeeks.forEach((w) => expect(w.close).toBe(closeByWeek.get(w.week)));
  });

  it('has no duplicate weeks within a group', () => {
    [SIEVERT_SELL_WEEKS, OTHER_SELL_WEEKS].forEach((group) => {
      const weeks = group.map((w) => w.week);
      expect(new Set(weeks).size).toBe(weeks.length);
    });
  });

  it('is chronological within each group', () => {
    [SIEVERT_SELL_WEEKS, OTHER_SELL_WEEKS].forEach((group) => {
      const weeks = group.map((w) => w.week);
      expect([...weeks].sort()).toEqual(weeks);
    });
  });

  it('carries positive shares, value and filing counts', () => {
    allSellWeeks.forEach((w) => {
      expect(w.shares).toBeGreaterThan(0);
      expect(w.value).toBeGreaterThan(0);
      expect(w.txns).toBeGreaterThan(0);
      expect(w.people.length).toBeGreaterThan(0);
    });
  });

  it("credits every share in a week to that week's named people", () => {
    allSellWeeks.forEach((w) => {
      const peopleShares = w.people.reduce((sum, p) => sum + p.shares, 0);
      expect(peopleShares).toBe(w.shares);
    });
  });

  it('attributes only Mike Sievert to the Sievert series', () => {
    SIEVERT_SELL_WEEKS.forEach((w) => {
      expect(w.people.map((p) => p.name)).toEqual(['Mike Sievert']);
    });
  });

  it('never attributes Mike Sievert to the everyone-else series', () => {
    OTHER_SELL_WEEKS.forEach((w) => {
      w.people.forEach((p) => expect(p.name).not.toMatch(/sievert/i));
    });
  });

  it('never attributes a sale to Deutsche Telekom', () => {
    allSellWeeks.forEach((w) => {
      w.people.forEach((p) => expect(p.name).not.toMatch(/deutsche|telekom/i));
    });
  });

  it('accounts for every sale transaction the metadata counts', () => {
    const txns = allSellWeeks.reduce((sum, w) => sum + w.txns, 0);
    expect(txns).toBe(TMUS_META.saleTxnCount);
  });

  it('implies a share price in the same ballpark as that week’s close', () => {
    // value / shares is the real weighted trade price; a week's close should be
    // within a sane band of it, which catches unit slips in the pipeline.
    allSellWeeks.forEach((w) => {
      const impliedPrice = w.value / w.shares;
      expect(impliedPrice).toBeGreaterThan(w.close * 0.7);
      expect(impliedPrice).toBeLessThan(w.close * 1.4);
    });
  });
});
