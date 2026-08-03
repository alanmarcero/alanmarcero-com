#!/usr/bin/env python3
"""Fetch, crop, convert and attribute the instrument plates for /opus-max-mac.

The plate on this page is a circular field — a photographic plate seen down
an eyepiece — so a frame is only usable if it survives being centre-cropped
to a square and masked to a circle. Every pick below was chosen and checked
that way, which means this generator has to perform the same crop: resize
without it and the page would show a composition nobody ever looked at.

It produces `public/opus-max-mac/plates/*.webp` and
`src/opusmaxmac/data/plates.js`, and it is committed so the next person
adding an instrument can regenerate the pair the same way.

Three generators, three picks tables, on purpose. This one shares nothing
with `scripts/fetch-synth-images.py` (the earlier pages) or
`scripts/fetch-opus5ios-synth-images.py` (the broadsheet): re-pointing
either of those would silently re-skin a route that is already finished.

Idempotent and safe to re-run: same picks in, same files out.

    python3 scripts/fetch-opus-max-mac-photographs.py            # fetch + crop + write data
    python3 scripts/fetch-opus-max-mac-photographs.py --check    # verify only, change nothing

Requires Pillow (`pip install pillow`) and nothing else — no macOS-only
binaries, so it runs on CI too.
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

# Square derivatives: the plate is a circle inscribed in one of these.
WIDTHS = (320, 640)
WEBP_QUALITY = 80

# A square crop is limited by the SHORT side, so asking Commons for a
# 1600-wide thumbnail — what the other two generators do — would cap the
# widest of these picks at a 458px square. This is wide enough that even the
# most letterboxed frame in the table (3.5:1) still yields a square past 640,
# and MediaWiki clamps the thumbnail to the original for everything smaller.
# `crop_to_square` re-checks that promise per file rather than trusting it.
THUMB_REQUEST_WIDTH = 2400

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGE_DIR = os.path.join(ROOT, 'public', 'opus-max-mac', 'plates')
DATA_FILE = os.path.join(ROOT, 'src', 'opusmaxmac', 'data', 'plates.js')

# (slug, bank name as it appears in src/data/patchBanks.js, Commons file, alt text)
#
# The bank name is the join key and must match patchBanks.js character for
# character — the register looks a plate up by it.
#
# Every pick is a THIRD distinct Commons file, different from both of the
# other generators', with one unavoidable exception noted at the JP-08. The
# alt text describes the frame AFTER the square crop, because that is the
# only part of the photograph the page ever shows.
#
# Three catalogue entries are deliberately absent, and must never be given a
# substitute:
#   Roland SH-01A    — no freely-licensed photograph of it exists anywhere.
#                      Re-checked Commons and Openverse 2026-08-03:
#                      `File:Roland GAIA SH-01.jpg` is a different synth, and
#                      the SH-101 files are the 1982 original rather than the
#                      Boutique reissue this bank is for.
#   Waves CODEX      — a plugin; there is no hardware to photograph.
#   Audio Demo MIDIs — not an instrument.
# They are drawn as Airy diffraction patterns instead: the image a telescope
# really makes of a source it cannot resolve. A drawing cannot be mistaken
# for a photograph of a product that does not exist; a lookalike can.
PICKS = [
    (
        'prophet-08',
        'Sequential Prophet 08 and Rev2',
        'File:DSI Prophet Rev2 - 2017 Winter NAMM '
        '(2017-01-19 14.19.00 by Pete Brown).jpg',
        'A Sequential Prophet Rev2 on a dark studio table, seen along the '
        'keybed, its name printed on the wooden end cheek',
    ),
    (
        'nord-lead-3',
        'Nord Lead 3 and Nord Rack 3',
        'File:Clavia Nord Lead 3 - filter 2 - Advanced Subtractive '
        'Sunthesizer Made in Sweden by Clavia.jpg',
        "A close, shallow-focus view of a Nord Lead 3's filter section, black "
        'knobs in lit red rings above the MADE IN SWEDEN legend on the red '
        'chassis',
    ),
    (
        'virus-ti',
        'Access Virus TI and TI2, OsTIrus, Adam Szabo Viper',
        'File:Virus TI Snow.JPG',
        'An Access Virus TI Snow desktop module on a wooden floor, a patch '
        'name on its display beside the grid of grey parameter buttons',
    ),
    (
        'andromeda-a6',
        'Alesis A6 Andromeda',
        # Dual-licensed `{{self|GFDL|cc-by-sa-all}}`. The CC BY-SA 4.0 arm is
        # what permits use here — GFDL on a photograph would drag the whole
        # licence text onto the page — so that is the arm to record.
        'File:Alesis Andromeda A6 back.jpg',
        'An Alesis A6 Andromeda seen from behind, ANDROMEDA printed across '
        'the rear panel with the blue-knobbed control surface and keybed '
        'rising above it',
    ),
    (
        'jp-8000',
        'Roland JP-8000, JP-8080, JE-8086, and Airwave',
        'File:JP-8080 Modulator.jpg',
        "The modulator and external-input controls of a Roland JP-8080's "
        'vocoder, close on the turquoise panel above the orange FILTER '
        'legends',
    ),
    (
        'little-phatty',
        'Moog Slim Phatty and Little Phatty',
        # A derivative work whose author field is a two-step chain. CC
        # requires the chain be preserved, so `strip_markup` flattens the
        # multi-line string with a separator — never truncate it to one name.
        'File:Moog Slim Phatty.jpg',
        'The OSCILLATORS section of a Moog Slim Phatty, one large waveform '
        "knob between the two oscillators' rows of backlit buttons",
    ),
    (
        'nord-lead-2x',
        'Nord Lead 2X, Nord Lead 2, DiscoDSP Discovery Pro',
        # This frame is a Nord Rack 2, the rackmount sibling of the Nord Lead
        # 2 the bank names, and the alt text says so rather than fudging it.
        # `File:Clavia Nord Rack 2x.jpg` looks like the better pick and is
        # not: its wikitext carries `{{RetouchedPicture}}` and its panel
        # pixels are a Nord Lead 2X photograph composited onto a rack body.
        'File:Clavia Nord Rack 2 knobs (by David J).jpg',
        'An extreme close view along the panel of a Clavia Nord Rack 2 — the '
        'rackmount of the Nord Lead 2 — its black knobs with white index '
        'lines over red scales',
    ),
    (
        # The one repeat across the three generators. Commons holds exactly
        # one photograph of this instrument — re-verified 2026-08-03: there is
        # no `Category:Roland JP-08`, and a full-text search returns nothing
        # else — so "a different frame" is not available at any price. It is
        # re-derived here rather than pointed at the other route's file, so
        # the two sets stay independently regenerable.
        'jp-08',
        'Roland JP-08',
        'File:Roland Boutique JP-08 Synthesizer.jpg',
        'The centre of a Roland Boutique JP-08 panel, orange sliders across '
        'its VCO and envelope sections above the red patch-number display',
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
    text = re.sub(r'\s*\n\s*', ' · ', text)
    # Some Artist fields link a Commons creator page, and stripping the anchor
    # leaves the namespace behind: "Creator:SynthAddict". The credit has to name
    # the photographer, not the page they have on Commons.
    text = re.sub(r'\bCreator:\s*', '', text)
    # A derivative's Artist field opens with the source file's name, which for
    # the Slim Phatty is 130 characters of underscored filename before the first
    # human. Commons' convention, not a licence condition: what CC asks for is
    # the authors and the derivative-work notice, and both are after the colon.
    # The file itself is still one click away through `source`.
    return re.sub(r'^[^:]+\.(?:jpe?g|png|gif|svg|webp):\s*', '', text, flags=re.I)


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
        '&prop=imageinfo&iiprop=url|extmetadata|size'
        f'&iiurlwidth={THUMB_REQUEST_WIDTH}'
    )
    pages = json.loads(fetch(url))['query']['pages']
    page = next(iter(pages.values()))
    if 'imageinfo' not in page:
        raise LookupError(f'no imageinfo for {title!r} — has it been renamed?')

    info = page['imageinfo'][0]
    extra = info.get('extmetadata') or {}
    return {
        'download': info.get('thumburl') or info['url'],
        # The largest square the ORIGINAL could ever give, which is what the
        # crop is checked against.
        'originalSquare': min(info['width'], info['height']),
        'author': strip_markup((extra.get('Artist') or {}).get('value')) or 'Unknown',
        'licence': strip_markup((extra.get('LicenseShortName') or {}).get('value')),
        'licenceUrl': strip_markup((extra.get('LicenseUrl') or {}).get('value')),
        'source': info.get('descriptionurl'),
    }


def crop_to_square(source_bytes, original_square, slug):
    """Centre-crop to the largest square the download contains.

    Centre, not a chosen box: every pick was verified by centring, and a
    per-file crop offset is a knob nobody would remember to re-check.

    The download is a thumbnail, so it can only be as tall as the thumbnail
    request allowed. If that came back short of what the original holds — and
    short of the largest derivative — the request width is wrong rather than
    the pick, and saying so beats quietly shipping a smaller plate.
    """
    original = Image.open(io.BytesIO(source_bytes)).convert('RGB')
    side = min(original.size)
    reachable = min(max(WIDTHS), original_square)
    if side < reachable:
        raise SystemExit(
            f'REFUSING {slug}: the thumbnail crops to {side}px square but the '
            f'original allows {reachable}px. Raise THUMB_REQUEST_WIDTH.'
        )

    left = (original.width - side) // 2
    top = (original.height - side) // 2
    return original.crop((left, top, left + side, top + side))


def write_derivatives(square, slug):
    """Write the square webps; return the widths that actually exist.

    Never upscales, and names each file after the width it really is rather
    than the width that was asked for — a `640w` descriptor on a 281px file
    is a lie the browser believes. A small original therefore gets one
    derivative at its own size, and the page builds its srcset from the
    returned list instead of assuming both sizes are there.
    """
    written = []

    for width in WIDTHS:
        target = min(width, square.width)
        if target in written:
            continue
        resized = square.resize((target, target), Image.LANCZOS)
        resized.save(os.path.join(IMAGE_DIR, f'{slug}-{target}.webp'),
                     'WEBP', quality=WEBP_QUALITY, method=6)
        written.append(target)

    return written


def write_data_module(rows):
    header = '''/*
 * Instrument photographs for /opus-max-mac — the circular plates.
 *
 * GENERATED by scripts/fetch-opus-max-mac-photographs.py — re-run that
 * rather than editing this file by hand, or the assets and the attribution
 * drift apart.
 *
 * Every derivative is SQUARE, because the plate is a circle: the generator
 * centre-crops before it resizes, and the frames were chosen by looking at
 * that crop. A non-square file here would mean somebody resized by hand.
 *
 * A third distinct set of Commons files, sharing none of its picks with the
 * earlier pages or the broadsheet, so no route's photographs can be changed
 * by editing another's generator. Every image is licensed for reuse and
 * modification. The site is public and carries the owner's name, so
 * manufacturer press shots and general image-search results are not usable.
 *
 * CC BY and CC BY-SA REQUIRE visible attribution — the credits block on the
 * page is that licence condition being met, not a courtesy. Removing it
 * means removing the images.
 *
 * `widths` lists the derivatives that actually exist, and each is named for
 * its true pixel size; the generator refuses to upscale, so a small original
 * gets one file rather than two. Build the srcset from this list.
 *
 * Three register entries have no photograph on purpose — Roland SH-01A (none
 * exists under a free licence), Waves CODEX (a plugin), Audio Demo MIDIs
 * (not an instrument). See the PICKS comment in the generator. They are
 * drawn as Airy diffraction patterns instead.
 */

export const plates = {'''

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
    lines.append('''export const plateFor = (bankName) => plates[bankName] || null;

/** Every credited photograph, for the attribution surface. */
export const credits = Object.entries(plates)
  .map(([bank, plate]) => ({ bank, ...plate }));

/** `srcSet` for a plate, built from the derivatives that exist. */
export const srcSetFor = (plate) => plate.widths
  .map((width) => `/opus-max-mac/plates/${plate.slug}-${width}.webp ${width}w`)
  .join(', ');

/** The widest derivative — the `src` fallback. */
export const sourceFor = (plate) =>
  `/opus-max-mac/plates/${plate.slug}-${plate.widths[plate.widths.length - 1]}.webp`;
''')
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, 'w') as handle:
        handle.write('\n'.join(lines))


def check():
    """Verify what is on disk against the picks table, and change nothing."""
    declared = {slug for slug, _, _, _ in PICKS}
    files = sorted(f for f in os.listdir(IMAGE_DIR) if f.endswith('.webp'))
    on_disk = {f.rsplit('-', 1)[0] for f in files}
    missing = sorted(declared - on_disk)
    orphans = sorted(on_disk - declared)

    # Squareness is this generator's whole reason to exist, so it is asserted
    # rather than assumed.
    oblong = []
    for name in files:
        with Image.open(os.path.join(IMAGE_DIR, name)) as image:
            if image.width != image.height:
                oblong.append(f'{name} ({image.width}x{image.height})')

    print(f'declared: {len(declared)}  files: {len(files)}')
    print(f'missing:  {missing or "none"}')
    print(f'orphans (files with no attribution): {orphans or "none"}')
    print(f'not square: {oblong or "none"}')
    return 1 if (missing or orphans or oblong) else 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true',
                        help='verify assets and attribution; write nothing')
    args = parser.parse_args()

    if args.check:
        return check()

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
        square = crop_to_square(fetch(meta['download']), meta['originalSquare'], slug)
        widths = write_derivatives(square, slug)

        rows.append({
            'slug': slug, 'bank': bank, 'alt': alt,
            'widths': widths, 'width': widths[-1], 'height': widths[-1],
            **{k: meta[k] for k in ('author', 'licence', 'licenceUrl', 'source')},
        })

        path = os.path.join(IMAGE_DIR, f'{slug}-{widths[-1]}.webp')
        size_kb = os.path.getsize(path) // 1024
        print(f'  {slug:14} {meta["licence"]:16} {str(widths):12} '
              f'{size_kb:4} kB  {meta["author"][:34]}')
        time.sleep(REQUEST_PAUSE_SECONDS)

    write_data_module(rows)
    print(f'\n{len(rows)} plates -> {os.path.relpath(DATA_FILE, ROOT)}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
