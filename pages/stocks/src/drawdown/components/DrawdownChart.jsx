import { useCallback, useId, useMemo } from 'react';
import { indexAtX, plotBox, yearTicks } from '../chartGeometry';
import {
  dateIndexMap, depthY, placeTroughLabels, thinYears, troughMarkers,
  underwaterPlot,
} from '../drawdownGeometry';
import { deepest, formatDepth, formatSpan } from '../drawdowns';
import { formatDate, formatPrice } from '../format';
import useChartCursor from '../hooks/useChartCursor';
import useChartView from '../hooks/useChartView';
import {
  ChartSvg, ChartTip, Crosshair, ValueGrid, YearTicks,
} from './ChartParts';

const WIDE = {
  w: 1000,
  h: 300,
  margin: {
    top: 18, right: 68, bottom: 40, left: 66,
  },
  tick: 13,
  label: 13,
  labelled: 4,
  yearGap: 44,
  yearOffset: 24,
};

const COMPACT = {
  w: 520,
  h: 320,
  margin: {
    top: 16, right: 84, bottom: 38, left: 76,
  },
  tick: 19,
  label: 17,
  labelled: 3,
  yearGap: 50,
  yearOffset: 28,
};

const MIN_YEAR_SESSIONS = 200;

const depthTick = (t) => (t === 0 ? '0%' : `−${Math.round(t * 100)}%`);

function episodeSpan(episode, dateIndex, coords, box) {
  if (!episode) return null;
  const startIdx = dateIndex.get(episode.peakDate);
  const endIdx = episode.recoveryDate
    ? dateIndex.get(episode.recoveryDate)
    : coords.length - 1;
  if (startIdx === undefined || endIdx === undefined || endIdx <= startIdx) return null;
  const x1 = coords[startIdx].x;
  const x2 = coords[endIdx].x;
  return { x: x1, width: Math.max(2, x2 - x1), top: box.top, height: box.height };
}

/**
 * Every daily close as a loss from the highest close before it — an
 * underwater chart. Highlights the deepest (max) drawdown's depth and span,
 * marks every counted drawdown trough, and avoids overlapping labels.
 */
