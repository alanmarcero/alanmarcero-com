import { useEffect, useRef } from 'react';
import { isTypingTarget, resultSummary } from './lib/catalog';

/** Focuses the search on "/" — the primary site's keyboard path into its catalogue. */
function useSlashShortcut(inputRef) {
  useEffect(() => {
    const handleShortcut = (event) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(document.activeElement)) return;
      event.preventDefault();
      inputRef.current?.focus();
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [inputRef]);
}

function Finder({ query, onQueryChange, bankCount, releaseCount }) {
  const inputRef = useRef(null);
  useSlashShortcut(inputRef);

  const clearQuery = () => {
    onQueryChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Escape' || !query) return;
    event.preventDefault();
    clearQuery();
  };

  return (
    <div className="codex-finder codex-shell">
      <div className="codex-finder__label-row">
        <label className="codex-label" htmlFor="codex-find">
          Find an instrument or a track
        </label>
        {query ? (
          <button
            type="button"
            className="codex-finder__clear"
            aria-label="Clear search"
            onClick={clearQuery}
          >
            Clear <span aria-hidden="true">&times;</span>
          </button>
        ) : (
          <kbd className="codex-finder__shortcut" aria-hidden="true">/</kbd>
        )}
      </div>
      <div className="codex-finder__field">
        <svg
          className="codex-finder__icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m15.5 15.5 5 5" />
        </svg>
        <input
          id="codex-find"
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck="false"
        />
      </div>
      <p className="codex-label codex-finder__result" role="status">
        {query ? resultSummary(bankCount, releaseCount) : ''}
      </p>
    </div>
  );
}

export default Finder;
