/**
 * Patch-cable corner/edge ornament: a cable arcing between two jack
 * sockets. Decorative. `flip` mirrors it horizontally for use on
 * opposite corners.
 */
export default function PatchCableOrnament({ className = "", flip = false }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 160 100"
      className={`patch-cable-ornament ${className}`.trim()}
      data-flip={flip}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path
        d="M20 24 C 60 80 110 80 140 40"
        fill="none"
        stroke="var(--graphic-amber, #ffb35c)"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.85"
      />
      <g fill="none" stroke="var(--graphic-panel-edge, #2a3a2e)" strokeWidth="3">
        <circle cx="20" cy="20" r="11" />
        <circle cx="140" cy="36" r="11" />
      </g>
      <g fill="var(--graphic-phosphor, #41ff8a)">
        <circle cx="20" cy="20" r="3" />
        <circle cx="140" cy="36" r="3" />
      </g>
    </svg>
  );
}
