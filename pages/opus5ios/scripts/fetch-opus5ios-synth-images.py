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
generators. Only the Commons transport and licence gate are shared, in
`scripts/commons_images.py`.

Idempotent and safe to re-run: same picks in, same files out.

    python3 pages/opus5ios/scripts/fetch-opus5ios-synth-images.py            # fetch + convert + write data
    python3 pages/opus5ios/scripts/fetch-opus5ios-synth-images.py --check    # verify only, change nothing

Requires Pillow (`pip install pillow`) and nothing else — unlike the older
generator it shells out to no macOS-only binaries, so it runs on CI too.
"""

import argparse
import io
import json
import os
import sys
import time
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / 'scripts'))
from commons_images import (  # noqa: E402
    ATTRIBUTION_KEYS,
    REQUEST_PAUSE_SECONDS,
    attribution_lines,
    commons_metadata,
    fetch,
    require_reusable_licence,
)

WIDTHS = (480, 960)
WEBP_QUALITY = 80

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGE_DIR = os.path.join(ROOT, 'assets', 'synths')
DATA_FILE = os.path.join(ROOT, 'src', 'data', 'synthImages.js')
# Where IMAGE_DIR is served from; the generated srcset points here.
IMAGE_URL = '/pages/opus5ios/assets/synths'

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
# Audio Demo MIDIs is deliberately absent because it is not an instrument.
# It falls back to a drawn faceplate plan in the catalogue.
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

# Licensed Commons images requested specifically for the combined Codex
# design. Keeping them in a separate map means a Codex image can supersede a
# base pick without silently changing the source /opus5ios design.
CODEX_COMMONS_PICKS = [
    (
        'virus-ti-snow-codex',
        'Access Virus TI and TI2, OsTIrus, Adam Szabo Viper',
        'File:Virus TI Snow.JPG',
        'An Access Virus TI Snow desktop synthesizer angled across a wooden '
        'surface, its blue display illuminated',
    ),
]

# Manufacturer product imagery requested specifically for the Codex design.
# Each image links back to its relevant product page; the Waves Graphic
# Library explicitly requires that linkback. These remain Codex-only so the
# source /opus5ios design is not altered.
CODEX_PICKS = [
    {
        'slug': 'waves-codex',
        'bank': 'Waves CODEX',
        'download': 'https://media.wavescdn.com/images/products/plugins/max/codex.png',
        'alt': 'The Waves Codex wavetable synthesizer interface, with twin '
               'oscillator displays and its modulation controls',
        'author': 'Waves Audio Ltd.',
        'licence': 'Waves Graphic Library',
        'licenceUrl': 'https://www.waves.com/downloads/graphic-library',
        'source': 'https://www.waves.com/plugins/codex',
        'sourceName': 'Waves.com',
        'linkImage': True,
    },
    {
        'slug': 'roland-sh-01a-codex',
        'bank': 'Roland SH-01A',
        'download': 'https://static.roland.com/assets/images/products/gallery/'
                    'sh-01a_k25m_left_1_gal.jpg',
        'alt': 'A grey Roland SH-01A synthesizer mounted in its K-25m '
               'keyboard dock, seen from a low angle',
        'author': 'Roland Corporation',
        'licence': 'Manufacturer product image',
        'licenceUrl': 'https://www.roland.com/us/support/product_images/',
        'source': 'https://www.roland.com/us/products/sh-01a/',
        'sourceName': 'Roland.com',
        'linkImage': True,
    },
]

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


DATA_HEADER = """/*
 * Instrument photographs for /opus5ios.
 *
 * GENERATED by scripts/fetch-opus5ios-synth-images.py — re-run that rather
 * than editing this file by hand, or the assets and the attribution drift
 * apart.
 *
 * These are a different set of frames from the ones the earlier pages use:
 * closer, more graphic, chosen for a wide plate rather than a small
 * portrait. Commons images are licensed for reuse and modification; the
 * Codex-only manufacturer images are attributed and link directly back to
 * their product pages. General image-search results are not used.
 *
 * CC BY and CC BY-SA REQUIRE visible attribution — the colophon credits
 * block is that licence condition being met, not a courtesy. Removing it
 * means removing the images.
 *
 * `widths` lists the derivatives that actually exist. Small originals get
 * one file, not two, because the generator refuses to upscale; the page
 * builds its srcset from this list rather than assuming both sizes.
 *
 * One catalogue entry has no image on purpose; see the PICKS comment in the
 * generator for which and why. It is drawn instead.
 */"""

DATA_FOOTER = """export const imageFor = (bankName) => synthImages[bankName] || null;

