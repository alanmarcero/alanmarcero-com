/**
 * Map a present-day patch-bank name to the synth thumbnail the old site used for
 * it (downloaded from archive.org into public/eras/img). Shown on the era cards
 * in their original right-floated position; null when the archive has no image
 * for that bank (we lean on text instead).
 */
const THUMBS = [
  [/prophet\s*0?8|rev2/i, 'p08.jpg'],
  [/nord lead 3/i, 'nl3.jpg'],
  [/virus ti/i, 'virusti.jpg'],
  [/sh-?01a/i, 'sh01a_small.jpg'],
  [/andromeda/i, 'andysmall.jpg'],
  [/jp-?8000|jp-?8080/i, 'jp80x0_small.jpg'],
  [/moog/i, 'moog_small.jpg'],
  [/nord lead 2/i, 'nl2x_small.jpg'],
];

export const bankThumb = (name) => {
  const match = THUMBS.find(([pattern]) => pattern.test(name || ''));
  return match ? `/eras/img/${match[1]}` : null;
};
