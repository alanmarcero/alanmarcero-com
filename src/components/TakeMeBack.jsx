import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PAST_ERAS } from '../eras/eras';

/**
 * The hero "Take Me Back" control: a button that reveals a year picker. Choosing
 * a year hands the era id up to the app, which re-skins the whole site in that
 * era's theme.
 *
 * The menu is portaled to <body> and fixed-positioned above everything, so it is
 * never clipped by the hero's `overflow: hidden` or hidden behind the CRT
 * scanline overlay. It is anchored under the trigger button.
 */
function TakeMeBack({ onSelect }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const place = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
  };

  const toggle = () => {
    if (!open) place();
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => {
      if (triggerRef.current?.contains(event.target)) return;
      if (menuRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const reflow = () => place();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', reflow, true);
    window.addEventListener('resize', reflow);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', reflow, true);
      window.removeEventListener('resize', reflow);
    };
  }, [open]);

  const pick = (id) => {
    onSelect(id);
    setOpen(false);
  };

  const menu =
    open && pos
      ? createPortal(
          <div
            ref={menuRef}
            className="take-me-back__menu"
            role="menu"
            aria-label="Pick a year to travel to"
            style={{ top: pos.top, left: pos.left }}
          >
            <p className="take-me-back__hint">
              Pick a year <span aria-hidden="true">⏳</span>
            </p>
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
          </div>,
          document.body
        )
      : null;

  return (
    <div className="take-me-back">
      <button
        ref={triggerRef}
        type="button"
        className="btn btn--ghost take-me-back__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
      >
        Take Me Back
      </button>
      {menu}
    </div>
  );
}

export default TakeMeBack;
