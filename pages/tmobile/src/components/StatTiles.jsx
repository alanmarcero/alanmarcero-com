import { formatShares, formatUSD } from '../insiderFilters';

/**
 * The headline numbers for the current selection. One hero figure (the dollar
 * total), then supporting tiles.
 */
function StatTiles({ summary, weekTotal }) {
  const share = weekTotal ? Math.round((summary.weekCount / weekTotal) * 100) : 0;

  return (
    <div className="tm-tiles">
      <div className="tm-tile tm-tile--hero">
        <p className="tm-tile__label">Sold, at the prices they sold for</p>
        <p className="tm-tile__hero">{formatUSD(summary.value)}</p>
      </div>
      <div className="tm-tile">
        <p className="tm-tile__label">Shares sold</p>
        <p className="tm-tile__value">{formatShares(summary.shares)}</p>
      </div>
      <div className="tm-tile">
        <p className="tm-tile__label">Weeks with a sale</p>
        <p className="tm-tile__value">{summary.weekCount}</p>
        <p className="tm-tile__sub">{`${share}% of the ${weekTotal} weeks shown`}</p>
      </div>
      <div className="tm-tile">
        <p className="tm-tile__label">Sale filings</p>
        <p className="tm-tile__value">{summary.txns}</p>
      </div>
    </div>
  );
}

export default StatTiles;
