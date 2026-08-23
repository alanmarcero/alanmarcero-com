/**
 * Identity is never carried by colour alone: each key pairs its mark (a line
 * for the price, the actual dot shape for each sell group) with a text label.
 */
function ChartLegend({ showSievert, showOthers }) {
  return (
    <ul className="tm-legend">
      <li className="tm-legend__item">
        <span className="tm-legend__mark tm-legend__mark--price" aria-hidden="true" />
        Weekly close
      </li>
      {showSievert && (
        <li className="tm-legend__item">
          <span className="tm-legend__mark tm-legend__mark--sievert" aria-hidden="true" />
          Mike Sievert sold
        </li>
      )}
      {showOthers && (
        <li className="tm-legend__item">
          <span className="tm-legend__mark tm-legend__mark--others" aria-hidden="true" />
          Other insider sold
        </li>
      )}
    </ul>
  );
}

export default ChartLegend;
