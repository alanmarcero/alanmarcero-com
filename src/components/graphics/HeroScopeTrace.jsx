import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion";
import { buildWavePath } from "./waveforms";

/**
 * Hero-scale oscilloscope trace for the `.hero-scope` slot. A constant
 * waveform that scrolls horizontally like a live signal (the CSS group
 * translates it by one period) while slowly morphing square → sine → saw
 * via SMIL. A faint echo pass trails underneath. Decorative; the slot's CSS
 * color drives the hue. Morphing is dropped under prefers-reduced-motion.
 */

const WAVE = { width: 1320, mid: 120, amplitude: 82, period: 220 };

const SQUARE = buildWavePath("square", WAVE);
const SINE = buildWavePath("sine", WAVE);
const SAW = buildWavePath("saw", WAVE);

// square (hold) → sine (hold) → saw (hold) → back to square
const MORPH = {
  values: [SQUARE, SQUARE, SINE, SINE, SAW, SAW, SQUARE].join(";"),
  keyTimes: "0;0.12;0.33;0.45;0.66;0.78;1",
  keySplines: Array(6).fill("0.42 0 0.58 1").join(";"),
  dur: "18s",
};

export default function HeroScopeTrace({ className = "" }) {
  const reduced = usePrefersReducedMotion();
  const baseD = reduced ? SINE : SQUARE;

  const morph = reduced ? null : (
    <animate
      attributeName="d"
      dur={MORPH.dur}
      repeatCount="indefinite"
      calcMode="spline"
      keyTimes={MORPH.keyTimes}
      keySplines={MORPH.keySplines}
      values={MORPH.values}
    />
  );

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${WAVE.width} 240`}
      preserveAspectRatio="none"
      className={`hero-scope-trace ${className}`.trim()}
    >
      <g className="hero-scope-trace__scroll">
        <path
          className="hero-scope-trace__echo"
          d={baseD}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.18"
          transform="translate(0 6)"
        >
          {morph}
        </path>
        <path
          className="hero-scope-trace__main"
          d={baseD}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {morph}
        </path>
      </g>
    </svg>
  );
}
