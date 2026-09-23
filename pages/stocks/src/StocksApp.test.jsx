/**
 * @jest-environment jsdom
 */
import { render, screen, within, fireEvent } from '@testing-library/react';
import StocksApp from './StocksApp';
import { INSTRUMENTS } from './data/instruments';

// jsdom has no IntersectionObserver, so every panel counts as on screen and loads

describe('StocksApp', () => {
  it('renders one panel per instrument, alphabetically', () => {
    render(<StocksApp />);
    const titles = screen.getAllByRole('heading', { level: 2 })
      .map((h) => h.textContent)
      .filter((t) => t !== 'Where this comes from');
    expect(titles).toHaveLength(INSTRUMENTS.length);
    expect(titles[0]).toBe('Bitcoin (BTC-USD)');
    expect(titles[1]).toMatch(/^BRK-B/);
    expect(titles[titles.length - 1]).toMatch(/^XLY/);
  });

  it('indexes every instrument at the top, in the same order', () => {
    render(<StocksApp />);
    const nav = screen.getByRole('navigation', { name: 'Instruments' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((l) => l.textContent)[0]).toBe('Bitcoin');
    expect(links[0]).toHaveAttribute('href', '#btc-usd');
    expect(links).toHaveLength(INSTRUMENTS.length);
  });

  it('draws every chart once its series loads', async () => {
    render(<StocksApp />);
    const charts = await screen.findAllByRole('img', { name: /as a loss from its all-time high/i });
    expect(charts).toHaveLength(INSTRUMENTS.length);
    expect(screen.getByRole('img', { name: /^SPY daily close/ })).toBeInTheDocument();
  });

  it('scopes every chart with one top-held control', async () => {
    render(<StocksApp />);
    await screen.findAllByRole('img', { name: /as a loss/i });
    const before = screen.getAllByRole('button', { name: /drawdowns as a table/i })
      .map((b) => b.textContent);
    fireEvent.click(screen.getByRole('button', { name: '1 year' }));
    const after = screen.getAllByRole('button', { name: /drawdowns as a table/i })
      .map((b) => b.textContent);
    expect(after).toHaveLength(INSTRUMENTS.length);
    expect(after).not.toEqual(before);
  });
});
