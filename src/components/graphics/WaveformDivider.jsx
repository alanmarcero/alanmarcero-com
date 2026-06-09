const TRACES = {
  sine: "M0 20 C 25 20 30 5 55 5 S 85 35 110 35 S 140 5 165 5 S 195 20 220 20 S 250 5 275 5 S 305 35 330 35 S 360 5 385 5 S 415 20 440 20",
  saw: "M0 32 L40 8 L40 32 L80 8 L80 32 L120 8 L120 32 L160 8 L160 32 L200 8 L200 32 L240 8 L240 32 L280 8 L280 32 L320 8 L320 32 L360 8 L360 32 L400 8 L400 32 L440 8",
  square:
    "M0 8 L30 8 L30 32 L60 32 L60 8 L90 8 L90 32 L120 32 L120 8 L150 8 L150 32 L180 32 L180 8 L210 8 L210 32 L240 32 L240 8 L270 8 L270 32 L300 32 L300 8 L330 8 L330 32 L360 32 L360 8 L390 8 L390 32 L420 32 L420 8 L440 8",
};

/**
 * Oscilloscope-trace section divider. Decorative; stretches to its
 * container width. Variant selects the wave shape.
 */
export default function WaveformDivider({ variant = "sine", className = "" }) {
  const trace = TRACES[variant] ?? TRACES.sine;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 440 40"
      preserveAspectRatio="none"
      className={`waveform-divider ${className}`.trim()}
      data-variant={variant}
    >
      <path
        d={trace}
        fill="none"
        stroke="var(--graphic-phosphor, #41ff8a)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
