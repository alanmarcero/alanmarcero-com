const BULB_COUNT = 22;
const FRAME_INSET = 3;
const FRAME_WIDTH = 434;
const BULB_SPACING = FRAME_WIDTH / BULB_COUNT;
const BULB_POSITIONS = Array.from(
  { length: BULB_COUNT },
  (_, index) => FRAME_INSET + BULB_SPACING * (index + 0.5),
);

/**
 * The marquee: the lit sign over a cabinet, drawn rather than photographed.
 * Bulbs sit on the frame at even intervals and pulse once on load.
 */
function Marquee() {
  return (
    <div className="marquee">
      {/*
        Decorative. The word is real text in the heading below, so labelling
        the drawing too would announce "Arcade" twice for one thing on screen.
      */}
      <svg
        className="marquee__frame"
        viewBox="0 0 440 96"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <rect
          x={FRAME_INSET}
          y={FRAME_INSET}
          width={FRAME_WIDTH}
          height="90"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        {BULB_POSITIONS.map((x, index) => (
          <g key={index} className="marquee__bulb" style={{ '--bulb': index }}>
            <circle cx={x} cy="9" r="2.4" fill="currentColor" />
            <circle cx={x} cy="87" r="2.4" fill="currentColor" />
          </g>
        ))}
      </svg>
      {/*
        The marquee word is this page's title, so it is the h1 — the arcade
        route had no h1 at all and its outline started at a visually-hidden
        h2. Mirrors Hero's <h1 className="hero__title"> on /matrix.
      */}
      <h1 className="marquee__word">Arcade</h1>
    </div>
  );
}

export default Marquee;
