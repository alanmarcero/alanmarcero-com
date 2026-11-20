import { useState } from 'react';
import './StocksApp.css';
import PageHeader from './drawdown/components/PageHeader';
import ToggleGroup from './drawdown/components/ToggleGroup';
import TopHoldControl from './drawdown/components/TopHoldControl';
import { DEFAULT_WINDOW, WINDOWS } from './drawdown/drawdownGeometry';
import { DEFAULT_TOP_HOLD, formatDepth, topHoldById } from './drawdown/drawdowns';
import InstrumentPanel from './components/InstrumentPanel';
import { INSTRUMENTS } from './data/instruments';
import { anchorOf, byLabel } from './instruments';
import YearOverlayPanel from './overlay/YearOverlayPanel';

const ORDERED = byLabel(INSTRUMENTS);

function StocksApp() {
  const [windowId, setWindowId] = useState(DEFAULT_WINDOW);
  const [holdId, setHoldId] = useState(DEFAULT_TOP_HOLD);
  const hold = topHoldById(holdId);

  return (
    <div className="dd-page">
      <PageHeader
        kicker="// drawdown readout"
        title="Drawdowns"
        intro={(
          <>
            How far each all-time high fell before it was beaten. Every daily close
            Yahoo Finance holds for {INSTRUMENTS.length} stocks, funds and coins, each plotted as a
            loss from the highest close before it, so the line sits on the top
            edge at a record and hangs below it for as long as the record stands.
          </>
        )}
      >
        <nav className="st-index" aria-label="Instruments">
          {ORDERED.map((instrument) => (
            <a key={instrument.symbol} className="dd-filter" href={`#${anchorOf(instrument)}`}>
              {instrument.label}
              <span className={`st-index__dd${instrument.drawdown < 0 ? '' : ' st-index__dd--ath'}`}>
                {formatDepth(instrument.drawdown)}
              </span>
            </a>
          ))}
        </nav>
      </PageHeader>

      <main id="main-content" className="dd-main">
        <YearOverlayPanel instruments={ORDERED} />

        <div className="st-controls">
          <div className="dd-controls">
            <ToggleGroup
              labelId="st-window-label"
              label="Timeframe"
              options={WINDOWS}
              value={windowId}
              onChange={setWindowId}
            />
            <TopHoldControl value={holdId} onChange={setHoldId} />
          </div>
        </div>

        {ORDERED.map((instrument) => (
          <InstrumentPanel
            key={instrument.symbol}
            instrument={instrument}
            hold={hold}
            windowId={windowId}
          />
        ))}

        <footer className="dd-notes">
          <h2 className="dd-notes__title">Data and methodology</h2>
          <ul className="dd-notes__list">
            <li>
              Daily closes from Yahoo Finance, read {INSTRUMENTS[0].fetched}, from each
              instrument's first session to the last one that had closed. Closes
              are adjusted for splits and not for dividends, so a fund that pays out
              reads a little deeper here than its total return did.
            </li>
            <li>
              A drawdown runs from an all-time closing high to the first close above
              it, and its depth is the lowest close in between. A top "stands"
              for the calendar days from its peak to that recovery, or to the last
              close for the one still open; only tops that stood at least six
              months (180 days) are counted.
            </li>
            <li>
              Bitcoin and Ethereum trade around the clock, so their "close"
              is the price at midnight UTC, every day of the week.
            </li>
            <li>
              SMH before 2011 is Merrill Lynch's Semiconductor HOLDRS, whose
              ticker VanEck's fund took over; Yahoo splices the two, and so does
              the chart. XLF's 2016 "split" is the spin-off of its
              real-estate names into XLRE.
            </li>
            <li>
              Yahoo now and then carries a session with no close at all. Rather than
              skip it (which can hide the bottom of a drawdown), each one is
              read back from the following session's previous close.
            </li>
          </ul>
        </footer>
      </main>
    </div>
  );
}

export default StocksApp;
