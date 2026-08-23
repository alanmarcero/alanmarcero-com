#!/usr/bin/env python3
"""Re-check the favourite routes on the /flights board and rewrite flights.html.

Run it again whenever the fares are stale:

    python3 -m venv .venv-flights
    .venv-flights/bin/pip install fast-flights typing_extensions
    .venv-flights/bin/python scripts/sweep-flights.py

    # look before you leap
    .venv-flights/bin/python scripts/sweep-flights.py --dry-run

FAVOURITES below is the list, and it is the only thing to edit to add or
drop a route. Everything else — the board's regions, the gates, the
footer counts — follows from it.

Why not the fli MCP, which is what this board was built on: its
GetShoppingResults RPC answers every query with an HTTP 200 whose body is
`[["wrb.fr",null,null,null,null,[13]]]` — gRPC INTERNAL. The client reads
that as an empty result set, so a broken endpoint is reported as
`{"success": true, "count": 0}`. Confirmed against one-way, round-trip,
near and far dates, four locales and a trivially-populated route;
`flights` 0.9.0 is the latest release, so there is no upgrade to take.
This sweep reads Google's own /travel/flights results page instead, via
the published fast-flights package.

The one trap worth knowing before editing anything here: asking this API
for nonstop flights does not work the obvious way. See the STOPS_*
constants — a plain `max_stops=0` silently returns connecting itineraries,
which is a wrong board that looks like a right one.

Two things the basis change costs, both surfaced on the page rather than
buried here:

- No bag filter. fli's RPC carried `[checked_bags, carry_on]`; the tfs
  message the results page takes has no equivalent — every plausible
  field number was probed and none moved the price. Fares are base fares.
- No paired return leg. A round-trip query returns outbound options
  priced against whatever return Google can pair, and the page never sees
  that return. The return shown is a second lookup: the same carrier's
  cheapest nonstop on the return date. It is labelled as that.
"""

from __future__ import annotations

import argparse
import base64
import json
import re
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path

try:
    from fast_flights import FlightData, Passengers, create_filter
    from fast_flights.core import parse_response
    from fast_flights.primp import Client
except ImportError:  # pragma: no cover - the script is a manual tool
    sys.exit("fast-flights is not installed — see the module docstring for the venv recipe.")

ROOT = Path(__file__).resolve().parent.parent
BOARD = ROOT / "index.html"

# --- What gets checked -------------------------------------------------
# `dir` is "out" for a trip leaving Boston and "in" for the same trip run
# the other way, which is priced from the far airport and for one seat.
FAVOURITES = [
    {"code": "AMS", "city": "Amsterdam", "region": "Europe", "dir": "out"},
    {"code": "LHR", "city": "London–Heathrow", "region": "Europe", "dir": "out"},
    {"code": "LGW", "city": "London–Gatwick", "region": "Europe", "dir": "out"},
    {"code": "EDI", "city": "Edinburgh", "region": "Europe", "dir": "out"},
    {"code": "PHL", "city": "Philadelphia", "region": "Northeast", "dir": "out"},
    {"code": "YOW", "city": "Ottawa", "region": "Canada", "dir": "out"},
    {"code": "CLT", "city": "Charlotte", "region": "Southeast", "dir": "out"},
    {"code": "AVL", "city": "Asheville", "region": "Southeast", "dir": "out"},
    {"code": "SFO", "city": "San Francisco", "region": "West", "dir": "out"},
    {"code": "NRT", "city": "Tokyo", "region": "Asia", "dir": "out"},
    {"code": "HKG", "city": "Hong Kong", "region": "Asia", "dir": "out"},
    {"code": "MBJ", "city": "Montego Bay", "region": "Caribbean & Latin America", "dir": "out"},
    {"code": "AVL", "city": "Asheville", "region": "Round trip into Boston", "dir": "in"},
    {"code": "CLT", "city": "Charlotte", "region": "Round trip into Boston", "dir": "in"},
]

HOME = "BOS"
NIGHTS = 5
SAMPLE_DAYS = (4, 11, 18, 25)   # four departures a month, not one
MONTHS = 12
OUT_PARTY = {"adults": 2, "children": 1, "seats": 3, "label": "2 adults + 1 child"}
IN_PARTY = {"adults": 1, "children": 0, "seats": 1, "label": "1 traveller"}
PREFERRED = "B6"                # JetBlue — the airline the board is built around
SWITCH_THRESHOLD = 500          # only leave JetBlue if another nonstop saves more than this

