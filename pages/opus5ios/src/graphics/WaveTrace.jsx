import { useMemo } from 'react';
import { wavePoints, linePath, silhouettePath } from './waveTrace';

const WIDTH = 320;
const HEIGHT = 64;

/**
 * A scope trace on graph paper — the figure printed beside each instrument.
 *
 * Two modes, because the two things being plotted are not the same thing:
 * `trace` is a single stroke over one cycle, which is what an oscillator
 * looks like on a scope; `silhouette` is the mirrored block a finished
 * track looks like in an editor. Same geometry, two readings of it.
 *
 * Decorative. The bank's name, patch count and description are all real
 * text next to it, so an accessible name here would only repeat them.
 */
function WaveTrace({
  seed,
  variant = 'trace',
  cycles = 2,
  className = '',
}) {
  const { stroke, fill } = useMemo(() => {
    const points = wavePoints({
      seed,
      width: WIDTH,
      height: HEIGHT,
      samples: 220,
      cycles,
    });
    return {
      stroke: linePath(points),
      fill: variant === 'silhouette' ? silhouettePath(points, HEIGHT) : null,
    };
  }, [seed, variant, cycles]);

  return (
    <svg
      className={`trace trace--${variant} ${className}`}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <line
        className="trace__axis"
        x1="0"
        y1={HEIGHT / 2}
        x2={WIDTH}
        y2={HEIGHT / 2}
      />
      {fill
        ? <path className="trace__fill" d={fill} />
        : <path className="trace__line" d={stroke} />}
    </svg>
  );
}

export default WaveTrace;
