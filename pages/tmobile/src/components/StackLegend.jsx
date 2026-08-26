import { GROUP_LABEL, GROUPS } from '../monthlySeries';

/**
 * The monthly chart's legend. It mirrors the mark it labels — a column, not
 * the price chart's dot — and pairs each swatch with a name, so identity is
 * never carried by colour alone.
 */
function StackLegend({ show }) {
  return (
    <ul className="tm-legend">
      {GROUPS.filter((group) => show[group]).map((group) => (
        <li className="tm-legend__item" key={group}>
          <span
            className={`tm-legend__mark tm-legend__mark--bar tm-legend__mark--bar-${group}`}
            aria-hidden="true"
          />
          {GROUP_LABEL[group]}
        </li>
      ))}
    </ul>
  );
}

export default StackLegend;
