import { SELLER_FILTERS } from '../insiderFilters';
import { MEASURES } from '../monthlySeries';

/**
 * One control row above everything it scopes. The seller filter narrows both
 * charts, the tiles and both tables; the measure switch picks which of the
 * three scales the monthly chart plots — they are never two y-axes on one plot.
 */
function FilterRow({ filter, onFilter, measure, onMeasure }) {
  return (
    <div className="tm-controls">
      <div className="tm-controls__group" role="group" aria-labelledby="tm-who-label">
        <p className="tm-controls__label" id="tm-who-label">Whose sales</p>
        <div className="tm-filters">
          {SELLER_FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`tm-filter${filter === option.id ? ' tm-filter--on' : ''}`}
              aria-pressed={filter === option.id}
              title={option.hint}
              onClick={() => onFilter(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="tm-controls__group" role="group" aria-labelledby="tm-measure-label">
        <p className="tm-controls__label" id="tm-measure-label">Monthly chart measures</p>
        <div className="tm-filters">
          {MEASURES.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`tm-filter${measure === option.id ? ' tm-filter--on' : ''}`}
              aria-pressed={measure === option.id}
              onClick={() => onMeasure(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FilterRow;
