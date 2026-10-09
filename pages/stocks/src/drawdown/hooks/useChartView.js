import useMediaQuery from '../../../../src/hooks/useMediaQuery';

export const COMPACT_QUERY = '(max-width: 640px)';

/**
 * Which of a chart's two fixed coordinate spaces to draw in. A phone gets the
 * compact one — narrower, with larger type in user units — so the axes stay
 * legible once the SVG is scaled down into a ~330px column.
 */
export default function useChartView(wide, compactView) {
  const compact = useMediaQuery(COMPACT_QUERY);
  return { compact, view: compact ? compactView : wide };
}
