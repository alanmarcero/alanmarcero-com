import { useId } from 'react';
import { orbitsFor } from './orbits';

/*
 * The interval orrery — the page's one showpiece and its only moving part.
 *
 * Eleven banks as eleven bodies, each on the orbit its assigned interval puts
 * it on, turning at that interval's period, sized by the one thing here that is
 * measured rather than labelled: the patch count. See orbits.js for which is
 * which; the page prints both facts in the caption.
 *
 * The figure carries no words at all. Its key is the caption underneath, which
 * is where a chart's key belongs and, more practically, the only place a label
 * cannot be run over by an orbiting body.
 *
 * Not interactive and not reachable. Nothing in here does anything a keyboard
 * user would want to reach, so it is a single `role="img"` with a summary and no
 * focusable children. The live link runs the other way: the register lights
 * whichever ring belongs to the row you are reading.
 */

/*
 * The figure is drawn in a `0 0 100 100` box with the centre at (50, 50), and
 * not in the `-50 -50 100 100` box that would put the centre at the origin.
 *
 * That is a browser-compatibility decision, not a taste one. The bodies rotate
 * via a CSS animation, so their rotation centre comes from `transform-origin`,
 * and with `transform-box: view-box` browsers disagree about whether a
 * percentage is measured from the viewBox's corner or from the local origin —
 * Chrome resolves `50% 50%` on a `-50 -50 100 100` box to the user-space point
 * (50, 50), which is the bottom-right of the field, and the bodies swing out of
 * the figure entirely. With the box starting at (0, 0) both readings land on the
 * same point, so there is nothing left to disagree about.
 */
const CENTRE = 50;
const FIELD = 44;
const LIMB = 46;
const TICK_OUTER = 47.4;
const TICK_MAJOR = 48.8;
const SPOKES = 8;
const TICK_STEP_DEGREES = 5;

const polar = (radius, degrees) => {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: CENTRE + Math.cos(radians) * radius,
    y: CENTRE + Math.sin(radians) * radius,
  };
};

const ticks = () => {
  const marks = [];
  for (let degrees = 0; degrees < 360; degrees += TICK_STEP_DEGREES) {
    const major = degrees % 45 === 0;
    marks.push({
      degrees,
      major,
      inner: polar(LIMB, degrees),
      outer: polar(major ? TICK_MAJOR : TICK_OUTER, degrees),
    });
  }
  return marks;
};

const spokes = () =>
  Array.from({ length: SPOKES }, (_unused, index) => {
    const degrees = (360 / SPOKES) * index;
    return { degrees, end: polar(FIELD, degrees) };
  });

function Orrery({ banks, activeIndex = null, paused = false, className = '' }) {
  const haloId = useId();
  const bodies = orbitsFor(banks);

  return (
    <svg
      className={`fig orrery ${className}`.trim()}
      viewBox="0 0 100 100"
      role="img"
      focusable="false"
      data-paused={paused ? 'true' : 'false'}
      aria-label={
        `Interval orrery: the ${bodies.length} patch banks drawn as orbits, one per ` +
        'just-intonation interval from 1:1 to 2:1. Each bank’s patch count is listed ' +
        'with its entry below, and the lit ring is the entry being read.'
      }
    >
      <defs>
        <radialGradient id={haloId}>
          <stop offset="0%" stopColor="var(--rose-lit)" stopOpacity="0.4" />
          <stop offset="55%" stopColor="var(--rose)" stopOpacity="0.11" />
          <stop offset="100%" stopColor="var(--rose)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* The instrument: a graduated limb and eight spokes. The spokes are the
          one genuinely decorative mark in the figure, so they are the one mark
          allowed to use --haze. */}
      <g className="orrery__instrument">
        <circle className="orrery__limb" cx={CENTRE} cy={CENTRE} r={LIMB} />
        {ticks().map((tick) => (
          <line
            key={tick.degrees}
            className={`orrery__tick${tick.major ? ' orrery__tick--major' : ''}`}
            x1={tick.inner.x}
            y1={tick.inner.y}
            x2={tick.outer.x}
            y2={tick.outer.y}
          />
        ))}
        {spokes().map((spoke) => (
          <line
            key={spoke.degrees}
            className="orrery__spoke"
            x1={CENTRE}
            y1={CENTRE}
            x2={spoke.end.x}
            y2={spoke.end.y}
          />
        ))}
      </g>

      {/*
        The orbits draw themselves in on arrival. Each ring's own circumference
        rides along as a custom property, so one keyframe covers eleven radii —
        the tidier `pathLength="1"` does not survive `non-scaling-stroke`, which
        the rings need to stay hairlines at any rendered size.
      */}
      <g className="orrery__orbits">
        {bodies.map((body) => {
          const radius = body.radius * FIELD;
          return (
            <circle
              key={body.designation}
              className={`orrery__orbit${activeIndex === body.index ? ' is-active' : ''}`}
              data-lit={activeIndex === body.index ? '' : undefined}
              cx={CENTRE}
              cy={CENTRE}
              r={radius}
              style={{
                '--ring': body.index,
                '--circumference': (2 * Math.PI * radius).toFixed(3),
              }}
            />
          );
        })}
      </g>

      {/*
        Two nested groups per body on purpose. The outer one carries the epoch
        phase as an SVG attribute — which takes an explicit centre and so cannot
        be misread — and it survives the CSS animation on the inner one not
        applying at all. Under prefers-reduced-motion the alternative is eleven
        bodies parked in a row at three o'clock.
      */}
      <g className="orrery__bodies">
        {bodies.map((body) => {
          const active = activeIndex === body.index;
          const distance = body.radius * FIELD;
          const degrees = (body.phase * 180) / Math.PI;

          return (
            <g key={body.designation} transform={`rotate(${degrees} ${CENTRE} ${CENTRE})`}>
              <g
                className="orrery__turn"
                style={{ '--period': `${body.period}s`, '--body': body.index }}
              >
                {active && (
                  <line
                    className="orrery__radius"
                    x1={CENTRE}
                    y1={CENTRE}
                    x2={CENTRE + distance}
                    y2={CENTRE}
                  />
                )}
                <circle
                  className="orrery__halo"
                  cx={CENTRE + distance}
                  cy={CENTRE}
                  r={active ? body.haloRadius * 1.5 : body.haloRadius}
                  fill={`url(#${haloId})`}
                />
                {/*
                  A bank with no patch count is drawn hollow. Filled, it would
                  be the faintest and smallest of the eleven — the figure
                  asserting a magnitude for the one entry whose readout says
                  there is none.
                */}
                <circle
                  className={[
                    'orrery__body',
                    body.unlisted && 'orrery__body--unlisted',
                    active && 'is-active',
                  ].filter(Boolean).join(' ')}
                  data-body=""
                  cx={CENTRE + distance}
                  cy={CENTRE}
                  r={active ? body.bodyRadius * 1.7 : body.bodyRadius}
                />
              </g>
            </g>
          );
        })}
      </g>

      {/* The observer, at the centre of their own chart. */}
      <g className="orrery__observer">
        <line x1={CENTRE - 3.2} y1={CENTRE} x2={CENTRE + 3.2} y2={CENTRE} />
        <line x1={CENTRE} y1={CENTRE - 3.2} x2={CENTRE} y2={CENTRE + 3.2} />
        <circle cx={CENTRE} cy={CENTRE} r="1" data-body="" />
      </g>
    </svg>
  );
}

export default Orrery;
export { CENTRE, FIELD };
