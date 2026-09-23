#!/usr/bin/env python3
"""
GENERATOR — writes pages/tmobile/src/data/tmusDailyCloses.js

The drawdown chart's data: every daily close Yahoo Finance holds for TMUS, from
the first trade on 2007-04-19 (as MetroPCS, which became T-Mobile US in the
2013 reverse merger) to the last completed session.

The fetching lives in scripts/yahoo_daily.py, shared with the /stocks page —
read its docstring: null closes, mid-session runs and split adjustment each
produce a chart that looks right and is not.

Run:  python3 pages/tmobile/scripts/fetch-yahoo-daily-closes.py
      python3 pages/tmobile/scripts/fetch-yahoo-daily-closes.py --dry-run
"""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'scripts'))
from yahoo_daily import HoleInSeries, fetch_daily_closes, row_lines  # noqa: E402

OUT = Path(__file__).resolve().parents[1] / 'src' / 'data' / 'tmusDailyCloses.js'


def render(rows, info):
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
        *row_lines(rows),
        '];',
        '',
    ]
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true',
                        help='print the module instead of writing it')
    args = parser.parse_args()

    try:
        rows, fetched = fetch_daily_closes('TMUS', log=lambda m: print(m, file=sys.stderr))
    except HoleInSeries as error:
        sys.exit(f'{error}; refusing to write a series with a hole in it.')

    info = {
        'symbol': 'TMUS',
        'source': 'Yahoo Finance (daily close, split-adjusted)',
        **{k: fetched[k] for k in ('first', 'last', 'sessions', 'repaired', 'splits', 'fetched')},
    }
    module = render(rows, info)
    if args.dry_run:
        print(module)
        return
    OUT.write_text(module)
    print(f'Wrote {OUT} — {info["sessions"]} sessions, {info["first"]} to {info["last"]}.',
          file=sys.stderr)


if __name__ == '__main__':
    main()
