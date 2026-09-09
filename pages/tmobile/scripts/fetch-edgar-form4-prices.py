#!/usr/bin/env python3
"""
GENERATOR — writes pages/tmobile/src/data/tmusInsiderSales.js

The five-year half of the TMUS page: weekly closing prices from Yahoo Finance,
and a marker on every week a T-Mobile insider sold their own stock, read from
the Form 4 filings themselves at SEC EDGAR.

EDGAR rather than Nasdaq, because Nasdaq's feed stops at 250 transactions of
every kind — about two years — and cannot cover five. Nasdaq mirrors these same
filings; the sibling script fetch-nasdaq-insider-sales.py builds the monthly
chart from the mirror, and a test asserts the two agree where they overlap.

Five things that will bite whoever runs this next:

1.  ONLY TRANSACTION CODE S IS A SALE. A Form 4 line carries a one-letter code.
    S is a sale — open market, or under a 10b5-1 plan, which the form flags
    separately and which is still the insider choosing to take money off the
    table. F is shares withheld by the company to cover tax on a vest: the
    insider never chose it and no shares reach the market as their decision.
    A is a grant, M an option exercise, G a gift. Counting anything but S
    inflates the total with money nobody decided to take.

2.  THE RAW XML IS NOT THE primaryDocument. The submissions index points at
    `xslF345X06/wk-form4_1788469087.xml`, which is the human-readable rendering
    served through EDGAR's stylesheet. Strip the `xsl.../` prefix for the
    machine-readable original; the rendered one parses into nothing useful.

3.  A WEEK IS A MONDAY. Every sale is filed under the Monday of its trade week
    so it lands on a point in the price series, and the marker is drawn at that
    week's CLOSE, not at the trade price — the page says so, and both tables
    carry the real per-trade numbers. `value / shares` is the honest weighted
    price and a test holds it near the close, which catches a unit slip.

4.  EDGAR WANTS AN EMAIL IN THE User-Agent. Not a name, not a URL — a string
    without an @ address in it gets a blanket 403 on every Archives path,
    including ones that load fine in a browser. It also rate-limits hard: four
    workers with a short pause each, and a backoff on 403/429/503, gets 350-odd
    filings without a refusal.

5.  YAHOO APPENDS THE WEEK IN PROGRESS as its own bar, sharing a Monday with
    the completed bar when one exists. Both are folded onto their Monday and
    the later close wins, so the series always ends at the latest price rather
    than at last Friday. The final point is therefore a week to date.

Deutsche Telekom AG, the majority owner, is excluded: 30M+ shares in block
trades that would flatten every executive's trade into the axis. So is one
named trade — see OUTLIER_TRADES — for the same reason at a smaller scale. Both
exclusions are recorded in the generated metadata and printed on the page.

Run:  python3 pages/tmobile/scripts/fetch-edgar-form4-prices.py
      python3 pages/tmobile/scripts/fetch-edgar-form4-prices.py --dry-run
"""

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ElementTree
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta
from pathlib import Path

CIK = '0001283699'
SUBMISSIONS = f'https://data.sec.gov/submissions/CIK{CIK}.json'
ARCHIVE = 'https://www.sec.gov/Archives/edgar/data/{cik}/{accession}/{document}'
PRICES = ('https://query1.finance.yahoo.com/v8/finance/chart/TMUS'
          '?interval=1wk&range=5y')

# EDGAR answers 403 to a User-Agent WITHOUT AN EMAIL ADDRESS IN IT — a
# descriptive one is not enough, it wants a contact it could write to. And do
# not advertise gzip: urllib will not decompress it, and the JSON then arrives
# as bytes that fail to decode. Yahoo, separately, rejects a default urllib UA.
SEC_HEADERS = {
    'User-Agent': 'alanmarcero.com contact@alanmarcero.com',
    'Accept-Encoding': 'identity',
}
YAHOO_HEADERS = {
    'User-Agent': ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                   'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'),
    'Accept': 'application/json',
}

SALE_CODE = 'S'
EXCLUDED = 'DEUTSCHE TELEKOM AG'
CEO = 'Mike Sievert'

# ONE TRANSACTION, HELD OUT OF EVERY FIGURE ON THE PAGE and named at the foot
# of it. Raul Marcelo Claure's 550,000-share block on 2026-02-12 is $119.7M in
# a single indirect open-market trade — on its own it is most of the dollars in
# the trailing year, and it is the same kind of trade Deutsche Telekom is
# excluded for: a holder unwinding a position, not an executive taking a
# payday. Left in, it sets the axis on every chart and the cadence the page is
# actually about disappears underneath it.
#
# Keyed by (date, filer) so it can only ever remove the one trade it names, and
# the generator FAILS if that trade stops arriving — a silent no-op here would
# quietly put the outlier back.
OUTLIER_TRADES = (('2026-02-12', 'CLAURE RAUL MARCELO'),)

