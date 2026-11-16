import { useCallback, useMemo } from 'react';
import { indexAtX, plotBox, xAt } from '../drawdown/chartGeometry';
import { formatDate, formatPrice } from '../drawdown/format';
import useChartCursor from '../drawdown/hooks/useChartCursor';
import useChartView from '../drawdown/hooks/useChartView';
import { ChartSvg, ChartTip, ValueGrid } from '../drawdown/components/ChartParts';
import {
  CURRENT_YEAR,
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
 * Year-vs-year overlay chart, aligned by calendar day of year and normalized
 * to 0% at each year's first close.
 */
function YearOverlayChart({
  baseYear,
  currentYear = CURRENT_YEAR,
  baseSeries,
  currentSeries,
  subject,
}) {
  const { compact, view } = useChartView(WIDE, COMPACT);

  const geometry = useMemo(() => {
    const box = plotBox(view.w, view.h, view.margin);
    const plot = overlayPlot(baseSeries, currentSeries, box, 5);
    const lookup = buildDayLookup(baseSeries, currentSeries);
    const months = compact
      ? MONTH_STARTS.filter((_, i) => i % 2 === 0)
      : MONTH_STARTS;
    return {
      box, plot, lookup, months,
    };
  }, [baseSeries, compact, currentSeries, view]);

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

  if (!baseSeries.length && !currentSeries.length) return null;

  const lastBase = plot.coordsBase[plot.coordsBase.length - 1];
  const lastCurrent = plot.coordsCurrent[plot.coordsCurrent.length - 1];
  const yZero = plot.yOf(0);

  const hover = cursor.index === null ? null : lookup[cursor.index];
  const hoverX = hover ? xAt(hover.day, DAYS_IN_YEAR, box) : null;

  const ariaLabel = `${subject} ${baseYear} vs ${currentYear} relative percentage performance`
    + (lastBase ? `. ${baseYear} finished at ${formatSignedPct(lastBase.pct)}` : '')
    + (lastCurrent ? `. ${currentYear} is at ${formatSignedPct(lastCurrent.pct)} as of ${formatDate(lastCurrent.date)}` : '')
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

        {plot.lineBase && (
          <polyline className="dd-chart__line st-overlay__line--base" points={plot.lineBase} />
        )}
        {plot.lineCurrent && (
          <polyline className="dd-chart__line st-overlay__line--current" points={plot.lineCurrent} />
        )}

        {lastBase && (
          <>
            <circle
              className="dd-chart__dot st-overlay__dot--base"
              cx={lastBase.x}
              cy={lastBase.y}
              r={4.5}
            />
            <text
              className="dd-chart__endlabel st-overlay__endlabel--base"
              x={lastBase.x + 8}
              y={lastBase.y}
              textAnchor="start"
              dominantBaseline="middle"
            >
              {formatSignedPct(lastBase.pct)}
            </text>
          </>
        )}

        {lastCurrent && (
          <>
            <circle
              className="dd-chart__dot dd-chart__dot--current"
              cx={lastCurrent.x}
              cy={lastCurrent.y}
              r={4.5}
            />
            <text
              className="dd-chart__endlabel dd-chart__endlabel--current"
              x={lastCurrent.x + 8}
              y={lastCurrent.y}
              textAnchor="start"
              dominantBaseline="middle"
            >
              {formatSignedPct(lastCurrent.pct)}
            </text>
          </>
        )}

        {hover && (
          <g className="dd-chart__cursor">
            <line x1={hoverX} x2={hoverX} y1={box.top} y2={box.bottom} />
            {hover.base && (
              <circle
                className="st-overlay__cursor-dot--base"
                cx={hoverX}
                cy={plot.yOf(hover.base.pct)}
                r={4.5}
              />
            )}
            {hover.current && (
              <circle
                className="st-overlay__cursor-dot--current"
                cx={hoverX}
                cy={plot.yOf(hover.current.pct)}
                r={4.5}
              />
            )}
          </g>
        )}
      </ChartSvg>

      {hover && (
        <ChartTip x={hoverX} viewWidth={view.w}>
          <p className="dd-tip__week">{hover.label}</p>
          {hover.current && (
            <p className="dd-tip__row">
              <span className="dd-tip__key st-overlay__key--current" aria-hidden="true" />
              <strong>{formatSignedPct(hover.current.pct)}</strong>
              <span className="dd-tip__label">
                {`${currentYear} · ${formatPrice(hover.current.close)}`}
              </span>
            </p>
          )}
          {hover.base && (
            <p className="dd-tip__row">
              <span className="dd-tip__key st-overlay__key--base" aria-hidden="true" />
              <strong>{formatSignedPct(hover.base.pct)}</strong>
              <span className="dd-tip__label">
                {`${baseYear} · ${formatPrice(hover.base.close)}`}
              </span>
            </p>
          )}
        </ChartTip>
      )}
    </div>
  );
}

export default YearOverlayChart;
