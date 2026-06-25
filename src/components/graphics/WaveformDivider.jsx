import { buildWavePath } from "./waveforms";

const WAVE = { width: 440, mid: 20, amplitude: 13, period: 88 };

// Precomputed once. Each path tiles by one period so the CSS can scroll it
// seamlessly (see `.cable-rule path` in App.css).
const TRACES = {
  sine: buildWavePath("sine", WAVE),
  saw: buildWavePath("saw", WAVE),
  square: buildWavePath("square", WAVE),
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
      viewBox={`0 0 ${WAVE.width} 40`}
      preserveAspectRatio="none"
      className={`waveform-divider ${className}`.trim()}
      data-variant={variant}
    >
      <path
        d={trace}
        fill="none"
        stroke="var(--graphic-phosphor, #4af2a4)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
