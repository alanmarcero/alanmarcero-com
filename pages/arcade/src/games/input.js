/**
 * The keyboard half of the arcade's input contract. Games speak in the same
 * action names the touch controls send ('left', 'fire', …), so mapping a key
 * to its action lets a game route both inputs through one handler.
 *
 * GameCanvas passes `KeyboardEvent.key`, where the space bar is ' '; 'Space'
 * is accepted as well because that is how the registry spells it.
 */
const DEFAULT_KEY_ACTIONS = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  ' ': 'fire',
  Space: 'fire',
};

/** The action a key stands for, or null for a key the arcade does not use. */
export function actionForKey(key) {
  return DEFAULT_KEY_ACTIONS[key] ?? null;
}

/** One grid step for each direction action, with y growing downwards. */
export const DIRECTION_STEPS = Object.freeze({
  up: Object.freeze({ x: 0, y: -1 }),
  down: Object.freeze({ x: 0, y: 1 }),
  left: Object.freeze({ x: -1, y: 0 }),
  right: Object.freeze({ x: 1, y: 0 }),
});
