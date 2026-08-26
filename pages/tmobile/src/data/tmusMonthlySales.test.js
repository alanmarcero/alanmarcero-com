import { MONTHLY_SALES, NASDAQ_META, SALE_TXNS } from './tmusMonthlySales';
import { SIEVERT_SELL_WEEKS, OTHER_SELL_WEEKS } from './tmusInsiderSales';

const ISO_MONTH = /^\d{4}-\d{2}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const GROUPS = ['sievert', 'others'];

const sum = (list, pick) => list.reduce((total, item) => total + pick(item), 0);

describe('NASDAQ_META', () => {
  it('names Nasdaq as the source, with the page a reader can check', () => {
    expect(NASDAQ_META.source).toMatch(/nasdaq/i);
    expect(NASDAQ_META.sourceUrl).toBe(
      'https://www.nasdaq.com/market-activity/stocks/tmus/insider-activity',
    );
  });

  it('records that the feed capped the window', () => {
    expect(NASDAQ_META.feedRecords).toBe(250);
    expect(NASDAQ_META.feedCapped).toBe(true);
  });

  it('excludes Deutsche Telekom and says how much that removed', () => {
    expect(NASDAQ_META.excludedFiler).toBe('DEUTSCHE TELEKOM AG');
    expect(NASDAQ_META.excludedRows).toBeGreaterThan(NASDAQ_META.txnCount);
    expect(NASDAQ_META.excludedRows + NASDAQ_META.txnCount)
      .toBe(NASDAQ_META.saleRows);
  });

  it('counts what actually survived', () => {
    expect(NASDAQ_META.txnCount).toBe(SALE_TXNS.length);
    expect(NASDAQ_META.monthCount).toBe(MONTHLY_SALES.length);
    expect(NASDAQ_META.sellerCount).toBe(new Set(SALE_TXNS.map((t) => t.name)).size);
  });

  it('covers about two years — all the feed will give', () => {
    const years = (new Date(NASDAQ_META.feedLast) - new Date(NASDAQ_META.feedFirst))
      / (365.25 * 24 * 3600 * 1000);
    expect(years).toBeGreaterThan(1.8);
    expect(years).toBeLessThan(2.2);
  });
});

describe('SALE_TXNS', () => {
  it('holds sales only — no Deutsche Telekom, no dispositions', () => {
    expect(SALE_TXNS.some((t) => /DEUTSCHE/i.test(t.filer))).toBe(false);
    SALE_TXNS.forEach((txn) => expect(['market', 'plan']).toContain(txn.kind));
  });

  it('is chronological', () => {
    const dates = SALE_TXNS.map((t) => t.date);
    expect([...dates].sort()).toEqual(dates);
  });

  it('carries a positive share count, price and value on every row', () => {
    SALE_TXNS.forEach((txn) => {
      expect(txn.date).toMatch(ISO_DATE);
      expect(txn.shares).toBeGreaterThan(0);
      expect(txn.price).toBeGreaterThan(0);
      expect(txn.value).toBe(Math.round(txn.shares * txn.price));
      expect(['direct', 'indirect']).toContain(txn.own);
    });
  });

  it('spells every seller readably, not in the feed\u2019s caps', () => {
    SALE_TXNS.forEach((txn) => expect(txn.name).not.toBe(txn.name.toUpperCase()));
  });
});

