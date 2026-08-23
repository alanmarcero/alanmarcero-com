/*
 * The attract band.
 *
 * A wireframe floor running back to a horizon — the vector-graphics
 * vocabulary the machines in this list came from, drawn rather than
 * emulated. Two families of line: verticals converging on a vanishing
 * point, and horizontals whose spacing tightens as they recede.
 *
 * Pure geometry. The spacing rule is the whole trick, so it is worth
 * asserting rather than eyeballing.
 */

/**
 * Verticals fanning out from the vanishing point to the bottom edge.
 *
 * They are spread evenly along the *bottom* edge, not by angle: an even
 * angular fan bunches up at the sides and leaves a hole in the middle,
 * which is the opposite of how a floor looks.
 */
export const convergingLines = ({
  width = 1200,
  height = 260,
  horizon = 96,
  count = 17,
  spread = 2.4,
}) => {
  const vanishX = width / 2;
  const lines = [];
  for (let index = 0; index < count; index += 1) {
    const fraction = count === 1 ? 0.5 : index / (count - 1);
    // `spread` widens the fan past the sheet so the outermost lines leave
    // the frame at the edge rather than converging inside it.
    const x = vanishX + (fraction - 0.5) * width * spread;
    lines.push({ x1: vanishX, y1: horizon, x2: x, y2: height });
  }
  return lines;
};

/**
 * Horizontals, spaced so each gap is a fixed fraction of the one below —
 * a geometric series, which is what perspective actually does to evenly
 * spaced rows.
 */
export const recedingRows = ({
  height = 260,
  horizon = 96,
  count = 9,
  ratio = 0.74,
}) => {
  const depth = height - horizon;
  // Sum of the series, so the rows fill exactly the space available
  // however many of them there are.
  let total = 0;
  for (let index = 0; index < count; index += 1) total += ratio ** index;

  const rows = [];
  let y = height;
  for (let index = 0; index < count; index += 1) {
    rows.push(y);
    y -= (depth / total) * ratio ** index;
  }
  return rows;
};
