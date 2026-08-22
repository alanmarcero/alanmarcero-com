#!/usr/bin/env python3
"""
GENERATOR: one photograph per card on /neworleans-tours.

    python3 scripts/fetch-nola-tour-photos.py            # fetch everything missing
    python3 scripts/fetch-nola-tour-photos.py --force    # re-fetch even if present
    python3 scripts/fetch-nola-tour-photos.py cajun-encounters gray-line-swamp

Writes 960px-wide JPEGs into public/neworleans-tours/<slug>.jpg, matching the
size and format the base /neworleans page already uses in public/neworleans-do/.

Where the photographs come from
-------------------------------
Each entry names the operator's OWN page. A tour is a thing the operator sells,
and the operator's own hero shot is the one picture guaranteed to be of the
actual boat, the actual guide and the actual route -- a stock swamp photo is
prettier and tells the reader nothing about which tour they are buying. The
page is `noindex, nofollow` and personal.

Three traps live here; each produces a page that looks finished and is wrong.

1. **og:image is often a logo, not a photograph.** Many small tour operators set
   og:image to their wordmark, so the "hero image" you get back is 600x200 of
   text. Every candidate is therefore scored on pixel dimensions AND aspect
   ratio, and anything wider than 2.6:1 or shorter than 300px is rejected --
   that band is where banners and wordmarks live. If an operator has nothing
   else, the slug is reported as a miss rather than silently given its logo.

2. **The largest image on the page is frequently a background texture.** Sites
   built on Squarespace/Wix ship full-bleed decorative JPEGs that outsize the
   real content photos. Candidates are collected in source order with og:image
   and hero-ish selectors first, and size is used as a tiebreak within a tier
   rather than as the primary sort -- otherwise the texture always wins.

3. **A swamp operator's hero shot is often a PLANTATION.** Cajun Pride's home
   page leads with Saint Joseph Plantation, because the combo tour is what it
   most wants to sell. That is precisely the day-trip this itinerary rules out,
   so a picture of it on a swamp card actively misinforms. Deep tour pages are
   tried before home pages partly for this reason, and every result still has to
   be eyeballed on a contact sheet before it ships.

Anything this script cannot resolve is listed at the end under MISSES, and is
meant to be filled by hand rather than approximated.
"""

from __future__ import annotations

import argparse
import io
import os
import re
import sys
import urllib.error
import urllib.request
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "public", "neworleans-tours")

TARGET_W = 960
MIN_W, MIN_H = 480, 300   # 500px is all some operators have ever uploaded
MAX_ASPECT = 2.6          # wider than this is a banner or a wordmark
MIN_ASPECT = 0.55         # taller than this is a phone screenshot or a poster

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

