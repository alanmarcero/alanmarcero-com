import { useCallback, useMemo } from 'react';
import { plotBox, polyline, yearTicks, weekIndexMap } from '../chartGeometry';
import { gapPlot, nearestIndex, openRun } from '../gapGeometry';
import { amountY } from '../monthlyGeometry';
import { formatDate } from '../insiderFilters';
import { formatDays } from '../sellPressure';
import useChartCursor from '../hooks/useChartCursor';
import useChartView from '../hooks/useChartView';
import {
  ChartSvg, ChartTip, Crosshair, ValueGrid, YearTicks,
} from './ChartParts';

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
  yearOffset: 24,
};

const COMPACT = {
  w: 520,
  h: 260,
  margin: {
    top: 22, right: 88, bottom: 38, left: 54,
  },
  tick: 19,
  endLabel: 17,
  yearOffset: 28,
};

const dayTick = (t) => t;

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
  const { compact, view } = useChartView(WIDE, COMPACT);

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

  const yOf = useCallback((days) => amountY(days, domain, box), [box, domain]);
  const indexAtViewX = useCallback((vx) => nearestIndex(coords, vx), [coords]);
  const cursor = useChartCursor({ count: coords.length, viewWidth: view.w, indexAtViewX });

  if (!coords.length) {
    return <p className="tm-panel__note">Nobody in this selection has sold, so there is no stretch to measure.</p>;
  }

  const hover = cursor.index === null ? null : coords[cursor.index];
  const last = coords[coords.length - 1];
  const recordY = record ? yOf(record.days) : null;
  // The gutter holds the end label, and a day count grows a digit at a time.
  // The face is monospaced, so its width is countable rather than guessable —
  // park the label short of the viewBox edge instead of letting it clip.
  // The compact gutter holds a number, not a number and a word.
  const endText = compact ? `${last.days}` : formatDays(last.days);
  const endX = Math.min(last.x + 10, view.w - 4 - endText.length * view.endLabel * 0.6);
  const label = `Days since the previous insider sale, week by week, ending at `
    + `${formatDays(last.days)} on ${formatDate(asOf)}.`;

  return (
    <div className="tm-chart">
      <ChartSvg cursor={cursor} view={view} labelSize={view.endLabel} label={label}>
        <defs>
          <linearGradient id="tm-quiet-wash" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--tm-quiet)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--tm-quiet)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <ValueGrid ticks={ticks} box={box} yOf={yOf} format={dayTick} />
        <YearTicks
          years={years}
          count={prices.length}
          box={box}
          offset={view.yearOffset}
          compact={compact}
        />

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

        {hover && <Crosshair x={hover.x} y={hover.y} box={box} />}

        <circle className="tm-chart__dot tm-chart__dot--quiet" cx={last.x} cy={last.y} r={5} />

        <text
          className="tm-chart__endlabel tm-chart__endlabel--quiet"
          x={endX}
          y={last.y}
          textAnchor="start"
          dominantBaseline="middle"
        >
          {endText}
        </text>
      </ChartSvg>

      {hover && (
        <ChartTip x={hover.x} viewWidth={view.w}>
          <p className="tm-tip__week">{`Week of ${formatDate(hover.week)}`}</p>
          <p className="tm-tip__row">
            <span className="tm-tip__key tm-tip__key--quiet" aria-hidden="true" />
            <strong>{formatDays(hover.days)}</strong>
            <span className="tm-tip__label">since a sale</span>
          </p>
          <p className="tm-tip__who">{`Last sale ${formatDate(hover.since)}`}</p>
        </ChartTip>
      )}
    </div>
  );
}

export default QuietChart;
