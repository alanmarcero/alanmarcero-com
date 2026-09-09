import { useCallback, useMemo, useRef, useState } from 'react';
import useMediaQuery from '../../../../src/hooks/useMediaQuery';
import { plotBox, xAt, yearTicks, weekIndexMap } from '../chartGeometry';
import { gapPlot, nearestIndex, openRun, polyline } from '../gapGeometry';
import { yAt } from '../monthlyGeometry';
import { formatWeek } from '../insiderFilters';
import { formatDays } from '../sellPressure';

// The same two coordinate spaces the price chart uses, at a shorter height:
// this plot is read against that one, so its x axis has to march in step.
const WIDE = {
  w: 1000,
  h: 240,
  margin: {
    top: 26, right: 76, bottom: 40, left: 66,
  },
  tick: 13,
  endLabel: 14,
};

const COMPACT = {
  w: 520,
  h: 260,
  margin: {
    top: 22, right: 88, bottom: 38, left: 54,
  },
  tick: 19,
  endLabel: 17,
};

const COMPACT_QUERY = '(max-width: 640px)';

/**
 * How long insiders had gone without selling, week by week. Each tooth falls
 * to the baseline on a sale and climbs while nobody sells, so the widest
 * teeth are the quiet stretches. One series, so the title names it and no
 * legend is needed; the record it is being measured against is a labelled
 * rule rather than a second trace.
 */
function QuietChart({
  prices, series, record, current, asOf,
}) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);

  const compact = useMediaQuery(COMPACT_QUERY);
  const view = compact ? COMPACT : WIDE;

  const geometry = useMemo(() => {
    const box = plotBox(view.w, view.h, view.margin);
    const weekIndex = weekIndexMap(prices);
    const plot = gapPlot(series, weekIndex, prices.length, box, compact ? 3 : 4);
    return {
      box,
      plot,
      years: yearTicks(prices.map((p) => p.week), { minWeeks: compact ? 26 : 0 }),
      open: polyline(openRun(plot.coords, current?.from)),
    };
  }, [prices, series, current, view, compact]);

  const { box, plot, years, open } = geometry;
  const { coords, domain, ticks } = plot;

  const yOf = useCallback((days) => yAt(days, domain, box), [box, domain]);

  const moveTo = useCallback((index) => {
    if (index === null || !coords[index]) return;
    setHover({ index, ...coords[index] });
  }, [coords]);

  const handlePointer = useCallback((event) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (!rect.width) return;
    const vx = ((event.clientX - rect.left) / rect.width) * view.w;
    moveTo(nearestIndex(coords, vx));
  }, [coords, moveTo, view.w]);

  const handleKeyDown = useCallback((event) => {
    const step = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
    if (!step) return;
    event.preventDefault();
    const from = hover ? hover.index : coords.length - 1;
    moveTo(Math.min(coords.length - 1, Math.max(0, from + step)));
  }, [coords.length, hover, moveTo]);

  const clear = useCallback(() => setHover(null), []);

  if (!coords.length) {
    return <p className="tm-panel__note">Nobody in this selection has sold, so there is no stretch to measure.</p>;
  }

  const last = coords[coords.length - 1];
  const recordY = record ? yOf(record.days) : null;
  // The gutter holds the end label, and a day count grows a digit at a time.
  // The face is monospaced, so its width is countable rather than guessable —
  // park the label short of the viewBox edge instead of letting it clip.
  const endText = compact ? `${last.days}` : formatDays(last.days);
  const endX = Math.min(last.x + 10, view.w - 4 - endText.length * view.endLabel * 0.6);
  const label = `Days since the previous insider sale, week by week, ending at `
    + `${formatDays(last.days)} on ${formatWeek(asOf)}.`;

  return (
    <div className="tm-chart">
      <svg
        ref={svgRef}
        className="tm-chart__svg"
        viewBox={`0 0 ${view.w} ${view.h}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ '--tm-tick-size': `${view.tick}px`, '--tm-endlabel-size': `${view.endLabel}px` }}
        role="img"
        aria-label={label}
        tabIndex={0}
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        onPointerLeave={clear}
        onBlur={clear}
        onKeyDown={handleKeyDown}
      >
        <defs>
          <linearGradient id="tm-quiet-wash" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--tm-quiet)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--tm-quiet)" stopOpacity="0" />
          </linearGradient>
        </defs>

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
            {t}
          </text>
        ))}

        {years.map(({ index, year }) => (
          <text
            key={year}
            className="tm-chart__tick"
            x={xAt(index, prices.length, box)}
            y={box.bottom + (compact ? 28 : 24)}
            textAnchor="middle"
          >
            {compact ? `’${year.slice(2)}` : year}
          </text>
        ))}

        <line
          className="tm-chart__axis"
          x1={box.left}
          x2={box.right}
          y1={box.bottom}
          y2={box.bottom}
        />

        <path className="tm-chart__area" d={plot.area} fill="url(#tm-quiet-wash)" />
        <polyline className="tm-chart__line tm-chart__line--quiet" points={plot.line} />
        {open && <polyline className="tm-chart__line tm-chart__line--open" points={open} />}

        {/* the record this quiet is being measured against, as a rule rather
            than a second series — it is one number, not a trend */}
        {record && (
          <>
            <line
              className="tm-chart__rule"
              x1={box.left}
              x2={box.right}
              y1={recordY}
              y2={recordY}
            />
            <text
              className="tm-chart__rulelabel"
              x={box.left + 8}
              y={recordY - 7}
            >
              {`previous longest ${formatDays(record.days)}`}
            </text>
          </>
        )}

        {hover && (
          <g className="tm-chart__cursor">
            <line x1={hover.x} x2={hover.x} y1={box.top} y2={box.bottom} />
            <circle cx={hover.x} cy={hover.y} r={4.5} />
          </g>
        )}

        <circle className="tm-chart__dot tm-chart__dot--quiet" cx={last.x} cy={last.y} r={5} />

        <text
          className="tm-chart__endlabel tm-chart__endlabel--quiet"
          x={endX}
          y={last.y}
          textAnchor="start"
          dominantBaseline="middle"
        >
          {/* the compact gutter holds a number, not a number and a word */}
          {endText}
        </text>
      </svg>

      {hover && (
        <div
          className="tm-tip"
          style={{ left: `${(hover.x / view.w) * 100}%` }}
          role="status"
          aria-live="polite"
        >
          <p className="tm-tip__week">{`Week of ${formatWeek(hover.week)}`}</p>
          <p className="tm-tip__row">
            <span className="tm-tip__key tm-tip__key--quiet" aria-hidden="true" />
            <strong>{formatDays(hover.days)}</strong>
            <span className="tm-tip__label">since a sale</span>
          </p>
          <p className="tm-tip__who">{`Last sale ${formatWeek(hover.since)}`}</p>
        </div>
      )}
    </div>
  );
}

export default QuietChart;