# slug -> (label, [pages to try in order]). Order matches the page.
# More than one page per operator on purpose: a small operator's HOME page is
# usually where the wordmark lives, and the actual photographs live one click in
# on the tour or gallery page. Trying the deep page first is what stops this
# script from filling the grid with logos.
SOURCES: dict[str, tuple[str, list[str]]] = {
    # --- verified-deals section ---
    "nola-tour-guy": ("Nola Tour Guy", [
        "https://www.nolatourguy.com/free-walking-tours-nola-tour-guy/",
    ]),
    "free-tours-by-foot": ("Free Tours by Foot", [
        "https://freetoursbyfoot.com/new-orleans-tours/",
    ]),
    "legendary-garden-district": ("NOLA Legendary Walking Tours", [
        "https://www.neworleanslegendarywalkingtours.com/new-orleans-tours/garden-district-walking-tour",
    ]),
    "go-city-nola": ("Go City New Orleans", [
        "https://gocity.com/new-orleans/en-us",
    ]),
    # --- swamp operators ---
    "cajun-encounters": ("Cajun Encounters", [
        "https://cajunencounters.com/tours/swamp-tour/",
        "https://cajunencounters.com/tours/",
        "https://cajunencounters.com/",
    ]),
    "jean-lafitte-swamp": ("Jean Lafitte Swamp Tour", [
        "https://www.jeanlafitteswamptour.com/swamp-tours/",
        "https://www.jeanlafitteswamptour.com/",
    ]),
    "cajun-pride-swamp": ("Cajun Pride Swamp Tours", [
        "https://www.cajunprideswamptours.com/swamp-tour/",
        "https://www.cajunprideswamptours.com/tours/",
        "https://www.cajunprideswamptours.com/gallery/",
        "https://www.cajunprideswamptours.com/",
    ]),
    "airboat-adventures": ("Airboat Adventures", [
        "https://www.airboatadventures.com/",
    ]),
    "dr-wagner-honey-island": ("Dr. Wagner's Honey Island", [
        "https://www.honeyislandswamp.com/",
    ]),
    "ultimate-swamp-adventures": ("Ultimate Swamp Adventures", [
        "https://ultimateswampadventures.com/swamp-tours/",
        "https://ultimateswampadventures.com/photo-gallery/",
        "https://ultimateswampadventures.com/gallery/",
        "https://ultimateswampadventures.com/",
    ]),
    "gray-line-swamp": ("Gray Line Swamp & Bayou", [
        "https://www.graylineneworleans.com/tours/swamp-bayou-tour",
    ]),
    # --- food tours ---
    "sidewalk-food-tours": ("Sidewalk Food Tours", [
        "https://www.sidewalkfoodtours.com/new-orleans/",
    ]),
    "nola-secrets": ("New Orleans Secrets Tours", [
        "https://nosecretstours.com/new-orleans-food-tours/",
        "https://nosecretstours.com/tours/",
        "https://nosecretstours.com/",
    ]),
    "confederacy-of-cruisers": ("Confederacy of Cruisers", [
        "https://confederacyofcruisers.com/tours/culinary-bike-tour/",
        "https://confederacyofcruisers.com/tours/",
        "https://confederacyofcruisers.com/",
    ]),
    # the free boardwalk that is shut until 2028
    "barataria-preserve": ("Barataria Preserve (NPS)", [
        "https://www.nps.gov/jela/planyourvisit/barataria-preserve.htm",
    ]),
    # --- drink tours ---
    # Old New Orleans Rum and Seven Three Distilling are deliberately absent:
    # the first's domain now 404s through a redirect to celebrationdistillation
    # .com and may not be trading, and the second publishes an awards badge
    # where a photograph should be. Neither is on the page yet either.
    "drink-and-learn": ("Drink & Learn", [
        "https://drinkandlearn.com/tours/",
        "https://drinkandlearn.com/cocktail-tour/",
        "https://drinkandlearn.com/",
    ]),
}


def full_size(url: str) -> str:
    """Undo a CDN's thumbnail transform so we fetch the original.

    Wix sites (Confederacy of Cruisers is one) ship every image as a 77x51
    blurred placeholder and swap in the real one from JavaScript, so a plain
    HTML scrape sees nothing but placeholders and every candidate fails the
    minimum-size test. Dropping the `/v1/fill/...` segment returns the original
    upload. Squarespace's `?format=` works the same way.
    """
    if "static.wixstatic.com/media/" in url:
        return re.sub(r"/v1/[^?]*", "", url)
    if "images.squarespace-cdn.com" in url:
        return re.sub(r"\?format=\d+w", "?format=2500w", url)
    return url


# Hand-resolved images, for operators whose own pages defeat the scraper.
# Each one is a deliberate choice with the reason recorded, because an
# unexplained hardcoded URL is indistinguishable from a stock photo.
DIRECT: dict[str, tuple[str, str]] = {
    # Every page on this WordPress site shares one site-wide og:image, and it is
    # Saint Joseph Plantation -- the combo upsell, and exactly the day this
    # itinerary rules out. The boat photograph lives in the theme directory and
    # is reachable only by scraping /gallery/ for content images.
    "cajun-pride-swamp": (
        "https://www.cajunprideswamptours.com/wp-content/uploads/2024/05/GatorPatrolBoatPic_1384389969.jpg",
        "site-wide og:image is Saint Joseph Plantation; this is the covered "
        "pontoon from /gallery/swamp-tours/, which is what the card describes",
    ),
    # nps.gov's Barataria page carries four "structured_data" images and only
    # one is of this park -- the others are generic NPS furniture, including a
    # mountain scene from a park 1,500 miles away. Pinned to the right one.
    # NPS photographs are works of the federal government and public domain.
    "barataria-preserve": (
        "https://www.nps.gov/common/uploads/structured_data/FB1B892F-B120-F212-F3365E9299950D0C.jpg?w=1200&h=900&mode=crop",
        "the Barataria visitor center, which is the thing the card says is shut",
    ),
}


