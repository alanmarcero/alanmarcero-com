import { useMemo, useState } from 'react';
import './TMobileApp.css';
import PageHeader from './components/PageHeader';
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
import DrawdownPanel from './components/DrawdownPanel';
import TopHoldControl from './components/TopHoldControl';
import SourceNotes from './components/SourceNotes';
import {
  DEFAULT_FILTER, filterById, selectedWeeks, summarize, visibleSeries,
} from './insiderFilters';
import {
  DEFAULT_MEASURE, measureById, monthRows, monthStacks, peakSeller, summarizeMonths,
} from './monthlySeries';
import { pressureReport, selectDays } from './sellPressure';
import { monthlyCaption, quietCaption } from './captions';
import {
  TMUS_META, TMUS_WEEKLY, SALE_DAYS, SIEVERT_SELL_WEEKS, OTHER_SELL_WEEKS,
} from './data/tmusInsiderSales';
import { MONTHLY_SALES, NASDAQ_META } from './data/tmusMonthlySales';
import { TMUS_DAILY, TMUS_DAILY_META } from './data/tmusDailyCloses';
import {
  DEFAULT_TOP_HOLD, drawdownEpisodes, heldAtLeast, topHoldById, underwater,
} from './drawdowns';

// Every "as of" figure is read from the date the data was fetched, not from
// the clock: the page is static, so a live `new Date()` would quietly inflate
// the quiet stretch by however long it has been since the last deploy.
const AS_OF = TMUS_META.fetched;
const WEEKS = TMUS_WEEKLY.map((p) => p.week);

// the whole daily history, computed once: it does not move with any control
const UNDERWATER = underwater(TMUS_DAILY);
const ALL_DRAWDOWNS = drawdownEpisodes(TMUS_DAILY);

function TMobileApp() {
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [measure, setMeasure] = useState(DEFAULT_MEASURE);
  const [topHold, setTopHold] = useState(DEFAULT_TOP_HOLD);

  const hold = topHoldById(topHold);
  const drawdowns = useMemo(() => heldAtLeast(ALL_DRAWDOWNS, hold.days), [hold.days]);

  const show = useMemo(() => visibleSeries(filter), [filter]);
  const rows = useMemo(
    () => selectedWeeks(filter, SIEVERT_SELL_WEEKS, OTHER_SELL_WEEKS),
    [filter],
  );
  const summary = useMemo(() => summarize(rows), [rows]);
  const pressure = useMemo(
    () => pressureReport(selectDays(SALE_DAYS, show), WEEKS, AS_OF),
    [show],
  );

  const stacks = useMemo(() => monthStacks(MONTHLY_SALES, measure, show), [measure, show]);
  const monthly = useMemo(() => summarizeMonths(stacks), [stacks]);
  const monthTableRows = useMemo(() => monthRows(MONTHLY_SALES, show), [show]);
  const monthlyNote = monthlyCaption({
    summary: monthly,
    measure,
    seller: peakSeller(MONTHLY_SALES, monthly.peak, show, measure),
    quietLead: filterById(filter).quiet,
  });

  return (
    <div className="tm-page">
      <PageHeader
        kicker="// ticker readout"
        title="TMUS"
        intro={(
          <>
            Five years of T-Mobile US, one point per week, with a marker on every week
            an insider sold their own stock &mdash; then how long they have gone
            without selling, and the last two years totalled up by month. Deutsche
            Telekom &mdash; which owns most of the company and trades in blocks
            nothing like an executive&rsquo;s payday &mdash; is left out of all three.
            Last, every daily close since the stock first traded, measured as a loss
            from its all-time high.
          </>
        )}
      />

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

          <p className="tm-panel__note">{quietCaption(pressure, AS_OF)}</p>

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

          <p className="tm-panel__note">{monthlyNote}</p>

          <p className="tm-hint">
            Hover or focus the chart and use &larr; &rarr; to read any month.
          </p>
        </section>

        <MonthlyTable rows={monthTableRows} />

        <DrawdownPanel
          id="tm-drawdown"
          title={`Peak-to-trough drawdowns since ${TMUS_DAILY_META.first.slice(0, 4)}`}
          points={UNDERWATER}
          episodes={drawdowns}
          hold={hold}
        >
          <div className="tm-controls tm-controls--inset">
            <TopHoldControl value={topHold} onChange={setTopHold} />
          </div>
        </DrawdownPanel>

        <SourceNotes insider={TMUS_META} nasdaq={NASDAQ_META} daily={TMUS_DAILY_META} />
      </main>
    </div>
  );
}

export default TMobileApp;
