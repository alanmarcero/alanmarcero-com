import { useMemo } from 'react';
import { convergingLines, recedingRows } from './attractGrid';

const WIDTH = 1200;
const HEIGHT = 240;
const HORIZON = 84;

/**
 * The band under the arcade masthead: a wireframe floor going back to a
 * horizon.
 *
 * Drawn, not photographed and not emulated — which is also the claim the
 * page makes about the games themselves. The rows crawl toward the viewer
 * on a slow loop; `prefers-reduced-motion` stops them with everything else.
 */
function AttractBand() {
  const { lines, rows } = useMemo(() => ({
    lines: convergingLines({ width: WIDTH, height: HEIGHT, horizon: HORIZON, count: 19 }),
    rows: recedingRows({ height: HEIGHT, horizon: HORIZON, count: 10 }),
  }), []);

  return (
    <svg
      className="attract"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <line className="attract__horizon" x1="0" y1={HORIZON} x2={WIDTH} y2={HORIZON} />
      <g className="attract__floor">
        {lines.map((line) => (
          <line
            key={line.x2}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
          />
        ))}
        {rows.map((y, index) => (
          <line
            key={y}
            className="attract__row"
            style={{ '--row-index': index }}
            x1="0"
            y1={y}
            x2={WIDTH}
            y2={y}
          />
        ))}
      </g>
      {/* A sun on the horizon, ruled through — the one shape every vector
          arcade backdrop ever drew. */}
      <circle className="attract__sun" cx={WIDTH / 2} cy={HORIZON} r="34" />
    </svg>
  );
}

export default AttractBand;
