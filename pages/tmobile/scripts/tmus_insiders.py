"""
Who the two insider-sale generators exclude, hold out and how they spell
everyone — shared by fetch-edgar-form4-prices.py (five-year series) and
fetch-nasdaq-insider-sales.py (monthly columns). Not a script: import it.

These live in one place because the page prints that the two sources agree
over the window they share, and a test asserts it. Two copies of the
hold-out list or the name map would let them drift apart silently.
"""

from collections import defaultdict

EXCLUDED = 'DEUTSCHE TELEKOM AG'

# ONE TRANSACTION, HELD OUT OF EVERY FIGURE ON THE PAGE and named at the foot
# of it. Raul Marcelo Claure's 550,000-share block on 2026-02-12 is $119.7M in
# a single indirect open-market trade — on its own it is most of the dollars in
# the trailing year, and it is the same kind of trade Deutsche Telekom is
# excluded for: a holder unwinding a position, not an executive taking a
# payday. Left in, it sets the axis on every chart and the cadence the page is
# actually about disappears underneath it.
#
# Keyed by (date, filer) so it can only ever remove the one trade it names, and
# each generator FAILS if that trade stops arriving — a silent no-op here would
# quietly put the outlier back.
OUTLIER_TRADES = (('2026-02-12', 'CLAURE RAUL MARCELO'),)

# Display only. Both sources file a name LAST FIRST MIDDLE in caps, which no
# algorithm reliably unpicks ("SIEVERT G MICHAEL" is G. Michael Sievert), so
# everyone who appears in either is spelled out here, once, so a reader can
# follow one person across both charts.
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
    'DROBAC DANIEL JAMES': 'Daniel James Drobac',
}


def tally_by_person(entries):
    """name -> summed shares and value, over records carrying all three."""
    people = defaultdict(lambda: {'shares': 0, 'value': 0})
    for entry in entries:
        people[entry['name']]['shares'] += entry['shares']
        people[entry['name']]['value'] += entry['value']
    return people


def ranked(people):
    """A tally as a list, biggest seller by shares first."""
    return [
        {'name': name, **totals}
        for name, totals in sorted(people.items(), key=lambda kv: -kv[1]['shares'])
    ]
