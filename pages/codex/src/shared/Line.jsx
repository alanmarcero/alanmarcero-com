/**
 * A register line — the page's one structural device.
 *
 * A label on the left, a figure on the right, and a run of dots holding the
 * two ends of the row together. Every ephemeris, timetable and star index
 * ever printed does this, and it is what this page uses instead of the cards
 * and the hairline rules the other designs here reach for.
 *
 * Rendering an `a` or a `button` makes the whole line an action, so a thing
 * you can do looks like a thing you can read. The value column is not
 * decoration: it carries the figure that belongs to the row, and callers are
 * expected to pass something true.
 */
function Line({ as: Tag = 'span', value, children, className = '', ...rest }) {
  const interactive = Tag === 'a' || Tag === 'button';
  const classes = ['line', interactive && 'act', className].filter(Boolean).join(' ');
  // A bare <button> inside a form-less page still defaults to type="submit",
  // which is not what any of these are.
  const type = Tag === 'button' ? rest.type ?? 'button' : rest.type;

  return (
    <Tag className={classes} {...rest} type={type}>
      <span className="line__label">{children}</span>
      <span className="line__leader" aria-hidden="true" />
      <span className="line__value">{value}</span>
    </Tag>
  );
}

export default Line;
