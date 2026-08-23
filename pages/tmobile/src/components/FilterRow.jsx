import { SELLER_FILTERS } from '../insiderFilters';

/**
 * One filter row above everything it scopes — the chart, the tiles and the
 * table all re-render against the same selection.
 */
function FilterRow({ value, onChange }) {
  return (
    <div className="tm-filters" role="group" aria-label="Whose sales to show">
      {SELLER_FILTERS.map((filter) => (
        <button
          key={filter.id}
          type="button"
          className={`tm-filter${value === filter.id ? ' tm-filter--on' : ''}`}
          aria-pressed={value === filter.id}
          title={filter.hint}
          onClick={() => onChange(filter.id)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

export default FilterRow;