# Display only. EDGAR files a name LAST FIRST MIDDLE, which no algorithm
# reliably unpicks ("Sievert G. Michael" is G. Michael Sievert), so everyone
# who appears is spelled out — and the spellings MATCH THE NASDAQ SCRIPT's, so
# one person can be followed across both charts on the page.
DISPLAY_NAME = {
    'SIEVERT G MICHAEL': 'Mike Sievert',
    'CLAURE RAUL MARCELO': 'Raul Marcelo Claure',
    'NELSON MARK WOLFE': 'Mark Wolfe Nelson',
    'KATZ MICHAEL J.': 'Michael J. Katz',
    'DATAR SRIKANT M.': 'Srikant M. Datar',
    'OSVALDIK PETER': 'Peter Osvaldik',
    'FIELD CALLIE R': 'Callie R Field',
    'BAZZANO DARA': 'Dara Bazzano',
    'CANO NESTOR': 'Nestor Cano',
    'FREIER JON': 'Jon Freier',
    'LONG LETITIA A': 'Letitia A Long',
    'EWALDSSON ULF': 'Ulf Ewaldsson',
    'TAYLOR TERESA': 'Teresa Taylor',
    'KING DEEANNE': 'Deeanne King',
    'RAY NEVILLE R': 'Neville R Ray',
    'WESTBROOK KELVIN R': 'Kelvin R Westbrook',
}

OUT = Path(__file__).resolve().parents[1] / 'src' / 'data' / 'tmusInsiderSales.js'


# -- pure helpers ---------------------------------------------------------

def monday_of(iso):
    """The Monday of the week an ISO date falls in — a week's anchor."""
    day = date.fromisoformat(iso)
    return (day - timedelta(days=day.weekday())).isoformat()


def display_name(raw):
    """A filer's name as the page spells it."""
    return DISPLAY_NAME.get(raw.upper().strip(), raw.title())


def is_excluded(raw):
    return raw.upper().strip() == EXCLUDED


def is_outlier(sale):
    return (sale['date'], sale['filer']) in OUTLIER_TRADES


def raw_document(primary):
    """`xslF345X06/wk-form4_123.xml` -> `wk-form4_123.xml`, the machine copy."""
    return primary.rsplit('/', 1)[-1]


def text_at(node, path):
    found = node.find(path)
    return (found.text or '').strip() if found is not None else ''


def number_at(node, path):
    text = text_at(node, path).replace(',', '').replace('$', '')
    try:
        return float(text)
    except ValueError:
        return 0.0


def parse_sales(xml, accession):
    """Every code-S non-derivative line in one Form 4, as flat sale records."""
    root = ElementTree.fromstring(xml)
    owner = text_at(root, './reportingOwner/reportingOwnerId/rptOwnerName')
    if not owner:
        return []

    relationship = root.find('./reportingOwner/reportingOwnerRelationship')
    role = 'Insider'
    if relationship is not None:
        if text_at(relationship, './isOfficer') in ('1', 'true'):
            role = text_at(relationship, './officerTitle') or 'Officer'
        elif text_at(relationship, './isDirector') in ('1', 'true'):
            role = 'Director'

    sales = []
    for txn in root.findall('./nonDerivativeTable/nonDerivativeTransaction'):
        if text_at(txn, './transactionCoding/transactionCode') != SALE_CODE:
            continue
        shares = number_at(txn, './transactionAmounts/transactionShares/value')
        price = number_at(txn, './transactionAmounts/transactionPricePerShare/value')
        traded = text_at(txn, './transactionDate/value')
        if not traded or shares <= 0 or price <= 0:
            continue
        sales.append({
            'date': traded,
            'week': monday_of(traded),
            'filer': owner.upper().strip(),
            'name': display_name(owner),
            'excluded': is_excluded(owner),
            'role': role,
            'shares': int(round(shares)),
            'price': round(price, 4),
            'value': shares * price,
            'accession': accession,
        })
    return sales


def weekly_closes(timestamps, closes, tz_offset):
    """Yahoo's weekly bars folded onto Mondays, latest close per week wins."""
    by_week = {}
    for stamp, close in zip(timestamps, closes):
        if close is None:
            continue
        local = datetime.utcfromtimestamp(stamp + tz_offset).date()
        by_week[monday_of(local.isoformat())] = round(close, 2)
    return [{'week': week, 'close': by_week[week]} for week in sorted(by_week)]


def group_of(sale):
    return 'sievert' if sale['name'] == CEO else 'others'


