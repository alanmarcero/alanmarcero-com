const GLYPHS = {
  ArrowLeft: '←',
  ArrowRight: '→',
  ArrowUp: '↑',
  ArrowDown: '↓',
  Space: 'SPACE',
};

/**
 * Turn a game's keyboard control map into a compact, de-duplicated list of
 * display glyphs (e.g. {left:'ArrowLeft', fire:'Space'} → ['←', 'SPACE']),
 * preserving declaration order. Used for the cabinet hover hint.
 */
export function controlGlyphs(controls) {
  const keys = Object.values(controls?.keyboard ?? {});
  const seen = new Set();
  const glyphs = [];
  for (const key of keys) {
    const glyph = GLYPHS[key] ?? String(key).toUpperCase();
    if (!seen.has(glyph)) {
      seen.add(glyph);
      glyphs.push(glyph);
    }
  }
  return glyphs;
}
