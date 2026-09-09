/**
 * @jest-environment jsdom
 */
import { render, screen, within, fireEvent } from '@testing-library/react';
import TMobileApp from './TMobileApp';
import {
  SALE_DAYS, SIEVERT_SELL_WEEKS, OTHER_SELL_WEEKS, TMUS_META, TMUS_WEEKLY,
} from './data/tmusInsiderSales';
import { MONTHLY_SALES, NASDAQ_META } from './data/tmusMonthlySales';

const sellWeekTotal = new Set(
  [...SIEVERT_SELL_WEEKS, ...OTHER_SELL_WEEKS].map((w) => w.week),
).size;

const activeMonths = MONTHLY_SALES.filter((r) => r.sievert.txns || r.others.txns);
const sievertMonths = MONTHLY_SALES.filter((r) => r.sievert.txns);

const weekTable = () => screen.getByRole('button', { name: /all .* sale weeks as a table/i });
const monthTable = () => screen.getByRole('button', { name: /months with a sale as a table/i });

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

  it('renders the monthly chart, with both groups in its own legend', () => {
    render(<TMobileApp />);
    expect(screen.getByRole('heading', { level: 2, name: /dollars sold by month/i }))
      .toBeInTheDocument();
    expect(screen.getByRole('img', { name: /by month/i })).toBeInTheDocument();
    expect(screen.getByText('Mike Sievert')).toBeInTheDocument();
    expect(screen.getByText('Other insiders')).toBeInTheDocument();
  });

  it('switches the monthly chart between its three measures', () => {
    render(<TMobileApp />);
    const dollars = screen.getByRole('button', { name: /dollars sold/i });
    expect(dollars).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: /sale filings/i }));
    expect(screen.getByRole('heading', { level: 2, name: /sale filings by month/i }))
      .toBeInTheDocument();
    expect(dollars).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(screen.getByRole('button', { name: /shares sold/i }));
    expect(screen.getByRole('heading', { level: 2, name: /shares sold by month/i }))
      .toBeInTheDocument();
  });

  it('says how much of the window its biggest month is, and how many were quiet', () => {
    render(<TMobileApp />);
    expect(screen.getByText(new RegExp(
      `Nobody sold in ${NASDAQ_META.quietMonths} of the ${NASDAQ_META.monthCount} months`,
    ))).toBeInTheDocument();
  });

  it('scopes that quiet-month count to whoever is selected', () => {
    render(<TMobileApp />);
    fireEvent.click(screen.getByRole('button', { name: /mike sievert only/i }));
    expect(screen.getByText(/Mike Sievert did not sell in \d+ of the 25 months/))
      .toBeInTheDocument();
  });

  it('renders the monthly table on demand, one row per month with a sale', () => {
    render(<TMobileApp />);
    fireEvent.click(monthTable());

    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(activeMonths.length + 1);
  });

  it('narrows the monthly table when the filter narrows', () => {
    render(<TMobileApp />);
    fireEvent.click(screen.getByRole('button', { name: /mike sievert only/i }));
    fireEvent.click(monthTable());

    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(sievertMonths.length + 1);
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

    fireEvent.click(weekTable());
    const table = screen.getByRole('table');
    // one header row + one row per (week, group) pair
    expect(within(table).getAllByRole('row'))
      .toHaveLength(SIEVERT_SELL_WEEKS.length + OTHER_SELL_WEEKS.length + 1);
  });

  it('narrows the table when the filter narrows', () => {
    render(<TMobileApp />);
    fireEvent.click(screen.getByRole('button', { name: /mike sievert only/i }));
    fireEvent.click(weekTable());

    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(SIEVERT_SELL_WEEKS.length + 1);
    expect(within(table).queryByText(/other insiders/i)).not.toBeInTheDocument();
  });

  it('credits the sources and the sale-code definition', () => {
    render(<TMobileApp />);
    expect(screen.getByText(/Yahoo Finance/i)).toBeInTheDocument();
    expect(screen.getByText(/SEC Form 4 filings/i)).toBeInTheDocument();
    // the page is explicit that tax withholding is not counted as a sale
    expect(screen.getByText(/code F\) are not sales/i)).toBeInTheDocument();
  });

  it('credits Nasdaq for the monthly columns and owns up to the 250-row cap', () => {
    render(<TMobileApp />);
    expect(screen.getByRole('link', { name: /nasdaq/i }))
      .toHaveAttribute('href', NASDAQ_META.sourceUrl);
    expect(screen.getByText(/hands back 250 transactions and no more/i))
      .toBeInTheDocument();
    expect(screen.getByText(/Disposition \(Non Open Market\)/i)).toBeInTheDocument();
  });

  describe('the quiet-stretch panel', () => {
    const asOf = TMUS_META.fetched;
    const daysSince = (from) => Math.round(
      (Date.parse(`${asOf}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000,
    );
    const lastFor = (group) => SALE_DAYS
      .filter((d) => (group ? d.group === group : true))
      .map((d) => d.date).sort().pop();

    it('draws the sawtooth and names what it plots', () => {
      render(<TMobileApp />);
      expect(screen.getByRole('heading', { level: 2, name: /days since the previous insider sale/i }))
        .toBeInTheDocument();
      expect(screen.getByRole('img', { name: /days since the previous insider sale/i }))
        .toBeInTheDocument();
    });

    it('leads with the days since anybody last sold', () => {
      render(<TMobileApp />);
      const tile = screen.getByText(/days since the last sale/i).closest('.tm-tile');
      expect(within(tile).getByText(String(daysSince(lastFor())))).toBeInTheDocument();
      expect(within(tile).getByText(new RegExp(TMUS_META.lastSale.slice(0, 4))))
        .toBeInTheDocument();
    });

    it('re-reads the quiet for whoever is selected', () => {
      render(<TMobileApp />);
      fireEvent.click(screen.getByRole('button', { name: /mike sievert only/i }));

      const tile = screen.getByText(/days since the last sale/i).closest('.tm-tile');
      expect(within(tile).getByText(String(daysSince(lastFor('sievert')))))
        .toBeInTheDocument();
      expect(within(tile).getByText(/Mike Sievert/)).toBeInTheDocument();
    });

    it('measures the open stretch against the longest one that ended', () => {
      render(<TMobileApp />);
      expect(screen.getByText(/longest quiet before this/i)).toBeInTheDocument();
      expect(screen.getByText(
        /previous longest of \d+ days and a typical \d+ days between spells of selling/,
      )).toBeInTheDocument();
    });

    it('puts the filing count beside the dollars, so one block trade cannot carry the claim', () => {
      render(<TMobileApp />);
      expect(screen.getByText(/sale filings, last 1 year/i)).toBeInTheDocument();
      expect(screen.getByText(/sold, last 6 months/i)).toBeInTheDocument();
      expect(screen.getByText(/across \d+ filings, (down|up) \d+%/)).toBeInTheDocument();
    });
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
