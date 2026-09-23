/** An open SVG path `d` through the points, to two places. */
export const polylinePath = (points) => points
  .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`)
  .join(' ');
