import { useEffect, useRef, useState } from 'react';
import useMediaQuery from '../hooks/useMediaQuery';
import { EXTERNAL_NAV, PRIMARY_NAV, SECONDARY_NAV } from './pages';

const DESKTOP_QUERY = '(min-width: 68rem)';

function YouTubeMark() {
  return (
    <svg className="site-nav__mark" viewBox="0 0 16 12" aria-hidden="true">
      <rect x="0.7" y="0.7" width="14.6" height="10.6" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.4 3.5v5l4.2-2.5-4.2-2.5z" fill="currentColor" />
    </svg>
  );
}

function NavLinks({ items, page }) {
  return items.map((item) => (
    <a
      key={item.id}
      href={item.href}
      aria-current={!item.external && item.id === page ? 'page' : undefined}
      target={item.external ? '_blank' : undefined}
      rel={item.external ? 'noopener noreferrer' : undefined}
    >
      {item.id === 'youtube' && <YouTubeMark />}
      {item.label}
    </a>
  ));
}

export default function SiteHeader({ page }) {
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const menuOpen = open && !desktop;

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };

    document.addEventListener('keydown', onKey);
    const first = menuRef.current?.querySelector('a');
    first?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  return (
    <header className="site-header">
      <div className="site-header__bar">
        <a className="site-wordmark" href="/">
          Alan <span>Marcero</span>
        </a>
        <button
          ref={buttonRef}
          className="site-nav-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="site-nav-toggle__bars" aria-hidden="true" />
          {menuOpen ? 'Close' : 'Menu'}
        </button>
        <nav
          id="site-menu"
          ref={menuRef}
          className={menuOpen ? 'site-nav is-open' : 'site-nav'}
          aria-label="Site"
        >
          <div className="site-nav__group">
            <NavLinks items={[...PRIMARY_NAV, ...EXTERNAL_NAV]} page={page} />
          </div>
          {SECONDARY_NAV.length > 0 && (
            <div className="site-nav__group">
              <NavLinks items={SECONDARY_NAV} page={page} />
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
