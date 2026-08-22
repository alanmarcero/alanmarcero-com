/*
 * Instrument photographs.
 *
 * Every image here is licensed for reuse and modification. The site is
 * public and carries the owner's name, so manufacturer press shots and
 * general image-search results are not usable — these come from Wikimedia
 * Commons under CC / public-domain terms.
 *
 * CC BY and CC BY-SA REQUIRE visible attribution. The credits surface
 * renders it. If you add an image, add its author, licence and source here
 * or the attribution will be incomplete and we will be in breach.
 *
 * Three catalogue entries have no photograph and are not meant to:
 *   Roland SH-01A    — no freely-licensed photograph exists
 *   Waves CODEX      — a plugin; there is no hardware to photograph
 *   Audio Demo MIDIs — not an instrument
 * Those fall back to their envelope field, which portrays the bank rather
 * than a machine.
 *
 * GENERATED, then reviewed by hand. Author strings come from Commons and
 * can contain newlines and derivative-work chains; they are flattened with
 * " · " so the credit chain survives on one line.
 */

export const synthImages = {
  "Sequential Prophet 08 and Rev2": {
    slug: "prophet-08",
    brightness: 1.344,
    alt: "A Sequential (Dave Smith Instruments) Prophet '08 synthesiser seen from the left",
    author: "Mac Rutan from Oviedo, FL, U.S.A.",
    licence: "CC BY-SA 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
    source: "https://commons.wikimedia.org/wiki/File:DSI_Prophet_%2708_-_left_side_view_-_Orlando_Synthesizer_Meetup_Dec_2016_(2016-12-04_(28)_by_Mac_Rutan).png",
    width: 960,
    height: 1280,
  },
  "Nord Lead 3 and Nord Rack 3": {
    slug: "nord-lead-3",
    brightness: 1.12,
    alt: "The knob panel of a Clavia Nord Lead 3",
    author: "Zak Mensah from Bristol, UK",
    licence: "CC BY 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0",
    source: "https://commons.wikimedia.org/wiki/File:Clavia_Nord_Lead_3_knobs.jpg",
    width: 960,
    height: 720,
  },
  "Access Virus TI and TI2, OsTIrus, Adam Szabo Viper": {
    slug: "virus-ti",
    brightness: 1.217,
    alt: "An Access Virus TI keyboard synthesiser",
    author: "Matroskin",
    licence: "Public domain",
    licenceUrl: "",
    source: "https://commons.wikimedia.org/wiki/File:Access_Virus_TI.jpg",
    width: 960,
    height: 593,
  },
  "Alesis A6 Andromeda": {
    slug: "andromeda-a6",
    brightness: 0.647,
    alt: "An Alesis A6 Andromeda analogue synthesiser, front view",
    author: "Creator:SynthAddict",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://commons.wikimedia.org/wiki/File:Alesis_Andromeda_A6_front.jpg",
    width: 960,
    height: 640,
  },
  "Roland JP-8000, JP-8080, JE-8086, and Airwave": {
    slug: "jp-8000",
    brightness: 0.932,
    alt: "A Roland JP-8000 synthesiser",
    author: "Danny Darko at English Wikipedia",
    licence: "Public domain",
    licenceUrl: "",
    source: "https://commons.wikimedia.org/wiki/File:JP-8000.png",
    width: 960,
    height: 600,
  },
  "Moog Slim Phatty and Little Phatty": {
    slug: "little-phatty",
    brightness: 0.954,
    alt: "A Moog Little Phatty synthesiser, angled from the right",
    author: "David Hilowitz from San Antonio, USA",
    licence: "CC BY 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0",
    source: "https://commons.wikimedia.org/wiki/File:Moog_Little_Phatty_Synthesizer_-_right_angled_(2014-05-18_by_David_Hilowitz).jpg",
    width: 960,
    height: 640,
  },
  "Nord Lead 2X, Nord Lead 2, DiscoDSP Discovery Pro": {
    slug: "nord-lead-2x",
    brightness: 0.968,
    alt: "A Clavia Nord Lead 2X, front view",
    author: "Clavia_Nord_Lead_2x.jpg: Candyman777 \u00b7 derivative work: Clusternote",
    licence: "CC BY-SA 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    source: "https://commons.wikimedia.org/wiki/File:Clavia_Nord_Lead_2x_front.jpg",
    width: 960,
    height: 333,
  },
  "Roland JP-08": {
    slug: "jp-08",
    brightness: 1.553,
    alt: "A Roland Boutique JP-08 desktop synthesiser",
    author: "Samboy",
    licence: "CC0",
    licenceUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    source: "https://commons.wikimedia.org/wiki/File:Roland_Boutique_JP-08_Synthesizer.jpg",
    width: 960,
    height: 450,
  },
};

export const imageFor = (bankName) => synthImages[bankName] || null;

/**
 * Per-image exposure correction, as a multiplier on the shared photo filter.
 *
 * WHY THESE NUMBERS EXIST. The eight photographs come from eight
 * photographers on Wikimedia Commons under eight lighting setups. Measured
 * against `--panel` (#232021) through the shared filter, their figure-ground
 * contrast ranged from 1.44:1 (jp-08, nearly invisible on the ground) to
 * 4.89:1 (andromeda-a6, floating off it) — a 3.40x spread. A uniform filter
 * over a heterogeneous corpus cannot fix that: it preserves the spread and
 * scales it down, so no single value of `brightness()` helps. Each photo
 * needs its own correction. These bring all eight to 3.00:1 — the WCAG
 * non-text floor — collapsing the spread to 1.00x.
 *
 * WHY A SCALAR AND NOT A FILTER STRING. The aesthetic (grayscale, contrast,
 * base brightness) belongs to the shared surface, not here. A whole filter
 * string would pin these eight images to one moment's aesthetic; a
 * multiplier stays proportionally correct when that aesthetic is retuned.
 *
 * RETURNS A NUMBER OR `undefined`, NEVER `null` OR `''`. The consumer spreads
 * this into a style object as a custom property, and React omits `undefined`
 * while emitting empty text for `null` — which yields
 * `brightness(calc(0.86 * ))`, invalid CSS, which drops the whole `filter`
 * declaration and renders the photo completely unfiltered. Quietest possible
 * bug, loudest possible failure. An image with no measurement must emit no
 * property at all and inherit the shared default.
 *
 * @param {string} bankName
 * @returns {number|undefined}
 */
export const photoBrightnessFor = (bankName) => {
  const image = synthImages[bankName];
  if (!image) return undefined;
  return typeof image.brightness === 'number' ? image.brightness : undefined;
};

/** Every credited image, for the attribution surface. */
export const credits = Object.entries(synthImages)
  .map(([bank, image]) => ({ bank, ...image }));
