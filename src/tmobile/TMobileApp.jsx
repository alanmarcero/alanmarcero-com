import { useMemo, useState } from 'react';
import './TMobileApp.css';
import { WaveformDivider } from '../components/graphics';
import PriceChart from './components/PriceChart';
import FilterRow from './components/FilterRow';
import ChartLegend from './components/ChartLegend';
import StatTiles from './components/StatTiles';
import SellTable from './components/SellTable';
import {
  DEFAULT_FILTER, selectedWeeks, summarize, visibleSeries,
} from './insiderFilters';
import {
  TMUS_META, TMUS_WEEKLY, SIEVERT_SELL_WEEKS, OTHER_SELL_WEEKS,
} from './data/tmusInsiderSales';

function TMobileApp() {
  const [filter, setFilter] = useState(DEFAULT_FILTER);

  const show = visibleSeries(filter);
  const rows = useMemo(
    () => selectedWeeks(filter, SIEVERT_SELL_WEEKS, OTHER_SELL_WEEKS),
    [filter],
  );
  const summary = useMemo(() => summarize(rows), [rows]);

  return (
    <div className="tm-page">
      <header className="tm-header">
        <a href="/" className="tm-back">&larr; Back to console</a>
        <p className="kicker tm-kicker">// ticker readout</p>
        <h1 className="tm-title">TMUS</h1>
        <p className="tm-sub">
          Five years of T-Mobile US, one point per week, with a marker on every week
          an insider sold their own stock. Deutsche Telekom &mdash; which owns most of
          the company and trades in blocks nothing like an executive&rsquo;s payday
          &mdash; is left out.
        </p>
        <WaveformDivider variant="saw" className="tm-divider" />
      </header>

      <main className="tm-main">
        <FilterRow value={filter} onChange={setFilter} />

        <StatTiles summary={summary} weekTotal={TMUS_WEEKLY.length} />

        <section className="tm-panel" aria-labelledby="tm-chart-heading">
          <div className="tm-panel__head">
            <h2 className="tm-panel__title" id="tm-chart-heading">
              Weekly close &amp; insider sales
            </h2>
            <ChartLegend showSievert={show.sievert} showOthers={show.others} />
          </div>

          <PriceChart
            prices={TMUS_WEEKLY}
            sievertWeeks={SIEVERT_SELL_WEEKS}
            otherWeeks={OTHER_SELL_WEEKS}
            showSievert={show.sievert}
            showOthers={show.others}
          />

          <p className="tm-hint">
            Hover or focus the chart and use &larr; &rarr; to read any week.
          </p>
        </section>

        <SellTable rows={rows} />

        <footer className="tm-notes">
          <h2 className="tm-notes__title">Where this comes from</h2>
          <ul className="tm-notes__list">
            <li>
              Prices: {TMUS_META.priceSource}, {TMUS_META.windowStart} to{' '}
              {TMUS_META.windowEnd}.
            </li>
            <li>
              Sales: {TMUS_META.saleTxnCount} sale transactions from{' '}
              {TMUS_META.insiderSource}. A sale here means SEC transaction code
              &ldquo;S&rdquo; &mdash; an actual sale, whether open-market or under a
              10b5-1 plan. Shares withheld to cover taxes on a vest (code F) are not
              sales and are not counted.
            </li>
            <li>
              Excluded filer{TMUS_META.excludedFilers.length === 1 ? '' : 's'}:{' '}
              {TMUS_META.excludedFilers.join(', ') || 'none'}.
            </li>
            <li>
              A dot sits at the week&rsquo;s closing price, not at the exact price of
              the trade. The tooltip and the table carry the real numbers.
            </li>
          </ul>
        </footer>
      </main>
    </div>
  );
}

export default TMobileApp;
