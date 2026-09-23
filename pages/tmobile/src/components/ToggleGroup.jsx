/**
 * A labelled row of mutually exclusive buttons — every control on the chart
 * pages. An option's `hint`, where it has one, becomes its tooltip.
 */
function ToggleGroup({
  labelId, label, options, value, onChange,
}) {
  return (
    <div className="tm-controls__group" role="group" aria-labelledby={labelId}>
      <p className="tm-controls__label" id={labelId}>{label}</p>
      <div className="tm-filters">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`tm-filter${value === option.id ? ' tm-filter--on' : ''}`}
            aria-pressed={value === option.id}
            title={option.hint}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ToggleGroup;