def roll(rows):
    """Shares, dollars, filings and the named people behind a set of sales.
    Dollars are rounded ONCE, here, and every wider total is a sum of these
    rounded figures — so a week and its days can never differ by a cent."""
    people = defaultdict(lambda: {'shares': 0, 'value': 0.0})
    for row in rows:
        people[row['name']]['shares'] += row['shares']
        people[row['name']]['value'] += row['value']
    named = [
        {'name': name, 'shares': t['shares'], 'value': int(round(t['value']))}
        for name, t in sorted(people.items(), key=lambda kv: -kv[1]['shares'])
    ]
    return {
        'shares': sum(p['shares'] for p in named),
        'value': sum(p['value'] for p in named),
        'txns': len(rows),
        'people': named,
    }


def merge(days):
    """Several day records added together, people and all."""
    people = defaultdict(lambda: {'shares': 0, 'value': 0})
    for day in days:
        for person in day['people']:
            people[person['name']]['shares'] += person['shares']
            people[person['name']]['value'] += person['value']
    named = [
        {'name': name, **totals}
        for name, totals in sorted(people.items(), key=lambda kv: -kv[1]['shares'])
    ]
    return {
        'shares': sum(p['shares'] for p in named),
        'value': sum(p['value'] for p in named),
        'txns': sum(day['txns'] for day in days),
        'people': named,
    }


def sale_days(sales):
    """One record per day somebody sold, per group. The week rollup below is
    what the price chart plots; this is what any question about TIMING has to
    read, because a gap between sales is measured in days, not in Mondays."""
    buckets = defaultdict(list)
    for sale in sales:
        buckets[(sale['date'], group_of(sale))].append(sale)
    return [
        {'date': day, 'week': rows[0]['week'], 'group': group, **roll(rows)}
        for (day, group), rows in sorted(buckets.items())
    ]


def sell_weeks(days, closes_by_week):
    """The day records rolled up per week per group — built FROM the days, so
    the two views of the same sales agree to the dollar."""
    buckets = defaultdict(list)
    for day in days:
        buckets[(day['group'], day['week'])].append(day)

    rolled = defaultdict(list)
    for (group, week), rows in buckets.items():
        rolled[group].append({'week': week, 'close': closes_by_week[week], **merge(rows)})
    for group in rolled:
        rolled[group].sort(key=lambda w: w['week'])
    return rolled


# -- edges ----------------------------------------------------------------

RETRYABLE = (403, 429, 503)


def get(url, headers, attempts=5):
    """One GET, retried through EDGAR's rate limiter, which answers 403/503."""
    for attempt in range(attempts):
        request = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            if error.code not in RETRYABLE or attempt == attempts - 1:
                raise
            time.sleep(1.5 * (2 ** attempt))
        except urllib.error.URLError:
            # a reset mid-run is the same rate limiter, wearing a different hat
            if attempt == attempts - 1:
                raise
            time.sleep(1.5 * (2 ** attempt))
    raise RuntimeError(f'unreachable: {url}')


def form4_filings(window_start):
    """(accession, document) for every Form 4 filed since the window opened."""
    payload = json.loads(get(SUBMISSIONS, SEC_HEADERS))
    recent = payload['filings']['recent']
    filings = []
    for form, filed, accession, document in zip(
            recent['form'], recent['filingDate'],
            recent['accessionNumber'], recent['primaryDocument']):
        if form != '4' or filed < window_start:
            continue
        filings.append((accession, raw_document(document)))
    return filings


def fetch_filing(filing):
    # EDGAR asks for no more than 10 requests a second and answers 403 when
    # pushed; four workers each pausing briefly stays well inside that.
    time.sleep(0.25)
    accession, document = filing
    url = ARCHIVE.format(cik=int(CIK), accession=accession.replace('-', ''),
                         document=document)
    return parse_sales(get(url, SEC_HEADERS), accession)


def fetch_prices():
    payload = json.loads(get(PRICES, YAHOO_HEADERS))
    result = payload['chart']['result'][0]
    quote = result['indicators']['quote'][0]
    return weekly_closes(result['timestamp'], quote['close'],
                         result['meta'].get('gmtoffset', 0))


