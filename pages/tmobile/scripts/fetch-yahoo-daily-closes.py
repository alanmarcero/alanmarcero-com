#!/usr/bin/env python3
"""
GENERATOR — writes pages/tmobile/src/data/tmusDailyCloses.js

The drawdown chart's data: every daily close Yahoo Finance holds for TMUS, from
the first trade on 2007-04-19 (as MetroPCS, which became T-Mobile US in the
2013 reverse merger) to the last completed session.

Three things that will bite whoever runs this next:

1.  YAHOO RETURNS A NULL CLOSE FOR THE ODD SESSION. The bar is there, its
    timestamp is there, and every field in it is null — 2026-09-22 was one. A
    skipped day is not harmless on this chart: that day was the lowest close of
    the drawdown in progress, so skipping it understated the trough. The close
    is recovered from `chartPreviousClose` on a one-day window opening the day
    AFTER the gap, which is that missing day's close by definition. Hourly bars
    are no substitute — their last print is not the closing auction.

2.  RUN MID-SESSION AND THE LAST BAR IS NOT A CLOSE. Yahoo appends today's
    session as a daily bar while it trades. A chart of daily closes must not
    carry a price that will move before 4pm, so a bar dated today is dropped
    unless the regular session has ended.

3.  PRICES ARE SPLIT-ADJUSTED, NOT DIVIDEND-ADJUSTED. `close` is adjusted for
    the 1-for-2 reverse split of 2013-05-01 (so a 2007 close reads as double
    what MetroPCS printed that day) and for nothing else. `adjclose` would also
    fold dividends in, which moves every price before 2023 and turns a peak into
    a total-return peak. The page is about closing prices, so it plots `close`.

Run:  python3 pages/tmobile/scripts/fetch-yahoo-daily-closes.py
      python3 pages/tmobile/scripts/fetch-yahoo-daily-closes.py --dry-run
"""

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

CHART = 'https://query1.finance.yahoo.com/v8/finance/chart/TMUS'
HISTORY = f'{CHART}?interval=1d&period1=0&period2=9999999999&events=split'
DAY = 86400

# Yahoo rejects a default urllib User-Agent.
HEADERS = {
    'User-Agent': ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                   'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'),
    'Accept': 'application/json',
}

# A recovered close further than this from both of its neighbours is not a
# close — it is a unit slip or an unadjusted pre-split figure.
MAX_REPAIR_JUMP = 0.25

OUT = Path(__file__).resolve().parents[1] / 'src' / 'data' / 'tmusDailyCloses.js'


# -- pure helpers ---------------------------------------------------------

def session_date(stamp, tz_offset):
    """The exchange-local date a bar's timestamp belongs to."""
    return datetime.fromtimestamp(stamp + tz_offset, tz=timezone.utc).date().isoformat()


def completed_bars(timestamps, closes, tz_offset, now, session_end):
    """(date, close-or-None) per bar, without a session still trading."""
    today = session_date(now, tz_offset)
    bars = [(session_date(t, tz_offset), c) for t, c in zip(timestamps, closes)]
    if bars and bars[-1][0] == today and now < session_end:
        bars = bars[:-1]
    return bars


def plausible(value, before, after):
    """A recovered close has to sit near at least one of its neighbours."""
    near = [n for n in (before, after) if n]
    return any(abs(value - n) / n <= MAX_REPAIR_JUMP for n in near)


# -- edges ----------------------------------------------------------------

def get(url, attempts=4):
    for attempt in range(attempts):
        try:
            request = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(request, timeout=60) as response:
                return json.loads(response.read())
        except (urllib.error.HTTPError, urllib.error.URLError):
            if attempt == attempts - 1:
                raise
            time.sleep(1.5 * (2 ** attempt))
    raise RuntimeError(f'unreachable: {url}')


def recover_close(iso, tz_offset):
    """A missing day's close, read as the previous close of the day after it."""
    midnight = datetime.fromisoformat(iso).replace(tzinfo=timezone.utc)
    start = int(midnight.timestamp()) - tz_offset + DAY
    payload = get(f'{CHART}?interval=1d&period1={start}&period2={start + DAY * 5}')
    return payload['chart']['result'][0]['meta'].get('chartPreviousClose')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true',
                        help='print the module instead of writing it')
    args = parser.parse_args()

    try:
        result = get(HISTORY)['chart']['result'][0]
        closes = result['indicators']['quote'][0]['close']
        meta = result['meta']
    except (urllib.error.URLError, KeyError, IndexError) as error:
        sys.exit(f'Yahoo daily history unreachable or reshaped: {error}')

    tz_offset = meta.get('gmtoffset', 0)
    now = int(time.time())
    session_end = meta['currentTradingPeriod']['regular']['end']
    bars = completed_bars(result['timestamp'], closes, tz_offset, now, session_end)

    repaired = []
    for i, (iso, close) in enumerate(bars):
        if close is not None:
            continue
        value = recover_close(iso, tz_offset)
        before = bars[i - 1][1] if i > 0 else None
        after = bars[i + 1][1] if i + 1 < len(bars) else None
        if value is None or not plausible(value, before, after):
            sys.exit(f'No trustworthy close for {iso} (recovered {value}); '
                     'refusing to write a series with a hole in it.')
        bars[i] = (iso, value)
        repaired.append(iso)
        print(f'{iso}: null close recovered as {value:.2f}', file=sys.stderr)

    rows = [[iso, round(close, 2)] for iso, close in bars]
    splits = sorted((result.get('events') or {}).get('splits', {}).values(),
                    key=lambda s: s['date'])
    info = {
        'symbol': 'TMUS',
        'source': 'Yahoo Finance (daily close, split-adjusted)',
        'first': rows[0][0],
        'last': rows[-1][0],
        'sessions': len(rows),
        'repaired': repaired,
        'splits': [{'date': session_date(s['date'], tz_offset), 'ratio': s['splitRatio']}
                   for s in splits],
        'fetched': date.today().isoformat(),
    }

    lines = [
        '/* ' + '=' * 74,
        '   tmusDailyCloses.js — GENERATED DATA, do not hand-edit.',
        '',
        f'   {info["source"]}: {info["first"]} to {info["last"]},',
        f'   {info["sessions"]} sessions. Fetched {info["fetched"]}.',
        '',
        '   Regenerate with pages/tmobile/scripts/fetch-yahoo-daily-closes.py',
        '   ' + '=' * 74 + ' */',
        '',
        f'export const TMUS_DAILY_META = {json.dumps(info, separators=(", ", ": "))};',
        '',
        '/** [date, close] for every session, oldest first. */',
        'export const TMUS_DAILY = [',
    ]
    # eight sessions a line keeps ~5,000 rows readable in a diff
    for i in range(0, len(rows), 8):
        chunk = ','.join(json.dumps(r, separators=(',', ':')) for r in rows[i:i + 8])
        lines.append(f'  {chunk},')
    lines += ['];', '']
    module = '\n'.join(lines)

    if args.dry_run:
        print(module)
        return
    OUT.write_text(module)
    print(f'Wrote {OUT} — {info["sessions"]} sessions, {info["first"]} to {info["last"]}.',
          file=sys.stderr)


if __name__ == '__main__':
    main()
