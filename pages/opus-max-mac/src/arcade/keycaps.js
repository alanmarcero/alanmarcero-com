/*
 * What a machine answers to, as a diagram of its keys.
 *
 * The row already names the game and says what it is; the one thing a reader
 * still wants before pressing Play is which keys their hands go on. So the mark
 * beside each machine is that, drawn from the registry's own control map rather
 * than authored by hand — a picture of a thing you can do, not a picture of the
 * subject.
 *
 * The four arrow positions come back as four booleans instead of a list on
 * purpose: the unused ones are still drawn, as empty outlines, and it is the
 * empty outline that tells you at a glance that Pong takes two keys and Pac-Man
 * four. A list of the keys a game uses cannot say that.
 *
 * Pure. Same control map in, same layout out.
 */

/**
 * The arrows, each with the character that stands for it and the word a screen
 * reader should hear. The arcade's own `controlGlyphs` holds a glyph table too
 * but does not export it, and this route needs to know which keys are arrows
 * rather than just how to print them — a flat list of glyphs cannot be drawn as
 * a cross.
 */
const ARROWS = {
  ArrowUp: { position: 'up', glyph: '↑', spoken: 'up' },
  ArrowDown: { position: 'down', glyph: '↓', spoken: 'down' },
  ArrowLeft: { position: 'left', glyph: '←', spoken: 'left' },
  ArrowRight: { position: 'right', glyph: '→', spoken: 'right' },
};

/** Keys whose name is a word rather than a character. */
const NAMED = {
  Space: { glyph: 'SPACE', spoken: 'space' },
};

/**
 * Reading order for the spoken sentence, which is not the drawing order: a
 * sentence wants the pair a player thinks of first, and the cross wants a
 * clockwise walk.
 */
export const ARROW_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

/** Which of the four cross positions a key occupies, if any. */
export const arrowPositionFor = (key) => ARROWS[key]?.position ?? null;

/** What gets printed on the cap. Anything unrecognised is its own key, in caps. */
export const glyphFor = (key) =>
  ARROWS[key]?.glyph ?? NAMED[key]?.glyph ?? String(key ?? '').toUpperCase();

/** What gets read aloud. A single-character key is already its own word. */
const spokenFor = (key) => ARROWS[key]?.spoken ?? NAMED[key]?.spoken ?? glyphFor(key);

/** A list of words as one capitalised clause, with nothing on the end. */
const sentence = (words) => {
  if (!words.length) return '';
  const clause = words.join(', ');
  return clause.charAt(0).toUpperCase() + clause.slice(1);
};

/**
 * The keys one machine answers to.
 *
 * Roles are collapsed away: a game that fires and drops with the same key has
 * one key, and `keyCount` counts caps a hand has to reach, not entries in the
 * map. Extras keep the map's own order, which is the order the game's author
 * wrote them in and is stable across renders.
 */
export const keyLayout = (keyboard = {}) => {
  const keys = Object.values(keyboard ?? {}).filter(Boolean);
  const used = new Set(keys);

  const arrows = {
    up: used.has('ArrowUp'),
    down: used.has('ArrowDown'),
    left: used.has('ArrowLeft'),
    right: used.has('ArrowRight'),
  };

  const extras = [];
  const printed = new Set();
  for (const key of keys) {
    if (ARROWS[key]) continue;
    const glyph = glyphFor(key);
    if (!glyph || printed.has(glyph)) continue;
    printed.add(glyph);
    extras.push({ key, glyph });
  }

  const arrowsUsed = ARROW_KEYS.filter((key) => used.has(key));

  return {
    arrows,
    extras,
    keyCount: arrowsUsed.length + extras.length,
    spoken: sentence([
      ...arrowsUsed.map(spokenFor),
      ...extras.map((extra) => spokenFor(extra.key)),
    ]),
  };
};
