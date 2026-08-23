/**
 * Push the standard HUD payload to the React overlay.
 *
 * Every game reports the same four fields, so this is the one place that
 * defines the HUD contract. `overrides` covers the games that deviate:
 * Pac-Man and Space Invaders pin `gameOver: false` because they announce the
 * end of a run through their own death sequence, Tetris has no lives, and
 * Life Pulse accumulates a fractional score it wants floored for display.
 */
export function emitHud(game, overrides) {
  if (!game.onHudUpdate) return;

  game.onHudUpdate({
    score: game.score,
    lives: game.lives,
    level: game.level,
    gameOver: game.gameOver,
    ...overrides,
  });
}
