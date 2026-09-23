import { useState } from 'react';
import './StocksApp.css';
import PageHeader from '../../tmobile/src/components/PageHeader';
import TopHoldControl from '../../tmobile/src/components/TopHoldControl';
import { DEFAULT_TOP_HOLD, topHoldById } from '../../tmobile/src/drawdowns';
import InstrumentPanel from './components/InstrumentPanel';
import { INSTRUMENTS } from './data/instruments';
import { anchorOf, byLabel } from './instruments';

const ORDERED = byLabel(INSTRUMENTS);

function StocksApp() {
  const [topHold, setTopHold] = useState(DEFAULT_TOP_HOLD);
  const hold = topHoldById(topHold);

  return (
    <div className="tm-page">
      <PageHeader
        kicker="// drawdown readout"
        title="Drawdowns"
        intro={(
          <>
            How far each all-time high fell before it was beaten. Every daily close
            Yahoo Finance holds for fourteen stocks, funds and coins, each plotted as a
            loss from the highest close before it &mdash; so the line sits on the top
            edge at a record and hangs below it for as long as the record stands.
          </>
        )}
      >
        <nav className="st-index" aria-label="Instruments">
          {ORDERED.map((instrument) => (
            <a key={instrument.symbol} className="tm-filter" href={`#${anchorOf(instrument)}`}>
              {instrument.label}
            </a>
          ))}
        </nav>
      </PageHeader>

      <main className="tm-main">
        <div className="tm-controls st-controls">
          <TopHoldControl value={topHold} onChange={setTopHold} />
        </div>

        {ORDERED.map((instrument) => (
          <InstrumentPanel key={instrument.symbol} instrument={instrument} hold={hold} />
        ))}

        <footer className="tm-notes">
          <h2 className="tm-notes__title">Where this comes from</h2>
          <ul className="tm-notes__list">
            <li>
              Daily closes from Yahoo Finance, read {INSTRUMENTS[0].fetched}, from each
              instrument&rsquo;s first session to the last one that had closed. Closes
              are adjusted for splits and not for dividends, so a fund that pays out
              reads a little deeper here than its total return did.
            </li>
            <li>
              A drawdown runs from an all-time closing high to the first close above
              it, and its depth is the lowest close in between. A top &ldquo;stands&rdquo;
              for the calendar days from its peak to that recovery, or to the last
              close for the one still open; the control at the top counts only the
              tops that stood at least that long, on every chart at once.
            </li>
            <li>
              Bitcoin and Ethereum trade around the clock, so their &ldquo;close&rdquo;
              is the price at midnight UTC, every day of the week.
            </li>
            <li>
              SMH before 2011 is Merrill Lynch&rsquo;s Semiconductor HOLDRS, whose
              ticker VanEck&rsquo;s fund took over; Yahoo splices the two, and so does
              the chart. XLF&rsquo;s 2016 &ldquo;split&rdquo; is the spin-off of its
              real-estate names into XLRE.
            </li>
            <li>
              Yahoo now and then carries a session with no close at all. Rather than
              skip it &mdash; which can hide the bottom of a drawdown &mdash; each one is
              read back from the following session&rsquo;s previous close.
            </li>
          </ul>
        </footer>
      </main>
    </div>
  );
}

export default StocksApp;