# Google's stops filter is a literal count, so nonstop is 0 — and that is
# the one value protobuf will not put on the wire, because proto3 skips a
# scalar sitting at its default. Passing max_stops=0 therefore sends no
# filter at all and quietly returns connecting itineraries. Serialising a
# stand-in and rewriting that single byte to zero keeps the field present,
# which is the difference between a nonstop board and a board that only
# looks like one. Verified: BOS-PHL comes back 33 rows, every one nonstop,
# at the same fare the unconstrained query's cheapest nonstop shows.
STOPS_NONSTOP = 0
STOPS_ONE_OR_FEWER = 1
_STOPS_SENTINEL = 7                       # 0x07: never appears in the ASCII payload
_STOPS_TAG = bytes([(5 << 3) | 0])        # FlightData.max_stops, varint

# Below this many priced days out of the sample, sampling is not measuring
# the route and every departure gets checked instead.
DENSE_SCAN_BELOW = 12

WORKERS = 4
ATTEMPTS = 3                    # an empty page is indistinguishable from no service
EMPTY_ATTEMPTS = 2              # ...but most empties are just past the booking window
PACE_SECONDS = 0.45

# fast-flights reports carrier names; the board stores IATA codes.
CODES = {
    "JetBlue": "B6", "Delta": "DL", "American": "AA", "United": "UA", "Alaska": "AS",
    "Allegiant": "G4", "Spirit": "NK", "Frontier": "F9", "Southwest": "WN",
    "Sun Country": "SY", "Porter Airlines": "PD", "Air Canada": "AC", "WestJet": "WS",
    "Japan Airlines": "JL", "ANA": "NH", "All Nippon Airways": "NH",
    "British Airways": "BA", "Virgin Atlantic": "VS", "KLM": "KL", "Air France": "AF",
    "Aer Lingus": "EI", "Iberia": "IB", "Finnair": "AY", "Lufthansa": "LH",
    "Icelandair": "FI", "PLAY": "OG", "Norse Atlantic Airways": "Z0", "TAP Air Portugal": "TP",
    "Caribbean Airlines": "BW", "Copa Airlines": "CM", "Air Transat": "TS", "Emirates": "EK",
    "Turkish Airlines": "TK", "SWISS": "LX", "Austrian": "OS", "Scandinavian Airlines": "SK",
    "Level": "LV", "Discover Airlines": "4Y", "Condor": "DE", "Zipair": "ZG",
}

_pace_lock = threading.Lock()
_last_call = [0.0]


def _paced():
    """Keep the whole pool under a polite request rate."""
    with _pace_lock:
        wait = PACE_SECONDS - (time.monotonic() - _last_call[0])
        if wait > 0:
            time.sleep(wait)
        _last_call[0] = time.monotonic()


# --- Parsing Google's rows into board records --------------------------

@dataclass
class Option:
    """One priced itinerary row as the results page reports it."""

    price: int
    carrier: str          # IATA code, or the raw name when unmapped
    carrier_name: str
    dep: str | None       # ISO datetime
    arr: str | None
    dur: int | None       # minutes
    stops: int


def parse_price(raw: str) -> int | None:
    """A row with no bookable fare renders as $0 — that is a gap, not a bargain."""
    digits = re.sub(r"[^0-9]", "", raw or "")
    if not digits:
        return None
    return int(digits) or None


def parse_duration(raw: str) -> int | None:
    if not raw:
        return None
    hours = re.search(r"(\d+)\s*hr", raw)
    mins = re.search(r"(\d+)\s*min", raw)
    if not hours and not mins:
        return None
    return int(hours.group(1) if hours else 0) * 60 + int(mins.group(1) if mins else 0)


def parse_clock(raw: str, on: date, day_offset: int = 0) -> str | None:
    """Turn "6:50 AM on Mon, Sep 14" into an ISO datetime on a known date.

    The page never prints a year, so the search date supplies it. Only the
    clock time is read from the string; the date part is what we asked for.
    """
    m = re.match(r"\s*(\d{1,2}):(\d{2})\s*([AP]M)", raw or "")
    if not m:
        return None
    hour, minute, half = int(m.group(1)), int(m.group(2)), m.group(3)
    if half == "PM" and hour != 12:
        hour += 12
    if half == "AM" and hour == 12:
        hour = 0
    stamp = datetime.combine(on + timedelta(days=day_offset), datetime.min.time())
    return (stamp + timedelta(hours=hour, minutes=minute)).isoformat()


