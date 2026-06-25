import { buildWavePath } from "./waveforms";

const PHOSPHOR = "var(--graphic-phosphor, #4af2a4)";
const AMBER = "var(--graphic-amber, #ffb454)";
const PANEL = "var(--graphic-panel, #14181a)";
const PANEL_EDGE = "var(--graphic-panel-edge, #232a2e)";

// The patch cable carries a bright "current" pulse (base line + dashed overlay
// the CSS marches along).
const CABLE_PATH = "M150 70 C 168 92 160 124 132 142 C 110 156 78 152 58 138";

// The console's mini read-out: a sine that scrolls inside its clipped window
// like a live signal. Drawn from x=0; positioned by the parent <g>.
const SCOPE_X = 32;
const SCOPE_Y = 146;
const SCOPE_W = 60;
const SCOPE_PERIOD = 20;
const SCOPE_WAVE = buildWavePath("sine", {
  width: SCOPE_W,
  mid: SCOPE_Y,
  amplitude: 11,
  period: SCOPE_PERIOD,
});

/**
 * Hero portrait substitute: stylized synthesist at a modular console,
 * drawn as phosphor line art. Original artwork (not a photo trace).
 * Drop-in for the 180x180 hero image slot.
 */
export default function SynthesistMark({
  size = 180,
  title = "Alan Marcero — synthesist at the console",
  className = "",
}) {
  return (
    <svg
      role="img"
      width={size}
      height={size}
      viewBox="0 0 180 180"
      className={`synthesist-mark ${className}`.trim()}
    >
      <title>{title}</title>
      <circle cx="90" cy="90" r="88" fill={PANEL} stroke={PANEL_EDGE} strokeWidth="2" />
      <g fill="none" stroke={PHOSPHOR} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {/* head + shoulders, facing the console */}
        <circle cx="74" cy="62" r="16" />
        <path d="M52 118 C 52 94 62 86 74 86 C 86 86 96 94 96 112" />
        {/* arm reaching to the panel */}
        <path d="M92 98 C 106 96 114 92 122 84" />
      </g>
      {/* modular console panel */}
      <g stroke={PANEL_EDGE} strokeWidth="2" fill="none">
        <rect x="108" y="52" width="48" height="76" rx="4" />
        <path d="M108 78 H156 M108 104 H156" />
      </g>
      {/* knobs and jacks on the panel */}
      <g fill="none" stroke={PHOSPHOR} strokeWidth="2">
        <circle cx="122" cy="65" r="5" />
        <path d="M122 65 L122 60" />
        <circle cx="142" cy="65" r="5" />
        <path d="M142 65 L146 62" />
        <circle cx="122" cy="91" r="5" opacity="0.8" />
        <circle cx="142" cy="91" r="5" opacity="0.8" />
      </g>
      {/* LEDs — VU activity (CSS blinks them in sequence) */}
      <g className="synthesist-mark__leds" fill={AMBER}>
        <circle cx="118" cy="116" r="2.5" />
        <circle cx="130" cy="116" r="2.5" />
        <circle cx="142" cy="116" r="2.5" />
      </g>
      {/* patch cable from panel down and around — base line + current pulse */}
      <path
        d={CABLE_PATH}
        fill="none"
        stroke={AMBER}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        className="synthesist-mark__cable-pulse"
        pathLength="1"
        d={CABLE_PATH}
        fill="none"
        stroke="#ffe6bd"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* scope read-out under the figure — a live sine scrolling in its window */}
      <clipPath id="synth-scope-clip">
        <rect x={SCOPE_X} y={SCOPE_Y - 12} width={SCOPE_W} height="24" rx="2" />
      </clipPath>
      <g clipPath="url(#synth-scope-clip)">
        <g transform={`translate(${SCOPE_X} 0)`}>
          <path
            className="synthesist-mark__scope"
            d={SCOPE_WAVE}
            fill="none"
            stroke={PHOSPHOR}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
        </g>
      </g>
    </svg>
  );
}
