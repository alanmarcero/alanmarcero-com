/*
 * Lissajous carriers.
 *
 * WHY THIS EXISTS, and it is three measurements rather than a preference.
 *
 * The main site's signature mark is a glowing Lissajous halo with a bright
 * packet riding it. Porting that to this page looked like "add a glow to the
 * envelope field". Three measurements say otherwise:
 *
 *   1. GLOW DOES NOT SCALE WITH MARK COUNT. Their glow sits on ONE curve in
 *      300x300px, and their own comment notes the spin "forces the
 *      drop-shadow to re-rasterize each frame" — one mark already needed a
 *      performance guard. The hero field is 889,200px² carrying ~1089 glyphs
 *      at 6.22% ink; a 6px blur on a 1.25px stroke expands each mark's
 *      footprint 10.6x, so the glow would cover ~66% of the hero from 1089
 *      additive sources. Light composites; ink does not.
 *
 *   2. THE SIGNATURE IS THE BEAM, NOT THE TRACE. Their actual move is
 *      `stroke-dasharray: 0.05 0.95` with a drop-shadow — a single bright
 *      packet on a long path. One glow source at any field size.
 *
 *   3. A DASH PATTERN RESTARTS AT EVERY SUBPATH. Verified by rasterising a
 *      three-subpath path with `stroke-dasharray="10 5000"`: ink came out
 *      234/234/234 across the three, i.e. three dashes, not one. The envelope
 *      field is ONE path of 1,148 subpaths, so a packet riding it renders as
 *      1,148 simultaneous packets.
 *
 * So the beam needs its own carrier: a single continuous subpath. That is a
 * Lissajous — the main site's own mark — generated here deterministically
 * from a seed, like everything else in this directory.
 *
 * Pure. No React, no DOM, no randomness beyond the seed.
 */

import { hashString, seededRandom } from './envelope';

const round = (value) => Math.round(value * 100) / 100;

/*
 * Frequency pairs that close. A Lissajous closes only when its two
 * frequencies are commensurate; coprime integers guarantee a single closed
 * loop rather than a curve that never rejoins its start. An unclosed carrier
 * shows a seam where the packet jumps, which is the one artefact a travelling
 * highlight cannot hide.
 */
const RATIOS = [[3, 2], [5, 4], [5, 3], [7, 4], [7, 5], [4, 3]];

/**
 * A single-subpath Lissajous curve.
 *
 * @param {object} options
 * @param {string} options.seed        same seed → same curve
 * @param {number} options.width
 * @param {number} options.height
 * @param {number} [options.samples]   polyline resolution
 * @param {number} [options.inset]     margin so the stroke is not clipped
 * @returns {{ d: string, ratio: [number, number], phase: number, closed: boolean }}
 */
export function buildLissajous({ seed, width, height, samples = 240, inset = 6 }) {
  const random = seededRandom(hashString(`lissajous:${seed}`));
  const [a, b] = RATIOS[Math.floor(random() * RATIOS.length)];
  const phase = random() * Math.PI * 2;

  const cx = width / 2;
  const cy = height / 2;
  const rx = Math.max(1, cx - inset);
  const ry = Math.max(1, cy - inset);

  const points = [];
  for (let i = 0; i <= samples; i += 1) {
    const t = (i / samples) * Math.PI * 2;
    points.push([
      round(cx + rx * Math.sin(a * t + phase)),
      round(cy + ry * Math.sin(b * t)),
    ]);
  }

  const [first, ...rest] = points;
  return {
    // ONE moveto. That is the whole point — see reason 3 above.
    d: `M${first[0]} ${first[1]}${rest.map(([x, y]) => `L${x} ${y}`).join('')}`,
    ratio: [a, b],
    phase,
    closed: first[0] === points[points.length - 1][0]
      && first[1] === points[points.length - 1][1],
  };
}

/**
 * Dash geometry for a packet riding a curve of `length` user units.
 *
 * Expressed as a fraction of the path so it is resolution-independent, the
 * way the main site does it (`0.05 0.95` against `pathLength="1"`).
 *
 * @param {number} [fraction] how much of the curve the packet occupies
 * @returns {{ dashArray: string, pathLength: number }}
 */
export function packetDash(fraction = 0.05) {
  const clamped = Math.min(0.5, Math.max(0.005, fraction));

  // Round the packet, then DERIVE the gap from the rounded value. Rounding
  // both independently broke the sum: round(0.995) is 1, so a 0.005 packet
  // emitted "0.01 1" — a dash pattern 1% longer than the path, drifting the
  // packet a little every lap. Caught by the sums-to-the-whole-path test.
  const on = round(clamped);

  return {
    dashArray: `${on} ${round(1 - on)}`,
    pathLength: 1,
  };
}