def days_ahead(raw: str) -> int:
    m = re.search(r"([+-]\d+)", raw or "")
    return int(m.group(1)) if m else 0


def to_option(flight, on: date) -> Option | None:
    price = parse_price(flight.price)
    if price is None:
        return None
    name = (flight.name or "").strip()
    parts = [p.strip() for p in name.split(",") if p.strip()]
    lead = parts[0] if parts else name
    return Option(
        price=price,
        carrier=CODES.get(lead, lead),
        carrier_name=lead,
        dep=parse_clock(flight.departure, on),
        arr=parse_clock(flight.arrival, on, days_ahead(flight.arrival_time_ahead)),
        dur=parse_duration(flight.duration),
        stops=flight.stops,
    )


# --- Talking to Google -------------------------------------------------

class SearchError(Exception):
    """The request could not be built or answered."""


def encode_tfs(legs, party, max_stops) -> str:
    """Build the `tfs` filter, forcing a nonstop request onto the wire.

    See the STOPS_* constants: 0 is the one stop-count protobuf will drop,
    so it is serialised as a sentinel and that byte rewritten to zero.
    Replacement is length-preserving, and the marker count is asserted so
    a payload that happened to contain the sentinel can't slip through.
    """
    spec = create_filter(
        flight_data=[
            FlightData(date=d.isoformat(), from_airport=o, to_airport=a) for d, o, a in legs
        ],
        trip="round-trip" if len(legs) > 1 else "one-way",
        passengers=Passengers(adults=party["adults"], children=party["children"]),
        seat="economy",
        max_stops=_STOPS_SENTINEL if max_stops == STOPS_NONSTOP else max_stops,
    )
    raw = spec.to_string()
    if max_stops == STOPS_NONSTOP:
        marker = _STOPS_TAG + bytes([_STOPS_SENTINEL])
        if raw.count(marker) != len(legs):
            raise SearchError(f"expected {len(legs)} stop markers, found {raw.count(marker)}")
        raw = raw.replace(marker, _STOPS_TAG + b"\x00")
    return base64.b64encode(raw).decode()


def query(legs, party, max_stops):
    """One search. Returns [] for a genuinely empty day, None if it never answered."""
    for attempt in range(ATTEMPTS):
        _paced()
        try:
            client = Client(impersonate="chrome_126", verify=False)
            response = client.get(
                "https://www.google.com/travel/flights",
                params={
                    "tfs": encode_tfs(legs, party, max_stops),
                    "hl": "en",
                    "tfu": "EgQIABABIgA",
                    "curr": "USD",
                },
            )
            if response.status_code != 200:
                raise SearchError(f"HTTP {response.status_code}")
            result = parse_response(response)
            return [o for o in (to_option(f, legs[0][0]) for f in result.flights) if o]
        except RuntimeError:
            # "No flights found" — real on a thin route, transient under load.
            # Only an all-attempts-empty answer is recorded as a gap. Empties
            # are cheap to re-ask but there are hundreds of them past an
            # airline's booking window, so they get one retry, not two.
            if attempt >= EMPTY_ATTEMPTS - 1:
                return []
            time.sleep(1.0)
            continue
        except Exception:
            if attempt == ATTEMPTS - 1:
                return None
        time.sleep(1.5 * (attempt + 1))
    return None


def window() -> tuple[date, date]:
    """The next MONTHS whole months, from the start of next month."""
    today = date.today()
    year, month = today.year, today.month + 1
    if month > 12:
        month, year = 1, year + 1
    first = date(year, month, 1)
    end_year, end_month = year + (month - 1 + MONTHS) // 12, (month - 1 + MONTHS) % 12 + 1
    return first, date(end_year, end_month, 1)


def sample_dates() -> list[tuple[date, date]]:
    """Four departures a month across the next 12 months, each a 5-night stay."""
    first, end = window()
    out = []
    day = first
    while day < end:
        if day.day in SAMPLE_DAYS:
            out.append((day, day + timedelta(days=NIGHTS)))
        day += timedelta(days=1)
    return out