def render(prices, groups, days, meta):
    def dump(value):
        return json.dumps(value, separators=(', ', ': '))

    lines = [
        '/* ' + '=' * 74,
        '   tmusInsiderSales.js — GENERATED DATA, do not hand-edit.',
        '',
        f'   Prices:  {meta["priceSource"]} — {meta["windowStart"]} to '
        f'{meta["windowEnd"]}.',
        '            The last week is a week to date, read on the fetch date below.',
        f'   Sales:   {meta["insiderSource"]}.',
        "            Transaction code 'S' only (a real sale, open-market or 10b5-1);",
        '            code F tax withholding is not a sale and is not counted.',
        f'   Excluded: {EXCLUDED} — the majority',
        '            owner, whose block trades are nothing like an executive payday.',
        f'   Fetched: {meta["fetched"]}.',
        '',
        '   Weeks are Monday-anchored. Regenerate with',
        '   pages/tmobile/scripts/fetch-edgar-form4-prices.py',
        '   ' + '=' * 74 + ' */',
        '',
        f'export const TMUS_META = {dump(meta)};',
        '',
        '/** Weekly closing price: one point per week. */',
        'export const TMUS_WEEKLY = [',
    ]
    lines += [f'  {dump(p)},' for p in prices]
    lines += [
        '];',
        '',
        "/** Weeks with a sale by the CEO's own sales. */",
        'export const SIEVERT_SELL_WEEKS = [',
    ]
    lines += [f'  {dump(w)},' for w in groups['sievert']]
    lines += [
        '];',
        '',
        '/** Weeks with a sale by any other insider. */',
        'export const OTHER_SELL_WEEKS = [',
    ]
    lines += [f'  {dump(w)},' for w in groups['others']]
    lines += [
        '];',
        '',
        '/** Every day somebody sold, per group — what the timing figures read. */',
        'export const SALE_DAYS = [',
    ]
    lines += [f'  {dump(d)},' for d in days]
    lines += ['];', '']
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true',
                        help='print the module instead of writing it')
    args = parser.parse_args()

    try:
        prices = fetch_prices()
    except (urllib.error.URLError, KeyError, IndexError) as error:
        sys.exit(f'Yahoo prices unreachable or reshaped: {error}')
    if not prices:
        sys.exit('Yahoo returned no weekly closes.')

    window_start, window_end = prices[0]['week'], prices[-1]['week']
    closes_by_week = {p['week']: p['close'] for p in prices}

    try:
        filings = form4_filings(window_start)
    except (urllib.error.URLError, KeyError) as error:
        sys.exit(f'EDGAR submissions index unreachable or reshaped: {error}')
    print(f'{len(filings)} Form 4 filings since {window_start}…', file=sys.stderr)

    with ThreadPoolExecutor(max_workers=3) as pool:
        batches = list(pool.map(fetch_filing, filings))

    # A trade can be filed before the price window opens or after its last
    # Monday; only sales that land on a plotted week can carry a marker.
    parsed = [s for batch in batches for s in batch if s['week'] in closes_by_week]
    dropped = [s for s in parsed if s['excluded']]
    outliers = sorted((s for s in parsed if not s['excluded'] and is_outlier(s)),
                      key=lambda s: s['date'])
    if len(outliers) != len(OUTLIER_TRADES):
        sys.exit(f'Expected {len(OUTLIER_TRADES)} outlier trades to hold out, '
                 f'found {len(outliers)} — check OUTLIER_TRADES against the filings.')
    sales = sorted((s for s in parsed if not s['excluded'] and not is_outlier(s)),
                   key=lambda s: (s['date'], s['name']))
    if not sales:
        sys.exit('No code-S sales parsed — the Form 4 shape changed.')

    unmapped = sorted({s['filer'] for s in sales if s['filer'] not in DISPLAY_NAME})
    if unmapped:
        print(f'NOTE: unmapped filer names, spelled from EDGAR: {unmapped}',
              file=sys.stderr)

    days = sale_days(sales)
    groups = sell_weeks(days, closes_by_week)
    meta = {
        'symbol': 'TMUS',
        'priceSource': 'Yahoo Finance (weekly close)',
        'insiderSource': 'SEC Form 4 filings (the source Nasdaq mirrors)',
        'windowStart': window_start,
        'windowEnd': window_end,
        'excludedFilers': [EXCLUDED],
        'excludedTxns': len(dropped),
        'excludedShares': int(round(sum(s['shares'] for s in dropped))),
        # the held-out block trades, so the page can name them from the data
        # rather than from prose that can go stale
        'outliers': [
            {
                'date': s['date'], 'name': s['name'], 'shares': s['shares'],
                'price': s['price'], 'value': int(round(s['value'])),
            }
            for s in outliers
        ],
        'saleTxnCount': len(sales),
        'sellerCount': len({s['name'] for s in sales}),
        'firstSale': sales[0]['date'],
        'lastSale': sales[-1]['date'],
        'saleDayCount': len(days),
        'filingsRead': len(filings),
        'fetched': date.today().isoformat(),
    }

    module = render(prices, groups, days, meta)
    if args.dry_run:
        print(module)
        return
    OUT.write_text(module, encoding='utf-8')
    print(f'{OUT}: {len(prices)} weeks, {len(sales)} sales by '
          f'{meta["sellerCount"]} people, last on {meta["lastSale"]} '
          f'({len(outliers)} block trade held out, {len(dropped)} {EXCLUDED} rows)')


if __name__ == '__main__':
    main()