class Collector(HTMLParser):
    """Pull image candidates out of a page, in priority tiers."""

    def __init__(self, base: str):
        super().__init__(convert_charrefs=True)
        self.base = base
        self.candidates: list[tuple[int, str]] = []   # (tier, absolute url)

    def _add(self, tier: int, url: str | None) -> None:
        if not url:
            return
        url = url.strip().split()[0] if " " in url.strip() else url.strip()
        if url.startswith("data:") or not url:
            return
        absolute = urljoin(self.base, url)
        if not absolute.startswith(("http://", "https://")):
            return
        if re.search(r"\.(svg|gif)(\?|$)", absolute, re.I):
            return
        absolute = full_size(absolute)
        self.candidates.append((tier, absolute))

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "meta":
            key = (a.get("property") or a.get("name") or "").lower()
            if key in ("og:image", "og:image:secure_url", "twitter:image", "twitter:image:src"):
                self._add(0, a.get("content"))
        elif tag == "img":
            cls = (a.get("class") or "") + " " + (a.get("id") or "")
            tier = 1 if re.search(r"hero|banner|feature|slide|header|masthead", cls, re.I) else 2
            # srcset gives the widest variant; take the last entry
            srcset = a.get("srcset") or a.get("data-srcset")
            if srcset:
                last = srcset.split(",")[-1].strip().split()[0]
                self._add(tier, last)
            self._add(tier, a.get("src") or a.get("data-src") or a.get("data-lazy-src"))
        elif tag in ("source",):
            srcset = a.get("srcset")
            if srcset:
                self._add(2, srcset.split(",")[-1].strip().split()[0])
        style = a.get("style") or ""
        m = re.search(r"url\((['\"]?)([^'\")]+)\1\)", style)
        if m:
            self._add(2, m.group(2))


class Redirect308(urllib.request.HTTPRedirectHandler):
    """Older urllib does not follow 308, and several operator sites redirect
    www -> apex with one. Without this the fetch just reports HTTP 308."""

    def http_error_308(self, req, fp, code, msg, headers):
        return self.http_error_301(req, fp, 301, msg, headers)


OPENER = urllib.request.build_opener(Redirect308)


def get(url: str, timeout: int = 25) -> bytes:
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    })
    with OPENER.open(req, timeout=timeout) as r:
        return r.read()


def looks_like_artwork(im: Image.Image) -> bool:
    """True for a logo, wordmark or line drawing rather than a photograph.

    Dimension and aspect filters do not catch these: a 660x792 crawfish-on-a-bike
    line drawing and a 960x443 oval wordmark on black both pass every geometric
    test, and both look absurd in a photo grid. Two signals separate art from a
    photograph reliably enough for this job:

      * **A flat border.** Artwork is almost always centred on one flat ground,
        so the outer ring of pixels is nearly a single colour. A photograph's
        border is not.
      * **A small palette.** Quantised to a 32-level cube, a photograph spreads
        across hundreds of cells; flat art occupies a few dozen.
    """
    small = im.convert("RGB").resize((64, 64), Image.BILINEAR)
    px = small.load()

    border = [px[x, y] for x in range(64) for y in (0, 63)]
    border += [px[x, y] for y in range(64) for x in (0, 63)]
    ref = max(set(border), key=border.count)
    near = sum(1 for c in border if max(abs(c[i] - ref[i]) for i in range(3)) < 26)
    flat_border = near / len(border) > 0.82

    cells = {(px[x, y][0] >> 3, px[x, y][1] >> 3, px[x, y][2] >> 3)
             for x in range(64) for y in range(64)}
    small_palette = len(cells) < 260

    return flat_border or small_palette


