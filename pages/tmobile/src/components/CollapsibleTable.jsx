import { useState } from 'react';

/**
 * A chart's accessible twin, folded away behind a toggle until asked for.
 * `children` are the table's head and body.
 */
function CollapsibleTable({
  showLabel, hideLabel, caption, children,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="tm-table-wrap">
      <button
        type="button"
        className="tm-table-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? hideLabel : showLabel}
      </button>

      {open && (
        <div className="tm-table-scroll">
          <table className="tm-table">
            <caption className="tm-table__caption">{caption}</caption>
            {children}
          </table>
        </div>
      )}
    </div>
  );
}

export default CollapsibleTable;
