import { tipPlacement, xAt, yearLabel } from '../chartGeometry';

/**
 * The frame every chart on the page draws in: a fixed viewBox that scales to
 * its column, focusable so the arrow keys can read it, and wired to a
 * `useChartCursor` cursor. `labelSize` sets the direct-label type size.
 */
export function ChartSvg({
  cursor, view, labelSize, label, children,
}) {
  return (
    <svg
      ref={cursor.svgRef}
      className="tm-chart__svg"
      viewBox={`0 0 ${view.w} ${view.h}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ '--tm-tick-size': `${view.tick}px`, '--tm-endlabel-size': `${labelSize}px` }}
      role="img"
      aria-label={label}
      tabIndex={0}
      {...cursor.handlers}
    >
      {children}
    </svg>
  );
}

/** Horizontal grid — solid hairlines, one step off the surface — and its labels. */
export function ValueGrid({
  ticks, box, yOf, format,
}) {
  return (
    <>
      {ticks.map((t) => (
        <line
          key={t}
          className="tm-chart__grid"
          x1={box.left}
          x2={box.right}
          y1={yOf(t)}
          y2={yOf(t)}
        />
      ))}

      {ticks.map((t) => (
        <text
          key={t}
          className="tm-chart__tick"
          x={box.left - 12}
          y={yOf(t)}
          textAnchor="end"
          dominantBaseline="middle"
        >
          {format(t)}
        </text>
      ))}
    </>
  );
}

/** Year labels under an x axis of `count` evenly spaced points. */
export function YearTicks({
  years, count, box, offset, compact,
}) {
  return years.map(({ index, year }) => (
    <text
      key={year}
      className="tm-chart__tick"
      x={xAt(index, count, box)}
      y={box.bottom + offset}
      textAnchor="middle"
    >
      {yearLabel(year, compact)}
    </text>
  ));
}

/** The cursor's vertical rule and the dot where it meets the trace. */
export function Crosshair({
  x, y, box, dotClassName,
}) {
  return (
    <g className="tm-chart__cursor">
      <line x1={x} x2={x} y1={box.top} y2={box.bottom} />
      <circle className={dotClassName} cx={x} cy={y} r={4.5} />
    </g>
  );
}

/** The tooltip, beside the cursor line at `x` rather than over it. */
export function ChartTip({ x, viewWidth, children }) {
  const { side, left } = tipPlacement(x, viewWidth);
  return (
    <div className={`tm-tip tm-tip--${side}`} style={{ left }} role="status" aria-live="polite">
      {children}
    </div>
  );
}