function DrawdownChart({ points, episodes, subject = 'Daily close' }) {
  const washId = `dd-drawdown-wash-${useId().replace(/[^\w-]/g, '')}`;
  const { compact, view } = useChartView(WIDE, COMPACT);

  const geometry = useMemo(() => {
    const box = plotBox(view.w, view.h, view.margin);
    const plot = underwaterPlot(points, box, 4);
    const minSessions = points.length > 400 ? MIN_YEAR_SESSIONS : 40;
    return {
      box,
      plot,
      dateIndex: dateIndexMap(points),
      years: thinYears(
        yearTicks(points.map((p) => p.date))
          .filter((t, i, all) => !all[i + 1] || all[i + 1].index - t.index >= minSessions),
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
  const worst = useMemo(() => deepest(episodes, 1)[0] || null, [episodes]);
  const snapIndices = useMemo(() => {
    if (!coords.length) return [];
    const unique = new Set([
      ...markers.map((m) => m.index),
      coords.length - 1,
    ]);
    return [...unique].sort((a, b) => a - b);
  }, [coords.length, markers]);

  const placedLabels = useMemo(() => {
    const topMarkers = deepest(markers, view.labelled);
    return placeTroughLabels(topMarkers, box, {
      gap: view.label + 4,
      halfWidth: view.label * 2.6,
      labelHeight: view.label + 4,
    });
  }, [box, markers, view.label, view.labelled]);

  const yOf = useCallback((magnitude) => depthY(-magnitude, domain, box), [box, domain]);
  const indexAtViewX = useCallback(
    (vx) => indexAtX(vx, coords.length, box),
    [box, coords.length],
  );
  const cursor = useChartCursor({
    count: coords.length, viewWidth: view.w, indexAtViewX, snapIndices,
  });

  if (!coords.length) return null;

  const hover = cursor.index === null ? null : coords[cursor.index];
  const first = points[0];
  const last = points[points.length - 1];
  const label = `${subject} as a loss from its all-time high, ${formatDate(first.date)} `
    + `to ${formatDate(last.date)}`
    + (worst ? `. The deepest drawdown shown is ${formatDepth(worst.depth)}.` : '.');

  const within = hover
    ? episodes.find((e) => e.peakDate === hover.peakDate && hover.depth < 0)
    : null;

  const maxSpan = episodeSpan(worst, dateIndex, coords, box);
  const activeSpan = within && within.peakDate !== worst?.peakDate
    ? episodeSpan(within, dateIndex, coords, box)
    : null;
  const maxY = worst ? depthY(worst.depth, domain, box) : null;
  const latest = coords[coords.length - 1];

  return (
    <div className="dd-chart">
      <ChartSvg cursor={cursor} view={view} labelSize={view.label} label={label}>
        <defs>
          <linearGradient id={washId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--dd-drawdown)" stopOpacity="0.02" />
            <stop offset="100%" stopColor="var(--dd-drawdown)" stopOpacity="0.28" />
          </linearGradient>
        </defs>

        {maxSpan && (
          <rect
            className="dd-chart__maxspan"
            x={maxSpan.x}
            y={maxSpan.top}
            width={maxSpan.width}
            height={maxSpan.height}
          />
        )}

        {activeSpan && (
          <rect
            className="dd-chart__activespan"
            x={activeSpan.x}
            y={activeSpan.top}
            width={activeSpan.width}
            height={activeSpan.height}
          />
        )}

        <ValueGrid ticks={ticks} box={box} yOf={yOf} format={depthTick} />
        <YearTicks
          years={years}
          count={points.length}
          box={box}
          offset={view.yearOffset}
          compact={compact}
          grid
        />

        {/* zero — an all-time high — is the line everything hangs from */}
        <line
          className="dd-chart__axis"
          x1={box.left}
          x2={box.right}
          y1={box.top}
          y2={box.top}
        />

        {maxY !== null && (
          <line
            className="dd-chart__maxline"
            x1={box.left}
            x2={box.right}
            y1={maxY}
            y2={maxY}
          />
        )}

        <path className="dd-chart__area" d={plot.area} fill={`url(#${washId})`} />
        <polyline className="dd-chart__line dd-chart__line--drawdown" points={plot.line} />

        {markers.map((m) => {
          const isMax = worst && m.peakDate === worst.peakDate;
          return (
            <circle
              key={m.peakDate}
              className={`dd-chart__dot dd-chart__dot--drawdown${isMax ? ' dd-chart__dot--max' : ''}${m.open ? ' dd-chart__dot--open' : ''}`}
              cx={m.x}
              cy={m.y}
              r={isMax ? 5.5 : 4}
            />
          );
        })}

        {placedLabels.map(({ marker, at }) => {
          const isMax = worst && marker.peakDate === worst.peakDate;
          return (
            <text
              key={marker.peakDate}
              className={`dd-chart__endlabel${isMax ? ' dd-chart__endlabel--max' : ''}`}
              x={at.x}
              y={at.y}
              textAnchor={at.anchor}
              dominantBaseline="middle"
            >
              {isMax && !compact ? `MAX ${formatDepth(marker.depth)}` : formatDepth(marker.depth)}
            </text>
          );
        })}

        <circle
          className="dd-chart__dot dd-chart__dot--current"
          cx={latest.x}
          cy={latest.y}
          r={4.5}
        />
        <text
          className="dd-chart__endlabel dd-chart__endlabel--current"
          x={latest.x + 8}
          y={latest.y}
          textAnchor="start"
          dominantBaseline="middle"
        >
          {formatDepth(last.depth)}
        </text>

        {hover && (
          <Crosshair
            x={hover.x}
            y={hover.y}
            box={box}
            dotClassName="dd-chart__cursor-dot--drawdown"
          />
        )}
      </ChartSvg>

      {hover && (
        <ChartTip x={hover.x} viewWidth={view.w}>
          <p className="dd-tip__week">{formatDate(hover.date)}</p>
          <p className="dd-tip__row">
            <span className="dd-tip__key dd-tip__key--drawdown" aria-hidden="true" />
            <strong>{hover.depth < 0 ? formatDepth(hover.depth) : 'All-time high'}</strong>
            <span className="dd-tip__label">{`close ${formatPrice(hover.close)}`}</span>
          </p>
          {hover.depth < 0 && (
            <p className="dd-tip__who">
              {`From the ${formatPrice(hover.peak)} high of ${formatDate(hover.peakDate)}`}
            </p>
          )}
          {within && (
            <p className="dd-tip__who">
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
