"""
Every daily close Yahoo Finance holds for one symbol — the library behind the
drawdown generators (pages/tmobile/scripts/fetch-yahoo-daily-closes.py and
pages/stocks/scripts/fetch-daily-closes.py). Not a script: import it.

Three things that will bite whoever changes this next:

1.  YAHOO RETURNS A NULL CLOSE FOR THE ODD SESSION. The bar is there, its
    timestamp is there, and every field in it is null — 2026-09-22 was one, in
    TMUS, BRK-B and six of the sector funds at once. A skipped day is not
    harmless on a drawdown chart: in TMUS that day was the lowest close of the
    drawdown in progress, so skipping it understated the trough. The close is
    recovered from `chartPreviousClose` on a window opening the day AFTER the
    gap, which is that missing day's close by definition. Hourly bars are no
    substitute — their last print is not the closing auction.

2.  RUN MID-SESSION AND THE LAST BAR IS NOT A CLOSE. Yahoo appends today's
    session as a daily bar while it trades. A chart of daily closes must not
    carry a price that will move before the bell, so a bar dated today is
    dropped unless the regular session has ended. Crypto never closes: its
    "session" is the UTC day, and the same rule drops the day in progress.

3.  PRICES ARE SPLIT-ADJUSTED, NOT DIVIDEND-ADJUSTED. `close` is adjusted for
    splits and nothing else; `adjclose` would also fold dividends in, which
    moves every older price and turns a peak into a total-return peak. These
    charts are about closing prices, so they use `close`.
"""

import json
import time
import urllib.error
import urllib.request
from datetime import date, datetime, timezone

CHART = 'https://query1.finance.yahoo.com/v8/finance/chart/{symbol}'
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


class HoleInSeries(Exception):
    """A null close that could not be recovered."""


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


def recover_close(symbol, iso, tz_offset):
    """A missing day's close, read as the previous close of the day after it."""
    midnight = datetime.fromisoformat(iso).replace(tzinfo=timezone.utc)
    start = int(midnight.timestamp()) - tz_offset + DAY
    url = CHART.format(symbol=symbol) + f'?interval=1d&period1={start}&period2={start + DAY * 5}'
    return get(url)['chart']['result'][0]['meta'].get('chartPreviousClose')


def fetch_daily_closes(symbol, log=print):
    """
    ([[date, close], …], info) for every completed session Yahoo holds.
    Raises HoleInSeries rather than return a series with a gap in it.
    """
    url = CHART.format(symbol=symbol) + '?interval=1d&period1=0&period2=9999999999&events=split'
    result = get(url)['chart']['result'][0]
    meta = result['meta']
    tz_offset = meta.get('gmtoffset', 0)
    bars = completed_bars(result['timestamp'], result['indicators']['quote'][0]['close'],
                          tz_offset, int(time.time()),
                          meta['currentTradingPeriod']['regular']['end'])

    repaired = []
    for i, (iso, close) in enumerate(bars):
        if close is not None:
            continue
        value = recover_close(symbol, iso, tz_offset)
        before = bars[i - 1][1] if i > 0 else None
        after = bars[i + 1][1] if i + 1 < len(bars) else None
        if value is None or not plausible(value, before, after):
            raise HoleInSeries(f'{symbol}: no trustworthy close for {iso} (recovered {value})')
        bars[i] = (iso, value)
        repaired.append(iso)
        log(f'{symbol} {iso}: null close recovered as {value:.2f}')

    rows = [[iso, round(close, 2)] for iso, close in bars]
    splits = sorted((result.get('events') or {}).get('splits', {}).values(),
                    key=lambda s: s['date'])
    info = {
        'symbol': symbol,
        'name': meta.get('longName') or meta.get('shortName') or symbol,
        'first': rows[0][0],
        'last': rows[-1][0],
        'sessions': len(rows),
        'repaired': repaired,
        'splits': [{'date': session_date(s['date'], tz_offset), 'ratio': s['splitRatio']}
                   for s in splits],
        'fetched': date.today().isoformat(),
    }
    return rows, info


def row_lines(rows, per_line=8):
    """The rows as JS array lines, eight sessions a line to keep diffs readable."""
    return [
        '  ' + ','.join(json.dumps(r, separators=(',', ':')) for r in rows[i:i + per_line]) + ','
        for i in range(0, len(rows), per_line)
    ]
