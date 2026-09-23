import { useCallback, useId, useMemo } from 'react';
import { indexAtX, plotBox, yearTicks } from '../chartGeometry';
import {
  dateIndexMap, depthY, labelPlacement, thinYears, troughMarkers, underwaterPlot,
} from '../drawdownGeometry';
import { deepest, formatDepth, formatSpan } from '../drawdowns';
import { formatDate, formatPrice } from '../insiderFilters';
import useChartCursor from '../hooks/useChartCursor';
import useChartView from '../hooks/useChartView';
import {
  ChartSvg, ChartTip, Crosshair, ValueGrid, YearTicks,
} from './ChartParts';

const WIDE = {
  w: 1000,
  h: 300,
  margin: {
    top: 18, right: 24, bottom: 40, left: 66,
  },
  tick: 13,
  label: 13,
  labelled: 4,
  // a four-digit year at the tick size, plus air
  yearGap: 44,
  yearOffset: 24,
};

const COMPACT = {
  w: 520,
  h: 320,
  margin: {
    top: 16, right: 16, bottom: 38, left: 76,
  },
  tick: 19,
  label: 17,
  labelled: 3,
  yearGap: 50,
  yearOffset: 28,
};

// a partial year needs this many of its own sessions beside it to be labelled
const MIN_YEAR_SESSIONS = 200;

// a keypress moves a trading week; five thousand sessions are too many to walk
const KEY_STRIDE = 5;

const depthTick = (t) => (t === 0 ? '0%' : `−${Math.round(t * 100)}%`);

/**
 * Every daily close as a loss from the highest close before it — an
 * underwater chart. The line sits on the top edge while the stock is at a
 * record and hangs below it for as long as it is not, so each dip is a
 * drawdown and its deepest point is how much the top gave back. The bottoms
 * of the drawdowns that pass the top-held filter are marked, and only the
 * deepest few are labelled.
 */
function DrawdownChart({ points, episodes, subject = 'Daily close' }) {
  // several of these can share a page, and a gradient id has to be unique on it
  const washId = `tm-drawdown-wash-${useId().replace(/[^\w-]/g, '')}`;
  const { compact, view } = useChartView(WIDE, COMPACT);

  const geometry = useMemo(() => {
    const box = plotBox(view.w, view.h, view.margin);
    const plot = underwaterPlot(points, box, 4);
    return {
      box,
      plot,
      dateIndex: dateIndexMap(points),
      years: thinYears(
        yearTicks(points.map((p) => p.date))
          // a partial first year sits on top of the next
          .filter((t, i, all) => !all[i + 1] || all[i + 1].index - t.index >= MIN_YEAR_SESSIONS),
        points.length,
        box,
        view.yearGap,
      ),
    };
  }, [points, view]);

  const { box, plot, dateIndex, years } = geometry;
  const { coords, domain, ticks } = plot;

  const markers = useMemo(
    () => troughMarkers(episodes, dateIndex, coords),
    [episodes, dateIndex, coords],
  );
  const labelled = useMemo(
    () => new Set(deepest(episodes, view.labelled).map((e) => e.peakDate)),
    [episodes, view.labelled],
  );

  const yOf = useCallback((magnitude) => depthY(-magnitude, domain, box), [box, domain]);
  const indexAtViewX = useCallback((vx) => indexAtX(vx, coords.length, box), [box, coords.length]);
  const cursor = useChartCursor({
    count: coords.length, viewWidth: view.w, indexAtViewX, stride: KEY_STRIDE,
  });

  if (!coords.length) return null;

  const hover = cursor.index === null ? null : coords[cursor.index];
  const first = points[0];
  const last = points[points.length - 1];
  const worst = deepest(episodes, 1)[0];
  const label = `${subject} as a loss from its all-time high, ${formatDate(first.date)} `
    + `to ${formatDate(last.date)}`
    + (worst ? `. The deepest drawdown shown is ${formatDepth(worst.depth)}.` : '.');

  // the drawdown the hovered day sits inside, if it is one being counted
  const within = hover
    ? episodes.find((e) => e.peakDate === hover.peakDate && hover.depth < 0)
    : null;

  return (
    <div className="tm-chart">
      <ChartSvg cursor={cursor} view={view} labelSize={view.label} label={label}>
        <defs>
          <linearGradient id={washId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--tm-drawdown)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--tm-drawdown)" stopOpacity="0.22" />
          </linearGradient>
        </defs>

        <ValueGrid ticks={ticks} box={box} yOf={yOf} format={depthTick} />
        <YearTicks
          years={years}
          count={points.length}
          box={box}
          offset={view.yearOffset}
          compact={compact}
        />

        {/* zero — an all-time high — is the line everything hangs from */}
        <line
          className="tm-chart__axis"
          x1={box.left}
          x2={box.right}
          y1={box.top}
          y2={box.top}
        />

        <path className="tm-chart__area" d={plot.area} fill={`url(#${washId})`} />
        <polyline className="tm-chart__line tm-chart__line--drawdown" points={plot.line} />

        {markers.map((m) => (
          <circle
            key={m.peakDate}
            className={`tm-chart__dot tm-chart__dot--drawdown${m.open ? ' tm-chart__dot--open' : ''}`}
            cx={m.x}
            cy={m.y}
            r={4.5}
          />
        ))}

        {markers.filter((m) => labelled.has(m.peakDate)).map((m) => {
          const at = labelPlacement(m, box, { gap: view.label + 4, halfWidth: view.label * 2.4 });
          return (
            <text
              key={m.peakDate}
              className="tm-chart__endlabel"
              x={at.x}
              y={at.y}
              textAnchor={at.anchor}
              dominantBaseline="middle"
            >
              {formatDepth(m.depth)}
            </text>
          );
        })}

        {hover && (
          <Crosshair
            x={hover.x}
            y={hover.y}
            box={box}
            dotClassName="tm-chart__cursor-dot--drawdown"
          />
        )}
      </ChartSvg>

      {hover && (
        <ChartTip x={hover.x} viewWidth={view.w}>
          <p className="tm-tip__week">{formatDate(hover.date)}</p>
          <p className="tm-tip__row">
            <span className="tm-tip__key tm-tip__key--drawdown" aria-hidden="true" />
            <strong>{hover.depth < 0 ? formatDepth(hover.depth) : 'All-time high'}</strong>
            <span className="tm-tip__label">{`close ${formatPrice(hover.close)}`}</span>
          </p>
          {hover.depth < 0 && (
            <p className="tm-tip__who">
              {`From the ${formatPrice(hover.peak)} high of ${formatDate(hover.peakDate)}`}
            </p>
          )}
          {within && (
            <p className="tm-tip__who">
              {`${within.open ? 'Bottom so far' : 'Bottomed at'} ${formatDepth(within.depth)} `}
              {`on ${formatDate(within.troughDate)}; `}
              {within.open
                ? `top has stood ${formatSpan(within.topDays)}`
                : `back above in ${formatSpan(within.topDays)}`}
            </p>
          )}
        </ChartTip>
      )}
    </div>
  );
}

export default DrawdownChart;
