import { useMemo, useState } from 'react';
import './TMobileApp.css';
import { WaveformDivider } from '../../../src/components/graphics';
import PriceChart from './components/PriceChart';
import MonthlySalesChart from './components/MonthlySalesChart';
import FilterRow from './components/FilterRow';
import ChartLegend from './components/ChartLegend';
import StackLegend from './components/StackLegend';
import StatTiles from './components/StatTiles';
import DroughtTiles from './components/DroughtTiles';
import QuietChart from './components/QuietChart';
import SellTable from './components/SellTable';
import MonthlyTable from './components/MonthlyTable';
import {
  DEFAULT_FILTER, filterById, formatUSD, formatWeek, selectedWeeks, summarize,
  visibleSeries,
} from './insiderFilters';
import {
  DEFAULT_MEASURE, dominantSeller, formatAmount, formatMonth, formatPercent,
  measureById, monthRows, monthStacks, summarizeMonths,
} from './monthlySeries';
import {
  biggestDay, currentGap, describeChange, formatDays, gapRuns, gapSeries,
  longestClosedGap, medianGap, periodComparison, saleDates, selectDays,
  spanLabel, SPELL_BREAK,
} from './sellPressure';
import {
  TMUS_META, TMUS_WEEKLY, SALE_DAYS, SIEVERT_SELL_WEEKS, OTHER_SELL_WEEKS,
} from './data/tmusInsiderSales';
import { MONTHLY_SALES, NASDAQ_META } from './data/tmusMonthlySales';

// Every "as of" figure is read from the date the data was fetched, not from
// the clock: the page is static, so a live `new Date()` would quietly inflate
// the quiet stretch by however long it has been since the last deploy.
const AS_OF = TMUS_META.fetched;
const HALF_YEAR = 182;
const YEAR = 365;

function TMobileApp() {
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [measure, setMeasure] = useState(DEFAULT_MEASURE);

  const show = visibleSeries(filter);
  const rows = useMemo(
    () => selectedWeeks(filter, SIEVERT_SELL_WEEKS, OTHER_SELL_WEEKS),
    [filter],
  );
  const summary = useMemo(() => summarize(rows), [rows]);

  const pressure = useMemo(() => {
    const days = selectDays(SALE_DAYS, visibleSeries(filter));
    const dates = saleDates(days);
    const runs = gapRuns(dates, AS_OF);
    const current = currentGap(runs);
    const year = periodComparison(days, AS_OF, YEAR);
    return {
      current,
      record: longestClosedGap(runs),
      // pauses inside one spell of selling are not pauses
      median: medianGap(runs, { longerThan: SPELL_BREAK }),
      series: gapSeries(TMUS_WEEKLY.map((p) => p.week), dates, AS_OF),
      halfYear: periodComparison(days, AS_OF, HALF_YEAR),
      year,
      lastSellers: current
        ? [...new Set(days.filter((d) => d.date === current.from)
          .flatMap((d) => d.people.map((p) => p.name)))]
        : [],
      // the one trade the trailing year's dollar figure leans on, if it does
      topDay: biggestDay(days, year.recentStart, AS_OF),
    };
  }, [filter]);

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
          an insider sold their own stock &mdash; then how long they have gone
          without selling, and the last two years totalled up by month. Deutsche
          Telekom &mdash; which owns most of the company and trades in blocks
          nothing like an executive&rsquo;s payday &mdash; is left out of all three.
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

        <section className="tm-panel" aria-labelledby="tm-quiet-heading">
          <div className="tm-panel__head">
            <h2 className="tm-panel__title" id="tm-quiet-heading">
              Days since the previous insider sale
            </h2>
          </div>

          <DroughtTiles
            current={pressure.current}
            record={pressure.record}
            median={pressure.median}
            halfYear={pressure.halfYear}
            year={pressure.year}
            lastSellers={pressure.lastSellers}
          />

          <QuietChart
            prices={TMUS_WEEKLY}
            series={pressure.series}
            record={pressure.record}
            current={pressure.current}
            asOf={AS_OF}
          />

          <p className="tm-panel__note">
            {pressure.current ? (
              <>
                {`Each tooth falls to the floor on a sale and climbs while nobody sells, `}
                {`so a wide tooth is a quiet stretch. The one on the right is still open: `}
                {`${formatDays(pressure.current.days)} as of ${formatWeek(AS_OF)}`}
                {pressure.record
                  ? `, against a previous longest of ${formatDays(pressure.record.days)} `
                    + `and a typical ${formatDays(pressure.median)} between spells of selling`
                  : ''}
                {'. '}
                {`Over the last ${spanLabel(HALF_YEAR)} this selection sold `}
                {`${formatUSD(pressure.halfYear.recent.value)} across `}
                {`${pressure.halfYear.recent.txns} filings, `}
                {`${describeChange(pressure.halfYear.change.value)} on the `}
                {`${formatUSD(pressure.halfYear.prior.value)} of the `}
                {`${spanLabel(HALF_YEAR)} before. `}
                {pressure.topDay && pressure.topDay.share >= 0.4
                  ? `The trailing year's dollar figure leans on a single day — `
                    + `${formatWeek(pressure.topDay.date)} is `
                    + `${formatPercent(pressure.topDay.share)} of it `
                    + `(${pressure.topDay.people[0].name}, `
                    + `${formatUSD(pressure.topDay.value)}) — which is why the filing `
                    + `count, ${describeChange(pressure.year.change.txns)} on the year, `
                    + `is the honest read on how often anyone is selling.`
                  : ''}
              </>
            ) : (
              'Nobody in this selection sold in the window, so there is no stretch to measure.'
            )}
          </p>

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
              {TMUS_META.windowEnd}. The last point is that week to date.
            </li>
            <li>
              Everything is counted to {TMUS_META.fetched}, the day the filings and
              prices were read &mdash; not to the moment you open the page. A quiet
              stretch is measured between trade dates, so a Friday sale and the
              Monday after it are three days apart, not a week.
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
              Excluded everywhere on this page: {TMUS_META.excludedFilers.join(', ')}.
              Over the five years that is {TMUS_META.excludedTxns} sale filings and{' '}
              {TMUS_META.excludedShares.toLocaleString('en-US')} shares; in the Nasdaq
              window alone, {NASDAQ_META.excludedRows} of the {NASDAQ_META.saleRows}{' '}
              sale filings. Leaving the majority owner in would flatten every
              executive&rsquo;s trade into the axis.
            </li>
            {TMUS_META.outliers.map((trade) => (
              <li key={trade.date}>
                <strong>Held out of every chart, tile and table above:</strong>{' '}
                {trade.name}&rsquo;s block of{' '}
                {trade.shares.toLocaleString('en-US')} shares on{' '}
                {formatWeek(trade.date)} &mdash; {formatUSD(trade.value)} at $
                {trade.price.toFixed(2)}, in one trade. That is a holder unwinding a
                position rather than an executive taking a payday, and at that size
                it sets the axis on every chart and buries the thing this page is
                about. It is the only individual trade left out; the rest of{' '}
                {trade.name.split(' ').slice(-1)}&rsquo;s sales are counted, and
                adding this one back would put{' '}
                {formatUSD(trade.value)} into the totals above.
              </li>
            ))}
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
