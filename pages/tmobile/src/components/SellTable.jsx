import {
  formatDate, formatExactUSD, formatPrice, formatShares,
} from '../insiderFilters';
import { GROUP_LABEL } from '../monthlySeries';
import CollapsibleTable from './CollapsibleTable';

/**
 * The chart's accessible twin — every value a dot or tooltip shows is readable
 * here without hovering anything.
 */
function SellTable({ rows }) {
  return (
    <CollapsibleTable
      showLabel={`Show all ${rows.length} sale weeks as a table`}
      hideLabel="Hide the numbers"
      caption={(
        <>
          Every week an insider sold, at that week&rsquo;s closing price. Deutsche
          Telekom is excluded.
        </>
      )}
    >
      <thead>
        <tr>
          <th scope="col">Week</th>
          <th scope="col">Close</th>
          <th scope="col">Who</th>
          <th scope="col" className="tm-num">Shares</th>
          <th scope="col" className="tm-num">Value</th>
          <th scope="col">Sellers</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={`${row.week}-${row.group}`}>
            <td>{formatDate(row.week)}</td>
            <td>{formatPrice(row.close)}</td>
            <td>
              <span
                className={`tm-table__key tm-table__key--${row.group}`}
                aria-hidden="true"
              />
              {GROUP_LABEL[row.group]}
            </td>
            <td className="tm-num">{formatShares(row.shares)}</td>
            <td className="tm-num">{formatExactUSD(row.value)}</td>
            <td className="tm-table__people">
              {row.people.map((p) => p.name).join(', ')}
            </td>
          </tr>
        ))}
      </tbody>
    </CollapsibleTable>
  );
}

export default SellTable;
