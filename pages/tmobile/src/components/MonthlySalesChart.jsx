import { useCallback, useMemo, useRef, useState } from 'react';
import useMediaQuery from '../../../../src/hooks/useMediaQuery';
import { plotBox } from '../chartGeometry';
import {
  bandScale, bandIndexAtX, columnPath, monthTicks, stackDomain, stackRects,
  stackTicks, yAt,
} from '../monthlyGeometry';
import {
  GROUP_LABEL, formatAmount, formatMonth, formatTick, measureById, monthSellers,
  monthTotals, shortMonth,
} from '../monthlySeries';
import { formatShares, formatUSD } from '../insiderFilters';

// Two fixed coordinate spaces, as on the price chart: a phone gets a narrower
// box with larger type in user units, so the axis stays legible once the SVG
// is scaled down into a ~330px column.
const WIDE = {
  w: 1000,
  h: 420,
  margin: { top: 34, right: 24, bottom: 54, left: 74 },
  tick: 13,
  capLabel: 14,
  quarterly: true,
};

const COMPACT = {
  w: 560,
  h: 420,
  margin: { top: 30, right: 14, bottom: 56, left: 78 },
  tick: 19,
  capLabel: 17,
  quarterly: false,
};

const COMPACT_QUERY = '(max-width: 640px)';

/** Keep the tooltip inside the well at the two ends of the axis. */
const clampPercent = (value) => Math.min(84, Math.max(16, value));

