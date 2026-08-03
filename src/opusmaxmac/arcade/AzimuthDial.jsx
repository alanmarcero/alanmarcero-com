import { sectors, dialTicks, numeralFor, readingLines } from './dial';

/*
 * The azimuth dial.
 *
 * Twelve machines as twelve bearings, the one in hand lit and named in the
 * middle. It is the arcade's one showpiece, and everything around it is a list.
 *
 * Not interactive, and not reachable. The twelve real controls are the rows
 * below; the dial only reflects them, so a keyboard user meets each machine
 * once instead of thirteen times. The live link runs one way — hovering or
 * focusing a row lights that row's sector.
 *
 * Colours are set here as presentation attributes and every one of them is a
 * token, so the figure is correct before a stylesheet arrives and yields to any
 * rule that does arrive: a presentation attribute loses to every CSS
 * declaration, which is exactly the precedence a default wants.
 */

/** Where the reading sits, in the 100-unit field. */
const READING_TYPE = 5.4;
const READING_LINE = 6.6;
const NUMERAL_TYPE = 4.4;

function AzimuthDial({ items = [], activeId = null, className = '' }) {
  const wedges = sectors(items.length);
  const ticks = dialTicks(items.length);

  // A null id must not match a machine that happens to have no id of its own.
  const activeIndex = activeId == null ? -1 : items.findIndex((item) => item.id === activeId);
  const active = activeIndex < 0 ? null : items[activeIndex];
  const lines = readingLines(active?.name);

  return (
    <svg
      className={`fig dial ${className}`.trim()}
      viewBox="-50 -50 100 100"
      aria-hidden="true"
      focusable="false"
    >
      {/* The graduated limb, drawn just outside the wedges it graduates. */}
      <g className="dial__limb">
        {ticks.map((tick) => (
          <line
            key={tick.index}
            className={`dial__tick${tick.major ? ' dial__tick--major' : ''}`}
            x1={tick.inner.x}
            y1={tick.inner.y}
            x2={tick.outer.x}
            y2={tick.outer.y}
            stroke="var(--rose)"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>

      <g className="dial__sectors">
        {wedges.map((wedge, index) => {
          const lit = index === activeIndex;

          return (
            <path
              key={items[index].id ?? index}
              className={`dial__sector${lit ? ' is-active' : ''}`}
              data-lit={lit ? '' : undefined}
              d={wedge.path}
              fill="none"
              stroke={lit ? 'var(--rose-lit)' : 'var(--rose-mark)'}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </g>

      {/*
        Every numeral claims `data-body`, because forced colours strips `fill`
        from everything under `.fig` and text with no fill is a hollow outline.
      */}
      <g className="dial__numerals">
        {wedges.map((wedge, index) => {
          const lit = index === activeIndex;

          return (
            <text
              key={items[index].id ?? index}
              className={`dial__numeral${lit ? ' is-active' : ''}`}
              data-body=""
              x={wedge.labelPoint.x}
              y={wedge.labelPoint.y}
              transform={`rotate(${wedge.textAngle} ${wedge.labelPoint.x} ${wedge.labelPoint.y})`}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={NUMERAL_TYPE}
              fill={lit ? 'var(--rose-lit)' : 'var(--rose)'}
            >
              {numeralFor(index)}
            </text>
          );
        })}
      </g>

      {/* With nothing in hand the dial reads nothing: an empty centre is a state. */}
      {lines.length > 0 && (
        <text
          className="dial__reading"
          data-lit=""
          textAnchor="middle"
          fontSize={READING_TYPE}
          fill="var(--ink)"
        >
          {lines.map((line, index) => (
            <tspan
              key={line}
              x="0"
              y={(index - (lines.length - 1) / 2) * READING_LINE}
              dominantBaseline="central"
            >
              {line}
            </tspan>
          ))}
        </text>
      )}
    </svg>
  );
}

export default AzimuthDial;
