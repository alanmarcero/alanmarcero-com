import { SELLER_FILTERS } from '../insiderFilters';
import { MEASURES } from '../monthlySeries';
import ToggleGroup from './ToggleGroup';

/**
 * One control row above everything it scopes. The seller filter narrows both
 * charts, the tiles and both tables; the measure switch picks which of the
 * three scales the monthly chart plots — they are never two y-axes on one plot.
 */
function FilterRow({ filter, onFilter, measure, onMeasure }) {
  return (
    <div className="tm-controls">
      <ToggleGroup
        labelId="tm-who-label"
        label="Whose sales"
        options={SELLER_FILTERS}
        value={filter}
        onChange={onFilter}
      />
      <ToggleGroup
        labelId="tm-measure-label"
        label="Monthly chart measures"
        options={MEASURES}
        value={measure}
        onChange={onMeasure}
      />
    </div>
  );
}

export default FilterRow;
