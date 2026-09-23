import { INSTRUMENTS } from './instruments';
import { daysBetween } from '../../../tmobile/src/sellPressure';

// Crypto trades every day; an exchange shuts for weekends, holidays, and once
// for the week after 9/11, which is the longest gap any fund here has.
const LONGEST_GAP = { crypto: 1, exchange: 7 };
const isCrypto = (symbol) => symbol.endsWith('-USD');

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
    expect(longest).toBeLessThanOrEqual(LONGEST_GAP[isCrypto(symbol) ? 'crypto' : 'exchange']);
  });

  it('carries no close that moved half its value in a session', () => {
    // a unit slip or an unadjusted split would; Ethereum's worst real day is -42%
    CLOSES.slice(1).forEach(([, close], i) => {
      expect(Math.abs(close / CLOSES[i][1] - 1)).toBeLessThan(0.5);
    });
  });
});
