#!/usr/bin/env python3
"""Fetch, convert and attribute the instrument photographs for /opus5ios.

The broadsheet layout wants a different photograph of each instrument than
the one the earlier pages use — a closer, more graphic frame, because these
sit in a wide plate column rather than a small portrait slot. This script
produced `public/opus5ios/synths/*.webp` and
`src/opus5ios/data/synthImages.js`, and it is committed so the next person
adding an instrument can regenerate the pair the same way.

It deliberately does NOT share a picks table with
`scripts/fetch-synth-images.py`: that script owns the earlier pages' images
and re-pointing it would silently re-skin them. Two pages, two picks, two
generators.

Idempotent and safe to re-run: same picks in, same files out.

    python3 scripts/fetch-opus5ios-synth-images.py            # fetch + convert + write data
    python3 scripts/fetch-opus5ios-synth-images.py --check    # verify only, change nothing

Requires Pillow (`pip install pillow`) and nothing else — unlike the older
generator it shells out to no macOS-only binaries, so it runs on CI too.
"""

import argparse
import io
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

from PIL import Image

# Wikimedia asks for a descriptive User-Agent with contact info, and
# rate-limits anonymous bursts. Both are honoured below.
USER_AGENT = (
    'alanmarcero-com-site-build/1.0 '
    '(https://alanmarcero.com; https://github.com/alanmarcero)'
)
REQUEST_PAUSE_SECONDS = 1.5
WIDTHS = (480, 960)
WEBP_QUALITY = 80

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGE_DIR = os.path.join(ROOT, 'public', 'opus5ios', 'synths')
DATA_FILE = os.path.join(ROOT, 'src', 'opus5ios', 'data', 'synthImages.js')

