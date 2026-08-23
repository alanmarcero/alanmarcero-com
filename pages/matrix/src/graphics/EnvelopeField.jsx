import { useMemo, useId } from 'react';
import { buildFieldPath, columnsForAspect } from './envelope';
import { buildLissajous, packetDash } from './lissajous';

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
  beam = false,
  beamSeconds = 4.2,
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

  /*
   * The beam: one bright packet riding one continuous curve.
   *
   * Three measurements put it here rather than on the field itself, and they
   * are in lissajous.js at length. The short version: the main site's glow
   * sits on ONE mark, this field has ~1089, and light composites where ink
   * does not — a 6px blur on a 1.25px stroke would cover ~66% of the hero.
   * And a dash pattern restarts at every subpath (measured: three subpaths
   * gave three dashes, 234/234/234 ink), so a packet riding a 1,148-subpath
   * field renders as 1,148 packets. The carrier has to be a single subpath.
   *
   * So this is ONE extra path with ONE drop-shadow, at any field size.
   */
  const carrier = useMemo(
    () => (beam
      ? buildLissajous({ seed, width: field.width, height: field.height })
      : null),
    [beam, seed, field.width, field.height],
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
      {carrier && (
        <>
          {/*
            The animation rides in the SVG's own <style> rather than in a
            stylesheet, because the stylesheets belong to another slice and
            this way the reduced-motion query travels with the component that
            needs it. SMIL would not honour that query at all.
          */}
          <style>{`
            @keyframes envelope-field-beam { to { stroke-dashoffset: -1; } }
            .envelope-field__beam {
              animation: envelope-field-beam ${beamSeconds}s linear infinite;
            }
            @media (prefers-reduced-motion: reduce) {
              .envelope-field__beam { animation: none; }
            }
          `}</style>
          <path
            className="envelope-field__beam"
            d={carrier.d}
            pathLength={packetDash().pathLength}
            strokeDasharray={packetDash().dashArray}
            fill="none"
            stroke="var(--lcd)"
            strokeWidth={strokeWidth * 1.6}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ filter: 'drop-shadow(0 0 4px var(--lcd))' }}
          />
        </>
      )}
    </svg>
  );
}

export default EnvelopeField;
