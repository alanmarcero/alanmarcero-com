import { useState } from 'react';
import { formatExactUSD, formatShares } from '../insiderFilters';
import { formatMonth } from '../monthlySeries';

/**
 * The monthly chart's accessible twin. Every figure a column, a tooltip or the
 * axis shows is readable here without hovering anything — including the small
 * months the chart can only draw as a hairline.
 */
function MonthlyTable({ rows }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="tm-table-wrap">
      <button
        type="button"
        className="tm-table-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'Hide the monthly numbers' : `Show all ${rows.length} months with a sale as a table`}
      </button>

      {open && (
        <div className="tm-table-scroll">
          <table className="tm-table">
            <caption className="tm-table__caption">
              Every month an insider sold, from Nasdaq&rsquo;s insider activity for
              TMUS. Months with no sale are omitted here and left empty on the chart.
            </caption>
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col" className="tm-num">Filings</th>
                <th scope="col" className="tm-num">Shares</th>
                <th scope="col" className="tm-num">Value</th>
                <th scope="col">Who sold</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.month}>
                  <td>{formatMonth(row.month)}</td>
                  <td className="tm-num">{row.txns}</td>
                  <td className="tm-num">{formatShares(row.shares)}</td>
                  <td className="tm-num">{formatExactUSD(row.value)}</td>
                  <td className="tm-table__people">
                    {row.sellers.map((seller) => (
                      <span className="tm-table__seller" key={seller.name}>
                        <span
                          className={`tm-table__key tm-table__key--${seller.group}`}
                          aria-hidden="true"
                        />
                        {`${seller.name} (${formatShares(seller.shares)})`}
                      </span>
                    ))}
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

export default MonthlyTable;
