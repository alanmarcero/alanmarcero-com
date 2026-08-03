import { useEffect, useId, useRef } from 'react';
import GameCanvas from '../../arcade/components/GameCanvas';
import { keyLayout } from './keycaps';
import './screen.css';

/*
 * The running machine, mounted unchanged and wearing this route's chrome.
 *
 * `GameCanvas`, the loop, the HUD markup and the touch controls are the
 * existing runtime, untouched — it is shared with three other routes. It
 * imports no stylesheet of its own, so it renders against whatever an
 * ancestor loaded, and `screen.css` (imported here, so it arrives with the
 * runtime and not before) covers every class name it emits.
 *
 * Everything this file adds is about the seam between a page and a game: what
 * a screen reader is told on arrival, where focus goes, and which keypresses
 * the document behind the game is not allowed to act on.
 */

/*
 * The keys a game needs that the browser also wants. Two separate bugs live
 * here, and both are invisible until someone plays for more than a second:
 * the document behind the fixed wrapper still scrolls on Space and the
 * arrows, and because a click can leave focus sitting on a HUD button, Space
 * also re-activates that button — press "Copy Link", play Space Invaders, and
 * every shot copies the URL again.
 *
 * Escape is deliberately absent: the runtime listens for it to leave.
 */
const HELD_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  ' ',
  'PageUp',
  'PageDown',
  'Home',
  'End',
]);

function RunningGame({ game, onExit }) {
  const stageRef = useRef(null);
  const briefingId = useId();

  // A keyboard reader arrives at the game itself rather than at the top of a
  // page whose only content is a canvas, which is also how Escape becomes
  // discoverable: the description below is read out on arrival.
  useEffect(() => {
    stageRef.current?.focus();
  }, []);

  // Capture phase, on window, for the life of the stage: the default action
  // has to be cancelled before it reaches whatever element focus happens to
  // be on. Propagation is left alone, so the runtime's own keydown listener
  // still sees every key.
  useEffect(() => {
    const holdKey = (event) => {
      if (!HELD_KEYS.has(event.key)) return;
      // Not when a button has focus. Cancelling a button's keydown is what
      // stops Space activating it, so swallowing Space here would leave the
      // game-over overlay's own "Play again" unusable from the keyboard —
      // trading one Space bug for a worse one. A focused button means the
      // reader is aiming at the chrome, not at the game.
      if (event.target instanceof HTMLButtonElement) return;
      event.preventDefault();
    };
    window.addEventListener('keydown', holdKey, true);
    return () => window.removeEventListener('keydown', holdKey, true);
  }, []);

  useEffect(() => {
    document.body.classList.add('is-playing');
    return () => document.body.classList.remove('is-playing');
  }, []);

  return (
    <div
      className="stage"
      ref={stageRef}
      tabIndex={-1}
      aria-label={`${game.name} — running`}
      aria-describedby={briefingId}
    >
      <p className="sr-only" id={briefingId}>
        Press Escape to leave the game. Controls: {keyLayout(game.controls.keyboard).spoken}.
      </p>

      <GameCanvas game={game} onExit={onExit} />
    </div>
  );
}

export default RunningGame;
