import { TOP_HOLDS } from '../drawdowns';
import ToggleGroup from './ToggleGroup';

/** Sensitivity level for drawdown detection (how many drawdowns are highlighted). */
function TopHoldControl({ value, onChange, id = 'dd-hold-label' }) {
  return (
    <ToggleGroup
      labelId={id}
      label="Drawdown detection"
      options={TOP_HOLDS}
      value={value}
      onChange={onChange}
    />
  );
}

export default TopHoldControl;
