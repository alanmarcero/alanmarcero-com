import { useMemo, useState } from 'react';
import { formatDate, formatPrice } from '../drawdown/format';
import { titleOf } from '../instruments';
import useCloses from '../useCloses';
import YearOverlayChart from './YearOverlayChart';
import { extractYearRelative, formatSignedPct } from './yearOverlay';

function YearOverlayContent({ instrument }) {
  const { status, closes } = useCloses(instrument.load, true);

  const { series2018, series2026 } = useMemo(() => {
    if (!closes) return { series2018: [], series2026: [] };
    return {
      series2018: extractYearRelative(closes, 2018),
      series2026: extractYearRelative(closes, 2026),
    };
  }, [closes]);

  if (!closes) {
    return (
      <div className="st-placeholder" aria-hidden={status !== 'error'}>
        {status === 'error' && (
          <p className="dd-panel__note">This series did not load. Reload the page to try again.</p>
        )}
      </div>
    );
  }

  const first18 = series2018[0];
  const last18 = series2018[series2018.length - 1];
  const first26 = series2026[0];
  const last26 = series2026[series2026.length - 1];

  return (
    <>
      <YearOverlayChart
        series2018={series2018}
        series2026={series2026}
        subject={instrument.label}
      />

      <p className="dd-panel__note">
        {`${titleOf(instrument)} relative return from each year's first close: `}
        {last18 && (
          <>
            {`2018 finished ${formatSignedPct(last18.pct)} `}
            {`(${formatPrice(first18.close)} → ${formatPrice(last18.close)})`}
          </>
        )}
        {last18 && last26 && '; '}
        {last26 && (
          <>
            {`2026 is ${formatSignedPct(last26.pct)} through ${formatDate(last26.date)} `}
            {`(${formatPrice(first26.close)} → ${formatPrice(last26.close)})`}
          </>
        )}
        .
      </p>

      <p className="dd-hint">
        Hover or focus the chart and use &larr; &rarr; to step through the calendar year.
      </p>
    </>
  );
}

/**
 * Interactive 2018 vs 2026 relative-percentage overlay panel with an
 * instrument selector.
 */
function YearOverlayPanel({ instruments, defaultSymbol = 'SPY' }) {
  const fallback = instruments.find((i) => i.symbol === defaultSymbol) || instruments[0];
  const [symbol, setSymbol] = useState(fallback?.symbol ?? '');
  const selected = instruments.find((i) => i.symbol === symbol) || fallback;

  if (!selected) return null;

  return (
    <section className="dd-panel st-overlay" id="overlay-2018-2026" aria-labelledby="overlay-2018-2026-heading">
      <div className="dd-panel__head">
        <div>
          <h2 className="dd-panel__title" id="overlay-2018-2026-heading">2018 vs 2026</h2>
          <p className="dd-panel__kicker">
            Relative % change from each year&rsquo;s first close · aligned by calendar date
          </p>
        </div>

        <div className="st-overlay__legend" aria-label="Series legend">
          <span className="st-overlay__legend-item">
            <span className="dd-tip__key st-overlay__key--2026" aria-hidden="true" />
            2026
          </span>
          <span className="st-overlay__legend-item">
            <span className="dd-tip__key st-overlay__key--2018" aria-hidden="true" />
            2018
          </span>
        </div>
      </div>

      <div className="dd-filters st-overlay__picker" role="group" aria-label="Select instrument for 2018 vs 2026 overlay">
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

      <YearOverlayContent key={selected.symbol} instrument={selected} />
    </section>
  );
}

export default YearOverlayPanel;
