import {
  useCallback, useId, useMemo, useRef, useState,
} from 'react';
import useMediaQuery from '../../../../src/hooks/useMediaQuery';
import { indexAtX, plotBox, xAt, yearTicks } from '../chartGeometry';
import {
  dateIndexMap, depthY, labelPlacement, thinYears, troughMarkers, underwaterPlot,
} from '../drawdownGeometry';
import { deepest, formatDepth, formatSpan } from '../drawdowns';
import { formatPrice, formatWeek } from '../insiderFilters';

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
};

const COMPACT_QUERY = '(max-width: 640px)';

// a partial year needs this many of its own sessions beside it to be labelled
const MIN_YEAR_SESSIONS = 200;

/**
 * Every daily close as a loss from the highest close before it — an
 * underwater chart. The line sits on the top edge while the stock is at a
 * record and hangs below it for as long as it is not, so each dip is a
 * drawdown and its deepest point is how much the top gave back. The bottoms
 * of the drawdowns that pass the top-held filter are marked, and only the
 * deepest few are labelled.
 */
function DrawdownChart({ points, episodes, subject = 'Daily close' }) {
  const svgRef = useRef(null);
  // several of these can share a page, and a gradient id has to be unique on it
  const washId = `tm-drawdown-wash-${useId().replace(/[^\w-]/g, '')}`;
  const [hover, setHover] = useState(null);

  const compact = useMediaQuery(COMPACT_QUERY);
  const view = compact ? COMPACT : WIDE;

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
  }, [points, view, compact]);

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

  const moveTo = useCallback((index) => {
    if (!coords[index]) return;
    setHover(coords[index]);
  }, [coords]);

  const handlePointer = useCallback((event) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (!rect.width) return;
    const vx = ((event.clientX - rect.left) / rect.width) * view.w;
    moveTo(indexAtX(vx, coords.length, box));
  }, [box, coords.length, moveTo, view.w]);

  const handleKeyDown = useCallback((event) => {
    const step = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
    if (!step) return;
    event.preventDefault();
    // a keypress moves a trading week; five thousand sessions are too many to walk
    const from = hover ? hover.index : coords.length - 1;
    moveTo(Math.min(coords.length - 1, Math.max(0, from + step * 5)));
  }, [coords.length, hover, moveTo]);

  const clear = useCallback(() => setHover(null), []);

  if (!coords.length) return null;

  const first = points[0];
  const last = points[points.length - 1];
  const worst = deepest(episodes, 1)[0];
  const label = `${subject} as a loss from its all-time high, ${formatWeek(first.date)} `
    + `to ${formatWeek(last.date)}`
    + (worst ? `. The deepest drawdown shown is ${formatDepth(worst.depth)}.` : '.');

  // the drawdown the hovered day sits inside, if it is one being counted
  const within = hover
    ? episodes.find((e) => e.peakDate === hover.peakDate && hover.depth < 0)
    : null;

  return (
    <div className="tm-chart">
      <svg
        ref={svgRef}
        className="tm-chart__svg"
        viewBox={`0 0 ${view.w} ${view.h}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ '--tm-tick-size': `${view.tick}px`, '--tm-endlabel-size': `${view.label}px` }}
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
          <linearGradient id={washId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--tm-drawdown)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--tm-drawdown)" stopOpacity="0.22" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <line
            key={t}
            className="tm-chart__grid"
            x1={box.left}
            x2={box.right}
            y1={depthY(-t, domain, box)}
            y2={depthY(-t, domain, box)}
          />
        ))}

        {ticks.map((t) => (
          <text
            key={t}
            className="tm-chart__tick"
            x={box.left - 12}
            y={depthY(-t, domain, box)}
            textAnchor="end"
            dominantBaseline="middle"
          >
            {t === 0 ? '0%' : `−${Math.round(t * 100)}%`}
          </text>
        ))}

        {years.map(({ index, year }) => (
          <text
            key={year}
            className="tm-chart__tick"
            x={xAt(index, points.length, box)}
            y={box.bottom + (compact ? 28 : 24)}
            textAnchor="middle"
          >
            {compact ? `’${year.slice(2)}` : year}
          </text>
        ))}

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
          <g className="tm-chart__cursor">
            <line x1={hover.x} x2={hover.x} y1={box.top} y2={box.bottom} />
            <circle className="tm-chart__cursor-dot--drawdown" cx={hover.x} cy={hover.y} r={4.5} />
          </g>
        )}
      </svg>

      {hover && (
        <div
          className="tm-tip"
          style={{ left: `${(hover.x / view.w) * 100}%` }}
          role="status"
          aria-live="polite"
        >
          <p className="tm-tip__week">{formatWeek(hover.date)}</p>
          <p className="tm-tip__row">
            <span className="tm-tip__key tm-tip__key--drawdown" aria-hidden="true" />
            <strong>{hover.depth < 0 ? formatDepth(hover.depth) : 'All-time high'}</strong>
            <span className="tm-tip__label">{`close ${formatPrice(hover.close)}`}</span>
          </p>
          {hover.depth < 0 && (
            <p className="tm-tip__who">
              {`From the ${formatPrice(hover.peak)} high of ${formatWeek(hover.peakDate)}`}
            </p>
          )}
          {within && (
            <p className="tm-tip__who">
              {`${within.open ? 'Bottom so far' : 'Bottomed at'} ${formatDepth(within.depth)} `}
              {`on ${formatWeek(within.troughDate)}; `}
              {within.open
                ? `top has stood ${formatSpan(within.topDays)}`
                : `back above in ${formatSpan(within.topDays)}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default DrawdownChart;
