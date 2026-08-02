/*
 * One drawn mark per machine.
 *
 * A game list needs to be scannable by shape, not only by name — and the
 * shapes these particular games left behind are famous. Each mark is drawn
 * here as line work on a 40×40 field, in the same stroke vocabulary as
 * every other figure on the sheet, so the arcade reads as a section of the
 * same publication rather than as a second website.
 *
 * They are decorative: every mark sits beside the game's name in real
 * text, so the SVG is hidden from assistive technology rather than
 * labelled twice.
 */

const MARKS = {
  // The five-across invader: antennae, body, dropped legs, two eyes.
  'space-invaders': (
    <>
      <path d="M11 13L7 7M29 13l4-6" />
      <path d="M7 13h26v12H7z" />
      <path d="M11 25v6h5M29 25v6h-5" />
      <path d="M15 18h.5M25 18h.5" strokeWidth="3.4" strokeLinecap="round" />
    </>
  ),
  // A rock, and the ship keeping its distance from it.
  asteroids: (
    <>
      <path d="M24 5l9 5-1 10-8 7-9-2-4-9 4-9z" />
      <path d="M4 36l7-13 6 13-6.5-4z" />
    </>
  ),
  // An S-piece, its four cells ruled in.
  tetris: (
    <>
      <path d="M6 12h12v10H6z" />
      <path d="M18 22h12v10H18z" />
      <path d="M12 12v10M18 22v10M6 17h12M18 27h12" strokeOpacity="0.45" />
    </>
  ),
  // The wedge, and the dots it is heading for.
  'pac-man': (
    <>
      <path d="M20 20L33 12a15 15 0 1 0 0 16z" />
      <path d="M6 20h.01" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  // Bricks, ball, paddle.
  breakout: (
    <>
      <path d="M6 8h9v5H6zM17 8h9v5h-9zM28 8h6v5h-6zM6 15h6v5H6zM14 15h9v5h-9zM25 15h9v5h-9z" />
      <circle cx="16" cy="26" r="2.5" />
      <path d="M11 34h14" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  // Lanes, and one thing crossing them.
  frogger: (
    <>
      <path d="M4 10h32M4 20h32M4 30h32" strokeDasharray="5 4" strokeOpacity="0.55" />
      <path d="M20 36V6" />
      <path d="M16 11l4-5 4 5" />
    </>
  ),
  // The coil, its head, and the food.
  snake: (
    <>
      <path d="M6 9h12v8H6v8h18" strokeLinejoin="miter" />
      <path d="M24 21h8v8h-8z" />
      <circle cx="31" cy="10" r="2.5" />
    </>
  ),
  // Two paddles, one ball, the centre line.
  pong: (
    <>
      <path d="M20 5v30" strokeDasharray="3 4" strokeOpacity="0.55" />
      <path d="M7 12v12M33 16v12" strokeWidth="3" strokeLinecap="round" />
      <circle cx="23" cy="21" r="2.5" />
    </>
  ),
  // Four lanes and the notes falling down them.
  rhythm: (
    <>
      <path d="M8 4v32M17 4v32M26 4v32M35 4v32" strokeOpacity="0.45" />
      <path d="M8 10l3 3-3 3-3-3zM26 16l3 3-3 3-3-3zM17 24l3 3-3 3-3-3z" />
      <path d="M3 34h34" strokeWidth="2" />
    </>
  ),
  // The chain, and a mushroom in its way.
  centipede: (
    <>
      <circle cx="9" cy="14" r="4" />
      <circle cx="18" cy="14" r="4" />
      <circle cx="27" cy="14" r="4" />
      <path d="M31 22h4M5 22h4" strokeOpacity="0.5" />
      <path d="M14 32a6 6 0 0 1 12 0z" />
      <path d="M18 32v4M22 32v4" />
    </>
  ),
  // A bird, in as few strokes as a bird can be drawn.
  'bird-name-generator': (
    <>
      <ellipse cx="20" cy="19" rx="11" ry="9" />
      <path d="M9 19L2 14v10z" />
      <path d="M31 17l7 2-7 2z" />
      <path d="M15 20a7 6 0 0 0 10 3" strokeOpacity="0.6" />
      <path d="M17 28v7M23 28v7" />
      <path d="M26 16h.5" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  // The pulse going out, and the thing that sent it.
  'life-pulse': (
    <>
      <circle cx="16" cy="20" r="4" />
      <path d="M23 12a11 11 0 0 1 0 16" strokeOpacity="0.75" />
      <path d="M28 7a18 18 0 0 1 0 26" strokeOpacity="0.45" />
      <path d="M4 20h6" />
    </>
  ),
};

function Pictogram({ id, className = '' }) {
  const mark = MARKS[id];
  // A game with no mark drawn yet gets no placeholder box: an empty slot in
  // the column is quieter than a question mark, and the name still reads.
  if (!mark) return null;

  return (
    <svg
      className={`mark ${className}`}
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
    >
      {mark}
    </svg>
  );
}

export default Pictogram;
export { MARKS };
