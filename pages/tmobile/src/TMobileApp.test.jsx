/**
 * @jest-environment jsdom
 */
import { render, screen, within, fireEvent } from '@testing-library/react';
import TMobileApp from './TMobileApp';
import {
  SIEVERT_SELL_WEEKS, OTHER_SELL_WEEKS, TMUS_WEEKLY,
} from './data/tmusInsiderSales';

const sellWeekTotal = new Set(
  [...SIEVERT_SELL_WEEKS, ...OTHER_SELL_WEEKS].map((w) => w.week),
).size;

describe('TMobileApp', () => {
  it('renders the ticker heading and the chart', () => {
    render(<TMobileApp />);
    expect(screen.getByRole('heading', { level: 1, name: 'TMUS' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /weekly closing price/i })).toBeInTheDocument();
  });

  it('says up front that Deutsche Telekom is excluded', () => {
    render(<TMobileApp />);
    // named in the standfirst and again in the source notes
    expect(screen.getAllByText(/Deutsche Telekom/i).length).toBeGreaterThan(1);
  });

  it('offers the three seller filters with "all insiders" selected', () => {
    render(<TMobileApp />);
    const all = screen.getByRole('button', { name: /all insiders/i });
    expect(all).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /mike sievert only/i }))
      .toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /everyone else/i }))
      .toHaveAttribute('aria-pressed', 'false');
  });

  it('shows both sell series in the legend by default', () => {
    render(<TMobileApp />);
    expect(screen.getByText(/mike sievert sold/i)).toBeInTheDocument();
    expect(screen.getByText(/other insider sold/i)).toBeInTheDocument();
  });

  it('drops the other-insider series when filtered to Sievert', () => {
    render(<TMobileApp />);
    fireEvent.click(screen.getByRole('button', { name: /mike sievert only/i }));

    expect(screen.getByText(/mike sievert sold/i)).toBeInTheDocument();
    expect(screen.queryByText(/other insider sold/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mike sievert only/i }))
      .toHaveAttribute('aria-pressed', 'true');
  });

  it('drops the Sievert series when filtered to everyone else', () => {
    render(<TMobileApp />);
    fireEvent.click(screen.getByRole('button', { name: /everyone else/i }));

    expect(screen.getByText(/other insider sold/i)).toBeInTheDocument();
    expect(screen.queryByText(/mike sievert sold/i)).not.toBeInTheDocument();
  });

  it('reports the week count for the current filter', () => {
    render(<TMobileApp />);
    expect(screen.getByText(String(sellWeekTotal))).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /mike sievert only/i }));
    expect(screen.getByText(String(SIEVERT_SELL_WEEKS.length))).toBeInTheDocument();
  });

  it('renders the table view on demand, one row per selected sale week', () => {
    render(<TMobileApp />);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /show all .* as a table/i }));
    const table = screen.getByRole('table');
    // one header row + one row per (week, group) pair
    expect(within(table).getAllByRole('row'))
      .toHaveLength(SIEVERT_SELL_WEEKS.length + OTHER_SELL_WEEKS.length + 1);
  });

  it('narrows the table when the filter narrows', () => {
    render(<TMobileApp />);
    fireEvent.click(screen.getByRole('button', { name: /mike sievert only/i }));
    fireEvent.click(screen.getByRole('button', { name: /show all .* as a table/i }));

    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(SIEVERT_SELL_WEEKS.length + 1);
    expect(within(table).queryByText(/other insiders/i)).not.toBeInTheDocument();
  });

  it('credits the sources and the sale-code definition', () => {
    render(<TMobileApp />);
    expect(screen.getByText(/Yahoo Finance/i)).toBeInTheDocument();
    expect(screen.getByText(/Form 4/i)).toBeInTheDocument();
    // the page is explicit that tax withholding is not counted as a sale
    expect(screen.getByText(/code F\) are not sales/i)).toBeInTheDocument();
  });

  it('links back to the console', () => {
    render(<TMobileApp />);
    expect(screen.getByRole('link', { name: /back to console/i }))
      .toHaveAttribute('href', '/');
  });

  it('states how many weeks the window covers', () => {
    render(<TMobileApp />);
    expect(screen.getByText(new RegExp(`of the ${TMUS_WEEKLY.length} weeks shown`)))
      .toBeInTheDocument();
  });
});
