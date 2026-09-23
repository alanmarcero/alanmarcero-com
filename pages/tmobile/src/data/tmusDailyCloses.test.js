import { TMUS_DAILY, TMUS_DAILY_META } from './tmusDailyCloses';
import { TMUS_WEEKLY } from './tmusInsiderSales';
import { daysBetween } from '../sellPressure';

describe('TMUS daily closes', () => {
  it('matches its own metadata', () => {
    expect(TMUS_DAILY).toHaveLength(TMUS_DAILY_META.sessions);
    expect(TMUS_DAILY[0][0]).toBe(TMUS_DAILY_META.first);
    expect(TMUS_DAILY[TMUS_DAILY.length - 1][0]).toBe(TMUS_DAILY_META.last);
  });

  it('reaches back to the first trade', () => {
    expect(TMUS_DAILY_META.first).toBe('2007-04-19');
  });

  it('is strictly date-ordered with a positive close every session', () => {
    TMUS_DAILY.forEach(([date, close], i) => {
      expect(Number.isFinite(close) && close > 0).toBe(true);
      if (i) expect(date > TMUS_DAILY[i - 1][0]).toBe(true);
    });
  });

  it('has no hole longer than a holiday weekend', () => {
    // a null close skipped instead of recovered would open a gap here
    const longest = TMUS_DAILY.slice(1).reduce(
      (max, [date], i) => Math.max(max, daysBetween(TMUS_DAILY[i][0], date)),
      0,
    );
    // Hurricane Sandy shut the exchange for two days in 2012
    expect(longest).toBeLessThanOrEqual(5);
  });

  it('carries no close that moved more than 40% in a session', () => {
    // a unit slip, or an unadjusted pre-split close, would show up here
    TMUS_DAILY.slice(1).forEach(([, close], i) => {
      expect(Math.abs(close / TMUS_DAILY[i][1] - 1)).toBeLessThan(0.4);
    });
  });

  it('agrees with the weekly series on the Friday closes they share', () => {
    const daily = new Map(TMUS_DAILY);
    const matched = TMUS_WEEKLY.slice(0, -1).filter((w) => {
      const friday = new Date(Date.parse(`${w.week}T00:00:00Z`) + 4 * 86400000)
        .toISOString().slice(0, 10);
      return daily.has(friday) && Math.abs(daily.get(friday) - w.close) < 0.02;
    });
    // holiday weeks end on a Thursday, so not every week has a Friday close
    expect(matched.length / (TMUS_WEEKLY.length - 1)).toBeGreaterThan(0.9);
  });
});
