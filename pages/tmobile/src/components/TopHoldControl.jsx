import { TOP_HOLDS } from '../drawdowns';
import ToggleGroup from './ToggleGroup';

/** How long an all-time high has to stand before its drawdown is counted. */
function TopHoldControl({ value, onChange, id = 'tm-hold-label' }) {
  return (
    <ToggleGroup
      labelId={id}
      label="Count a top that stood at least"
      options={TOP_HOLDS}
      value={value}
      onChange={onChange}
    />
  );
}

export default TopHoldControl;
