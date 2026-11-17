/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import StocksApp from './StocksApp';
import { INSTRUMENTS } from './data/instruments';
import {
  DEFAULT_TOP_HOLD, drawdownEpisodes, formatDepth, heldAtLeast, topHoldById, worstByYear,
} from './drawdown/drawdowns';

// every panel imports its series on mount; wait for them so no update lands after a test
const loaded = () => screen.findAllByRole('img', { name: /as a loss from its all-time high/i }, { timeout: 10000 });

// jsdom has no IntersectionObserver, so every panel counts as on screen and loads

describe('StocksApp', () => {
  jest.setTimeout(15000);
  it('renders one panel per instrument, alphabetically', async () => {
    render(<StocksApp />);
    await loaded();
    const titles = screen.getAllByRole('heading', { level: 2 })
      .map((h) => h.textContent)
      .filter((t) => t !== 'Data and methodology' && !/^\d{4} vs 2026$/.test(t));
    expect(titles).toHaveLength(INSTRUMENTS.length);
    expect(titles[0]).toBe('AAPL — Apple');
    expect(titles[1]).toBe('ABBV — AbbVie');
    expect(titles[titles.length - 1]).toMatch(/^XOM/);
  });

  it('indexes every instrument at the top, in the same order', async () => {
    render(<StocksApp />);
    await loaded();
    const nav = screen.getByRole('navigation', { name: 'Instruments' });
    const links = within(nav).getAllByRole('link');
    const aapl = INSTRUMENTS.find((i) => i.symbol === 'AAPL');
    expect(links[0]).toHaveTextContent(`AAPL${formatDepth(aapl.drawdown)}`);
    expect(links[0]).toHaveAttribute('href', '#aapl');
    expect(links).toHaveLength(INSTRUMENTS.length);
  });

  it('draws every chart once its series loads', async () => {
    render(<StocksApp />);
    const charts = await screen.findAllByRole('img', { name: /as a loss from its all-time high/i });
    expect(charts).toHaveLength(INSTRUMENTS.length);
    expect(screen.getByRole('img', { name: /^SPY daily close/ })).toBeInTheDocument();
  });

  it('lists each chart\'s biggest drops, one per year', async () => {
    render(<StocksApp />);
    await loaded();
    const spy = INSTRUMENTS.find((i) => i.symbol === 'SPY');
    const { CLOSES } = await spy.load();
    const minDays = topHoldById(DEFAULT_TOP_HOLD).days;
    const expected = worstByYear(heldAtLeast(drawdownEpisodes(CLOSES), minDays));
    const spyList = within(document.getElementById('spy')).getByRole('list');
    const rows = within(spyList).getAllByRole('listitem');
    expect(rows).toHaveLength(expected.length);
    expect(rows[0]).toHaveTextContent(expected[0].year);
    expect(rows[0]).toHaveTextContent(formatDepth(expected[0].depth));
    const years = rows.map((r) => r.textContent.slice(0, 4));
    expect(new Set(years).size).toBe(years.length);
  });

  it('renders the year overlay chart and switches instruments and comparison years', async () => {
    render(<StocksApp />);
    await loaded();
    expect(
      await screen.findByRole('img', { name: /SPY 2018 vs 2026 relative percentage performance/i }),
    ).toBeInTheDocument();

    const instrumentPicker = screen.getByRole('group', { name: /Select instrument for year overlay/i });
    fireEvent.click(within(instrumentPicker).getByRole('button', { name: 'QQQ' }));
    expect(
      await screen.findByRole('img', { name: /QQQ 2018 vs 2026 relative percentage performance/i }),
    ).toBeInTheDocument();

    const yearPicker = screen.getByRole('group', { name: /Select comparison year/i });
    const yearButtons = within(yearPicker).getAllByRole('button');
    expect(yearButtons).toHaveLength(10);
    expect(yearButtons[0]).toHaveTextContent(/^2016[+\u2212]?\d\.\d{2}$/);
    fireEvent.click(within(yearPicker).getByRole('button', { name: /^2016/ }));
    expect(
      await screen.findByRole('img', { name: /QQQ 2016 vs 2026 relative percentage performance/i }),
    ).toBeInTheDocument();
  });
});
