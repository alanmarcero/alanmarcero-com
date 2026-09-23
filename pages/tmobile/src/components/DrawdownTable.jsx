import { useState } from 'react';
import { formatDepth, formatSpan } from '../drawdowns';
import { formatPrice, formatWeek } from '../insiderFilters';

/**
 * The drawdown chart's accessible twin: every marked bottom, its peak and
 * how long the top stood, deepest first.
 */
function DrawdownTable({ episodes, holdLabel }) {
  const [open, setOpen] = useState(false);
  const rows = [...episodes].sort((a, b) => a.depth - b.depth);

  return (
    <div className="tm-table-wrap">
      <button
        type="button"
        className="tm-table-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'Hide the drawdowns' : `Show all ${rows.length} drawdowns as a table`}
      </button>

      {open && (
        <div className="tm-table-scroll">
          <table className="tm-table">
            <caption className="tm-table__caption">
              {`Every drawdown from an all-time closing high whose top stood `}
              {holdLabel}
              {`, deepest first. A top stands from its peak close to the first close above it.`}
            </caption>
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
                  <td>{formatWeek(e.peakDate)}</td>
                  <td className="tm-num">{formatPrice(e.peak)}</td>
                  <td>{formatWeek(e.troughDate)}</td>
                  <td className="tm-num">{formatPrice(e.trough)}</td>
                  <td className="tm-num">{formatDepth(e.depth)}</td>
                  <td className="tm-num">{formatSpan(e.toBottomDays)}</td>
                  <td className="tm-num">
                    {e.open ? `${formatSpan(e.topDays)}, still open` : formatSpan(e.topDays)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DrawdownTable;