/** Every credited image, for the attribution surface. */
export const credits = Object.entries(synthImages)
  .map(([bank, image]) => ({ bank, ...image }));

/** `srcSet` for an image, built from the derivatives that exist. */
export const srcSetFor = (image) => image.widths
  .map((width) => `IMAGE_URL/${image.slug}-${width}.webp ${width}w`)
  .join(', ');

/** The widest derivative — the `src` fallback. */
export const sourceFor = (image) =>
  `IMAGE_URL/${image.slug}-${image.widths[image.widths.length - 1]}.webp`;
""".replace('IMAGE_URL', IMAGE_URL)


def image_map_lines(name, image_rows):
    lines = [f'export const {name} = {{']
    for row in image_rows:
        lines += attribution_lines(row)
        if row.get('sourceName'):
            lines.append(f'    sourceName: {json.dumps(row["sourceName"])},')
        if row.get('linkImage'):
            lines.append('    linkImage: true,')
        lines.append(f'    widths: {json.dumps(row["widths"])},')
        lines.append(f'    width: {row["width"]},')
        lines.append(f'    height: {row["height"]},')
        lines.append('  },')
    lines.append('};\n')
    return lines


def render_data_module(rows, codex_rows):
    return '\n'.join([
        DATA_HEADER,
        *image_map_lines('synthImages', rows),
        '/** Product images used only by the combined /codex design. */',
        *image_map_lines('codexImages', codex_rows),
        DATA_FOOTER,
    ])


def check():
    """Verify what is on disk against the picks tables, and change nothing."""
    declared = (
        {slug for slug, _, _, _ in PICKS}
        | {slug for slug, _, _, _ in CODEX_COMMONS_PICKS}
        | {pick['slug'] for pick in CODEX_PICKS}
    )
    on_disk = {f.rsplit('-', 1)[0] for f in os.listdir(IMAGE_DIR)}
    missing = sorted(declared - on_disk)
    orphans = sorted(on_disk - declared)

    print(f'declared: {len(declared)}')
    print(f'missing:  {missing or "none"}')
    print(f'orphans (files with no attribution): {orphans or "none"}')
    return 1 if (missing or orphans) else 0


def derivative_fields(written):
    """`widths`, `width` and `height` for a row, from what `convert` wrote."""
    _, (pixel_width, pixel_height) = written[-1]
    return {
        'widths': [width for width, _ in written],
        'width': pixel_width,
        'height': pixel_height,
    }


def report(slug, licence, author, widest_width):
    path = os.path.join(IMAGE_DIR, f'{slug}-{widest_width}.webp')
    size_kb = os.path.getsize(path) // 1024
    print(f'  {slug:14} {licence:16} {size_kb:4} kB  {author[:34]}')


def fetch_commons_row(slug, bank, title, alt):
    meta = commons_metadata(title)
    require_reusable_licence(slug, meta['licence'])

    time.sleep(REQUEST_PAUSE_SECONDS)
    written = convert(fetch(meta['download']), slug)
    report(slug, meta['licence'], meta['author'], written[-1][0])
    time.sleep(REQUEST_PAUSE_SECONDS)
    return {
        'slug': slug, 'bank': bank, 'alt': alt,
        **derivative_fields(written),
        **{k: meta[k] for k in ATTRIBUTION_KEYS},
    }


def fetch_manufacturer_row(pick):
    written = convert(fetch(pick['download']), pick['slug'])
    report(pick['slug'], pick['licence'], pick['author'], written[-1][0])
    return {**pick, **derivative_fields(written)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true',
                        help='verify assets and attribution; write nothing')
    args = parser.parse_args()

    if args.check:
        return check()

    os.makedirs(IMAGE_DIR, exist_ok=True)
    rows = [fetch_commons_row(*pick) for pick in PICKS]
    codex_rows = [fetch_commons_row(*pick) for pick in CODEX_COMMONS_PICKS]
    codex_rows += [fetch_manufacturer_row(pick) for pick in CODEX_PICKS]

    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, 'w') as handle:
        handle.write(render_data_module(rows, codex_rows))
    total = len(rows) + len(codex_rows)
    print(f'\n{total} instruments -> {os.path.relpath(DATA_FILE, ROOT)}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
