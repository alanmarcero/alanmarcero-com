import { useEffect, useRef } from 'react';

const isTypingTarget = (el) =>
  el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

export default function CatalogSearch({
  value,
  onChange,
  label,
  placeholder,
  results,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(document.activeElement)) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleKeyDown = (event) => {
    if (event.key !== 'Escape' || !value) return;
    event.preventDefault();
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className="catalog-search">
      <div className="hero-search">
        <input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        {value ? (
          <button
            className="search-clear"
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
          >
            &times;
          </button>
        ) : (
          <kbd className="search-hint" aria-hidden="true">/</kbd>
        )}
      </div>
      {results ? (
        <p className="hero-results-count" role="status" aria-live="polite">{results}</p>
      ) : null}
    </div>
  );
}
