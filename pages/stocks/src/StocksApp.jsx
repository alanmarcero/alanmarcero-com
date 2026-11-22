import { useState } from 'react';
import './StocksApp.css';
import PageHeader from './drawdown/components/PageHeader';
import ToggleGroup from './drawdown/components/ToggleGroup';
import TopHoldControl from './drawdown/components/TopHoldControl';
import { DEFAULT_WINDOW, WINDOWS } from './drawdown/drawdownGeometry';
import { DEFAULT_TOP_HOLD, topHoldById } from './drawdown/drawdowns';
import InstrumentPanel from './components/InstrumentPanel';
import { INSTRUMENTS } from './data/instruments';
import { byLabel } from './instruments';
import YearOverlayPanel from './overlay/YearOverlayPanel';

const ORDERED = byLabel(INSTRUMENTS);
const OVERLAY_SYMBOLS = ['SPY', 'QQQ', 'DIA', 'IWM'];
const OVERLAY_INSTRUMENTS = OVERLAY_SYMBOLS
  .map((sym) => INSTRUMENTS.find((i) => i.symbol === sym))
  .filter(Boolean);

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
            How far each 52-week high fell before it was beaten. Every daily close
            Yahoo Finance holds for {INSTRUMENTS.length} stocks, funds and coins, each plotted as a
            loss from the highest close in the trailing 52 weeks, so the line sits on the top
            edge at a 52-week high and hangs below it during a drawdown.
          </>
        )}
      />

      <main id="main-content" className="dd-main">
        <YearOverlayPanel instruments={OVERLAY_INSTRUMENTS} />

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
              A drawdown runs from a 52-week closing high to the next 52-week
              closing high, and its depth is the lowest close in between. The
              detection level filters by minimum drawdown depth.
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
