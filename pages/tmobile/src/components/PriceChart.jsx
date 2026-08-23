import { useCallback, useMemo, useRef, useState } from 'react';
import useMediaQuery from '../../../../src/hooks/useMediaQuery';
import {
  plotBox, xAt, yAt, indexAtX, priceDomain, priceTicks, yearTicks,
  linePoints, areaPath, sellMarkers, weekIndexMap,
} from '../chartGeometry';
import { formatPrice, formatShares, formatUSD, formatWeek } from '../insiderFilters';

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
};

const COMPACT_QUERY = '(max-width: 640px)';

const diamond = (x, y, r) => `M${x},${y - r}L${x + r},${y}L${x},${y + r}L${x - r},${y}Z`;

function PriceChart({ prices, sievertWeeks, otherWeeks, showSievert, showOthers }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);

  const compact = useMediaQuery(COMPACT_QUERY);
  const view = compact ? COMPACT : WIDE;

  const geometry = useMemo(() => {
    const box = plotBox(view.w, view.h, view.margin);
    const domain = priceDomain(prices.map((p) => p.close), { padFraction: 0.08, step: 20 });
    const weekIndex = weekIndexMap(prices);
    return {
      box,
      domain,
      weekIndex,
      ticks: priceTicks(domain, view.priceStep),
      years: yearTicks(prices.map((p) => p.week)),
      line: linePoints(prices, domain, box),
      area: areaPath(prices, domain, box),
      sievert: sellMarkers(sievertWeeks, weekIndex, prices, domain, box),
      others: sellMarkers(otherWeeks, weekIndex, prices, domain, box),
    };
  }, [prices, sievertWeeks, otherWeeks, view]);

  const { box, domain, ticks, years, line, area } = geometry;

  // week -> sell rows, so the crosshair can report both groups at one X.
  const sellsByWeek = useMemo(() => {
    const map = new Map();
    if (showSievert) geometry.sievert.forEach((s) => map.set(s.week, { ...map.get(s.week), sievert: s }));
    if (showOthers) geometry.others.forEach((s) => map.set(s.week, { ...map.get(s.week), others: s }));
    return map;
  }, [geometry, showSievert, showOthers]);

  const moveTo = useCallback((index) => {
    const point = prices[index];
    if (!point) return;
    setHover({ index, ...point });
  }, [prices]);

  const handlePointer = useCallback((event) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (!rect.width) return;
    // client px -> viewBox units
    const vx = ((event.clientX - rect.left) / rect.width) * view.w;
    moveTo(indexAtX(vx, prices.length, box));
  }, [box, moveTo, prices.length, view.w]);

  const handleKeyDown = useCallback((event) => {
    const step = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
    if (!step) return;
    event.preventDefault();
    const from = hover ? hover.index : prices.length - 1;
    moveTo(Math.min(prices.length - 1, Math.max(0, from + step)));
  }, [hover, moveTo, prices.length]);

  const clear = useCallback(() => setHover(null), []);

  const last = prices[prices.length - 1];
  const hoverX = hover ? xAt(hover.index, prices.length, box) : 0;
  const hoverY = hover ? yAt(hover.close, domain, box) : 0;
  const hoverSells = hover ? sellsByWeek.get(hover.week) : null;

  const label = `T-Mobile US weekly closing price, ${formatWeek(prices[0].week)} to `
    + `${formatWeek(last.week)}, with a marker on every week an insider sold.`;

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
          <linearGradient id="tm-wash" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--tm-price)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--tm-price)" stopOpacity="0" />
          </linearGradient>
        </defs>

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
            {`$${t}`}
          </text>
        ))}

        {years.map(({ index, year }) => (
          <text
            key={year}
            className="tm-chart__tick"
            x={xAt(index, prices.length, box)}
            y={box.bottom + (compact ? 30 : 26)}
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

        {hover && (
          <g className="tm-chart__cursor">
            <line x1={hoverX} x2={hoverX} y1={box.top} y2={box.bottom} />
            <circle cx={hoverX} cy={hoverY} r={4.5} />
          </g>
        )}

        {/* one selective direct label, parked in the gutter past the line end */}
        <text
          className="tm-chart__endlabel"
          x={xAt(prices.length - 1, prices.length, box) + 10}
          y={yAt(last.close, domain, box)}
          textAnchor="start"
          dominantBaseline="middle"
        >
          {formatPrice(last.close)}
        </text>
      </svg>

      {hover && (
        <div
          className="tm-tip"
          style={{ left: `${(hoverX / view.w) * 100}%` }}
          role="status"
          aria-live="polite"
        >
          <p className="tm-tip__week">{`Week of ${formatWeek(hover.week)}`}</p>
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
                {`sh · ${formatUSD(hoverSells.others.value)} · ${hoverSells.others.people.length} other insider${hoverSells.others.people.length === 1 ? '' : 's'}`}
              </span>
            </p>
          )}
          {!hoverSells && <p className="tm-tip__none">No insider sales</p>}
        </div>
      )}
    </div>
  );
}

export default PriceChart;
