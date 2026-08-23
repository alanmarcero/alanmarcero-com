/*
 * Filter response plots.
 *
 * A resonant low-pass, plotted the way a datasheet plots one: magnitude in
 * dB against a logarithmic frequency axis, with decade ticks. The section
 * rules on this page are these curves rather than straight lines — a rule
 * that carries information is worth the pixels a rule spends anyway.
 *
 * The magnitude is the textbook two-pole response
 *
 *     |H| = 1 / sqrt( (1 - r^2)^2 + (r / Q)^2 ),   r = f / fc
 *
 * which gives the resonant lift just under cutoff and the 12 dB/octave
 * slope above it. It is not a model of any specific instrument's filter and
 * is not trying to be — it is the shape everyone who has turned a cutoff
 * knob recognises.
 */

/** Magnitude in dB at `frequency` for a 2-pole low-pass. */
export const magnitudeDb = (frequency, cutoff, q) => {
  const ratio = frequency / cutoff;
  const real = 1 - ratio * ratio;
  const imaginary = ratio / q;
  const magnitude = 1 / Math.sqrt(real * real + imaginary * imaginary);
  return 20 * Math.log10(magnitude);
};

/**
 * The curve, sampled across `width` on a log-frequency axis and mapped into
 * `height` with `dbRange` (top = +dbRange/2, bottom = -dbRange/2)... except
 * the top is `dbCeiling`, because a resonant peak can run to +20 dB and
 * clipping it against the plate edge looks like a rendering fault.
 */
export const responsePoints = ({
  width = 600,
  height = 48,
  samples = 160,
  minHz = 20,
  maxHz = 20000,
  cutoff = 1200,
  q = 3.2,
  dbCeiling = 16,
  dbFloor = -34,
}) => {
  const logMin = Math.log10(minHz);
  const logMax = Math.log10(maxHz);
  const span = dbCeiling - dbFloor;

  const points = [];
  for (let index = 0; index <= samples; index += 1) {
    const fraction = index / samples;
    const frequency = 10 ** (logMin + fraction * (logMax - logMin));
    const db = Math.max(dbFloor, Math.min(dbCeiling, magnitudeDb(frequency, cutoff, q)));
    points.push({
      x: fraction * width,
      y: height - ((db - dbFloor) / span) * height,
      frequency,
      db,
    });
  }
  return points;
};

/** Where a frequency sits along the axis, in user units. */
export const frequencyToX = (frequency, { width = 600, minHz = 20, maxHz = 20000 } = {}) => {
  const logMin = Math.log10(minHz);
  const logMax = Math.log10(maxHz);
  return ((Math.log10(frequency) - logMin) / (logMax - logMin)) * width;
};

/**
 * Decade ticks — 100 Hz, 1 kHz, 10 kHz — with the label already formatted.
 * Only ticks inside the axis are returned, so narrowing the range drops the
 * labels that would otherwise pile up on the edge.
 */
export const decadeTicks = ({ width = 600, minHz = 20, maxHz = 20000 } = {}) => {
  const ticks = [];
  for (let decade = 1; decade <= 5; decade += 1) {
    const frequency = 10 ** decade;
    if (frequency < minHz || frequency > maxHz) continue;
    ticks.push({
      frequency,
      x: frequencyToX(frequency, { width, minHz, maxHz }),
      label: frequency >= 1000 ? `${frequency / 1000}k` : `${frequency}`,
    });
  }
  return ticks;
};

/** An SVG path `d` through the points. */
export const curvePath = (points) => points
  .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`)
  .join(' ');
