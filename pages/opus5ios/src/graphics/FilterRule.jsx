import { useMemo } from 'react';
import { responsePoints, curvePath, decadeTicks, frequencyToX } from './filterCurve';

const WIDTH = 1200;
const HEIGHT = 56;

/**
 * The rule between sections — a low-pass response instead of a straight
 * line.
 *
 * A page divided into sections needs a divider; this one costs the same
 * pixels a hairline would and says something while it is there. Cutoff
 * moves per section so the two rules on the page are not the same drawing
 * twice.
 *
 * Decorative: the heading below it names the section.
 */
function FilterRule({ cutoff = 900, q = 4.5, label }) {
  const { path, ticks, cutoffX } = useMemo(() => ({
    path: curvePath(responsePoints({ width: WIDTH, height: HEIGHT, cutoff, q, samples: 300 })),
    ticks: decadeTicks({ width: WIDTH }),
    cutoffX: frequencyToX(cutoff, { width: WIDTH }),
  }), [cutoff, q]);

  return (
    <div className="rule-figure">
      <svg
        className="rule-figure__plot"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <line className="rule-figure__baseline" x1="0" y1={HEIGHT} x2={WIDTH} y2={HEIGHT} />
        {ticks.map(({ frequency, x }) => (
          <line
            key={frequency}
            className="rule-figure__tick"
            x1={x}
            y1={HEIGHT - 7}
            x2={x}
            y2={HEIGHT}
          />
        ))}
        <line
          className="rule-figure__cutoff"
          x1={cutoffX}
          y1="0"
          x2={cutoffX}
          y2={HEIGHT}
        />
        <path className="rule-figure__curve" d={path} />
      </svg>
      {/*
        preserveAspectRatio="none" stretches the plot to whatever width the
        page is, which would stretch text with it — so the labels are HTML
        positioned in percentages over the top, not <text> inside the SVG.
      */}
      <div className="rule-figure__labels" aria-hidden="true">
        {ticks.map(({ frequency, x, label: tick }) => (
          <span
            key={frequency}
            className="rule-figure__label"
            style={{ left: `${(x / WIDTH) * 100}%` }}
          >
            {tick}
          </span>
        ))}
      </div>
      {label && <p className="rule-figure__caption">{label}</p>}
    </div>
  );
}

export default FilterRule;