def every_date() -> list[tuple[date, date]]:
    """Every departure in the window.

    Four days a month estimates a route flown daily perfectly well, and is
    close to useless on one with a handful of bookable days a year — the
    odds of landing on them are slim, and the board then quotes a fare
    hundreds of dollars above what is actually for sale. Edinburgh proved
    it: sampling said $3,130 in May, and the cheapest nonstop round trip
    in the whole window was $2,568 on 9 October, two days off a sample.
    """
    first, end = window()
    out = []
    day = first
    while day < end:
        out.append((day, day + timedelta(days=NIGHTS)))
        day += timedelta(days=1)
    return out


# --- Building one route's record ---------------------------------------

def month_label(d: date) -> str:
    return d.strftime("%b %Y")


def month_slots() -> list[tuple[str, str]]:
    """(ym, label) for every month in the window, in order.

    Taken from the window rather than from the sampled dates, so the chart
    still has twelve columns whichever sampling a route used.
    """
    first, end = window()
    slots, day = [], first
    while day < end:
        key = day.strftime("%Y-%m")
        if not slots or slots[-1][0] != key:
            slots.append((key, month_label(day)))
        day += timedelta(days=1)
    return slots


def leg_dict(option: Option) -> dict | None:
    if not option.dep or option.dur is None:
        return None
    return {
        "airline": option.carrier,
        "flight": None,
        "dep": option.dep,
        "arr": option.arr or option.dep,
        "dur": option.dur,
    }


def build_view(samples: list[tuple[date, date, list[Option]]], seats: int, only_preferred: bool):
    """Fold the sampled days into the {cheapest, monthly, carriers, cheapDates} shape."""
    rows = []
    for dep, ret, options in samples:
        pool = [o for o in options if o.carrier == PREFERRED] if only_preferred else options
        if pool:
            rows.append((dep, ret, min(pool, key=lambda o: o.price)))
    if not rows:
        return None

    priced: dict[str, list[int]] = {}
    for dep, _, best in rows:
        priced.setdefault(dep.strftime("%Y-%m"), []).append(best.price)

    monthly = [{"ym": ym, "label": label,
                "min": min(priced[ym]) if ym in priced else None}
               for ym, label in month_slots()]

    counts: dict[str, dict] = {}
    for _, _, best in rows:
        entry = counts.setdefault(best.carrier, {"code": best.carrier, "name": best.carrier_name, "n": 0})
        entry["n"] += 1

    dep, ret, best = min(rows, key=lambda r: r[2].price)
    cheap_dates = [
        {
            "dep": d.isoformat(),
            "ret": r.isoformat(),
            "price": o.price,
            "oc": o.carrier,
            "of": None,
            "bc": None,
            "bf": None,
        }
        for d, r, o in sorted(rows, key=lambda r: r[2].price)[:6]
    ]

    return {
        "cheapest": {
            "price": best.price,
            "pp": round(best.price / seats),
            "dep": dep.isoformat(),
            "ret": ret.isoformat(),
            "out": leg_dict(best) or {
                "airline": best.carrier, "flight": None,
                "dep": dep.isoformat() + "T00:00:00", "arr": dep.isoformat() + "T00:00:00",
                "dur": best.dur or 0,
            },
            "back": None,
        },
        "monthly": monthly,
        "carriers": sorted(counts.values(), key=lambda c: -c["n"]),
        "cheapDates": cheap_dates,
        # Only worth warning about where more than one carrier flies the route:
        # that is when Google's cheapest return pairing may not be this carrier's.
        "mixedPairing": len(counts) > 1,
    }


def mark_beyond_window(*views):
    """Flag the trailing months no carrier has put on sale yet.

    The cutoff comes from the widest view — the last month anything was
    priced — and is stamped on every view, so a gap inside the window
    still reads as a gap.
    """
    live = [v for v in views if v]
    if not live:
        return
    cutoff = max(
        (i for v in live for i, m in enumerate(v["monthly"]) if m["min"] is not None),
        default=-1,
    )
    for view in live:
        for month in view["monthly"][cutoff + 1:]:
            month["beyond"] = True


def resolve_return(route, view, party):
    """Fill the return leg with that carrier's cheapest nonstop on the return date."""
    if not view:
        return
    cheapest = view["cheapest"]
    ret = date.fromisoformat(cheapest["ret"])
    origin, destination = route["origin"], route["far"]
    options = query([(ret, destination, origin)], party, STOPS_NONSTOP) or []
    carrier = cheapest["out"]["airline"]
    same = [o for o in options if o.carrier == carrier] or options
    if same:
        cheapest["back"] = leg_dict(min(same, key=lambda o: o.price))


