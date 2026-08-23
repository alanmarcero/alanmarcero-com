import { useId } from 'react';
import { AIRY_ZEROS, airyIntensity, airyRings } from './airy';

/*
 * The plate for a bank with no photograph: a diffraction pattern, drawn from
 * the physics in `airy.js`.
 *
 * A drawing of an unresolved source is the one substitute that tells the
 * truth. It says the catalogue has nothing on file, in the language the rest
 * of the page is already speaking, and it cannot be mistaken for a photograph
 * of an instrument that was never photographed — or, in two of the three
 * cases, that was never built.
 *
 * Three parts, drawn back to front: the spider's diffraction spikes, the core,
 * then the dark rings over both. The rings are the measured part and are drawn
 * last so nothing crosses them.
 *
 * No words and nothing to reach: the figure is `aria-hidden` and its plate
 * caption on the page carries the fact that there is no photograph.
 */

/** The 100-unit field. The outermost dark ring lands on the edge of it. */
const FIELD_RADIUS = 44;

/** How far the spikes run — past the last ring, as they do on a real plate. */
const SPIKE_REACH = 47.5;

/*
 * A three-vane spider makes six spikes, not three: each vane diffracts to
 * both sides of the field, so three lines through the centre draw all six.
 */
const VANES = 3;
const VANE_SPACING = 180 / VANES;

/** Degrees of spider rotation per variant, so no two plates draw alike. */
const VARIANT_ROTATION = 11;

/*
 * Where the core's gradient is sampled. Seven stops, closer together through
 * the shoulder at 0.3–0.6 where the profile bends hardest; the stop at 1 is
 * the first dark ring, so it is where the light actually reaches zero.
 */
const CORE_STOPS = [0, 0.15, 0.3, 0.45, 0.6, 0.8, 1];

const vanes = () =>
  Array.from({ length: VANES }, (_unused, index) => index * VANE_SPACING);

function AiryDisc({ variant = 0, className = '' }) {
  const coreId = useId();
  const rings = airyRings(AIRY_ZEROS.length, FIELD_RADIUS);
  const core = rings[0];

  return (
    <svg
      className={`fig airy ${className}`.trim()}
      viewBox="-50 -50 100 100"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/*
          The core is not a generic glow: every stop is the real Airy intensity
          at that radius, so the falloff a reader sees is the function and the
          bloom stops exactly where the first dark ring starts. Peak opacity is
          a full-strength rose — the fade is the shape of the mark rather than a
          dimming of it.
        */}
        <radialGradient id={coreId}>
          {CORE_STOPS.map((offset) => (
            <stop
              key={offset}
              offset={offset}
              stopColor="var(--rose)"
              stopOpacity={Number(airyIntensity(offset * AIRY_ZEROS[0]).toFixed(3))}
            />
          ))}
        </radialGradient>
      </defs>

      {/*
        The spikes are the only part a rotation shows on — the rings and the
        core are circles, and turning a circle achieves nothing. Decorative, so
        they take the haze; hairlines at any rendered size, so they do not
        thicken with the plate.
      */}
      <g
        className="airy__spider"
        transform={`rotate(${variant * VARIANT_ROTATION})`}
        stroke="var(--haze)"
        strokeWidth="1"
      >
        {vanes().map((degrees) => (
          <line
            key={degrees}
            x1={-SPIKE_REACH}
            y1="0"
            x2={SPIKE_REACH}
            y2="0"
            transform={`rotate(${degrees})`}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>

      <circle className="airy__core" data-body="" r={core.radius} fill={`url(#${coreId})`} />

      {/*
        The dark rings. Width carries the brightness of the ring inside each
        one, which is why these strokes scale with the plate: the weight is the
        measurement, and a non-scaling stroke would flatten all four to the
        same hairline. The innermost is the limb of the core and takes the
        brighter ink; the rest are read against the sky, so they take the mark
        ink and are never dimmed with opacity.
      */}
      <g className="airy__rings" fill="none">
        {rings.map((ring) => (
          <circle
            key={ring.index}
            className="airy__ring"
            r={ring.radius}
            stroke={ring.index === 0 ? 'var(--rose)' : 'var(--rose-mark)'}
            strokeWidth={ring.width}
          />
        ))}
      </g>
    </svg>
  );
}

export default AiryDisc;
