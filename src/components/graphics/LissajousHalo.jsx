import { useEffect } from "react";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion";
import useInViewport from "../../hooks/useInViewport";
import { lissajous, rose, buildParametricPath } from "./parametric";

/**
 * A live XY-oscilloscope trace built from parametric figures (Lissajous curves
 * and roses). It morphs between figures via SMIL while a bright beam packet
 * crawls along the trace like a scope's dot, and the whole figure drifts round
 * slowly. Decorative; the slot's CSS `color` drives the hue.
 *
 * The morph and beam are dropped under `prefers-reduced-motion`. While the trace
 * is scrolled off-screen its animation is paused — the SMIL timeline via
 * `pauseAnimations()` and the CSS spin/beam via the `lissajous-halo--paused`
 * class — so a figure nobody can see costs no CPU/GPU (the spinning
 * `drop-shadow` in particular re-rasterizes every frame otherwise).
 */

// Centered square viewBox; the curve is scaled to ring the badge beneath it.
const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 146;

// The figures the trace morphs through, in order (then it loops back).
// Rose curves are radially symmetric, so their petals ring the badge evenly
// and read as a halo centered on the mark; one Lissajous keeps the scope feel.
const FIGURES = [
  rose(3),
  rose(5),
  rose(4),
  lissajous(5, 4, Math.PI / 2),
];

const FIGURE_PATHS = FIGURES.map((fn) =>
  buildParametricPath(fn, { cx: CENTER, cy: CENTER, radius: RADIUS })
);

// symmetric ease for every hold→morph→hold leg
const EASE = "0.42 0 0.58 1";

/**
 * Build the SMIL morph attributes: hold each figure, morph to the next, then
 * loop back to the first. Doubling each figure creates the "hold" plateaus;
 * evenly spaced keyTimes make holds and morphs equal length.
 */
function buildMorph(figurePaths) {
  const values = [];
  figurePaths.forEach((path) => values.push(path, path));
  values.push(figurePaths[0]);
  const steps = values.length - 1;
  const keyTimes = values.map((_, i) => +(i / steps).toFixed(4)).join(";");
  const keySplines = Array(steps).fill(EASE).join(";");
  return { values: values.join(";"), keyTimes, keySplines, dur: "24s" };
}

const MORPH = buildMorph(FIGURE_PATHS);

export default function LissajousHalo({ className = "" }) {
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInViewport({ rootMargin: "200px" });
  const baseD = FIGURE_PATHS[0];

  // Pause/resume the SMIL animation timeline as the trace leaves/enters view.
  // (CSS spin + beam are frozen via the paused class below.)
  useEffect(() => {
    const svg = ref.current;
    if (!svg || typeof svg.pauseAnimations !== "function") return undefined;
    if (inView) svg.unpauseAnimations();
    else svg.pauseAnimations();
    return undefined;
  }, [inView, ref]);

  const morph = () =>
    reduced ? null : (
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

  const classes = ["lissajous-halo", className, !inView && !reduced && "lissajous-halo--paused"]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={classes}
    >
      <path
        className="lissajous-halo__echo"
        d={baseD}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.16"
        transform="translate(0 3)"
      >
        {morph()}
      </path>
      <path
        className="lissajous-halo__main"
        d={baseD}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      >
        {morph()}
      </path>
      {!reduced && (
        <path
          className="lissajous-halo__beam"
          pathLength="1"
          d={baseD}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {morph()}
        </path>
      )}
    </svg>
  );
}
