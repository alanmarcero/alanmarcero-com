/**
 * @jest-environment jsdom
 */
import { render, screen, within, fireEvent } from '@testing-library/react';
import StocksApp from './StocksApp';
import { INSTRUMENTS } from './data/instruments';
import {
  drawdownEpisodes, formatDepth, heldAtLeast, worstByYear,
} from '../../tmobile/src/drawdowns';

// every panel imports its series on mount; wait for them so no update lands after a test
const loaded = () => screen.findAllByRole('img', { name: /as a loss from its all-time high/i });

// jsdom has no IntersectionObserver, so every panel counts as on screen and loads

describe('StocksApp', () => {
  it('renders one panel per instrument, alphabetically', async () => {
    render(<StocksApp />);
    await loaded();
    const titles = screen.getAllByRole('heading', { level: 2 })
      .map((h) => h.textContent)
      .filter((t) => t !== 'Where this comes from');
    expect(titles).toHaveLength(INSTRUMENTS.length);
    expect(titles[0]).toBe('Bitcoin (BTC-USD)');
    expect(titles[1]).toMatch(/^BRK-B/);
    expect(titles[titles.length - 1]).toMatch(/^XLY/);
  });

  it('indexes every instrument at the top, in the same order', async () => {
    render(<StocksApp />);
    await loaded();
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

  it('lists each chart\'s biggest drops, one per year', async () => {
    render(<StocksApp />);
    await loaded();
    const spy = INSTRUMENTS.find((i) => i.symbol === 'SPY');
    const { CLOSES } = await spy.load();
    const expected = worstByYear(heldAtLeast(drawdownEpisodes(CLOSES), 30));
    const spyList = within(document.getElementById('spy')).getByRole('list');
    const rows = within(spyList).getAllByRole('listitem');
    expect(rows).toHaveLength(expected.length);
    expect(rows[0]).toHaveTextContent(expected[0].year);
    expect(rows[0]).toHaveTextContent(formatDepth(expected[0].depth));
    const years = rows.map((r) => r.textContent.slice(0, 4));
    expect(new Set(years).size).toBe(years.length);
  });
});
