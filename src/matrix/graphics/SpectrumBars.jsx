import { useMemo } from 'react';
import { buildSpectrum } from './spectrum';

const BOX_WIDTH = 320;
const BOX_HEIGHT = 64;

/**
 * The music section's figure. Bars rise from a baseline, so it reads as
 * level rather than as the catalogue's envelope contours.
 */
function SpectrumBars({ seed, bars = 56, className = '' }) {
  const shapes = useMemo(
    () => buildSpectrum({ seed, bars, width: BOX_WIDTH, height: BOX_HEIGHT }),
    [seed, bars],
  );

  return (
    <svg
      className={`spectrum ${className}`.trim()}
      viewBox={`0 0 ${BOX_WIDTH} ${BOX_HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {shapes.map((bar) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={BOX_HEIGHT - bar.height}
          width={bar.width}
          height={bar.height}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

export default SpectrumBars;
