/*
 * The graticule engraved round a photographic plate.
 *
 * A plate on this page is a circle, and every circle a person actually reads
 * — a compass rose, a telescope's setting circle, a micrometer eyepiece — is
 * graduated from twelve o'clock and numbered clockwise. So the angles here
 * are bearings. That is not what `Math.cos`/`Math.sin` give: they start at
 * three o'clock and, in SVG's downward y, run anticlockwise. The conversion
 * is therefore done once, in `bearingPoint`, rather than at each of the four
 * call sites where sooner or later one of them would be got wrong.
 *
 * Everything is stated in the `-50 -50 100 100` viewBox this route's figures
 * share, so the origin is the centre of the plate and a radius is already a
 * distance in that field.
 *
 * Pure. Same arguments in, same engraving out — no PRNG, no clock.
 */

/** The four cardinals, in bearing order: N, E, S, W. */
const CARDINALS = [0, 90, 180, 270];

/**
 * Five places is finer than any size this ever renders at can resolve, and
 * rounding keeps `sin(180°)`-grade dust — 1.2e-16 and its multiples — out of
 * the coordinates that end up in the markup.
 *
 * The zero case is not pedantry. Rounding a negative speck gives -0, which
 * every arithmetic use of a coordinate treats as 0 and every structural
 * comparison of one — `Object.is`, and so Jest's — does not.
 */
const round = (value) => {
  const rounded = Number(value.toFixed(5));
  return rounded === 0 ? 0 : rounded;
};

/**
 * A point at a radius and a bearing, in the 100-unit field.
 *
 * Sine carries x and negated cosine carries y, which is the whole conversion
 * from bearings to screen space. Doing it that way rather than by subtracting
 * 90 degrees from the angle also keeps the cardinals exact: bearing 0 lands
 * on x = 0 rather than on the 6e-17 that `cos(-90°)` returns.
 */
export const bearingPoint = (radius, bearingDegrees) => {
  const radians = (bearingDegrees * Math.PI) / 180;
  return {
    x: round(Math.sin(radians) * radius),
    y: round(-Math.cos(radians) * radius),
  };
};

/**
 * The graduations round the limb: `count` of them, evenly spaced, each a
 * radial stroke from `inner` outwards. Every `majorEvery`-th one reaches
 * further, so the eye can count the ring in groups without any numbers.
 */
export const radialTicks = ({
  count = 72,
  inner = 44,
  outer = 46.6,
  majorEvery = 6,
  majorOuter = 48.4,
} = {}) => {
  if (count < 1) return [];

  const step = 360 / count;

  return Array.from({ length: count }, (_unused, index) => {
    const bearing = step * index;
    // A `majorEvery` of zero would make every modulo NaN; no tick is major
    // rather than all of them, which is the harmless reading of "never".
    const major = majorEvery > 0 && index % majorEvery === 0;
    const foot = bearingPoint(inner, bearing);
    const head = bearingPoint(major ? majorOuter : outer, bearing);

    return { index, bearing, major, x1: foot.x, y1: foot.y, x2: head.x, y2: head.y };
  });
};

/**
 * The centre cross, as four separate radial segments rather than two crossed
 * lines. The gap is the point: an eyepiece reticle leaves the middle clear so
 * the cross can be laid on the thing being measured without hiding it, and
 * here the thing being measured is the photograph.
 */
export const crosshair = ({ gap = 9, reach = 41 } = {}) =>
  CARDINALS.map((bearing) => {
    const foot = bearingPoint(gap, bearing);
    const head = bearingPoint(reach, bearing);
    return { bearing, x1: foot.x, y1: foot.y, x2: head.x, y2: head.y };
  });

/**
 * The printed bearings, every `step` degrees, parked at `radius` — inside the
 * limb, where the graduations cannot run over them.
 *
 * Zero-padded to three digits because that is how a bearing is written
 * everywhere it is written at all, and because three glyphs wide means the
 * four labels are the same size and sit at the same optical weight.
 */
export const bearingLabels = ({ step = 90, radius = 37 } = {}) => {
  if (!(step > 0)) return [];

  // Ceiling, not floor: a step of 100 has a label at 300, which flooring the
  // 3.6 would drop.
  const count = Math.ceil(360 / step);

  return Array.from({ length: count }, (_unused, index) => {
    const bearing = step * index;
    const point = bearingPoint(radius, bearing);
    return {
      bearing,
      // The modulo is for the rounding, not the bearing: 359.6 would
      // otherwise print as a fourth digit.
      text: String(Math.round(bearing) % 360).padStart(3, '0'),
      x: point.x,
      y: point.y,
    };
  });
};