def sweep_one_ways(origin, far, party, log):
    """Cheapest nonstop in each direction, booked as two one-ways.

    Sampled on the same calendar as the round trip, one departure a month
    per direction, so the figure is comparable without doubling the sweep.
    """
    def cheapest_leg(frm, to):
        found = []

        def one(pair):
            return query([(pair[0], frm, to)], party, STOPS_NONSTOP) or []

        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            for options in pool.map(one, sample_dates()[::len(SAMPLE_DAYS)]):
                found.extend(o for o in options if o.stops == 0)
        if not found:
            return None
        best = min(found, key=lambda o: o.price)
        return {"price": best.price, "carrier": best.carrier, "name": best.carrier_name}

    out_leg, back_leg = cheapest_leg(origin, far), cheapest_leg(far, origin)
    if not out_leg or not back_leg:
        return None
    total = out_leg["price"] + back_leg["price"]
    log(f"    two one-ways: {out_leg['price']} out + {back_leg['price']} back = {total}")
    return {"out": out_leg, "back": back_leg, "total": total,
            "pp": round(total / party["seats"])}


def as_adults(party):
    """The same number of seats, none of them a child fare."""
    return {"adults": party["seats"], "children": 0, "seats": party["seats"],
            "label": f"{party['seats']} adults"}


def sweep_route(route, log, force_daily=False):
    party = OUT_PARTY if route["dir"] == "out" else IN_PARTY
    origin = HOME if route["dir"] == "out" else route["code"]
    far = route["code"] if route["dir"] == "out" else HOME
    route = {**route, "origin": origin, "far": far}

    pairs = sample_dates()

    def collect(for_party, dates=None):
        def one(pair):
            dep, ret = pair
            options = query([(dep, origin, far), (ret, far, origin)], for_party, STOPS_NONSTOP)
            return dep, ret, [o for o in (options or []) if o.stops == 0]

        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            return list(pool.map(one, dates if dates is not None else pairs))

    samples = collect(party)

    # Some carriers will not price a child on some routes at all — JAL to
    # Tokyo and Cathay to Hong Kong return an empty page for 2 adults + 1
    # child and a normal one for 3 adults. That is a fare-filing gap, not a
    # route with no service, and dropping the route would be the wrong
    # answer to it. Re-price the same three seats as adults and say so on
    # the page; the seat count, which is what the total depends on, is
    # unchanged.
    if not any(options for _, _, options in samples) and party["children"]:
        party = as_adults(party)
        log(f"    nothing prices with a child on board — re-pricing {party['seats']} seats as adults")
        samples = collect(party)

    # On a route that flies most days, four departures a month estimate the
    # monthly floor well. On one that prices a handful of days a year they
    # mostly land on nothing, and the fare that survives is whichever thin
    # date happened to be sampled — which is how Edinburgh came to be quoted
    # at $3,130 next May while $2,568 sat unbought on 9 October. Where the
    # sample comes back that sparse, stop sampling and check every day.
    flown = sum(1 for _, _, options in samples if options)
    scan = "sampled"
    if force_daily or flown <= DENSE_SCAN_BELOW:
        log(f"    {flown}/{len(samples)} sampled days price — checking every departure")
        dense = collect(party, every_date())
        # Only take the wider scan if it did at least as well; a run of
        # blank pages must not be allowed to erase a route that priced.
        if sum(1 for _, _, options in dense if options) >= flown:
            samples, scan = dense, "daily"
        else:
            log("    every-departure pass came back thinner than the sample — keeping the sample")

    all_view = build_view(samples, party["seats"], only_preferred=False)
    jb_view = build_view(samples, party["seats"], only_preferred=True)
    log(f"  {route['dir']} {origin}->{far}: "
        f"nonstop days {sum(1 for _, _, o in samples if o)}/{len(samples)} · "
        f"all {all_view['cheapest']['price'] if all_view else '—'} · "
        f"B6 {jb_view['cheapest']['price'] if jb_view else '—'}")

    # Airlines load schedules 6-11 months out and the tail of the window is
    # simply not on sale yet. Where that window ends is a fact about the
    # route, not about one airline — so it is read from every carrier's
    # fares and then applied to both views. Read per-view instead and a
    # month JetBlue merely skips would be labelled "not on sale", and a
    # route would be called seasonal for being far away.
    mark_beyond_window(all_view, jb_view)

    # Each view needs a return leg flown by the airline that view is about;
    # borrowing the other's would put a British Airways return under a
    # JetBlue fare whenever the two happen to tie on price.
    resolve_return(route, all_view, party)
    resolve_return(route, jb_view, party)

    record = {
        "code": route["code"],
        "city": route["city"],
        "region": route["region"],
        "seats": party["seats"],
        "bags": 0,
        "party": party["label"],
        "fav": True,
        "scan": scan,
        "all": all_view,
        "jb": jb_view,
    }
    if party["children"] == 0 and (OUT_PARTY if route["dir"] == "out" else IN_PARTY)["children"]:
        record["adultsOnly"] = True
    if route["dir"] == "in":
        record.update({"dir": "in", "origin": origin, "originCity": route["city"]})

    # A route with almost no nonstop service is worth showing with one stop
    # allowed, so the gap is a number rather than a blank.
    priced_months = sum(1 for m in (all_view or {}).get("monthly", []) if m["min"] is not None)
    if priced_months <= 3:
        conn_samples = []
        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            def one_stop(pair):
                dep, ret = pair
                options = query([(dep, origin, far), (ret, far, origin)], party, STOPS_ONE_OR_FEWER)
                return dep, ret, options or []
            for dep, ret, options in pool.map(one_stop, pairs):
                conn_samples.append((dep, ret, options))
        conn = build_view(conn_samples, party["seats"], only_preferred=False)
        if conn:
            record["conn"] = {
                "cheapest": conn["cheapest"]["price"],
                "pp": conn["cheapest"]["pp"],
                "months": sum(1 for m in conn["monthly"] if m["min"] is not None),
            }
            log(f"    one stop: {conn['cheapest']['price']} in {record['conn']['months']}/12 months")

        # Some routes fly nonstop in both directions and still refuse to
        # price as a nonstop round trip — Amsterdam does exactly this. A
        # blank month would read as "no service", which is wrong, so the
        # two one-way nonstops get their own figure.
        one_way = sweep_one_ways(origin, far, party, log)
        if one_way:
            record["oneWay"] = one_way

    return record


