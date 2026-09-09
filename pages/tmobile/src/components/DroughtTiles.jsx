import { formatUSD, formatWeek } from '../insiderFilters';
import { describeChange, formatDays, spanLabel } from '../sellPressure';

/**
 * How the selling rate has changed. The hero figure is the quiet itself — days
 * since anybody in the selection last sold — and the three supporting tiles
 * are the comparisons that stop one number carrying the whole claim: the
 * record it is up against, the dollars, and the filing count. Dollars and
 * filings are shown side by side on purpose: a single block trade can hold the
 * dollars up while the cadence collapses, and only the pair shows that.
 */
function DroughtTiles({
  current, record, median, halfYear, year, lastSellers,
}) {
  if (!current) {
    return (
      <div className="tm-tiles">
        <div className="tm-tile tm-tile--hero">
          <p className="tm-tile__label">Days since the last sale</p>
          <p className="tm-tile__hero">—</p>
          <p className="tm-tile__sub">Nobody in this selection sold in the window.</p>
        </div>
      </div>
    );
  }

  const beatsRecord = record && current.days > record.days;

  return (
    <div className="tm-tiles">
      <div className="tm-tile tm-tile--hero tm-tile--quiet">
        <p className="tm-tile__label">Days since the last sale</p>
        <p className="tm-tile__hero">{current.days}</p>
        <p className="tm-tile__sub">
          {`Last sale ${formatWeek(current.from)}`}
          {lastSellers.length ? ` · ${lastSellers.join(', ')}` : ''}
        </p>
      </div>

      <div className="tm-tile">
        <p className="tm-tile__label">Longest quiet before this</p>
        <p className="tm-tile__value">{record ? formatDays(record.days) : '—'}</p>
        <p className="tm-tile__sub">
          {record
            ? `${formatWeek(record.from)} → ${formatWeek(record.to)}`
            : 'No earlier pause to measure against'}
          {median ? ` · ${formatDays(median)} is the usual pause between spells of selling` : ''}
          {beatsRecord ? '. The open one is longer.' : ''}
        </p>
      </div>

      <div className="tm-tile">
        <p className="tm-tile__label">{`Sold, last ${spanLabel(halfYear.span)}`}</p>
        <p className="tm-tile__value">{formatUSD(halfYear.recent.value)}</p>
        <p className="tm-tile__sub">
          {`${describeChange(halfYear.change.value)} from `}
          {`${formatUSD(halfYear.prior.value)} in the ${spanLabel(halfYear.span)} before · `}
          {`${halfYear.recent.txns} filings, against ${halfYear.prior.txns}`}
        </p>
      </div>

      <div className="tm-tile">
        <p className="tm-tile__label">{`Sale filings, last ${spanLabel(year.span)}`}</p>
        <p className="tm-tile__value">{year.recent.txns}</p>
        <p className="tm-tile__sub">
          {`${describeChange(year.change.txns)} from ${year.prior.txns} · `}
          {`${year.recent.sellers} people selling, against ${year.prior.sellers} the year before`}
        </p>
      </div>
    </div>
  );
}

export default DroughtTiles;
