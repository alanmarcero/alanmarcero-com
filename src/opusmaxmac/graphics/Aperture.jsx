import { radialTicks, crosshair, bearingLabels } from './graticule';

/*
 * The photographic plate.
 *
 * A photograph of an instrument, printed as the circular field an eyepiece
 * actually shows, with the instrument's own graticule engraved over it: a
 * limb, its graduations, the bearings, and a reticle whose centre is left
 * clear of the subject.
 *
 * The graticule is `aria-hidden`, so the only thing announced is the
 * photograph's own `alt`. Nothing here is a control and nothing takes focus —
 * a reader gains nothing from arriving at a set of tick marks.
 *
 * No CSS lives in this file. Every class below is styled in
 * `styles/ephemeris.css`, including whether the graticule is visible at all
 * at a given size.
 */

/**
 * The limb, and so the radius the graduations stand on. Fed to `radialTicks`
 * as its `inner` rather than left to the module's default, so the circle and
 * the feet of the ticks cannot drift apart.
 *
 * It sits well inside the field on purpose. The photographs are real
 * photographs, and several were taken against a white studio backdrop — a
 * bearing printed in rose over one of those is rose on white. So the limb is
 * drawn where the photograph is fading out, and the bearings sit outside it
 * altogether, on the sky, where their contrast is the measured one. The
 * matching mask radius is in `ephemeris.css`; the two are a pair.
 */
const LIMB = 39;
const TICK_OUTER = 41.4;
const TICK_MAJOR_OUTER = 43;
const BEARING_RADIUS = 46.5;
const HAIR_REACH = 35;

function Aperture({ src, srcSet, sizes, width, height, alt, ticks = 72, className = '' }) {
  return (
    <div className={`plate ${className}`.trim()}>
      <img
        className="plate__photo"
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        width={width}
        height={height}
        alt={alt}
        loading="lazy"
        decoding="async"
      />

      {/*
        Hairlines throughout: `non-scaling-stroke` takes the widths out of the
        viewBox's units, so a plate rendered at 520px and the same plate at
        180px are engraved with the same 1px stroke rather than one of them
        being drawn in crayon.
      */}
      <svg
        className="fig plate__graticule"
        viewBox="-50 -50 100 100"
        aria-hidden="true"
        focusable="false"
      >
        <circle className="plate__limb" r={LIMB} vectorEffect="non-scaling-stroke" />

        {radialTicks({
          count: ticks,
          inner: LIMB,
          outer: TICK_OUTER,
          majorOuter: TICK_MAJOR_OUTER,
        }).map((tick) => (
          <line
            key={tick.index}
            className={`plate__tick${tick.major ? ' plate__tick--major' : ''}`}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {crosshair({ reach: HAIR_REACH }).map((hair) => (
          <line
            key={hair.bearing}
            className="plate__hair"
            x1={hair.x1}
            y1={hair.y1}
            x2={hair.x2}
            y2={hair.y2}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {bearingLabels({ radius: BEARING_RADIUS }).map((label) => (
          <text key={label.bearing} className="plate__bearing" x={label.x} y={label.y}>
            {label.text}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default Aperture;
