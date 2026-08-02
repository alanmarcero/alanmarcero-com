import { useMemo, useId } from 'react';
import { buildFieldPath, columnsForAspect } from './envelope';

/**
 * A field of ADSR envelope glyphs rendered as a single <path>.
 *
 * Decorative by default — it is texture derived from content, not content.
 * Pass a `title` only where the field is genuinely the thing being
 * described, and it becomes an accessible image instead.
 *
 * `draw` runs the one orchestrated motion on the page: a left-to-right
 * wipe that reveals the field on load. Reduced motion renders it complete.
 */
function EnvelopeField({
  seed,
  count,
  columns,
  aspect = null,
  cellWidth = 8,
  cellHeight = 6,
  gap = 2,
  strokeWidth = 1,
  className = '',
  draw = false,
  title = null,
}) {
  const resolvedColumns = useMemo(
    () => (aspect
      ? columnsForAspect({ count, aspect, cellWidth, cellHeight, gap })
      : columns),
    [aspect, count, columns, cellWidth, cellHeight, gap],
  );

  const field = useMemo(
    () => buildFieldPath({
      seed, count, columns: resolvedColumns, cellWidth, cellHeight, gap,
    }),
    [seed, count, resolvedColumns, cellWidth, cellHeight, gap],
  );

  const clipId = useId();
  const labelId = `${clipId}-label`;

  return (
    <svg
      className={`envelope-field ${draw ? 'envelope-field--draw' : ''} ${className}`.trim()}
      viewBox={`0 0 ${field.width} ${field.height}`}
      preserveAspectRatio="xMidYMid slice"
      role={title ? 'img' : 'presentation'}
      aria-labelledby={title ? labelId : undefined}
      aria-hidden={title ? undefined : 'true'}
      focusable="false"
    >
      {title && <title id={labelId}>{title}</title>}
      <defs>
        <clipPath id={clipId}>
          <rect
            className="envelope-field__wipe"
            x="0"
            y="0"
            width={field.width}
            height={field.height}
          />
        </clipPath>
      </defs>
      <path
        d={field.d}
        clipPath={draw ? `url(#${clipId})` : undefined}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default EnvelopeField;
