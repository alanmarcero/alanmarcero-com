import { Fragment } from 'react';
import { glyphFor, keyLayout } from './keycaps';

/*
 * The keys a machine answers to.
 *
 * A cross of four arrow positions with the extras stacked beside it. Used caps
 * carry their glyph in the rose; unused ones are drawn anyway, empty and in the
 * haze, because the shape of what is missing is half of what this figure says.
 *
 * The box is fixed at `-19 -19 62 38` whatever the machine uses, so twelve of
 * these down a column are twelve drawings of the same keyboard at the same
 * scale. Sizing the box to its contents would shrink Pong's two caps to the
 * width of Life Pulse's six and throw away the comparison the figure exists to
 * make. Room is reserved for three extras; the arcade's busiest machine uses
 * two.
 *
 * Caps are outlines. Nothing on this route gets a filled panel or a corner
 * radius, a drawn keycap included.
 */

/** The cap, and the pitch it repeats on, in the box's own units. */
const CAP = 11;
const GAP = 1.5;
const PITCH = CAP + GAP;

/** The extras column: wider caps, since a cap reading SPACE is a wide cap. */
const EXTRA_WIDTH = 20;
const EXTRA_GAP = 4;
const EXTRA_X = PITCH + CAP / 2 + EXTRA_GAP;

const ARROW_TYPE = 6.4;
const EXTRA_TYPE = 4.6;

/** Clockwise from the top, which is how the four sit under a hand. */
const CROSS = [
  { position: 'up', key: 'ArrowUp', cx: 0, cy: -PITCH },
  { position: 'right', key: 'ArrowRight', cx: PITCH, cy: 0 },
  { position: 'down', key: 'ArrowDown', cx: 0, cy: PITCH },
  { position: 'left', key: 'ArrowLeft', cx: -PITCH, cy: 0 },
];

function KeyCluster({ keyboard, className = '' }) {
  const { arrows, extras } = keyLayout(keyboard);

  return (
    <svg
      className={`fig keys ${className}`.trim()}
      viewBox="-19 -19 62 38"
      aria-hidden="true"
      focusable="false"
    >
      <g className="keys__cross">
        {CROSS.map(({ position, key, cx, cy }) => {
          const used = arrows[position];

          return (
            <Fragment key={position}>
              <rect
                className={`keys__cap keys__cap--arrow${used ? '' : ' is-unused'}`}
                data-lit={used ? '' : undefined}
                x={cx - CAP / 2}
                y={cy - CAP / 2}
                width={CAP}
                height={CAP}
                fill="none"
                stroke={used ? 'var(--rose)' : 'var(--haze)'}
                vectorEffect="non-scaling-stroke"
              />
              {used && (
                <text
                  className="keys__glyph"
                  data-lit=""
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={ARROW_TYPE}
                  fill="var(--rose)"
                >
                  {glyphFor(key)}
                </text>
              )}
            </Fragment>
          );
        })}
      </g>

      {/* The stack is centred on the cross, so one extra sits level with it. */}
      <g className="keys__extras">
        {extras.map((extra, index) => {
          const cy = (index - (extras.length - 1) / 2) * PITCH;

          return (
            <Fragment key={extra.glyph}>
              <rect
                className="keys__cap keys__cap--extra"
                data-lit=""
                x={EXTRA_X}
                y={cy - CAP / 2}
                width={EXTRA_WIDTH}
                height={CAP}
                fill="none"
                stroke="var(--rose)"
                vectorEffect="non-scaling-stroke"
              />
              <text
                className="keys__glyph keys__glyph--word"
                data-lit=""
                x={EXTRA_X + EXTRA_WIDTH / 2}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={EXTRA_TYPE}
                fill="var(--rose)"
              >
                {extra.glyph}
              </text>
            </Fragment>
          );
        })}
      </g>
    </svg>
  );
}

export default KeyCluster;
