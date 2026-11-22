import { useCallback, useRef, useState } from 'react';
import { arrowStep, stepIndex, viewBoxX } from '../chartGeometry';

function nearestSnap(target, snapIndices) {
  let best = snapIndices[0];
  let bestDist = Math.abs(best - target);
  for (let i = 1; i < snapIndices.length; i += 1) {
    const dist = Math.abs(snapIndices[i] - target);
    if (dist < bestDist) {
      best = snapIndices[i];
      bestDist = dist;
    }
  }
  return best;
}

/**
 * The crosshair every chart on the page shares: a pointer or the arrow keys
 * move it, and leaving or blurring the chart clears it. It holds an index
 * rather than a copy of the point, so a tooltip always reads the data that is
 * plotted now. `indexAtViewX` maps a viewBox x to a data index (null or NaN for none), and
 * `stride` is how many points one arrow press moves.
 */
export default function useChartCursor({
  count, viewWidth, indexAtViewX, stride = 1, snapIndices = null,
}) {
  const svgRef = useRef(null);
  const [index, setIndex] = useState(null);

  const moveTo = useCallback((next) => {
    if (!Number.isInteger(next) || next < 0 || next >= count) return;
    setIndex(next);
  }, [count]);

  const onPointer = useCallback((event) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect?.width) return;
    const raw = indexAtViewX(viewBoxX(event.clientX, rect, viewWidth));
    if (!Number.isInteger(raw) || raw < 0 || raw >= count) return;
    moveTo(snapIndices?.length ? nearestSnap(raw, snapIndices) : raw);
  }, [count, indexAtViewX, moveTo, snapIndices, viewWidth]);

  const onKeyDown = useCallback((event) => {
    const step = arrowStep(event.key);
    if (!step) return;
    event.preventDefault();
    if (snapIndices?.length) {
      const pos = index === null ? -1 : snapIndices.indexOf(index);
      const from = pos === -1 ? snapIndices.length - 1 : pos;
      moveTo(snapIndices[stepIndex(from, step, snapIndices.length)]);
      return;
    }
    moveTo(stepIndex(index ?? count - 1, step * stride, count));
  }, [count, index, moveTo, snapIndices, stride]);

  const clear = useCallback(() => setIndex(null), []);

  return {
    svgRef,
    // a selection that narrows the series can leave the cursor past its end
    index: index !== null && index < count ? index : null,
    handlers: {
      onPointerMove: onPointer,
      onPointerDown: onPointer,
      onPointerLeave: clear,
      onBlur: clear,
      onKeyDown,
    },
  };
}
