import { useCallback, useMemo } from 'react';
import {
  plotBox, xAt, priceY, indexAtX, priceDomain, priceTicks, yearTicks,
  linePoints, areaPath, sellMarkers, weekIndexMap,
} from '../chartGeometry';
import { formatDate, formatPrice, formatShares, formatUSD } from '../insiderFilters';
import useChartCursor from '../hooks/useChartCursor';
import useChartView from '../hooks/useChartView';
import {
  ChartSvg, ChartTip, Crosshair, ValueGrid, YearTicks,
} from './ChartParts';

// Two fixed coordinate spaces. A phone gets a narrower, taller box with larger
// type in user units, so the axes stay legible once the SVG is scaled down to
// a ~330px-wide column. Both keep a right gutter wide enough to hold the end
// label outside the plot, where it can never collide with its own trace.
const WIDE = {
  w: 1000,
  h: 460,
  margin: { top: 28, right: 76, bottom: 46, left: 66 },
  tick: 13,
  endLabel: 14,
  priceStep: 40,
  yearOffset: 26,
};

const COMPACT = {
  w: 520,
  h: 460,
  // the gutter must clear a full "$173.34" at the compact label size, or the
  // viewBox edge clips it
  margin: { top: 20, right: 88, bottom: 44, left: 54 },
  tick: 19,
  endLabel: 17,
  priceStep: 80,
  yearOffset: 30,
};

const diamond = (x, y, r) => `M${x},${y - r}L${x + r},${y}L${x},${y + r}L${x - r},${y}Z`;

const priceTick = (t) => `$${t}`;

/** week -> the visible sell rows that week, so the crosshair can report both groups at one X. */
function sellsByWeek(sievert, others, showSievert, showOthers) {
  const map = new Map();
  if (showSievert) sievert.forEach((s) => map.set(s.week, { ...map.get(s.week), sievert: s }));
  if (showOthers) others.forEach((s) => map.set(s.week, { ...map.get(s.week), others: s }));
  return map;
}

const plural = (count, noun) => `${count} ${noun}${count === 1 ? '' : 's'}`;

function PriceChart({ prices, sievertWeeks, otherWeeks, showSievert, showOthers }) {
  const { compact, view } = useChartView(WIDE, COMPACT);

  const geometry = useMemo(() => {
    const box = plotBox(view.w, view.h, view.margin);
    const domain = priceDomain(prices.map((p) => p.close), { padFraction: 0.08, step: 20 });
    const weekIndex = weekIndexMap(prices);
    return {
      box,
      domain,
      ticks: priceTicks(domain, view.priceStep),
      years: yearTicks(prices.map((p) => p.week), { minWeeks: compact ? 26 : 0 }),
      line: linePoints(prices, domain, box),
      area: areaPath(prices, domain, box),
      sievert: sellMarkers(sievertWeeks, weekIndex, prices, domain, box),
      others: sellMarkers(otherWeeks, weekIndex, prices, domain, box),
    };
  }, [prices, sievertWeeks, otherWeeks, view, compact]);

  const { box, domain, ticks, years, line, area } = geometry;

  const sells = useMemo(
    () => sellsByWeek(geometry.sievert, geometry.others, showSievert, showOthers),
    [geometry, showSievert, showOthers],
  );

  const yOf = useCallback((price) => priceY(price, domain, box), [box, domain]);
  const indexAtViewX = useCallback((vx) => indexAtX(vx, prices.length, box), [box, prices.length]);
  const cursor = useChartCursor({ count: prices.length, viewWidth: view.w, indexAtViewX });

  const last = prices[prices.length - 1];
  const hover = cursor.index === null ? null : prices[cursor.index];
  const hoverX = hover ? xAt(cursor.index, prices.length, box) : 0;
  const hoverSells = hover ? sells.get(hover.week) : null;

  const label = `T-Mobile US weekly closing price, ${formatDate(prices[0].week)} to `
    + `${formatDate(last.week)}, with a marker on every week an insider sold.`;

  return (
    <div className="tm-chart">
      <ChartSvg cursor={cursor} view={view} labelSize={view.endLabel} label={label}>
        <defs>
          <linearGradient id="tm-wash" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--tm-price)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--tm-price)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <ValueGrid ticks={ticks} box={box} yOf={yOf} format={priceTick} />
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

        <path className="tm-chart__area" d={area} fill="url(#tm-wash)" />
        <polyline className="tm-chart__line" points={line} />

        {/* other insiders first, the CEO on top: shape differentiates them
            where both sold in the same week */}
        {showOthers && geometry.others.map((s) => (
          <circle key={s.week} className="tm-chart__dot tm-chart__dot--others" cx={s.x} cy={s.y} r={4} />
        ))}
        {showSievert && geometry.sievert.map((s) => (
          <path key={s.week} className="tm-chart__dot tm-chart__dot--sievert" d={diamond(s.x, s.y, 5.5)} />
        ))}

        {hover && <Crosshair x={hoverX} y={yOf(hover.close)} box={box} />}

        {/* one selective direct label, parked in the gutter past the line end */}
        <text
          className="tm-chart__endlabel"
          x={xAt(prices.length - 1, prices.length, box) + 10}
          y={yOf(last.close)}
          textAnchor="start"
          dominantBaseline="middle"
        >
          {formatPrice(last.close)}
        </text>
      </ChartSvg>

      {hover && (
        <ChartTip x={hoverX} viewWidth={view.w}>
          <p className="tm-tip__week">{`Week of ${formatDate(hover.week)}`}</p>
          <p className="tm-tip__row">
            <span className="tm-tip__key tm-tip__key--price" aria-hidden="true" />
            <strong>{formatPrice(hover.close)}</strong>
            <span className="tm-tip__label">close</span>
          </p>
          {hoverSells?.sievert && (
            <p className="tm-tip__row">
              <span className="tm-tip__key tm-tip__key--sievert" aria-hidden="true" />
              <strong>{formatShares(hoverSells.sievert.shares)}</strong>
              <span className="tm-tip__label">
                {`sh · ${formatUSD(hoverSells.sievert.value)} · Sievert`}
              </span>
            </p>
          )}
          {hoverSells?.others && (
            <p className="tm-tip__row">
              <span className="tm-tip__key tm-tip__key--others" aria-hidden="true" />
              <strong>{formatShares(hoverSells.others.shares)}</strong>
              <span className="tm-tip__label">
                {`sh · ${formatUSD(hoverSells.others.value)} · `
                  + plural(hoverSells.others.people.length, 'other insider')}
              </span>
            </p>
          )}
          {!hoverSells && <p className="tm-tip__none">No insider sales</p>}
        </ChartTip>
      )}
    </div>
  );
}

export default PriceChart;
