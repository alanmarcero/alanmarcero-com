import { useCallback, useMemo } from 'react';
import { plotBox, yearLabel } from '../chartGeometry';
import {
  amountY, bandScale, bandIndexAtX, columnPath, monthTicks, stackDomain, stackRects,
  stackTicks,
} from '../monthlyGeometry';
import {
  GROUP_LABEL, formatAmount, formatMonth, formatTick, measureById, monthSellers,
  monthTotals, shortMonth,
} from '../monthlySeries';
import { formatShares, formatUSD } from '../insiderFilters';
import useChartCursor from '../hooks/useChartCursor';
import useChartView from '../hooks/useChartView';
import { ChartSvg, ChartTip, ValueGrid } from './ChartParts';

// Two fixed coordinate spaces, as on the price chart.
const WIDE = {
  w: 1000,
  h: 420,
  margin: { top: 34, right: 24, bottom: 54, left: 74 },
  tick: 13,
  capLabel: 14,
  quarterly: true,
  monthOffset: 22,
  yearOffset: 42,
};

const COMPACT = {
  w: 560,
  h: 420,
  margin: { top: 30, right: 14, bottom: 56, left: 78 },
  tick: 19,
  capLabel: 17,
  quarterly: false,
  monthOffset: 26,
  yearOffset: 48,
};

function MonthlySalesChart({ records, stacks, measure, summary, show }) {
  const { compact, view } = useChartView(WIDE, COMPACT);
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

  const yOf = useCallback((amount) => amountY(amount, domain, box), [box, domain]);
  const formatAxis = useCallback((amount) => formatTick(measure, amount), [measure]);
  const indexAtViewX = useCallback(
    (vx) => bandIndexAtX(vx, stacks.length, box),
    [box, stacks.length],
  );
  const cursor = useChartCursor({ count: stacks.length, viewWidth: view.w, indexAtViewX });

  const peakIndex = summary.peak
    ? stacks.findIndex((s) => s.month === summary.peak.month)
    : -1;

  const label = `T-Mobile US insider ${unit.label.toLowerCase()} by month, `
    + `${formatMonth(stacks[0].month)} to ${formatMonth(stacks[stacks.length - 1].month)}, `
    + 'stacked by seller. Deutsche Telekom is excluded.';

  const hoverIndex = cursor.index;
  const hoverStack = hoverIndex === null ? null : stacks[hoverIndex];
  const hoverRecord = hoverIndex === null ? null : records[hoverIndex];
  const hoverSellers = hoverRecord ? monthSellers(hoverRecord, show) : [];
  const hoverTotals = hoverRecord ? monthTotals(hoverRecord, show) : null;

  return (
    <div className="tm-chart">
      <ChartSvg cursor={cursor} view={view} labelSize={view.capLabel} label={label}>
        <ValueGrid ticks={ticks} box={box} yOf={yOf} format={formatAxis} />

        {/* the band the pointer is reading, behind the columns */}
        {hoverStack && (
          <rect
            className="tm-bars__band"
            x={band.leftAt(hoverIndex)}
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
              y={box.bottom + view.monthOffset}
              textAnchor="middle"
            >
              {shortMonth(month)}
            </text>
            {year && (
              <text
                className="tm-chart__tick tm-chart__tick--year"
                x={band.centerAt(index)}
                y={box.bottom + view.yearOffset}
                textAnchor="middle"
              >
                {yearLabel(year, compact)}
              </text>
            )}
          </g>
        ))}

        {/* one selective direct label: the month the chart is really about */}
        {peakIndex >= 0 && (
          <text
            className="tm-chart__endlabel"
            x={band.centerAt(peakIndex)}
            y={yOf(summary.peak.total) - 12}
            textAnchor="middle"
          >
            {formatTick(measure, summary.peak.total)}
          </text>
        )}
      </ChartSvg>

      {hoverStack && (
        <ChartTip x={band.centerAt(hoverIndex)} viewWidth={view.w}>
          <p className="tm-tip__week">{formatMonth(hoverStack.month)}</p>
          {hoverStack.segments.map((segment) => (
            <p className="tm-tip__row" key={segment.group}>
              <span
                className={`tm-tip__key tm-tip__key--${segment.group}`}
                aria-hidden="true"
              />
              <strong>{formatAmount(measure, segment.amount)}</strong>
              <span className="tm-tip__label">{GROUP_LABEL[segment.group]}</span>
            </p>
          ))}
          {hoverStack.segments.length > 1 && (
            <p className="tm-tip__row tm-tip__row--total">
              <strong>{formatAmount(measure, hoverStack.total)}</strong>
              <span className="tm-tip__label">the month</span>
            </p>
          )}
          {hoverSellers.length > 0 && (
            <p className="tm-tip__who">
              {hoverSellers.map((s) => s.name).join(', ')}
            </p>
          )}
          {hoverStack.total > 0 && (
            <p className="tm-tip__who">
              {measure === 'value'
                ? `${formatShares(hoverTotals.shares)} shares`
                : `${formatUSD(hoverTotals.value)} at the prices they sold for`}
            </p>
          )}
          {hoverStack.total === 0 && <p className="tm-tip__none">No insider sales</p>}
        </ChartTip>
      )}
    </div>
  );
}

export default MonthlySalesChart;
