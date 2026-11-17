import { INSTRUMENTS } from './instruments';
import { daysBetween } from '../drawdown/drawdowns';

// Crypto trades every day; US exchanges shut up to 7 days (e.g. 9/11),
// while KRX/Tadawul holiday breaks (Chuseok, Eid) can span up to 11 days.
const LONGEST_GAP = { crypto: 1, international: 12, exchange: 7 };
const isCrypto = (symbol) => symbol.endsWith('-USD');
const isInternational = (symbol) => symbol.includes('.');

describe.each(INSTRUMENTS.map((i) => [i.symbol, i]))('%s closes', (symbol, instrument) => {
  let CLOSES;
  let META;
  beforeAll(async () => {
    ({ CLOSES, META } = await instrument.load());
  });

  it('matches the list the page renders before it loads', () => {
    expect(META.symbol).toBe(symbol);
    expect(CLOSES).toHaveLength(instrument.sessions);
    expect(CLOSES[0][0]).toBe(instrument.first);
    expect(CLOSES[CLOSES.length - 1][0]).toBe(instrument.last);
    const peak = Math.max(...CLOSES.map(([, close]) => close));
    const current = CLOSES[CLOSES.length - 1][1] / peak - 1;
    expect(instrument.drawdown).toBeCloseTo(current, 4);
  });

  it('is strictly date-ordered with a positive close every session', () => {
    CLOSES.forEach(([date, close], i) => {
      expect(Number.isFinite(close) && close > 0).toBe(true);
      if (i) expect(date > CLOSES[i - 1][0]).toBe(true);
    });
  });

  it('has no hole a skipped null close would leave', () => {
    const longest = CLOSES.slice(1).reduce(
      (max, [date], i) => Math.max(max, daysBetween(CLOSES[i][0], date)),
      0,
    );
    const gapLimit = isCrypto(symbol)
      ? LONGEST_GAP.crypto
      : (isInternational(symbol) ? LONGEST_GAP.international : LONGEST_GAP.exchange);
    expect(longest).toBeLessThanOrEqual(gapLimit);
  });

  it('carries no close that moved abnormally in a session', () => {
    // a unit slip or an unadjusted split would; AAPL (-51.9%, Sep 2000) and
    // AMD (+52.3%) are real historical moves, and sub-$0.10 split-adjusted
    // 1970s closes (WMT) are subject to 2-decimal rounding ($0.01 -> $0.02).
    CLOSES.slice(1).forEach(([, close], i) => {
      if (CLOSES[i][1] < 0.1) return;
      expect(Math.abs(close / CLOSES[i][1] - 1)).toBeLessThan(0.55);
    });
  });
});
