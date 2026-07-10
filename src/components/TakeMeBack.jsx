import { useState, useRef, useEffect } from 'react';
import { PAST_ERAS } from '../eras/eras';

/**
 * The hero "Take Me Back" control: a button that reveals a year picker. Choosing
 * a year hands the era id up to the app, which re-skins the whole site in that
 * era's theme. Sits next to the Arcade link.
 */
function TakeMeBack({ onSelect }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (id) => {
    onSelect(id);
    setOpen(false);
  };

  return (
    <div className="take-me-back" ref={wrapRef}>
      <button
        type="button"
        className="btn btn--ghost take-me-back__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        Take Me Back
      </button>
      {open && (
        <div className="take-me-back__menu" role="menu" aria-label="Pick a year to travel to">
          <p className="take-me-back__hint">Pick a year <span aria-hidden="true">⏳</span></p>
          {PAST_ERAS.map((era) => (
            <button
              key={era.id}
              type="button"
              role="menuitem"
              className="take-me-back__year"
              onClick={() => pick(era.id)}
            >
              <span className="take-me-back__year-num">{era.year}</span>
              <span className="take-me-back__year-label">{era.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default TakeMeBack;
