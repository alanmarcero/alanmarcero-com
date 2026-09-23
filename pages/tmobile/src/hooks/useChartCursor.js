import { useCallback, useRef, useState } from 'react';
import { arrowStep, stepIndex, viewBoxX } from '../chartGeometry';

/**
 * The crosshair every chart on the page shares: a pointer or the arrow keys
 * move it, and leaving or blurring the chart clears it. It holds an index
 * rather than a copy of the point, so a tooltip always reads the data that is
 * plotted now. `indexAtViewX` maps a viewBox x to a data index (null or NaN for none), and
 * `stride` is how many points one arrow press moves.
 */
export default function useChartCursor({
  count, viewWidth, indexAtViewX, stride = 1,
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
    moveTo(indexAtViewX(viewBoxX(event.clientX, rect, viewWidth)));
  }, [indexAtViewX, moveTo, viewWidth]);

  const onKeyDown = useCallback((event) => {
    const step = arrowStep(event.key);
    if (!step) return;
    event.preventDefault();
    moveTo(stepIndex(index ?? count - 1, step * stride, count));
  }, [count, index, moveTo, stride]);

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