def usable(im: Image.Image) -> bool:
    w, h = im.size
    if w < MIN_W or h < MIN_H:
        return False
    aspect = w / h
    if not (MIN_ASPECT <= aspect <= MAX_ASPECT):
        return False
    return not looks_like_artwork(im)


def best_image(page_url: str, verbose: bool = False) -> Image.Image | None:
    try:
        html = get(page_url).decode("utf-8", "replace")
    except (urllib.error.URLError, urllib.error.HTTPError, OSError) as exc:
        print(f"    page fetch failed: {exc}")
        return None

    parser = Collector(page_url)
    parser.feed(html)

    seen: set[str] = set()
    ordered = []
    for tier, url in parser.candidates:
        base = url.split("?")[0]
        if base in seen:
            continue
        seen.add(base)
        ordered.append((tier, url))
    ordered.sort(key=lambda t: t[0])

    best: tuple[int, int, Image.Image] | None = None
    for tier, url in ordered[:28]:
        try:
            raw = get(url, timeout=20)
            im = Image.open(io.BytesIO(raw))
            im.load()
        except Exception as exc:                     # noqa: BLE001 - any decode failure is just a skip
            if verbose:
                print(f"    skip {url[:70]}: {exc}")
            continue
        if not usable(im):
            if verbose:
                print(f"    reject {im.size} {url[:70]}")
            continue
        area = im.size[0] * im.size[1]
        # tier first, then area: the biggest file on a Squarespace page is
        # usually a background texture, so size only breaks ties within a tier.
        if best is None or (tier, area) < (best[0], -1) or (tier == best[0] and area > best[1]):
            best = (tier, area, im)
            if tier == 0:
                break
    return best[2] if best else None


def save(im: Image.Image, path: str) -> tuple[int, int]:
    im = im.convert("RGB")
    w, h = im.size
    if w > TARGET_W:                                  # never upscale
        im = im.resize((TARGET_W, round(h * TARGET_W / w)), Image.LANCZOS)
    im.save(path, "JPEG", quality=84, optimize=True, progressive=True)
    return im.size


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("slugs", nargs="*", help="only these slugs (default: all missing)")
    ap.add_argument("--force", action="store_true", help="re-fetch even if the file exists")
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args()

    os.makedirs(OUT_DIR, exist_ok=True)
    wanted = args.slugs or list(SOURCES)
    unknown = [s for s in wanted if s not in SOURCES]
    if unknown:
        print(f"unknown slug(s): {', '.join(unknown)}")
        return 2

    misses: list[str] = []
    for slug in wanted:
        label, pages = SOURCES[slug]
        dest = os.path.join(OUT_DIR, f"{slug}.jpg")
        if os.path.exists(dest) and not args.force:
            print(f"  · {slug}: already present")
            continue
        print(f"  → {slug} ({label})")
        im = None
        if slug in DIRECT:
            url, why = DIRECT[slug]
            print(f"      direct ({why})")
            try:
                im = Image.open(io.BytesIO(get(url)))
                im.load()
            except Exception as exc:                  # noqa: BLE001
                print(f"      direct failed: {exc}")
                im = None
        for page in pages if im is None else []:
            print(f"      try {page}")
            im = best_image(page, args.verbose)
            if im is not None:
                break
        if im is None:
            print("    MISS - no usable photograph")
            misses.append(slug)
            continue
        size = save(im, dest)
        print(f"    saved {size[0]}x{size[1]} → public/neworleans-tours/{slug}.jpg")

    if misses:
        print("\nMISSES (fill these by hand, do not approximate):")
        for m in misses:
            print(f"  ✗ {m} — {SOURCES[m][0]} — tried: {', '.join(SOURCES[m][1])}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
