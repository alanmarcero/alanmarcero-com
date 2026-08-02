/**
 * The marquee: the lit sign over a cabinet, drawn rather than photographed.
 * Bulbs sit on the frame at even intervals and pulse once on load.
 */
function Marquee() {
  const bulbs = Array.from({ length: 22 }, (_, index) => index);

  return (
    <div className="marquee">
      <svg
        className="marquee__frame"
        viewBox="0 0 440 96"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Arcade"
      >
        <title>Arcade</title>
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
      <p className="marquee__word">Arcade</p>
    </div>
  );
}

export default Marquee;
