import EnvelopeField from './graphics/EnvelopeField';

/**
 * The thesis, stated as an image: every patch this site gives away, drawn
 * as its own ADSR envelope, all at once. The headline sits over it.
 */
function Hero({
  totalPatches,
  instrumentCount,
  searchQuery,
  onSearchChange,
  resultsCount,
}) {
  return (
    <header className="hero">
      <div className="hero__field" aria-hidden="true">
        <EnvelopeField
          seed="alan-marcero-catalog"
          count={totalPatches}
          aspect={1.6}
          cellWidth={8}
          cellHeight={6}
          gap={2}
          draw
        />
      </div>

      <div className="shell hero__body">
        <p className="legend legend--wide hero__eyebrow">
          Synthesizer sound design
        </p>

        <h1 className="hero__title">Alan Marcero</h1>

        <p className="hero__lead prose">
          Patch banks for the hardware you already own — Prophet 08, Virus TI,
          Nord Lead 3, Moog, JP-8000 and more. Every bank is free to download.
        </p>

        <p className="hero__count">
          <span className="readout hero__count-value">
            {totalPatches.toLocaleString()}
          </span>
          <span className="legend hero__count-label">
            patches across {instrumentCount} instruments
          </span>
        </p>

        <div className="hero__search">
          <label className="legend hero__search-label" htmlFor="find-instrument">
            Find your instrument
          </label>
          <input
            id="find-instrument"
            className="hero__search-input"
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Nord Lead, Virus, trance…"
            autoComplete="off"
            spellCheck="false"
          />
          <p className="hero__search-result" role="status">
            {resultsCount
              ? `${resultsCount.patches} banks, ${resultsCount.music} releases`
              : ''}
          </p>
        </div>
      </div>
    </header>
  );
}

export default Hero;
