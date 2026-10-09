import { formatDepth, formatSpan, worstByYear } from '../drawdowns';
import { formatDate } from '../format';

const LIMIT = 10;

/**
 * The most significant drops, at most one per year: each year's deepest
 * drawdown, filed under the year it bottomed, deepest first.
 */
function BiggestDrops({ episodes, id }) {
  const drops = worstByYear(episodes, LIMIT);
  if (!drops.length) return null;

  return (
    <div className="dd-drops">
      <h3 className="dd-drops__title" id={`${id}-drops`}>
        {`Biggest drops, one per year${drops.length === LIMIT ? ` — the deepest ${LIMIT}` : ''}`}
      </h3>
      <ol className="dd-drops__list" aria-labelledby={`${id}-drops`}>
        {drops.map((drop) => (
          <li className="dd-drops__row" key={drop.peakDate}>
            <span className="dd-drops__year">{drop.year}</span>
            <strong className="dd-drops__depth">{formatDepth(drop.depth)}</strong>
            <span className="dd-drops__span">
              {`${formatDate(drop.peakDate)} → ${formatDate(drop.troughDate)}`}
              <span className="dd-drops__days">
                {`${formatSpan(drop.toBottomDays)} peak to bottom`}
                {drop.open ? ', still open' : ''}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default BiggestDrops;
