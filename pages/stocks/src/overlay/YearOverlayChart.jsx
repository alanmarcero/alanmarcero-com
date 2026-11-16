import { useCallback, useMemo } from 'react';
import { indexAtX, plotBox, xAt } from '../drawdown/chartGeometry';
import { formatDate, formatPrice } from '../drawdown/format';
import useChartCursor from '../drawdown/hooks/useChartCursor';
import useChartView from '../drawdown/hooks/useChartView';
import { ChartSvg, ChartTip, ValueGrid } from '../drawdown/components/ChartParts';
import {
  DAYS_IN_YEAR,
  MONTH_STARTS,
  buildDayLookup,
  formatAxisPct,
  formatSignedPct,
  overlayPlot,
} from './yearOverlay';

const WIDE = {
  w: 1000,
  h: 300,
  margin: {
    top: 18, right: 72, bottom: 40, left: 66,
  },
  tick: 13,
  label: 13,
  yearOffset: 24,
};

const COMPACT = {
  w: 520,
  h: 320,
  margin: {
    top: 16, right: 86, bottom: 38, left: 76,
  },
  tick: 19,
  label: 17,
  yearOffset: 28,
};

/**
 * 2018 vs 2026 overlay chart, aligned by calendar day of year and normalized
 * to 0% at each year's first close.
 */
function YearOverlayChart({ series2018, series2026, subject }) {
  const { compact, view } = useChartView(WIDE, COMPACT);

  const geometry = useMemo(() => {
    const box = plotBox(view.w, view.h, view.margin);
    const plot = overlayPlot(series2018, series2026, box, 5);
    const lookup = buildDayLookup(series2018, series2026);
    const months = compact
      ? MONTH_STARTS.filter((_, i) => i % 2 === 0)
      : MONTH_STARTS;
    return {
      box, plot, lookup, months,
    };
  }, [compact, series2018, series2026, view]);

  const {
    box, plot, lookup, months,
  } = geometry;

  const indexAtViewX = useCallback(
    (vx) => indexAtX(vx, DAYS_IN_YEAR, box),
    [box],
  );
  const cursor = useChartCursor({
    count: DAYS_IN_YEAR,
    viewWidth: view.w,
    indexAtViewX,
    stride: 7,
  });

  if (!series2018.length && !series2026.length) return null;

  const last18 = plot.coords2018[plot.coords2018.length - 1];
  const last26 = plot.coords2026[plot.coords2026.length - 1];
  const yZero = plot.yOf(0);

  const hover = cursor.index === null ? null : lookup[cursor.index];
  const hoverX = hover ? xAt(hover.day, DAYS_IN_YEAR, box) : null;

  const ariaLabel = `${subject} 2018 vs 2026 relative percentage performance`
    + (last18 ? `. 2018 finished at ${formatSignedPct(last18.pct)}` : '')
    + (last26 ? `. 2026 is at ${formatSignedPct(last26.pct)} as of ${formatDate(last26.date)}` : '')
    + '.';

  return (
    <div className="dd-chart">
      <ChartSvg cursor={cursor} view={view} labelSize={view.label} label={ariaLabel}>
        <ValueGrid ticks={plot.ticks} box={box} yOf={plot.yOf} format={formatAxisPct} />

        {months.map(({ label, day }) => (
          <text
            key={label}
            className="dd-chart__tick"
            x={xAt(day, DAYS_IN_YEAR, box)}
            y={box.bottom + view.yearOffset}
            textAnchor="middle"
          >
            {label}
          </text>
        ))}

        {/* 0% baseline: start of each year */}
        <line
          className="dd-chart__axis"
          x1={box.left}
          x2={box.right}
          y1={yZero}
          y2={yZero}
        />

        {plot.line2018 && (
          <polyline className="dd-chart__line st-overlay__line--2018" points={plot.line2018} />
        )}
        {plot.line2026 && (
          <polyline className="dd-chart__line st-overlay__line--2026" points={plot.line2026} />
        )}

        {last18 && (
          <>
            <circle
              className="dd-chart__dot st-overlay__dot--2018"
              cx={last18.x}
              cy={last18.y}
              r={4.5}
            />
            <text
              className="dd-chart__endlabel st-overlay__endlabel--2018"
              x={last18.x + 8}
              y={last18.y}
              textAnchor="start"
              dominantBaseline="middle"
            >
              {formatSignedPct(last18.pct)}
            </text>
          </>
        )}

        {last26 && (
          <>
            <circle
              className="dd-chart__dot dd-chart__dot--current"
              cx={last26.x}
              cy={last26.y}
              r={4.5}
            />
            <text
              className="dd-chart__endlabel dd-chart__endlabel--current"
              x={last26.x + 8}
              y={last26.y}
              textAnchor="start"
              dominantBaseline="middle"
            >
              {formatSignedPct(last26.pct)}
            </text>
          </>
        )}

        {hover && (
          <g className="dd-chart__cursor">
            <line x1={hoverX} x2={hoverX} y1={box.top} y2={box.bottom} />
            {hover.p2018 && (
              <circle
                className="st-overlay__cursor-dot--2018"
                cx={hoverX}
                cy={plot.yOf(hover.p2018.pct)}
                r={4.5}
              />
            )}
            {hover.p2026 && (
              <circle
                className="st-overlay__cursor-dot--2026"
                cx={hoverX}
                cy={plot.yOf(hover.p2026.pct)}
                r={4.5}
              />
            )}
          </g>
        )}
      </ChartSvg>

      {hover && (
        <ChartTip x={hoverX} viewWidth={view.w}>
          <p className="dd-tip__week">{hover.label}</p>
          {hover.p2026 && (
            <p className="dd-tip__row">
              <span className="dd-tip__key st-overlay__key--2026" aria-hidden="true" />
              <strong>{formatSignedPct(hover.p2026.pct)}</strong>
              <span className="dd-tip__label">
                {`2026 · ${formatPrice(hover.p2026.close)}`}
              </span>
            </p>
          )}
          {hover.p2018 && (
            <p className="dd-tip__row">
              <span className="dd-tip__key st-overlay__key--2018" aria-hidden="true" />
              <strong>{formatSignedPct(hover.p2018.pct)}</strong>
              <span className="dd-tip__label">
                {`2018 · ${formatPrice(hover.p2018.close)}`}
              </span>
            </p>
          )}
        </ChartTip>
      )}
    </div>
  );
}

export default YearOverlayChart;
