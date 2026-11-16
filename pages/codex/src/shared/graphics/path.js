/*
 * SVG path primitives shared by every generator in this directory.
 * Pure. No React, no DOM.
 */

/** Two decimal places: enough precision for a glyph, short enough to keep `d` small. */
export const roundToHundredths = (value) => Math.round(value * 100) / 100;

/** A point list as ONE subpath: a single moveto followed by linetos. */
export const polylinePath = ([first, ...rest]) =>
  `M${first[0]} ${first[1]}${rest.map(([x, y]) => `L${x} ${y}`).join('')}`;
