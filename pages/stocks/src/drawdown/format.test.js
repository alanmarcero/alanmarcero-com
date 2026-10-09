import { formatDate, formatPrice } from './format';

describe('formatDate', () => {
  it('renders a readable date', () => {
    expect(formatDate('2024-02-19')).toBe('Feb 19, 2024');
  });

  it('drops a leading zero from the day', () => {
    expect(formatDate('2021-08-02')).toBe('Aug 2, 2021');
  });

  it('passes through anything it cannot parse', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

describe('formatPrice', () => {
  it('always shows cents', () => {
    expect(formatPrice(144.02)).toBe('$144.02');
    expect(formatPrice(136)).toBe('$136.00');
    expect(formatPrice(112345.6)).toBe('$112,345.60');
  });
});
