const DEFAULT_BARS = 7;

/**
 * Decorative output VU meter: a row of phosphor bars that bounce like a live
 * signal-level readout. Purely ornamental (aria-hidden); the bounce honors
 * prefers-reduced-motion via the global CSS guard.
 */
export default function SignalMeter({ bars = DEFAULT_BARS, label = 'OUT', className = '' }) {
  return (
    <div className={`signal-meter ${className}`.trim()} aria-hidden="true">
      <span className="signal-meter__label">{label}</span>
      <span className="signal-meter__bars">
        {Array.from({ length: bars }, (_, i) => (
          <span key={i} className="signal-meter__bar" style={{ '--bar-index': i }} />
        ))}
      </span>
    </div>
  );
}
