#!/usr/bin/env python3
"""
GENERATOR — writes pages/tmobile/src/data/tmusMonthlySales.js

Pulls T-Mobile US insider activity from the same feed that backs
nasdaq.com/market-activity/stocks/tmus/insider-activity, keeps only the sale
rows, drops DEUTSCHE TELEKOM AG, and rolls what is left up by calendar month.

Four things about this feed that will bite whoever runs it next:

1.  THE FEED IS CAPPED AT 250 ROWS, AND THE CAP IS SILENT. `totalRecords`
    does not move with what you ask for (it has read 250 and 251 while the
    body held exactly 250 rows), and `offset=250` returns an empty row list
    with that same count — so a paging loop looks like it reached the end of
    the data when it actually reached the end of the window. The metadata
    below therefore records the rows that ARRIVED, not the total the feed
    claims, and `feedCapped` says whether the cap is what bit — the window is
    ALSO bounded at about two years, so once old rows age out the count can
    come in under 250 and asking for 500 changes nothing. The page reads
    `feedCapped` to say which of the two bounds it is up against. Every trade type shares the 250, so the ~40% of rows that are
    grants and tax withholdings eat into the history the sales can cover. Two
    years is all this page can honestly chart; the five-year series next to it
    comes from EDGAR, which has no such cap.

2.  A DISPOSITION IS NOT A SALE. The feed's `transactionType` has five values.
    "Sell" and "Automatic Sell" are sales (open market and 10b5-1). "Disposition
    (Non Open Market)" is overwhelmingly shares withheld to cover tax on a vest
    — SEC code F — and counting it inflates the total with money nobody chose
    to take off the table. Only the two Sell types are kept.

3.  ONE MORE TRADE IS HELD OUT, BY NAME. OUTLIER_TRADES carries a single block
    trade that the five-year generator also holds out; the two must agree,
    because a test asserts the two series match over the window they share,
    so the list lives once, in tmus_insiders.py. Both scripts fail loudly
    rather than quietly keeping it if the feed stops covering that date.

4.  DEUTSCHE TELEKOM IS MOST OF THE FEED. The majority owner files 97 of the
    152 sale rows and 6.4M of the 7.7M shares. Leaving it in flattens every
    executive's trade into the axis, which is why it is excluded — the same
    call the five-year chart on this page makes.

Run:  python3 pages/tmobile/scripts/fetch-nasdaq-insider-sales.py
      python3 pages/tmobile/scripts/fetch-nasdaq-insider-sales.py --dry-run
"""

import argparse
import json
import sys
import urllib.error
import urllib.request
from datetime import date, datetime
from pathlib import Path

from tmus_insiders import DISPLAY_NAME, EXCLUDED, OUTLIER_TRADES, ranked, tally_by_person

FEED_CAP = 250
FEED = ('https://api.nasdaq.com/api/company/TMUS/insider-trades'
        f'?limit={FEED_CAP}&type=ALL&sortColumn=lastDate&sortOrder=DESC')
PAGE = 'https://www.nasdaq.com/market-activity/stocks/tmus/insider-activity'

# The feed rejects a default urllib agent.
HEADERS = {
    'User-Agent': ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                   'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'),
    'Accept': 'application/json',
}

SALE_TYPES = ('Sell', 'Automatic Sell')
CEO = 'SIEVERT G MICHAEL'

OUT = Path(__file__).resolve().parents[1] / 'src' / 'data' / 'tmusMonthlySales.js'


# -- pure helpers ---------------------------------------------------------

def to_number(text):
    """'42,769' and '$216.26' -> float."""
    cleaned = (text or '').replace(',', '').replace('$', '').strip()
    if not cleaned:
        return 0.0
    return float(cleaned)


def to_iso(mdy):
    """Nasdaq's '10/16/2024' -> '2024-10-16'."""
    return datetime.strptime(mdy.strip(), '%m/%d/%Y').date().isoformat()


def month_of(iso):
    return iso[:7]


def month_range(first, last):
    """Every month from `first` to `last` inclusive — gaps included, because a
    month with no sale is a fact and must occupy a slot on the axis."""
    year, month = int(first[:4]), int(first[5:7])
    end = (int(last[:4]), int(last[5:7]))
    months = []
    while (year, month) <= end:
        months.append(f'{year:04d}-{month:02d}')
        year, month = (year + 1, 1) if month == 12 else (year, month + 1)
    return months


def is_sale(row):
    return row.get('transactionType') in SALE_TYPES


def is_outlier(row):
    return (to_iso(row['lastDate']), row['insider']) in OUTLIER_TRADES


def parse_sale(row):
    shares = to_number(row['sharesTraded'])
    price = to_number(row['lastPrice'])
    return {
        'date': to_iso(row['lastDate']),
        'name': DISPLAY_NAME.get(row['insider'], row['insider'].title()),
        'filer': row['insider'],
        'relation': row.get('relation', ''),
        'kind': 'plan' if row['transactionType'] == 'Automatic Sell' else 'market',
        'own': 'indirect' if row.get('ownType') == 'Indirect' else 'direct',
        'shares': int(round(shares)),
        'price': round(price, 2),
        'value': int(round(shares * price)),
    }


def group_of(sale):
    return 'sievert' if sale['filer'] == CEO else 'others'


