import { useMemo, useState } from 'react';
import './TMobileApp.css';
import { WaveformDivider } from '../../../src/components/graphics';
import PriceChart from './components/PriceChart';
import MonthlySalesChart from './components/MonthlySalesChart';
import FilterRow from './components/FilterRow';
import ChartLegend from './components/ChartLegend';
import StackLegend from './components/StackLegend';
import StatTiles from './components/StatTiles';
import SellTable from './components/SellTable';
import MonthlyTable from './components/MonthlyTable';
import {
  DEFAULT_FILTER, filterById, selectedWeeks, summarize, visibleSeries,
} from './insiderFilters';
import {
  DEFAULT_MEASURE, dominantSeller, formatAmount, formatMonth, formatPercent,
  measureById, monthRows, monthStacks, summarizeMonths,
} from './monthlySeries';
import {
  TMUS_META, TMUS_WEEKLY, SIEVERT_SELL_WEEKS, OTHER_SELL_WEEKS,
} from './data/tmusInsiderSales';
import { MONTHLY_SALES, NASDAQ_META } from './data/tmusMonthlySales';

function TMobileApp() {
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [measure, setMeasure] = useState(DEFAULT_MEASURE);

  const show = visibleSeries(filter);
  const rows = useMemo(
    () => selectedWeeks(filter, SIEVERT_SELL_WEEKS, OTHER_SELL_WEEKS),
    [filter],
  );
  const summary = useMemo(() => summarize(rows), [rows]);

  const stacks = useMemo(
    () => monthStacks(MONTHLY_SALES, measure, show),
    [measure, show.sievert, show.others],
  );
  const monthly = useMemo(() => summarizeMonths(stacks), [stacks]);
  const monthTableRows = useMemo(
    () => monthRows(MONTHLY_SALES, show),
    [show.sievert, show.others],
  );

  const peakRecord = monthly.peak
    ? MONTHLY_SALES.find((r) => r.month === monthly.peak.month)
    : null;
  const peakSeller = peakRecord ? dominantSeller(peakRecord, show, measure) : null;

  return (
    <div className="tm-page">
      <header className="tm-header">
        <a href="/" className="tm-back">&larr; Back to console</a>
        <p className="kicker tm-kicker">// ticker readout</p>
        <h1 className="tm-title">TMUS</h1>
        <p className="tm-sub">
          Five years of T-Mobile US, one point per week, with a marker on every week
          an insider sold their own stock. Then the last two years again, totalled up
          by month. Deutsche Telekom &mdash; which owns most of
          the company and trades in blocks nothing like an executive&rsquo;s payday
          &mdash; is left out of both.
        </p>
        <WaveformDivider variant="saw" className="tm-divider" />
      </header>

      <main className="tm-main">
        <FilterRow
          filter={filter}
          onFilter={setFilter}
          measure={measure}
          onMeasure={setMeasure}
        />

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

        <section className="tm-panel" aria-labelledby="tm-monthly-heading">
          <div className="tm-panel__head">
            <h2 className="tm-panel__title" id="tm-monthly-heading">
              {`${measureById(measure).label} by month`}
            </h2>
            <StackLegend show={show} />
          </div>

          <MonthlySalesChart
            records={MONTHLY_SALES}
            stacks={stacks}
            measure={measure}
            summary={monthly}
            show={show}
          />

          <p className="tm-panel__note">
            {monthly.peak ? (
              <>
                {`${formatMonth(monthly.peak.month)} is ${formatPercent(monthly.peakShare)} of `}
                {`the ${formatAmount(measure, monthly.total)} in this window`}
                {peakSeller ? `, mostly ${peakSeller.name}` : ''}
                {`. ${filterById(filter).quiet} ${monthly.quietCount} of the `}
                {`${monthly.monthCount} months`}
                {monthly.spread >= 20
                  ? ', and a month with a sale is drawn at least a hairline tall so '
                    + 'it cannot disappear next to a month like that'
                  : ''}
                {'. The table below has every figure at full precision.'}
              </>
            ) : (
              'Nobody in this selection sold during the window.'
            )}
          </p>

          <p className="tm-hint">
            Hover or focus the chart and use &larr; &rarr; to read any month.
          </p>
        </section>

        <MonthlyTable rows={monthTableRows} />

        <footer className="tm-notes">
          <h2 className="tm-notes__title">Where this comes from</h2>
          <ul className="tm-notes__list">
            <li>
              Prices: {TMUS_META.priceSource}, {TMUS_META.windowStart} to{' '}
              {TMUS_META.windowEnd}.
            </li>
            <li>
              Weekly markers: {TMUS_META.saleTxnCount} sale transactions from{' '}
              {TMUS_META.insiderSource}. A sale here means SEC transaction code
              &ldquo;S&rdquo; &mdash; an actual sale, whether open-market or under a
              10b5-1 plan. Shares withheld to cover taxes on a vest (code F) are not
              sales and are not counted.
            </li>
            <li>
              Monthly columns: {NASDAQ_META.txnCount} sale transactions by{' '}
              {NASDAQ_META.sellerCount} people, read {NASDAQ_META.fetched} from{' '}
              <a
                href={NASDAQ_META.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Nasdaq&rsquo;s insider activity for TMUS
              </a>
              . Nasdaq hands back {NASDAQ_META.feedRecords} transactions and no more,
              of every kind, which is why these columns cover two years rather than
              five: {NASDAQ_META.feedFirst} to {NASDAQ_META.feedLast}, the two edge
              months partial. Kept are the &ldquo;Sell&rdquo; and &ldquo;Automatic
              Sell&rdquo; rows; a &ldquo;Disposition (Non Open Market)&rdquo; is
              overwhelmingly tax withholding on a vest, not a sale, and is not
              counted. Where the two windows overlap, Nasdaq and the Form 4 filings
              agree.
            </li>
            <li>
              Excluded from both: {TMUS_META.excludedFilers.join(', ')}. In the
              Nasdaq window alone that is {NASDAQ_META.excludedRows} of the{' '}
              {NASDAQ_META.saleRows} sale filings and{' '}
              {NASDAQ_META.excludedShares.toLocaleString('en-US')} shares; leaving it
              in would flatten every executive&rsquo;s trade into the axis.
            </li>
            <li>
              A dot on the weekly chart sits at the week&rsquo;s closing price, not at
              the exact price of the trade. Both tables carry the real numbers.
            </li>
          </ul>
        </footer>
      </main>
    </div>
  );
}

export default TMobileApp;
