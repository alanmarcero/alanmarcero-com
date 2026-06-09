/**
 * Hero-scale oscilloscope trace for the `.hero-scope` slot: a long
 * mixed-waveform sweep (sine into saw into square and back) with a
 * faint echo pass underneath. Decorative; stretches to its container.
 * Strokes use currentColor so the slot's CSS color drives the hue.
 */
export default function HeroScopeTrace({ className = "" }) {
  const sweep =
    "M0 120 C 60 120 80 60 140 60 S 240 180 300 180 S 400 60 460 60 S 540 120 600 120 L 660 48 L 660 192 L 720 48 L 720 192 L 780 48 L 780 192 L 840 120 L 900 48 L 900 192 L 960 192 L 960 48 L 1020 48 L 1020 192 L 1080 192 L 1080 48 L 1140 120 C 1200 120 1220 60 1280 60 S 1380 180 1440 180 S 1520 120 1540 120";
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1540 240"
      preserveAspectRatio="none"
      className={`hero-scope-trace ${className}`.trim()}
    >
      <path
        d={sweep}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={sweep}
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.18"
        transform="translate(0 6)"
      />
    </svg>
  );
}
