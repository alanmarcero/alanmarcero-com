/*
 * The azimuth dial — twelve machines set out the way an observer sets out the
 * sky, by bearing.
 *
 * A dial is the right instrument for this list because the twelve entries have
 * no order worth walking: nobody plays the arcade from I to XII. Twelve
 * bearings around a limb say "these are the twelve" without implying a
 * sequence, which is the same reason a compass rose is a ring and a timetable
 * is a column.
 *
 * Bearings, not the mathematician's angles: 0 degrees is twelve o'clock and
 * degrees increase clockwise, because that is what a bearing means everywhere
 * it is printed, and the reader is looking at a dial. The rest of the route's
 * conventions hold — a `-50 -50 100 100` box with the origin at the centre.
 *
 * Pure. Same machines in, same dial out — no PRNG, no clock.
 */

/** The wedge ring: where a sector starts, ends, and how far off its neighbour. */
export const SECTOR_INNER = 26;
export const SECTOR_OUTER = 44;
export const SECTOR_PAD_DEGREES = 1.1;

/** The graduated limb, drawn just outside the wedges. */
export const LIMB_INNER = 44;
export const LIMB_OUTER = 47;

/**
 * Five graduations to a sector, so the limb reads as a scale rather than as
 * twelve lonely marks, and every sector boundary still lands on a major.
 */
export const TICKS_PER_SECTOR = 5;

/**
 * The widest reading that fits across the dial's inner field at the type size
 * `.dial__reading` is set in. Past it the name takes two lines.
 */
export const MAX_READING_CHARS = 12;

export const ROMAN = [
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII',
];

/** A sector's numeral, falling back to the arabic figure past XII. */
export const numeralFor = (index) => ROMAN[index] ?? String(index + 1);

/**
 * A point on the dial at a given bearing. Subtracting the quarter turn is what
 * moves zero from three o'clock, where the trigonometry puts it, to twelve
 * o'clock, where a bearing belongs; clockwise then comes free, since the y
 * axis already points down.
 */
export const bearingPoint = (radius, bearingDegrees) => {
  const radians = ((bearingDegrees - 90) * Math.PI) / 180;
  return { x: Math.cos(radians) * radius, y: Math.sin(radians) * radius };
};

/** Path data carries no information past a thousandth of a unit. */
const trim = (value) => Number(value.toFixed(3));

/**
 * Fold a bearing into the half turn a numeral can be read in, so a sector low
 * on the dial gets its numeral standing on the radius rather than hanging
 * upside down from it.
 */
const uprightAngle = (bearing) => ((((bearing + 90) % 180) + 180) % 180) - 90;

/**
 * The annulus wedge: out along the outer arc, in across the end, back along
 * the inner arc, closed. Two arcs and two radial edges is the whole shape, and
 * writing it as one path rather than a stroked arc means a fill and a stroke
 * describe the same sector.
 */
const wedgePath = (innerRadius, outerRadius, start, end) => {
  // Only a single-sector dial ever sweeps more than a half turn, but the flag
  // has to be right when it does or the wedge inverts.
  const large = end - start > 180 ? 1 : 0;
  const outerStart = bearingPoint(outerRadius, start);
  const outerEnd = bearingPoint(outerRadius, end);
  const innerEnd = bearingPoint(innerRadius, end);
  const innerStart = bearingPoint(innerRadius, start);

  return [
    `M ${trim(outerStart.x)} ${trim(outerStart.y)}`,
    `A ${trim(outerRadius)} ${trim(outerRadius)} 0 ${large} 1 ${trim(outerEnd.x)} ${trim(outerEnd.y)}`,
    `L ${trim(innerEnd.x)} ${trim(innerEnd.y)}`,
    `A ${trim(innerRadius)} ${trim(innerRadius)} 0 ${large} 0 ${trim(innerStart.x)} ${trim(innerStart.y)}`,
    'Z',
  ].join(' ');
};

/**
 * One wedge per machine, in bearing order from twelve o'clock.
 *
 * The pad is taken off both ends of every sector rather than added between
 * them, so the sectors keep their true midpoints — the numeral and the wedge
 * agree about where the sector is — and the gap between neighbours is the same
 * everywhere, including across zero.
 */
export const sectors = (count, { inner = SECTOR_INNER, outer = SECTOR_OUTER, padDegrees = SECTOR_PAD_DEGREES } = {}) => {
  if (!Number.isFinite(count) || count < 1) return [];

  const span = 360 / count;

  return Array.from({ length: count }, (_unused, index) => {
    const from = span * index;
    const start = from + padDegrees;
    const end = from + span - padDegrees;
    const mid = from + span / 2;

    return {
      index,
      start,
      end,
      mid,
      path: wedgePath(inner, outer, start, end),
      labelPoint: bearingPoint((inner + outer) / 2, mid),
      textAngle: uprightAngle(mid),
    };
  });
};

/**
 * The graduations. Majors run the full depth of the limb and fall on the
 * sector boundaries; minors run half of it, which is what makes a scale read
 * as a scale instead of as a fence.
 */
export const dialTicks = (count, { inner = LIMB_INNER, outer = LIMB_OUTER } = {}) => {
  if (!Number.isFinite(count) || count < 1) return [];

  const total = count * TICKS_PER_SECTOR;
  const minorInner = (inner + outer) / 2;

  return Array.from({ length: total }, (_unused, index) => {
    const bearing = (360 / total) * index;
    const major = index % TICKS_PER_SECTOR === 0;

    return {
      index,
      bearing,
      major,
      inner: bearingPoint(major ? inner : minorInner, bearing),
      outer: bearingPoint(outer, bearing),
    };
  });
};

/**
 * The reading in the middle of the dial, broken onto at most two lines.
 *
 * "Bird Name Generator" does not fit across the inner field at any size worth
 * setting a reading in, and a name that has to be read at a glance cannot be
 * shrunk to fit. The break is balanced rather than greedy — two lines of nine
 * characters sit in a circle far better than one of four and one of fourteen,
 * and a circle is what this is centred in.
 */
export const readingLines = (name, maxChars = MAX_READING_CHARS) => {
  const words = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];

  const whole = words.join(' ');
  if (words.length === 1 || whole.length <= maxChars) return [whole];

  let at = 1;
  let narrowest = Infinity;
  for (let split = 1; split < words.length; split += 1) {
    const head = words.slice(0, split).join(' ').length;
    const tail = words.slice(split).join(' ').length;
    const difference = Math.abs(head - tail);
    if (difference < narrowest) {
      narrowest = difference;
      at = split;
    }
  }

  return [words.slice(0, at).join(' '), words.slice(at).join(' ')];
};