describe('MONTHLY_SALES', () => {
  it('is one continuous run of months with no gap and no duplicate', () => {
    const months = MONTHLY_SALES.map((r) => r.month);
    months.forEach((month) => expect(month).toMatch(ISO_MONTH));
    expect(new Set(months).size).toBe(months.length);
    expect([...months].sort()).toEqual(months);

    months.slice(1).forEach((month, i) => {
      const previous = new Date(`${months[i]}-01T00:00:00Z`);
      previous.setUTCMonth(previous.getUTCMonth() + 1);
      expect(month).toBe(previous.toISOString().slice(0, 7));
    });
  });

  it('spans exactly the window the metadata advertises', () => {
    expect(MONTHLY_SALES[0].month).toBe(NASDAQ_META.feedFirst.slice(0, 7));
    expect(MONTHLY_SALES[MONTHLY_SALES.length - 1].month)
      .toBe(NASDAQ_META.feedLast.slice(0, 7));
  });

  it('keeps a slot for a month in which nobody sold', () => {
    const quiet = MONTHLY_SALES.filter(
      (r) => !r.sievert.txns && !r.others.txns,
    );
    expect(quiet.length).toBe(NASDAQ_META.quietMonths);
    expect(quiet.length).toBeGreaterThan(0);
    quiet.forEach((r) => {
      expect(r.sievert.value).toBe(0);
      expect(r.others.value).toBe(0);
    });
  });

  it('holds both groups, fully formed, on every month', () => {
    MONTHLY_SALES.forEach((record) => {
      GROUPS.forEach((group) => {
        const bucket = record[group];
        expect(typeof bucket.shares).toBe('number');
        expect(typeof bucket.value).toBe('number');
        expect(Array.isArray(bucket.people)).toBe(true);
        // a group with people sold, and a group that sold has people
        expect(bucket.people.length > 0).toBe(bucket.txns > 0);
        expect(sum(bucket.people, (p) => p.shares)).toBe(bucket.shares);
      });
    });
  });

  it('puts Mike Sievert in the CEO bucket and nobody else', () => {
    MONTHLY_SALES.forEach((record) => {
      record.sievert.people.forEach((p) => expect(p.name).toBe('Mike Sievert'));
      record.others.people.forEach((p) => expect(p.name).not.toBe('Mike Sievert'));
    });
  });

  it('rolls up the transactions exactly, losing nothing', () => {
    const monthly = sum(MONTHLY_SALES, (r) => r.sievert.txns + r.others.txns);
    expect(monthly).toBe(SALE_TXNS.length);
    expect(sum(MONTHLY_SALES, (r) => r.sievert.shares + r.others.shares))
      .toBe(sum(SALE_TXNS, (t) => t.shares));
    expect(sum(MONTHLY_SALES, (r) => r.sievert.value + r.others.value))
      .toBe(sum(SALE_TXNS, (t) => t.value));
  });

  it('files every transaction under its own month', () => {
    MONTHLY_SALES.forEach((record) => {
      const expected = SALE_TXNS.filter((t) => t.date.startsWith(record.month));
      expect(record.sievert.txns + record.others.txns).toBe(expected.length);
    });
  });
});

/**
 * The page shows the same two years twice, from two different sources. If they
 * ever stopped agreeing, one of the two charts would be lying — so the claim
 * the page makes in its source notes is asserted here rather than trusted.
 */
describe('against the Form 4 series', () => {
  const secWeeks = [...SIEVERT_SELL_WEEKS, ...OTHER_SELL_WEEKS].filter(
    (week) => week.week >= NASDAQ_META.feedFirst && week.week <= NASDAQ_META.feedLast,
  );

  it('agrees share for share over the overlapping window', () => {
    expect(sum(secWeeks, (w) => w.shares)).toBe(sum(SALE_TXNS, (t) => t.shares));
  });

  it('agrees on the dollar total to within rounding', () => {
    const sec = sum(secWeeks, (w) => w.value);
    const nasdaq = sum(SALE_TXNS, (t) => t.value);
    expect(Math.abs(nasdaq - sec) / sec).toBeLessThan(0.0001);
  });

  it('names the same sellers, spelled the same way', () => {
    const secNames = new Set(secWeeks.flatMap((w) => w.people.map((p) => p.name)));
    const nasdaqNames = new Set(SALE_TXNS.map((t) => t.name));
    expect([...nasdaqNames].sort()).toEqual([...secNames].sort());
  });
});
