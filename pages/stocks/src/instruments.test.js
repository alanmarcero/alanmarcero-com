import { anchorOf, byLabel, titleOf } from './instruments';
import { INSTRUMENTS } from './data/instruments';

describe('byLabel', () => {
  it('orders the page alphabetically, ignoring case', () => {
    expect(byLabel(INSTRUMENTS).map((i) => i.label)).toEqual([
      'Bitcoin', 'BRK-B', 'Ethereum', 'QQQ', 'SMH', 'SPY',
      'XLB', 'XLE', 'XLF', 'XLK', 'XLP', 'XLRE', 'XLU', 'XLY',
    ]);
  });

  it('does not reorder the list it was given', () => {
    const list = [{ label: 'b' }, { label: 'a' }];
    byLabel(list);
    expect(list[0].label).toBe('b');
  });
});

describe('naming', () => {
  const bitcoin = INSTRUMENTS.find((i) => i.symbol === 'BTC-USD');
  const spy = INSTRUMENTS.find((i) => i.symbol === 'SPY');

  it('titles a coin by name and a fund by ticker', () => {
    expect(titleOf(bitcoin)).toBe('Bitcoin (BTC-USD)');
    expect(titleOf(spy)).toBe('SPY — S&P 500');
  });

  it('gives every instrument a distinct anchor', () => {
    const anchors = INSTRUMENTS.map(anchorOf);
    expect(new Set(anchors).size).toBe(INSTRUMENTS.length);
    expect(anchorOf(bitcoin)).toBe('btc-usd');
  });
});
