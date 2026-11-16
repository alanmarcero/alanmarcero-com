import { useMemo, useState } from 'react';
import { formatDate, formatPrice } from '../drawdown/format';
import { titleOf } from '../instruments';
import useCloses from '../useCloses';
import YearOverlayChart from './YearOverlayChart';
import {
  CURRENT_YEAR,
  OVERLAY_YEARS,
  extractYearRelative,
  formatCorrelation,
  formatSignedPct,
  overlayCorrelation,
} from './yearOverlay';

function YearPicker({ baseYear, onSelectYear, correlations }) {
  return (
    <div className="st-overlay__picker">
      <p className="dd-controls__label">Compare year</p>
      <div className="dd-filters" role="group" aria-label="Select comparison year">
        {OVERLAY_YEARS.map((year) => {
          const active = year === baseYear;
          const r = correlations ? correlations.get(year) : undefined;
          const signClass = r > 0
            ? ' st-overlay__year-corr--pos'
            : r < 0
              ? ' st-overlay__year-corr--neg'
              : '';
          return (
            <button
              key={year}
              type="button"
              className={`dd-filter st-overlay__year-btn${active ? ' dd-filter--on' : ''}`}
              aria-pressed={active}
              onClick={() => onSelectYear(year)}
            >
              {year}
              {r !== undefined && (
                <span className={`st-overlay__year-corr${signClass}`}>
                  {formatCorrelation(r)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function YearOverlayContent({ instrument, baseYear, onSelectYear }) {
  const { status, closes } = useCloses(instrument.load, true);

  const computed = useMemo(() => {
    if (!closes) return null;
    const currentSeries = extractYearRelative(closes, CURRENT_YEAR);
    const seriesByYear = new Map();
    const correlations = new Map();
    for (const year of OVERLAY_YEARS) {
      const series = extractYearRelative(closes, year);
      seriesByYear.set(year, series);
      correlations.set(year, overlayCorrelation(series, currentSeries));
    }
    return { currentSeries, seriesByYear, correlations };
  }, [closes]);

  if (!computed) {
    return (
      <>
        <YearPicker baseYear={baseYear} onSelectYear={onSelectYear} correlations={null} />
        <div className="st-placeholder" aria-hidden={status !== 'error'}>
          {status === 'error' && (
            <p className="dd-panel__note">This series did not load. Reload the page to try again.</p>
          )}
        </div>
      </>
    );
  }

  const { currentSeries, seriesByYear, correlations } = computed;
  const baseSeries = seriesByYear.get(baseYear) || [];
  const correlation = correlations.get(baseYear) ?? null;

  const firstBase = baseSeries[0];
  const lastBase = baseSeries[baseSeries.length - 1];
  const firstCurrent = currentSeries[0];
  const lastCurrent = currentSeries[currentSeries.length - 1];

  return (
    <>
      <YearPicker baseYear={baseYear} onSelectYear={onSelectYear} correlations={correlations} />

      <YearOverlayChart
        baseYear={baseYear}
        currentYear={CURRENT_YEAR}
        baseSeries={baseSeries}
        currentSeries={currentSeries}
        subject={instrument.label}
        correlation={correlation}
      />

      <p className="dd-panel__note">
        {`${titleOf(instrument)} relative return from each year's first close: `}
        {lastBase ? (
          <>
            {`${baseYear} finished ${formatSignedPct(lastBase.pct)} `}
            {`(${formatPrice(firstBase.close)} → ${formatPrice(lastBase.close)})`}
          </>
        ) : (
          <>
            {`no ${baseYear} closes (series starts ${formatDate(instrument.first)})`}
          </>
        )}
        {lastCurrent && (
          <>
            {`; ${CURRENT_YEAR} is ${formatSignedPct(lastCurrent.pct)} through ${formatDate(lastCurrent.date)} `}
            {`(${formatPrice(firstCurrent.close)} → ${formatPrice(lastCurrent.close)})`}
          </>
        )}
        {correlation !== null && ` · Pearson r = ${formatCorrelation(correlation)}`}
        .
      </p>

      <p className="dd-hint">
        Hover or focus the chart and use &larr; &rarr; to step through the calendar year.
      </p>
    </>
  );
}

/**
 * Interactive year-vs-2026 relative-percentage overlay panel with instrument
 * and comparison-year selectors.
 */
function YearOverlayPanel({ instruments, defaultSymbol = 'SPY', defaultYear = 2018 }) {
  const fallback = instruments.find((i) => i.symbol === defaultSymbol) || instruments[0];
  const [symbol, setSymbol] = useState(fallback?.symbol ?? '');
  const [baseYear, setBaseYear] = useState(defaultYear);
  const selected = instruments.find((i) => i.symbol === symbol) || fallback;

  if (!selected) return null;

  return (
    <section className="dd-panel st-overlay" id="overlay-year-compare" aria-labelledby="overlay-year-compare-heading">
      <div className="dd-panel__head">
        <div>
          <h2 className="dd-panel__title" id="overlay-year-compare-heading">
            {`${baseYear} vs ${CURRENT_YEAR}`}
          </h2>
          <p className="dd-panel__kicker">
            Relative % change from each year&rsquo;s first close · aligned by calendar date
          </p>
        </div>

        <div className="st-overlay__legend" aria-label="Series legend">
          <span className="st-overlay__legend-item">
            <span className="dd-tip__key st-overlay__key--current" aria-hidden="true" />
            {CURRENT_YEAR}
          </span>
          <span className="st-overlay__legend-item">
            <span className="dd-tip__key st-overlay__key--base" aria-hidden="true" />
            {baseYear}
          </span>
        </div>
      </div>

      <div className="dd-controls st-overlay__picker">
        <div>
          <p className="dd-controls__label">Instrument</p>
          <div className="dd-filters" role="group" aria-label="Select instrument for year overlay">
            {instruments.map((instrument) => {
              const active = instrument.symbol === selected.symbol;
              return (
                <button
                  key={instrument.symbol}
                  type="button"
                  className={`dd-filter${active ? ' dd-filter--on' : ''}`}
                  aria-pressed={active}
                  onClick={() => setSymbol(instrument.symbol)}
                >
                  {instrument.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <YearOverlayContent
        key={selected.symbol}
        instrument={selected}
        baseYear={baseYear}
        onSelectYear={setBaseYear}
      />
    </section>
  );
}

export default YearOverlayPanel;
