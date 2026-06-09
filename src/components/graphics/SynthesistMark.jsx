const PHOSPHOR = "var(--graphic-phosphor, #41ff8a)";
const AMBER = "var(--graphic-amber, #ffb35c)";
const PANEL = "var(--graphic-panel, #131713)";
const PANEL_EDGE = "var(--graphic-panel-edge, #2a3a2e)";

/**
 * Hero portrait substitute: stylized synthesist at a modular console,
 * drawn as phosphor line art. Original artwork (not a photo trace).
 * Drop-in for the 180x180 hero image slot.
 */
export default function SynthesistMark({
  size = 180,
  title = "Alan Marcero — synthesist at the console",
}) {
  return (
    <svg
      role="img"
      width={size}
      height={size}
      viewBox="0 0 180 180"
      className="synthesist-mark"
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
      {/* LEDs */}
      <g fill={AMBER}>
        <circle cx="118" cy="116" r="2.5" />
        <circle cx="130" cy="116" r="2.5" opacity="0.5" />
        <circle cx="142" cy="116" r="2.5" opacity="0.8" />
      </g>
      {/* patch cable from panel down and around */}
      <path
        d="M150 70 C 168 92 160 124 132 142 C 110 156 78 152 58 138"
        fill="none"
        stroke={AMBER}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* scope trace under the figure */}
      <path
        d="M34 146 L48 146 L56 132 L66 158 L74 140 L80 146 L96 146"
        fill="none"
        stroke={PHOSPHOR}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  );
}