# (slug, bank name as it appears in src/data/patchBanks.js, Commons file, alt text)
#
# The bank name is the join key and must match patchBanks.js exactly — the
# catalogue looks images up by it.
#
# Every pick here is a DIFFERENT Commons file from the one the earlier
# pages use, with one unavoidable exception noted below. The frames lean
# close and graphic: a panel, a logo, a bank of knobs. At the size this
# layout gives them, a whole keyboard shot reads as a grey smudge.
#
# Three catalogue entries are deliberately absent:
#   Roland SH-01A    — no freely-licensed photograph exists (re-checked
#                      Commons and Openverse, 2026-08-02: Commons has no
#                      SH-01A file at all and Openverse returns zero
#                      commercial-use results)
#   Waves CODEX      — a plugin; there is no hardware to photograph
#   Audio Demo MIDIs — not an instrument
# They fall back to a drawn faceplate plan in the catalogue. Do not
# substitute a lookalike: an SH-101 photo would misrepresent the product
# the bank is actually for.
PICKS = [
    (
        'prophet-08',
        'Sequential Prophet 08 and Rev2',
        "File:Prophet '08 (rear center).jpg",
        "The keybed and rear panel of a Sequential Prophet '08, its name "
        'printed along the end cheek',
    ),
    (
        'nord-lead-3',
        'Nord Lead 3 and Nord Rack 3',
        'File:Clavia Nord Lead 3 - filter 1 - Advanced Subtractive ....jpg',
        "A close view of the Nord Lead 3's filter section, knobs lit against "
        'the red chassis',
    ),
    (
        'virus-ti',
        'Access Virus TI and TI2, OsTIrus, Adam Szabo Viper',
        'File:Access Virus TI2 Polar & Korg TR88 on stand.jpg',
        'A white Access Virus TI2 Polar mounted on a two-tier keyboard stand',
    ),
    (
        'andromeda-a6',
        'Alesis A6 Andromeda',
        'File:Andromeda a6.JPG',
        'An Alesis A6 Andromeda, the full blue-knobbed control panel above '
        'its keybed',
    ),
    (
        'jp-8000',
        'Roland JP-8000, JP-8080, JE-8086, and Airwave',
        'File:Roland JP-8000 front panel.jpg',
        'The blue front panel of a Roland JP-8000, sliders and knobs across '
        'its full width',
    ),
    (
        'little-phatty',
        'Moog Slim Phatty and Little Phatty',
        'File:Moog Little Phatty (closeup).jpg',
        "A close view of a Moog Little Phatty's panel — cutoff and resonance "
        'knobs above the Moog logo',
    ),
    (
        'nord-lead-2x',
        'Nord Lead 2X, Nord Lead 2, DiscoDSP Discovery Pro',
        'File:Clavia Nord Lead 2x.jpg',
        'A Clavia Nord Lead 2X seen from a low angle, red chassis against '
        'white',
    ),
    (
        # The one repeat. Commons holds exactly one JP-08 photograph and
        # Openverse none, so "a different frame" is not available for this
        # instrument at any price. Re-derived here rather than linked to the
        # other page's file so the two sets stay independently regenerable.
        'jp-08',
        'Roland JP-08',
        'File:Roland Boutique JP-08 Synthesizer.jpg',
        'A Roland Boutique JP-08 desktop module, its Jupiter-8 panel in '
        'miniature',
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


def convert(source_bytes, slug):
    """Write the webp derivatives; return the widest one's real dimensions.

    Never upscales. Two of the picks are small originals (the JP-08 is
    600px wide, the Andromeda 640px), and stretching them to 960 would
    ship a soft image while claiming a sharp one. The srcset in the page
    is built from the real numbers this returns, so a small original just
    means one derivative instead of two.
    """
    original = Image.open(io.BytesIO(source_bytes)).convert('RGB')
    written = []

    for width in WIDTHS:
        if width > original.width and written:
            continue
        target = min(width, original.width)
        height = round(original.height * target / original.width)
        resized = original.resize((target, height), Image.LANCZOS)
        path = os.path.join(IMAGE_DIR, f'{slug}-{width}.webp')
        resized.save(path, 'WEBP', quality=WEBP_QUALITY, method=6)
        written.append((width, resized.size))

    return written


def write_data_module(rows):
    header = '''/*
 * Instrument photographs for /opus5ios.
 *
 * GENERATED by scripts/fetch-opus5ios-synth-images.py — re-run that rather
 * than editing this file by hand, or the assets and the attribution drift
 * apart.
 *
 * These are a different set of frames from the ones the earlier pages use:
 * closer, more graphic, chosen for a wide plate rather than a small
 * portrait. Every image is licensed for reuse and modification. The site is
 * public and carries the owner's name, so manufacturer press shots and
 * general image-search results are not usable.
 *
 * CC BY and CC BY-SA REQUIRE visible attribution — the colophon credits
 * block is that licence condition being met, not a courtesy. Removing it
 * means removing the images.
 *
 * `widths` lists the derivatives that actually exist. Small originals get
 * one file, not two, because the generator refuses to upscale; the page
 * builds its srcset from this list rather than assuming both sizes.
 *
 * Three catalogue entries have no photograph on purpose; see the PICKS
 * comment in the generator for which and why. They are drawn instead.
 */

export const synthImages = {'''

    lines = [header]
    for row in rows:
        lines.append(f'  {json.dumps(row["bank"])}: {{')
        for key in ('slug', 'alt', 'author', 'licence', 'licenceUrl', 'source'):
            lines.append(f'    {key}: {json.dumps(row[key])},')
        lines.append(f'    widths: {json.dumps(row["widths"])},')
        lines.append(f'    width: {row["width"]},')
        lines.append(f'    height: {row["height"]},')
        lines.append('  },')
    lines.append('};\n')
    lines.append('''export const imageFor = (bankName) => synthImages[bankName] || null;

/** Every credited image, for the attribution surface. */
export const credits = Object.entries(synthImages)
  .map(([bank, image]) => ({ bank, ...image }));

/** `srcSet` for an image, built from the derivatives that exist. */
export const srcSetFor = (image) => image.widths
  .map((width) => `/opus5ios/synths/${image.slug}-${width}.webp ${width}w`)
  .join(', ');

/** The widest derivative — the `src` fallback. */
export const sourceFor = (image) =>
  `/opus5ios/synths/${image.slug}-${image.widths[image.widths.length - 1]}.webp`;
''')
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, 'w') as handle:
        handle.write('\n'.join(lines))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true',
                        help='verify assets and attribution; write nothing')
    args = parser.parse_args()

    if args.check:
        declared = {slug for slug, _, _, _ in PICKS}
        on_disk = {f.rsplit('-', 1)[0] for f in os.listdir(IMAGE_DIR)}
        missing = sorted(declared - on_disk)
        orphans = sorted(on_disk - declared)

        print(f'declared: {len(declared)}')
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
        written = convert(fetch(meta['download']), slug)
        widest_width, (pixel_width, pixel_height) = written[-1]

        rows.append({
            'slug': slug, 'bank': bank, 'alt': alt,
            'widths': [width for width, _ in written],
            'width': pixel_width, 'height': pixel_height,
            **{k: meta[k] for k in ('author', 'licence', 'licenceUrl', 'source')},
        })

        path = os.path.join(IMAGE_DIR, f'{slug}-{widest_width}.webp')
        size_kb = os.path.getsize(path) // 1024
        print(f'  {slug:14} {meta["licence"]:16} {size_kb:4} kB  {meta["author"][:34]}')
        time.sleep(REQUEST_PAUSE_SECONDS)

    write_data_module(rows)
    print(f'\n{len(rows)} instruments -> {os.path.relpath(DATA_FILE, ROOT)}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