function MonthlySalesChart({ records, stacks, measure, summary, show }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);

  const compact = useMediaQuery(COMPACT_QUERY);
  const view = compact ? COMPACT : WIDE;
  const unit = measureById(measure);

  const geometry = useMemo(() => {
    const box = plotBox(view.w, view.h, view.margin);
    const domain = stackDomain(stacks.map((s) => s.total));
    const band = bandScale(stacks.length, box);
    return {
      box,
      domain,
      band,
      ticks: stackTicks(domain),
      months: monthTicks(stacks.map((s) => s.month), view.quarterly),
      columns: stacks.map((stack, i) => stackRects(stack, domain, box, band, i)),
    };
  }, [stacks, view]);

  const { box, domain, band, ticks, months, columns } = geometry;

  const moveTo = useCallback((index) => {
    const stack = stacks[index];
    if (!stack) return;
    setHover({ index, stack, record: records[index] });
  }, [records, stacks]);

  const handlePointer = useCallback((event) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (!rect.width) return;
    // client px -> viewBox units
    const vx = ((event.clientX - rect.left) / rect.width) * view.w;
    moveTo(bandIndexAtX(vx, stacks.length, box));
  }, [box, moveTo, stacks.length, view.w]);

  const handleKeyDown = useCallback((event) => {
    const step = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
    if (!step) return;
    event.preventDefault();
    const from = hover ? hover.index : stacks.length - 1;
    moveTo(Math.min(stacks.length - 1, Math.max(0, from + step)));
  }, [hover, moveTo, stacks.length]);

  const clear = useCallback(() => setHover(null), []);

  const peakIndex = summary.peak
    ? stacks.findIndex((s) => s.month === summary.peak.month)
    : -1;

  const label = `T-Mobile US insider ${unit.label.toLowerCase()} by month, `
    + `${formatMonth(stacks[0].month)} to ${formatMonth(stacks[stacks.length - 1].month)}, `
    + 'stacked by seller. Deutsche Telekom is excluded.';

  const hoverSellers = hover ? monthSellers(hover.record, show) : [];
  const hoverTotals = hover ? monthTotals(hover.record, show) : null;

  return (
    <div className="tm-chart">
      <svg
        ref={svgRef}
        className="tm-chart__svg"
        viewBox={`0 0 ${view.w} ${view.h}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          '--tm-tick-size': `${view.tick}px`,
          '--tm-endlabel-size': `${view.capLabel}px`,
        }}
        role="img"
        aria-label={label}
        tabIndex={0}
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        onPointerLeave={clear}
        onBlur={clear}
        onKeyDown={handleKeyDown}
      >
        {/* horizontal grid — solid hairlines, one step off the surface */}
        {ticks.map((t) => (
          <line
            key={t}
            className="tm-chart__grid"
            x1={box.left}
            x2={box.right}
            y1={yAt(t, domain, box)}
            y2={yAt(t, domain, box)}
          />
        ))}

        {ticks.map((t) => (
          <text
            key={t}
            className="tm-chart__tick"
            x={box.left - 12}
            y={yAt(t, domain, box)}
            textAnchor="end"
            dominantBaseline="middle"
          >
            {formatTick(measure, t)}
          </text>
        ))}

        {/* the band the pointer is reading, behind the columns */}
        {hover && (
          <rect
            className="tm-bars__band"
            x={band.leftAt(hover.index)}
            y={box.top}
            width={band.step}
            height={box.height}
          />
        )}

        {columns.map((rects, index) => (
          <g key={stacks[index].month}>
            {rects.map((rect) => (
              <path
                key={rect.group}
                className={`tm-bars__seg tm-bars__seg--${rect.group}`}
                d={columnPath(rect)}
              />
            ))}
          </g>
        ))}

        <line
          className="tm-chart__axis"
          x1={box.left}
          x2={box.right}
          y1={box.bottom}
          y2={box.bottom}
        />

        {months.map(({ index, month, year }) => (
          <g key={month}>
            <text
              className="tm-chart__tick"
              x={band.centerAt(index)}
              y={box.bottom + (compact ? 26 : 22)}
              textAnchor="middle"
            >
              {shortMonth(month)}
            </text>
            {year && (
              <text
                className="tm-chart__tick tm-chart__tick--year"
                x={band.centerAt(index)}
                y={box.bottom + (compact ? 48 : 42)}
                textAnchor="middle"
              >
                {compact ? `’${year.slice(2)}` : year}
              </text>
            )}
          </g>
        ))}

        {/* one selective direct label: the month the chart is really about */}
        {peakIndex >= 0 && (
          <text
            className="tm-chart__endlabel"
            x={band.centerAt(peakIndex)}
            y={yAt(summary.peak.total, domain, box) - 12}
            textAnchor="middle"
          >
            {formatTick(measure, summary.peak.total)}
          </text>
        )}
      </svg>

      {hover && (
        <div
          className="tm-tip"
          style={{ left: `${clampPercent((band.centerAt(hover.index) / view.w) * 100)}%` }}
          role="status"
          aria-live="polite"
        >
          <p className="tm-tip__week">{formatMonth(hover.stack.month)}</p>
          {hover.stack.segments.map((segment) => (
            <p className="tm-tip__row" key={segment.group}>
              <span
                className={`tm-tip__key tm-tip__key--${segment.group}`}
                aria-hidden="true"
              />
              <strong>{formatAmount(measure, segment.amount)}</strong>
              <span className="tm-tip__label">{GROUP_LABEL[segment.group]}</span>
            </p>
          ))}
          {hover.stack.segments.length > 1 && (
            <p className="tm-tip__row tm-tip__row--total">
              <strong>{formatAmount(measure, hover.stack.total)}</strong>
              <span className="tm-tip__label">the month</span>
            </p>
          )}
          {hoverSellers.length > 0 && (
            <p className="tm-tip__who">
              {hoverSellers.map((s) => s.name).join(', ')}
            </p>
          )}
          {hover.stack.total > 0 && (
            <p className="tm-tip__who">
              {measure === 'value'
                ? `${formatShares(hoverTotals.shares)} shares`
                : `${formatUSD(hoverTotals.value)} at the prices they sold for`}
            </p>
          )}
          {hover.stack.total === 0 && <p className="tm-tip__none">No insider sales</p>}
        </div>
      )}
    </div>
  );
}

export default MonthlySalesChart;
