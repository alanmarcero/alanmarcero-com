#!/usr/bin/env python3
"""Price Boston to New Orleans for the flights card on /neworleans and rewrite its data.

    .venv-flights/bin/python pages/neworleans/scripts/sweep-msy-flights.py
    .venv-flights/bin/python pages/neworleans/scripts/sweep-msy-flights.py --dry-run

The venv recipe and the Google client are the /flights sweep's; see the
docstring of pages/flights/scripts/sweep-flights.py. This script imports
its request and parsing code and changes nothing in it.

The trip: 3 seats, nonstop both ways, 5 nights, every departure day for
the next 365 days. The outbound leaves BOS between 05:00 and 11:00. The
return leaves MSY between 14:00 and 19:00.

Each leg is priced as a one-way. A round-trip query reports only the
outbound, so it cannot apply a time window to the return. For each day,
the cheapest outbound is paired with the cheapest return ON THE SAME
AIRLINE, so the pair can be booked as one round trip. JetBlue is priced
as a second pair.

The cheapest trips are then priced again as real round trips, to confirm
the one-way sum. A round-trip fare can come back lower, and Google does
not say which return it uses (on the date checked by hand, it was a
return outside the afternoon window). The page shows that fare apart
and does not count it as a match.

primp 1.3.1 no longer has the `chrome_126` profile the /flights sweep
asks for. It then picks a random profile, and some profiles get a page
the parser reads as rows with a price and no times. This script asks
for `chrome_146` and retries an answer that has no times.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import re
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
PAGE = ROOT / "pages" / "neworleans" / "index.html"

_spec = importlib.util.spec_from_file_location("sweep", ROOT / "pages" / "flights" / "scripts" / "sweep-flights.py")
sweep = importlib.util.module_from_spec(_spec)
sys.modules["sweep"] = sweep          # dataclasses look their module up here
_spec.loader.exec_module(sweep)

_Client = sweep.Client
sweep.Client = lambda **kw: _Client(**{**kw, "impersonate": "chrome_146"})

HOME, FAR = "BOS", "MSY"
PARTY = {"adults": 3, "children": 0, "seats": 3, "label": "3 adults"}
NIGHTS = 5
DAYS = 365
OUT_WINDOW = (5, 11)      # departure hour, inclusive of 11:00 exactly
BACK_WINDOW = (14, 19)
VERIFY_TOP = 12
PREFERRED = sweep.PREFERRED
MARK = re.compile(r'(<script id="fx-data">\s*const MSY_FLIGHTS = ).*?(;\s*</script>)', re.S)


def in_window(iso: str, window: tuple[int, int]) -> bool:
    t = datetime.fromisoformat(iso)
    minutes = t.hour * 60 + t.minute
    return window[0] * 60 <= minutes <= window[1] * 60


def leg_options(day: date, frm: str, to: str):
    """Nonstop one-way rows for one day. None if Google never answered with times."""
    for _ in range(4):
        options = sweep.query([(day, frm, to)], PARTY, sweep.STOPS_NONSTOP)
        if options is None:
            continue
        if options and not any(o.dep for o in options):
            continue          # a markup the parser cannot read; ask again
        return [o for o in options if o.stops == 0 and o.dep]
    return None


def leg(option) -> dict:
    return {"airline": option.carrier, "dep": option.dep, "arr": option.arr, "dur": option.dur}


def pair(outs, backs, carrier=None) -> dict | None:
    """Cheapest same-airline outbound + return, optionally for one airline."""
    best = None
    for code in {o.carrier for o in outs} & {b.carrier for b in backs}:
        if carrier and code != carrier:
            continue
        o = min((x for x in outs if x.carrier == code), key=lambda x: x.price)
        b = min((x for x in backs if x.carrier == code), key=lambda x: x.price)
        if best is None or o.price + b.price < best["price"]:
            best = {"price": o.price + b.price, "airline": code, "out": leg(o), "back": leg(b)}
    return best


def round_trip_check(trip) -> int | None:
    """The same dates as a real round-trip fare, on the trip's airline and outbound window."""
    dep, ret = date.fromisoformat(trip["dep"]), date.fromisoformat(trip["ret"])
    for _ in range(4):
        rows = sweep.query([(dep, HOME, FAR), (ret, FAR, HOME)], PARTY, sweep.STOPS_NONSTOP)
        if rows is None or (rows and not any(r.dep for r in rows)):
            continue
        fit = [r.price for r in rows
               if r.carrier == trip["all"]["airline"] and r.dep and in_window(r.dep, OUT_WINDOW)]
        return min(fit) if fit else None
    return None


def main():
    args = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    args.add_argument("--dry-run", action="store_true", help="print the JSON, write nothing")
    dry = args.parse_args().dry_run

    today = date.today()
    days = [today + timedelta(days=n) for n in range(1, DAYS + 1)]
    backs = [d + timedelta(days=NIGHTS) for d in days]

    with ThreadPoolExecutor(max_workers=sweep.WORKERS) as pool:
        out_rows = list(pool.map(lambda d: leg_options(d, HOME, FAR), days))
        back_rows = list(pool.map(lambda d: leg_options(d, FAR, HOME), backs))

    # A second pass, one at a time, for the days Google did not answer under load.
    for rows, frm, to, when in ((out_rows, HOME, FAR, days), (back_rows, FAR, HOME, backs)):
        for i, got in enumerate(rows):
            if got is None:
                rows[i] = leg_options(when[i], frm, to)

    trips, unanswered, carriers = [], [], {}
    for dep, ret, outs, rets in zip(days, backs, out_rows, back_rows):
        if outs is None or rets is None:
            unanswered.append(dep.isoformat())
            continue
        for o in outs + rets:
            carriers[o.carrier] = o.carrier_name
        outs = [o for o in outs if in_window(o.dep, OUT_WINDOW)]
        rets = [b for b in rets if in_window(b.dep, BACK_WINDOW)]
        best = pair(outs, rets)
        if best:
            trips.append({"dep": dep.isoformat(), "ret": ret.isoformat(),
                          "all": best, "jb": pair(outs, rets, PREFERRED)})
    trips.sort(key=lambda t: (t["all"]["price"], t["dep"]))

    with ThreadPoolExecutor(max_workers=sweep.WORKERS) as pool:
        checks = list(pool.map(round_trip_check, trips[:VERIFY_TOP]))
    for trip, rt in zip(trips, checks):
        trip["rt"] = rt

    data = {
        "swept": today.isoformat(),
        "origin": HOME, "far": FAR, "seats": PARTY["seats"], "party": PARTY["label"],
        "nights": NIGHTS, "outWindow": OUT_WINDOW, "backWindow": BACK_WINDOW,
        "threshold": sweep.SWITCH_THRESHOLD, "days": DAYS, "unanswered": unanswered,
        "carriers": carriers, "trips": trips,
    }
    blob = json.dumps(data, separators=(",", ":"))
    print(f"{len(trips)} trips priced, {len(unanswered)} days unanswered {unanswered}, "
          f"cheapest {trips[0]['all']['price'] if trips else None}", file=sys.stderr)
    if dry:
        print(json.dumps(data, indent=1))
        return
    html = PAGE.read_text()
    if not MARK.search(html):
        sys.exit(f"no fx-data block in {PAGE}")
    PAGE.write_text(MARK.sub(lambda m: m.group(1) + blob + m.group(2), html, count=1))


if __name__ == "__main__":
    main()
