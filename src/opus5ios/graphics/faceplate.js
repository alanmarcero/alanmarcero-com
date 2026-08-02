/*
 * Drawn faceplates.
 *
 * Three catalogue entries have no photograph and never will: no
 * freely-licensed picture of a Roland SH-01A exists, Waves CODEX is a
 * plugin with no hardware to point a camera at, and the MIDI bank is not an
 * instrument. Leaving those plates empty puts a hole in a column that is
 * otherwise a wall of machines.
 *
 * So they get a plan view instead — the panel drawing from the back of a
 * manual: a chassis, control sections divided by rules, knobs with pointer
 * lines, sliders, switches, a patch-number strip. Laid out from the bank's
 * own name, so the three drawn plates are three different machines rather
 * than one placeholder used three times.
 *
 * It is a drawing and it is honest about being one — a drawing cannot be
 * mistaken for a photograph of a product that does not exist.
 *
 * Pure geometry: takes a seed, returns numbers.
 */

import { makeRandom, intBetween, between } from './seed';

const KNOB = 'knob';
const SLIDER = 'slider';
const SWITCH = 'switch';

/**
 * A section's worth of controls, packed into a simple grid so nothing
 * overlaps and nothing escapes the section. One control kind per section:
 * real panels group by function, and a knob sitting in the middle of a bank
 * of sliders reads as a mistake.
 */
const fillSection = (random, section, kind) => {
  const controls = [];
  const inset = 9;
  const innerX = section.x + inset;
  const innerWidth = section.width - inset * 2;

  if (kind === SLIDER) {
    const count = intBetween(random, 2, 4);
    const step = innerWidth / count;
    for (let index = 0; index < count; index += 1) {
      controls.push({
        type: SLIDER,
        x: innerX + step * (index + 0.5),
        y: section.y + 16,
        length: section.height - 32,
        // Where the cap sits along the track, 0 at the bottom.
        position: between(random, 0.15, 0.9),
      });
    }
    return controls;
  }

  if (kind === SWITCH) {
    const rows = 2;
    const columns = intBetween(random, 2, 3);
    const stepX = innerWidth / columns;
    const stepY = (section.height - 26) / rows;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        controls.push({
          type: SWITCH,
          x: innerX + stepX * (column + 0.5),
          y: section.y + 18 + stepY * (row + 0.5),
          width: Math.min(15, stepX * 0.55),
          height: 7,
          on: random() < 0.45,
        });
      }
    }
    return controls;
  }

  const columns = intBetween(random, 2, 3);
  const rows = intBetween(random, 1, 2);
  const stepX = innerWidth / columns;
  const stepY = (section.height - 26) / rows;
  const radius = Math.min(9, stepX * 0.3, stepY * 0.34);
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      controls.push({
        type: KNOB,
        x: innerX + stepX * (column + 0.5),
        y: section.y + 18 + stepY * (row + 0.5),
        radius,
        // Pointer angle in radians, measured from straight up and swept
        // through the 300° a real knob travels — never into the 60° dead
        // zone at the bottom, which is where the pointer never points.
        angle: between(random, -Math.PI * 0.83, Math.PI * 0.83),
      });
    }
  }
  return controls;
};

/**
 * A whole panel.
 *
 * `sectionLabels` are the words printed above each division. They come from
 * the caller so a bank can be drawn with the vocabulary of its own kind of
 * instrument, and default to the sections nearly every subtractive synth
 * has.
 */
export const faceplateLayout = ({
  seed,
  width = 420,
  height = 150,
  sectionLabels = ['LFO', 'VCO', 'MIXER', 'VCF', 'ENV', 'VCA'],
}) => {
  const random = makeRandom(seed);
  const margin = 8;
  const panel = {
    x: margin,
    y: margin,
    width: width - margin * 2,
    height: height - margin * 2,
  };

  // A keybed on roughly half the drawings. The SH-01A has keys, CODEX does
  // not, and rather than special-casing names the seed decides — both
  // outcomes are plausible plan views and neither claims anything the
  // catalogue text does not already say.
  const hasKeybed = random() < 0.5;
  const keybedHeight = hasKeybed ? Math.round(panel.height * 0.3) : 0;
  const controlHeight = panel.height - keybedHeight;

  const sectionCount = intBetween(random, 3, Math.min(5, sectionLabels.length));
  const sectionWidth = panel.width / sectionCount;

  const sections = [];
  const controls = [];
  const kinds = [KNOB, SLIDER, SWITCH];

  for (let index = 0; index < sectionCount; index += 1) {
    const section = {
      x: panel.x + sectionWidth * index,
      y: panel.y,
      width: sectionWidth,
      height: controlHeight,
      label: sectionLabels[index % sectionLabels.length],
    };
    sections.push(section);
    // The first section is always knobs. A panel that opens with a bank of
    // switches reads as a patchbay, not an instrument.
    const kind = index === 0 ? KNOB : kinds[intBetween(random, 0, kinds.length - 1)];
    controls.push(...fillSection(random, section, kind));
  }

  const keybed = hasKeybed
    ? {
      x: panel.x,
      y: panel.y + controlHeight,
      width: panel.width,
      height: keybedHeight,
      keys: intBetween(random, 20, 30),
    }
    : null;

  return { width, height, panel, sections, controls, keybed };
};

/**
 * The black keys of a keybed, as fractions of an octave. Drawn from the
 * real pattern (no black key between E–F or B–C) because an evenly spaced
 * row of black keys is the one detail that makes a drawn keyboard look
 * wrong to anyone who plays one.
 */
export const BLACK_KEY_OFFSETS = [0, 1, 3, 4, 5];

/** Black-key rectangles for a keybed, in user units. */
export const blackKeys = (keybed) => {
  if (!keybed) return [];
  const step = keybed.width / keybed.keys;
  const rects = [];
  for (let index = 0; index < keybed.keys - 1; index += 1) {
    if (!BLACK_KEY_OFFSETS.includes(index % 7)) continue;
    rects.push({
      x: keybed.x + step * (index + 1) - step * 0.3,
      y: keybed.y,
      width: step * 0.6,
      height: keybed.height * 0.62,
    });
  }
  return rects;
};
