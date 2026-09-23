#!/usr/bin/env python3
"""Fetch, optimise and attribute the instrument photographs.

The catalogue's photographs are Wikimedia Commons files licensed for
reuse. This script is the thing that produced `public/synths/*.webp` and
`pages/matrix/src/data/synthImages.js` — it exists so the next person adding an
instrument can regenerate the pair the same way, and can verify that the
existing set was produced consistently.

It is deliberately idempotent and safe to re-run: same picks in, same
files out.

    python3 scripts/fetch-synth-images.py            # fetch + convert + write data
    python3 scripts/fetch-synth-images.py --check    # verify only, change nothing

Requires `cwebp` (brew install webp) and `sips` (macOS). Both are used
only for conversion and dimension-reading; neither touches the source.

WHY THIS FILE EXISTS AT ALL: the first version of these assets was built
with throwaway commands in a temp directory. The outputs were committed
and the generator was not, so the sixteen files in public/synths were
unreproducible for about an hour. A peer's completion review caught it.
Outputs without their generator are a debt a successor inherits silently.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import time

from commons_images import (
    ATTRIBUTION_KEYS,
    REQUEST_PAUSE_SECONDS,
    attribution_lines,
    commons_metadata,
    fetch,
    require_reusable_licence,
)

WIDTHS = (480, 960)
WEBP_QUALITY = 78

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGE_DIR = os.path.join(ROOT, 'public', 'synths')
DATA_FILE = os.path.join(ROOT, 'pages', 'matrix', 'src', 'data', 'synthImages.js')

# (slug, bank name as it appears in src/data/patchBanks.js, Commons file, alt text)
#
# The bank name is the join key and must match patchBanks.js exactly — the
# catalogue looks images up by it.
#
# Three catalogue entries are deliberately absent:
#   Roland SH-01A    — no freely-licensed photograph exists (checked
#                      Commons and Openverse, 2026-08-01)
#   Waves CODEX      — a plugin; there is no hardware to photograph
#   Audio Demo MIDIs — not an instrument
# They fall back to an envelope-field portrait in the catalogue. Do not
# substitute a lookalike: an SH-101 photo would misrepresent the product
# the bank is actually for.
PICKS = [
    (
        'prophet-08',
        'Sequential Prophet 08 and Rev2',
        "File:DSI Prophet '08 - left side view - Orlando Synthesizer Meetup "
        "Dec 2016 (2016-12-04 (28) by Mac Rutan).png",
        "A Sequential (Dave Smith Instruments) Prophet '08 synthesiser seen "
        "from the left",
    ),
    (
        'nord-lead-3',
        'Nord Lead 3 and Nord Rack 3',
        'File:Clavia Nord Lead 3 knobs.jpg',
        'The knob panel of a Clavia Nord Lead 3',
    ),
    (
        'virus-ti',
        'Access Virus TI and TI2, OsTIrus, Adam Szabo Viper',
        'File:Access Virus TI.jpg',
        'An Access Virus TI keyboard synthesiser',
    ),
    (
        'andromeda-a6',
        'Alesis A6 Andromeda',
        'File:Alesis Andromeda A6 front.jpg',
        'An Alesis A6 Andromeda analogue synthesiser, front view',
    ),
    (
        'jp-8000',
        'Roland JP-8000, JP-8080, JE-8086, and Airwave',
        'File:JP-8000.png',
        'A Roland JP-8000 synthesiser',
    ),
    (
        'little-phatty',
        'Moog Slim Phatty and Little Phatty',
        'File:Moog Little Phatty Synthesizer - right angled '
        '(2014-05-18 by David Hilowitz).jpg',
        'A Moog Little Phatty synthesiser, angled from the right',
    ),
    (
        'nord-lead-2x',
        'Nord Lead 2X, Nord Lead 2, DiscoDSP Discovery Pro',
        'File:Clavia Nord Lead 2x front.jpg',
        'A Clavia Nord Lead 2X, front view',
    ),
    (
        'jp-08',
        'Roland JP-08',
        'File:Roland Boutique JP-08 Synthesizer.jpg',
        'A Roland Boutique JP-08 desktop synthesiser',
    ),
]

def dimensions(path):
    output = subprocess.run(
        ['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', path],
        capture_output=True, text=True, check=True,
    ).stdout
    width = re.search(r'pixelWidth:\s*(\d+)', output)
    height = re.search(r'pixelHeight:\s*(\d+)', output)
    return int(width.group(1)), int(height.group(1))


# The generator owns only the `synthImages` map. The prose above it and the
# helpers below it (imageFor, photoBrightnessFor, credits) were written by
# hand and are kept verbatim, as is each image's `brightness`: an exposure
# correction measured against the page's ground (see the comment on
# photoBrightnessFor), which Commons knows nothing about. A new instrument
# arrives without one, and the data test that requires one says so.
MAP_OPEN = 'export const synthImages = {\n'
MAP_CLOSE = '\n};\n'
BRIGHTNESS = re.compile(r'^  ("(?:[^"\\]|\\.)*"): \{\n(?:    .*\n)*?    brightness: ([\d.]+),$', re.M)


def split_data_module(text):
    """(before map, map body, after map) of an existing data module."""
    open_at = text.index(MAP_OPEN) + len(MAP_OPEN)
    close_at = text.index(MAP_CLOSE, open_at)
    return text[:open_at], text[open_at:close_at], text[close_at:]


def measured_brightness(map_body):
    """bank name -> the brightness figure recorded against it, as written."""
    return {json.loads(bank): value for bank, value in BRIGHTNESS.findall(map_body)}


def render_entry(row, brightness):
    lines = attribution_lines(row)
    if brightness is not None:
        lines.insert(2, f'    brightness: {brightness},')
    lines.append(f'    width: {row["width"]},')
    lines.append(f'    height: {row["height"]},')
    lines.append('  },')
    return lines


def render_data_module(rows, existing):
    """The existing module with its image map rebuilt from `rows`."""
    before, map_body, after = split_data_module(existing)
    brightness = measured_brightness(map_body)
    entries = [line for row in rows for line in render_entry(row, brightness.get(row['bank']))]
    return before + '\n'.join(entries) + after


def check():
    """Verify what is on disk against the picks table, and change nothing."""
    missing = [
        os.path.relpath(os.path.join(IMAGE_DIR, f'{slug}-{width}.webp'), ROOT)
        for slug, _, _, _ in PICKS
        for width in WIDTHS
        if not os.path.exists(os.path.join(IMAGE_DIR, f'{slug}-{width}.webp'))
    ]
    declared = {slug for slug, _, _, _ in PICKS}
    on_disk = {f.rsplit('-', 1)[0] for f in os.listdir(IMAGE_DIR)}
    orphans = sorted(on_disk - declared)

    print(f'declared: {len(declared)}  expected files: {len(declared) * len(WIDTHS)}')
    print(f'missing:  {missing or "none"}')
    print(f'orphans (files with no attribution): {orphans or "none"}')
    return 1 if (missing or orphans) else 0


def fetch_pick(slug, bank, title, alt):
    """Download one pick, write its webp derivatives, return its data row."""
    meta = commons_metadata(title)
    require_reusable_licence(slug, meta['licence'])

    time.sleep(REQUEST_PAUSE_SECONDS)
    original = os.path.join('/tmp', f'synth-src-{slug}')
    with open(original, 'wb') as handle:
        handle.write(fetch(meta['download']))

    for width in WIDTHS:
        destination = os.path.join(IMAGE_DIR, f'{slug}-{width}.webp')
        subprocess.run(
            ['cwebp', '-quiet', '-metadata', 'none', '-q', str(WEBP_QUALITY),
             '-resize', str(width), '0', original, '-o', destination],
            check=True,
        )

    wide = os.path.join(IMAGE_DIR, f'{slug}-{WIDTHS[-1]}.webp')
    width_px, height_px = dimensions(wide)
    size_kb = os.path.getsize(wide) // 1024
    print(f'  {slug:14} {meta["licence"]:16} {size_kb:4} kB  {meta["author"][:34]}')
    return {
        'slug': slug, 'bank': bank, 'alt': alt,
        'width': width_px, 'height': height_px,
        **{k: meta[k] for k in ATTRIBUTION_KEYS},
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true',
                        help='verify assets and attribution; write nothing')
    args = parser.parse_args()

    if args.check:
        return check()

    # Read before any download: finding out afterwards that the module is
    # missing or malformed leaves new assets beside stale attribution.
    with open(DATA_FILE) as handle:
        existing = handle.read()
    split_data_module(existing)

    os.makedirs(IMAGE_DIR, exist_ok=True)
    rows = []
    for pick in PICKS:
        rows.append(fetch_pick(*pick))
        time.sleep(REQUEST_PAUSE_SECONDS)

    with open(DATA_FILE, 'w') as handle:
        handle.write(render_data_module(rows, existing))
    print(f'\n{len(rows)} instruments -> {os.path.relpath(DATA_FILE, ROOT)}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