# --- Confirming what is already on the board ---------------------------

def party_for(record) -> dict:
    """Reconstruct the party a record was priced for, from the record."""
    seats = record.get("seats", OUT_PARTY["seats"])
    if record.get("adultsOnly") or seats == 1:
        return {"adults": seats, "children": 0, "seats": seats, "label": f"{seats} adults"}
    return {"adults": seats - 1, "children": 1, "seats": seats,
            "label": f"{seats - 1} adults + 1 child"}


def confirm(data, log) -> int:
    """Re-ask Google for each favourite's headline itinerary, exactly as shown.

    A full sweep takes hours; this is one query per figure, so it answers
    "is the number on the board still real?" in about a minute. Returns
    the number of figures that no longer price as shown.
    """
    print(f"{'ROUTE':9s} {'VIEW':5s} {'DEPART':11s} {'RETURN':11s} {'BOARD':>7s} {'LIVE':>7s}  VERDICT")
    drifted = 0
    for key in data.get("favourites", []):
        record = data["routes"].get(key)
        if not record:
            continue
        party = party_for(record)
        origin = record.get("origin", data["origin"])
        far = data["origin"] if record.get("dir") == "in" else record["code"]
        for label in ("all", "jb"):
            view = record.get(label)
            if not view:
                continue
            cheapest = view["cheapest"]
            dep, ret = date.fromisoformat(cheapest["dep"]), date.fromisoformat(cheapest["ret"])
            options = query([(dep, origin, far), (ret, far, origin)], party, STOPS_NONSTOP) or []
            if label == "jb":
                options = [o for o in options if o.carrier == PREFERRED]
            live = min((o.price for o in options if o.stops == 0), default=None)
            shown = cheapest["price"]
            if live is None:
                verdict, bad = "GONE — no longer prices", True
            elif live == shown:
                verdict, bad = "confirmed", False
            else:
                move = live - shown
                verdict = f"{'+' if move > 0 else ''}{move} ({'dearer' if move > 0 else 'cheaper'})"
                bad = abs(move) > shown * 0.02
            drifted += bool(bad)
            print(f"{key:9s} {label:5s} {dep.isoformat():11s} {ret.isoformat():11s} "
                  f"{shown:7d} {live if live is not None else 0:7d}  {verdict}")
    return drifted


