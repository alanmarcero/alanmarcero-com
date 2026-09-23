/**
 * Push the standard HUD payload to the React overlay.
 *
 * Every game reports the same four fields, so this is the one place that
 * defines the HUD contract. `overrides` covers the games that deviate:
 * Space Invaders pins `gameOver: false` on routine updates and reports the
 * end of a run only from its own game-over path, Tetris has no lives, and
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
