import { TOP_HOLDS } from '../drawdowns';

/** How long an all-time high has to stand before its drawdown is counted. */
function TopHoldControl({ value, onChange, id = 'tm-hold-label' }) {
  return (
    <div className="tm-controls__group" role="group" aria-labelledby={id}>
      <p className="tm-controls__label" id={id}>Count a top that stood at least</p>
      <div className="tm-filters">
        {TOP_HOLDS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`tm-filter${value === option.id ? ' tm-filter--on' : ''}`}
            aria-pressed={value === option.id}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TopHoldControl;
