import { deepest, formatDepth, formatSpan } from '../drawdowns';
import { formatDate, formatPrice } from '../insiderFilters';
import CollapsibleTable from './CollapsibleTable';

/**
 * The drawdown chart's accessible twin: every marked bottom, its peak and
 * how long the top stood, deepest first.
 */
function DrawdownTable({ episodes, holdLabel }) {
  const rows = deepest(episodes, episodes.length);

  return (
    <CollapsibleTable
      showLabel={`Show all ${rows.length} drawdowns as a table`}
      hideLabel="Hide the drawdowns"
      caption={(
        <>
          {`Every drawdown from an all-time closing high whose top stood `}
          {holdLabel}
          {`, deepest first. A top stands from its peak close to the first close above it.`}
        </>
      )}
    >
      <thead>
        <tr>
          <th scope="col">Peak</th>
          <th scope="col" className="tm-num">High</th>
          <th scope="col">Bottom</th>
          <th scope="col" className="tm-num">Low</th>
          <th scope="col" className="tm-num">Drawdown</th>
          <th scope="col" className="tm-num">Peak to bottom</th>
          <th scope="col" className="tm-num">Top stood</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((e) => (
          <tr key={e.peakDate}>
            <td>{formatDate(e.peakDate)}</td>
            <td className="tm-num">{formatPrice(e.peak)}</td>
            <td>{formatDate(e.troughDate)}</td>
            <td className="tm-num">{formatPrice(e.trough)}</td>
            <td className="tm-num">{formatDepth(e.depth)}</td>
            <td className="tm-num">{formatSpan(e.toBottomDays)}</td>
            <td className="tm-num">
              {e.open ? `${formatSpan(e.topDays)}, still open` : formatSpan(e.topDays)}
            </td>
          </tr>
        ))}
      </tbody>
    </CollapsibleTable>
  );
}

export default DrawdownTable;