# --- Writing the board -------------------------------------------------

def load_board() -> tuple[str, dict]:
    html = BOARD.read_text()
    m = re.search(r"const FLIGHTS = (\{.*?\});\n", html, re.S)
    if not m:
        sys.exit("Could not find the FLIGHTS blob in flights.html")
    return html, json.loads(m.group(1))


def merge(data: dict, records: list[dict]) -> dict:
    favourites = []
    for record in records:
        key = record["code"] + ("_IN" if record.get("dir") == "in" else "")
        previous = data["routes"].get(key, {})
        for carried in ("alert",):
            if carried in previous and carried not in record:
                record[carried] = previous[carried]
        data["routes"][key] = record
        favourites.append(key)

    # The favourites own their region entry; drop them from any other.
    for region in data["regions"]:
        region["keys"] = [k for k in region["keys"] if k not in favourites]
    data["regions"] = [r for r in data["regions"] if r["keys"]]
    data["favourites"] = favourites
    data["favSweep"] = date.today().isoformat()
    # Say which basis actually produced these numbers rather than describing
    # the default, because the two differ by hundreds of dollars on a thin route.
    daily = sum(1 for r in records if r.get("scan") == "daily")
    if daily == len(records):
        data["favSampling"] = f"every departure across the next {MONTHS} months"
    elif daily:
        data["favSampling"] = (f"{len(SAMPLE_DAYS)} departures a month across {MONTHS} months, "
                               f"and every date on the {daily} thinnest routes")
    else:
        data["favSampling"] = f"{len(SAMPLE_DAYS)} departures a month across {MONTHS} months"
    data["threshold"] = SWITCH_THRESHOLD
    return data


def write_board(html: str, data: dict, out: Path):
    blob = json.dumps(data, ensure_ascii=False, separators=(", ", ": "))
    updated = re.sub(
        r"const FLIGHTS = \{.*?\};\n",
        lambda _: f"const FLIGHTS = {blob};\n",
        html,
        count=1,
        flags=re.S,
    )
    out.write_text(updated)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--dry-run", action="store_true", help="print the swept JSON, leave the board alone")
    ap.add_argument("--only", help="comma-separated codes to sweep (default: all favourites)")
    ap.add_argument("--daily", action="store_true",
                    help="check every departure on every route, not just the thin ones. "
                         "~365 queries a route instead of 48 — slow, and the accurate answer")
    ap.add_argument("--confirm", action="store_true",
                    help="re-ask Google for each favourite's headline fare and report drift; "
                         "one query per figure, so it finishes in about a minute")
    ap.add_argument("--write-from", nargs="+", metavar="FILE",
                    help="skip the sweep; write the board from saved --dry-run JSON. "
                         "Later files win on a route both contain.")
    args = ap.parse_args()

    def log(msg):
        print(msg, file=sys.stderr, flush=True)

    if args.confirm:
        _, data = load_board()
        drifted = confirm(data, log)
        print(f"\n{drifted} figure(s) no longer price as shown." if drifted
              else "\nEvery figure on the shortlist still prices as shown.")
        sys.exit(1 if drifted else 0)

    if args.write_from:
        # A sweep is slow enough to be worth keeping: --dry-run it to a file,
        # read it, and write the board from that. Several files merge in the
        # order given, so a re-run of two routes lands on top of a full sweep
        # without re-flying the other twelve.
        records = []
        for path in args.write_from:
            for record in json.loads(Path(path).read_text()):
                key = (record["code"], record.get("dir"))
                records = [r for r in records if (r["code"], r.get("dir")) != key]
                records.append(record)
        log(f"Writing {len(records)} records from {len(args.write_from)} file(s)")
    else:
        wanted = FAVOURITES
        if args.only:
            keep = {c.strip().upper() for c in args.only.split(",")}
            wanted = [r for r in FAVOURITES if r["code"] in keep]
        log(f"Sweeping {len(wanted)} routes · {len(sample_dates())} sampled departures each")
        records = []
        for route in wanted:
            log(f"{route['code']} {route['city']} ({route['dir']})")
            records.append(sweep_route(route, log, force_daily=args.daily))

    if args.dry_run:
        json.dump(records, sys.stdout, indent=1)
        return

    html, data = load_board()
    write_board(html, merge(data, records), BOARD)
    log(f"Wrote {BOARD}")


if __name__ == "__main__":
    main()
