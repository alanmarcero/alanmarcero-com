#!/usr/bin/env python3
"""Fetch, optimise and attribute the instrument photographs.

The catalogue's photographs are Wikimedia Commons files licensed for
reuse. This script is the thing that produced `public/synths/*.webp` and
`src/matrix/data/synthImages.js` — it exists so the next person adding an
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
import urllib.parse
import urllib.request

# Wikimedia asks for a descriptive User-Agent with contact info, and
# rate-limits anonymous bursts. Both are honoured below.
USER_AGENT = (
    'alanmarcero-com-site-build/1.0 '
    '(https://alanmarcero.com; https://github.com/alanmarcero)'
)
REQUEST_PAUSE_SECONDS = 1.5
WIDTHS = (480, 960)
WEBP_QUALITY = 78

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGE_DIR = os.path.join(ROOT, 'public', 'synths')
DATA_FILE = os.path.join(ROOT, 'src', 'matrix', 'data', 'synthImages.js')

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

# Licences that permit commercial use and modification. Anything else must
# not ship: the site is public and carries the owner's name.
ALLOWED = re.compile(r'^(CC BY(-SA)? \d|CC0|Public domain)', re.I)


def strip_markup(value):
    """Commons returns HTML in attribution fields; flatten it to text.

    Newlines matter here: author strings carry derivative-work chains that
    CC requires be preserved, and an unescaped newline inside a JS string
    literal is a syntax error. Flattening with a separator keeps the chain
    and keeps the file parseable.
    """
    text = re.sub(r'<[^>]+>', '', value or '').strip()
    return re.sub(r'\s*\n\s*', ' · ', text)


def fetch(url, tries=4):
    for attempt in range(tries):
        try:
            request = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
            return urllib.request.urlopen(request, timeout=60).read()
        except urllib.error.HTTPError as error:
            if error.code in (429, 503) and attempt < tries - 1:
                time.sleep(4 * (attempt + 1))
                continue
            raise
    raise RuntimeError('unreachable')


def commons_metadata(title):
    url = (
        'https://commons.wikimedia.org/w/api.php?action=query&format=json'
        f'&titles={urllib.parse.quote(title)}'
        '&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=1600'
    )
    pages = json.loads(fetch(url))['query']['pages']
    page = next(iter(pages.values()))
    if 'imageinfo' not in page:
        raise LookupError(f'no imageinfo for {title!r} — has it been renamed?')

    info = page['imageinfo'][0]
    extra = info.get('extmetadata') or {}
    return {
        'download': info.get('thumburl') or info['url'],
        'author': strip_markup((extra.get('Artist') or {}).get('value')) or 'Unknown',
        'licence': strip_markup((extra.get('LicenseShortName') or {}).get('value')),
        'licenceUrl': strip_markup((extra.get('LicenseUrl') or {}).get('value')),
        'source': info.get('descriptionurl'),
    }


def dimensions(path):
    output = subprocess.run(
        ['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', path],
        capture_output=True, text=True, check=True,
    ).stdout
    width = re.search(r'pixelWidth:\s*(\d+)', output)
    height = re.search(r'pixelHeight:\s*(\d+)', output)
    return int(width.group(1)), int(height.group(1))


def write_data_module(rows):
    header = '''/*
 * Instrument photographs.
 *
 * GENERATED by scripts/fetch-synth-images.py — re-run that rather than
 * editing this file by hand, or the assets and the attribution drift
 * apart.
 *
 * Every image is licensed for reuse and modification. The site is public
 * and carries the owner's name, so manufacturer press shots and general
 * image-search results are not usable.
 *
 * CC BY and CC BY-SA REQUIRE visible attribution — the footer credits
 * block is that licence condition being met, not a courtesy. Removing it
 * means removing the images.
 *
 * Three catalogue entries have no photograph on purpose; see the PICKS
 * comment in the generator for which and why.
 */

export const synthImages = {'''

    lines = [header]
    for row in rows:
        lines.append(f'  {json.dumps(row["bank"])}: {{')
        for key in ('slug', 'alt', 'author', 'licence', 'licenceUrl', 'source'):
            lines.append(f'    {key}: {json.dumps(row[key])},')
        lines.append(f'    width: {row["width"]},')
        lines.append(f'    height: {row["height"]},')
        lines.append('  },')
    lines.append('};\n')
    lines.append('''export const imageFor = (bankName) => synthImages[bankName] || null;

/** Every credited image, for the attribution surface. */
export const credits = Object.entries(synthImages)
  .map(([bank, image]) => ({ bank, ...image }));
''')
    with open(DATA_FILE, 'w') as handle:
        handle.write('\n'.join(lines))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true',
                        help='verify assets and attribution; write nothing')
    args = parser.parse_args()

    if args.check:
        missing = []
        for slug, bank, _, _ in PICKS:
            for width in WIDTHS:
                path = os.path.join(IMAGE_DIR, f'{slug}-{width}.webp')
                if not os.path.exists(path):
                    missing.append(os.path.relpath(path, ROOT))
        declared = {slug for slug, _, _, _ in PICKS}
        on_disk = {f.rsplit('-', 1)[0] for f in os.listdir(IMAGE_DIR)}
        orphans = sorted(on_disk - declared)

        print(f'declared: {len(declared)}  expected files: {len(declared) * len(WIDTHS)}')
        print(f'missing:  {missing or "none"}')
        print(f'orphans (files with no attribution): {orphans or "none"}')
        return 1 if (missing or orphans) else 0

    os.makedirs(IMAGE_DIR, exist_ok=True)
    rows = []

    for slug, bank, title, alt in PICKS:
        meta = commons_metadata(title)

        if not ALLOWED.match(meta['licence'] or ''):
            raise SystemExit(
                f'REFUSING {slug}: licence {meta["licence"]!r} does not clearly '
                'permit commercial use and modification. Pick another file.'
            )

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
        rows.append({
            'slug': slug, 'bank': bank, 'alt': alt,
            'width': width_px, 'height': height_px,
            **{k: meta[k] for k in ('author', 'licence', 'licenceUrl', 'source')},
        })

        size_kb = os.path.getsize(wide) // 1024
        print(f'  {slug:14} {meta["licence"]:16} {size_kb:4} kB  {meta["author"][:34]}')
        time.sleep(REQUEST_PAUSE_SECONDS)

    write_data_module(rows)
    print(f'\n{len(rows)} instruments -> {os.path.relpath(DATA_FILE, ROOT)}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
