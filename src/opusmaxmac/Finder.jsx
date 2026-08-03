import { useRef } from 'react';

/**
 * One field, narrowing both the register and the log at once — "Nord" is a
 * reasonable thing to type whether you want the patches or the tracks made
 * with them.
 *
 * It has no box. The brackets are the field: an ephemeris brackets a figure it
 * is qualifying, and here they mark where the typing goes. The underline is
 * the writing line, not a border.
 */
/** "1 banks" is not a count anybody wants read back to them. */
const countOf = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/**
 * What the status line says. The release half is dropped while the log is still
 * being fetched and after a failure — the page cannot honestly report zero
 * releases when it does not yet know how many there are.
 */
const summarise = (bankCount, trackCount) =>
  [countOf(bankCount, 'bank', 'banks'), trackCount === null ? null : countOf(trackCount, 'release', 'releases')]
    .filter(Boolean)
    .join(' · ');

function Finder({ query, onQueryChange, bankCount, trackCount }) {
  const inputRef = useRef(null);

  const handleKeyDown = (event) => {
    if (event.key !== 'Escape' || !query) return;
    event.preventDefault();
    onQueryChange('');
    inputRef.current?.focus();
  };

  return (
    <div className="finder page">
      <label className="gloss finder__label" htmlFor="find-entry">
        Find an instrument or a track
      </label>

      <div className="finder__field">
        <input
          id="find-entry"
          ref={inputRef}
          className="finder__input"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nord, Virus, trance…"
          autoComplete="off"
          spellCheck="false"
        />
      </div>

      <p className="gloss gloss--quiet finder__result" role="status">
        {query ? summarise(bankCount, trackCount) : ''}
      </p>
    </div>
  );
}

export default Finder;
