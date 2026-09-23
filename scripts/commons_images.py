"""
Wikimedia Commons plumbing for the instrument-photograph generators
(scripts/fetch-synth-images.py, pages/opus5ios/scripts/fetch-opus5ios-synth-images.py,
pages/opus-max-mac/scripts/fetch-opus-max-mac-photographs.py). Not a script:
import it.

Only the transport, the metadata read and the licence gate live here. Each
generator keeps its own picks table and its own image treatment, so editing
one route's photographs can never re-skin another's.
"""

import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request

# Wikimedia asks for a descriptive User-Agent with contact info, and
# rate-limits anonymous bursts. Both are honoured below.
USER_AGENT = (
    'alanmarcero-com-site-build/1.0 '
    '(https://alanmarcero.com; https://github.com/alanmarcero)'
)
REQUEST_PAUSE_SECONDS = 1.5
DEFAULT_THUMB_WIDTH = 1600

# Licences that permit commercial use and modification. Anything else must
# not ship: the site is public and carries the owner's name.
ALLOWED = re.compile(r'^(CC BY(-SA)? \d|CC0|Public domain)', re.I)

ATTRIBUTION_KEYS = ('author', 'licence', 'licenceUrl', 'source')


def strip_markup(value):
    """Commons returns HTML in attribution fields; flatten it to text.

    Newlines matter here: author strings carry derivative-work chains that
    CC requires be preserved, and an unescaped newline inside a JS string
    literal is a syntax error. Flattening with a separator keeps the chain
    and keeps the file parseable.
    """
    text = re.sub(r'<[^>]+>', '', value or '').strip()
    return re.sub(r'\s*\n\s*', ' · ', text)


def require_reusable_licence(slug, licence):
    if not ALLOWED.match(licence or ''):
        raise SystemExit(
            f'REFUSING {slug}: licence {licence!r} does not clearly '
            'permit commercial use and modification. Pick another file.'
        )


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


def metadata_url(title, thumb_width):
    return (
        'https://commons.wikimedia.org/w/api.php?action=query&format=json'
        f'&titles={urllib.parse.quote(title)}'
        '&prop=imageinfo&iiprop=url|extmetadata|size'
        f'&iiurlwidth={thumb_width}'
    )


def parse_metadata(payload, title, clean=strip_markup):
    """The download URL and attribution fields out of one imageinfo answer."""
    page = next(iter(payload['query']['pages'].values()))
    if 'imageinfo' not in page:
        raise LookupError(f'no imageinfo for {title!r} — has it been renamed?')

    info = page['imageinfo'][0]
    extra = info.get('extmetadata') or {}

    def field(name):
        return clean((extra.get(name) or {}).get('value'))

    return {
        'download': info.get('thumburl') or info['url'],
        # The largest square the ORIGINAL could ever give.
        'originalSquare': min(info['width'], info['height']),
        'author': field('Artist') or 'Unknown',
        'licence': field('LicenseShortName'),
        'licenceUrl': field('LicenseUrl'),
        'source': info.get('descriptionurl'),
    }


def commons_metadata(title, thumb_width=DEFAULT_THUMB_WIDTH, clean=strip_markup):
    payload = json.loads(fetch(metadata_url(title, thumb_width)))
    return parse_metadata(payload, title, clean)


def attribution_lines(row):
    """The opening of one image's entry in a generated JS map: bank key, slug,
    alt and the four attribution fields, in the order every page reads them."""
    lines = [f'  {json.dumps(row["bank"])}: {{']
    for key in ('slug', 'alt', *ATTRIBUTION_KEYS):
        lines.append(f'    {key}: {json.dumps(row[key])},')
    return lines
