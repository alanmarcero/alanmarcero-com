import { formatDate, formatUSD } from '../insiderFilters';

/**
 * Where every figure on the TMUS page comes from, and what was left out of
 * it. Printed from the generators' own metadata, never as prose, so it cannot
 * go stale against the data.
 */
function SourceNotes({ insider, nasdaq, daily }) {
  return (
    <footer className="tm-notes">
      <h2 className="tm-notes__title">Where this comes from</h2>
      <ul className="tm-notes__list">
        <li>
          Prices: {insider.priceSource}, {insider.windowStart} to{' '}
          {insider.windowEnd}. The last point is that week to date.
        </li>
        <li>
          Everything is counted to {insider.fetched}, the day the filings and
          prices were read &mdash; not to the moment you open the page. A quiet
          stretch is measured between trade dates, so a Friday sale and the
          Monday after it are three days apart, not a week.
        </li>
        <li>
          Weekly markers: {insider.saleTxnCount} sale transactions from{' '}
          {insider.insiderSource}. A sale here means SEC transaction code
          &ldquo;S&rdquo; &mdash; an actual sale, whether open-market or under a
          10b5-1 plan. Shares withheld to cover taxes on a vest (code F) are not
          sales and are not counted.
        </li>
        <li>
          Monthly columns: {nasdaq.txnCount} sale transactions by{' '}
          {nasdaq.sellerCount} people, read {nasdaq.fetched} from{' '}
          <a
            href={nasdaq.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Nasdaq&rsquo;s insider activity for TMUS
          </a>
          . Nasdaq{' '}
          {nasdaq.feedCapped
            ? `hands back ${nasdaq.feedRecords} transactions and no more, of every kind,`
            : `carries ${nasdaq.feedRecords} transactions of every kind and reaches no further back,`}{' '}
          which is why these columns cover two years rather than five:{' '}
          {nasdaq.feedFirst} to {nasdaq.feedLast}, the two edge
          months partial. Kept are the &ldquo;Sell&rdquo; and &ldquo;Automatic
          Sell&rdquo; rows; a &ldquo;Disposition (Non Open Market)&rdquo; is
          overwhelmingly tax withholding on a vest, not a sale, and is not
          counted. Where the two windows overlap, Nasdaq and the Form 4 filings
          agree.
        </li>
        <li>
          Excluded everywhere on this page: {insider.excludedFilers.join(', ')}.
          Over the five years that is {insider.excludedTxns} sale filings and{' '}
          {insider.excludedShares.toLocaleString('en-US')} shares; in the Nasdaq
          window alone, {nasdaq.excludedRows} of the {nasdaq.saleRows}{' '}
          sale filings. Leaving the majority owner in would flatten every
          executive&rsquo;s trade into the axis.
        </li>
        {insider.outliers.map((trade) => (
          <li key={trade.date}>
            <strong>Held out of every chart, tile and table above:</strong>{' '}
            {trade.name}&rsquo;s block of{' '}
            {trade.shares.toLocaleString('en-US')} shares on{' '}
            {formatDate(trade.date)} &mdash; {formatUSD(trade.value)} at $
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
          Drawdowns: {daily.sessions.toLocaleString('en-US')} daily closes
          from {daily.source}, {daily.first} to{' '}
          {daily.last} &mdash; everything Yahoo holds. The stock first
          traded as MetroPCS and became T-Mobile US in the 2013 merger, so the
          early years are MetroPCS&rsquo;s, adjusted for the{' '}
          {daily.splits.map((s) => `${s.ratio} split of ${s.date}`).join(', ')}.
          Closes are not adjusted for dividends. A drawdown runs from an all-time
          closing high to the first close above it, and its depth is the lowest
          close in between.
          {daily.repaired.length
            ? ` Yahoo had no close for ${daily.repaired.join(', ')}; it was `
              + 'read back from the following session\u2019s previous close.'
            : ''}
        </li>
        <li>
          A dot on the weekly chart sits at the week&rsquo;s closing price, not at
          the exact price of the trade. Both tables carry the real numbers.
        </li>
      </ul>
    </footer>
  );
}

export default SourceNotes;