def roll_up(sales, months):
    """One record per month, each carrying the two groups separately."""
    buckets = {m: {'sievert': [], 'others': []} for m in months}
    for sale in sales:
        buckets[month_of(sale['date'])][group_of(sale)].append(sale)

    records = []
    for month in months:
        record = {'month': month}
        for group in ('sievert', 'others'):
            rows = buckets[month][group]
            record[group] = {
                'shares': sum(r['shares'] for r in rows),
                'value': sum(r['value'] for r in rows),
                'txns': len(rows),
                'people': ranked(tally_by_person(rows)),
            }
        records.append(record)
    return records


# -- edges ----------------------------------------------------------------

def fetch():
    request = urllib.request.Request(FEED, headers=HEADERS)
    with urllib.request.urlopen(request, timeout=60) as response:
        payload = json.load(response)
    table = payload['data']['transactionTable']
    rows = table['table']['rows'] or []
    if not rows:
        sys.exit('Nasdaq returned no transaction rows — the feed shape changed.')
    return rows, table['totalRecords']


def render(records, sales, meta):
    def dump(value):
        return json.dumps(value, separators=(', ', ': '))

    lines = [
        '/* ' + '=' * 71,
        '   tmusMonthlySales.js — GENERATED DATA, do not hand-edit.',
        '',
        '   Source: Nasdaq insider activity for TMUS (the feed behind',
        f'   {PAGE}),',
        f'   read {meta["fetched"]}. The feed hands back 250 transactions and no more,',
        '   which is what fixes this window at two years rather than five.',
        '',
        '   Kept: transaction types "Sell" and "Automatic Sell" — an actual sale,',
        '   open-market or under a 10b5-1 plan. Dispositions (shares withheld to',
        '   cover tax on a vest), grants and option exercises are not sales.',
        f'   Dropped: {EXCLUDED}, the majority owner, whose block trades',
        "   are nothing like an executive's payday.",
        '',
        '   Regenerate with pages/tmobile/scripts/fetch-nasdaq-insider-sales.py',
        '   ' + '=' * 71 + ' */',
        '',
        f'export const NASDAQ_META = {dump(meta)};',
        '',
        '/** One record per calendar month in the window, months with no sale included. */',
        'export const MONTHLY_SALES = [',
    ]
    lines += [f'  {dump(r)},' for r in records]
    lines += [
        '];',
        '',
        '/** Every kept sale transaction, oldest first — the table view reads this. */',
        'export const SALE_TXNS = [',
    ]
    lines += [f'  {dump(s)},' for s in sales]
    lines += ['];', '']
    return '\n'.join(lines)


def build_meta(rows, total, sale_rows, dropped, outlier_rows, kept,
               covered, months, records, fetched):
    return {
        'symbol': 'TMUS',
        'source': 'Nasdaq insider activity',
        'sourceUrl': PAGE,
        'fetched': fetched,
        'feedRecords': len(rows),
        'feedReported': int(total),
        'feedCapped': len(rows) >= FEED_CAP,
        'saleRows': len(sale_rows),
        'excludedFiler': EXCLUDED,
        'excludedRows': len(dropped),
        'excludedShares': int(round(sum(to_number(r['sharesTraded']) for r in dropped))),
        'outliers': [
            {k: v for k, v in parse_sale(r).items()
             if k in ('date', 'name', 'shares', 'price', 'value')}
            for r in sorted(outlier_rows, key=lambda r: to_iso(r['lastDate']))
        ],
        'txnCount': len(kept),
        'sellerCount': len({s['name'] for s in kept}),
        'feedFirst': covered[0],
        'feedLast': covered[-1],
        'firstSale': kept[0]['date'],
        'lastSale': kept[-1]['date'],
        'monthCount': len(months),
        'quietMonths': sum(
            1 for r in records if not r['sievert']['txns'] and not r['others']['txns']),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true',
                        help='print the module instead of writing it')
    args = parser.parse_args()

    try:
        rows, total = fetch()
    except urllib.error.URLError as error:
        sys.exit(f'Nasdaq feed unreachable: {error}')

    sale_rows = [r for r in rows if is_sale(r)]
    dropped = [r for r in sale_rows if r['insider'] == EXCLUDED]
    outlier_rows = [r for r in sale_rows
                    if r['insider'] != EXCLUDED and is_outlier(r)]
    if len(outlier_rows) != len(OUTLIER_TRADES):
        sys.exit(f'Expected {len(OUTLIER_TRADES)} outlier trades to hold out, '
                 f'found {len(outlier_rows)} — the feed no longer covers that '
                 f'date, or the five-year generator has moved on without this one.')
    kept = sorted((parse_sale(r) for r in sale_rows
                   if r['insider'] != EXCLUDED and not is_outlier(r)),
                  key=lambda s: (s['date'], s['name']))

    # The axis spans the feed's OWN coverage, not just the months that happen
    # to contain a sale — otherwise a run of quiet months at either end reads
    # as missing data instead of as nobody selling. The two edge months are
    # partial, which is the 250-row cap showing at one end and the read date at
    # the other, and the page says so.
    covered = sorted(to_iso(r['lastDate']) for r in rows)
    months = month_range(month_of(covered[0]), month_of(covered[-1]))
    records = roll_up(kept, months)

    meta = build_meta(rows, total, sale_rows, dropped, outlier_rows, kept,
                      covered, months, records, fetched=date.today().isoformat())

    module = render(records, kept, meta)
    if args.dry_run:
        print(module)
        return
    OUT.write_text(module, encoding='utf-8')
    print(f'{OUT}: {len(kept)} sales, {len(months)} months, '
          f'{meta["quietMonths"]} of them quiet')


if __name__ == '__main__':
    main()
