/**
 * The marquee: the lit sign over a cabinet, drawn rather than photographed.
 * Bulbs sit on the frame at even intervals and pulse once on load.
 */
function Marquee() {
  const bulbs = Array.from({ length: 22 }, (_, index) => index);

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
          x="3"
          y="3"
          width="434"
          height="90"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        {bulbs.map((index) => {
          const spacing = 434 / bulbs.length;
          const x = 3 + spacing * (index + 0.5);
          return (
            <g key={index} className="marquee__bulb" style={{ '--bulb': index }}>
              <circle cx={x} cy="9" r="2.4" fill="currentColor" />
              <circle cx={x} cy="87" r="2.4" fill="currentColor" />
            </g>
          );
        })}
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
