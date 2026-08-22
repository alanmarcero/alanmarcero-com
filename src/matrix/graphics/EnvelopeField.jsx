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
  groups = null,
}) {
  const resolvedColumns = useMemo(
    () => (aspect
      ? columnsForAspect({ count, aspect, cellWidth, cellHeight, gap })
      : columns),
    [aspect, count, columns, cellWidth, cellHeight, gap],
  );

  const field = useMemo(
    () => buildFieldPath({
      seed, count, columns: resolvedColumns, cellWidth, cellHeight, gap, groups,
    }),
    [seed, count, resolvedColumns, cellWidth, cellHeight, gap, groups],
  );

  /*
   * Weight proportional to the size of the instrument each band draws.
   *
   * The field's problem was never scale or contrast — both were measured and
   * both were fine. It was that 1,148 glyphs in one grid correspond to
   * nothing. A 128-patch flagship and a three-patch utility rendered
   * identically, which is the same flatness the catalogue rows have, in the
   * graphic that is supposed to be about the collection.
   *
   * Banding alone would only draw seams. Weighting the bands by patch count
   * makes the biggest instruments the heaviest marks on the field, so the
   * texture starts reporting the shape of the collection instead of its size.
   *
   * Bounded to 0.75x-1.6x of the caller's strokeWidth: below that a band
   * disappears against the ground it was measured for, above it the glyphs
   * start to blot at the cell sizes this field actually renders at.
   */
  const bandWidths = useMemo(() => {
    if (!field.bands || !Array.isArray(groups)) return null;
    const sizes = groups.filter((n) => Number.isInteger(n) && n > 0);
    if (sizes.length === 0) return null;
    const largest = Math.max(...sizes);
    return field.bands.map((_, index) => {
      const size = sizes[index];
      if (!size) return strokeWidth;
      const scaled = 0.75 + (size / largest) * 0.85;
      return Math.round(strokeWidth * scaled * 100) / 100;
    });
  }, [field.bands, groups, strokeWidth]);

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
      {field.bands ? (
        field.bands.map((d, index) => (
          <path
            key={index}
            className="envelope-field__band"
            d={d}
            clipPath={draw ? `url(#${clipId})` : undefined}
            fill="none"
            stroke="currentColor"
            strokeWidth={bandWidths ? bandWidths[index] : strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ))
      ) : (
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
      )}
    </svg>
  );
}

export default EnvelopeField;
