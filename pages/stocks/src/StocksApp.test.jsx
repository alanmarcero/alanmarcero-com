/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import StocksApp from './StocksApp';
import { INSTRUMENTS } from './data/instruments';

// every panel imports its series on mount; wait for them so no update lands after a test
const loaded = () => screen.findAllByRole('img', { name: /as a loss from its 52-week high/i }, { timeout: 10000 });

// jsdom has no IntersectionObserver, so every panel counts as on screen and loads

describe('StocksApp', () => {
  jest.setTimeout(15000);
  it('renders one panel per instrument, alphabetically', async () => {
    render(<StocksApp />);
    await loaded();
    const titles = screen.getAllByRole('heading', { level: 2 })
      .map((h) => h.textContent)
      .filter((t) => t !== 'Data and methodology' && t !== 'Year-over-year correlation');
    expect(titles).toHaveLength(INSTRUMENTS.length);
    expect(titles[0]).toBe('AAPL — Apple');
    expect(titles[1]).toBe('AMZN — Amazon');
    expect(titles[titles.length - 1]).toMatch(/^XLY/);
  });

  it('omits the top instrument index navigation and labels drawdown detection levels', async () => {
    render(<StocksApp />);
    await loaded();
    expect(screen.queryByRole('navigation', { name: 'Instruments' })).not.toBeInTheDocument();

    const detectionGroup = screen.getByRole('group', { name: 'Drawdown detection' });
    const buttons = within(detectionGroup).getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['Highest', 'High', 'Medium', 'Low', 'Lowest']);
  });

  it('draws every chart once its series loads', async () => {
    render(<StocksApp />);
    const charts = await screen.findAllByRole('img', { name: /as a loss from its 52-week high/i });
    expect(charts).toHaveLength(INSTRUMENTS.length);
    expect(screen.getByRole('img', { name: /^SPY daily close/ })).toBeInTheDocument();
  });

  it('omits the caption, biggest-drops list and keyboard hint under each chart', async () => {
    render(<StocksApp />);
    await loaded();
    expect(screen.queryByText(/Biggest drops, one per year/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/step between marked drops/i)).not.toBeInTheDocument();
  });

  it('renders the year overlay chart and switches instruments and comparison years', async () => {
    render(<StocksApp />);
    await loaded();
    expect(
      await screen.findByRole('img', { name: /SPY 2018 vs 2026 relative percentage performance/i }),
    ).toBeInTheDocument();

    const instrumentPicker = screen.getByRole('group', { name: /Select instrument for year overlay/i });
    expect(within(instrumentPicker).getAllByRole('button').map((b) => b.textContent))
      .toEqual(['SPY', 'QQQ', 'DIA', 'IWM']);
    fireEvent.click(within(instrumentPicker).getByRole('button', { name: 'QQQ' }));
    expect(
      await screen.findByRole('img', { name: /QQQ 2018 vs 2026 relative percentage performance/i }),
    ).toBeInTheDocument();

    const yearPicker = screen.getByRole('group', { name: /Select comparison year/i });
    const yearButtons = within(yearPicker).getAllByRole('button');
    expect(yearButtons).toHaveLength(10);
    expect(yearButtons[0]).toHaveTextContent(/^2016[+\u2212]?\d+%$/);
    fireEvent.click(within(yearPicker).getByRole('button', { name: /^2016/ }));
    expect(
      await screen.findByRole('img', { name: /QQQ 2016 vs 2026 relative percentage performance/i }),
    ).toBeInTheDocument();
  });
});
