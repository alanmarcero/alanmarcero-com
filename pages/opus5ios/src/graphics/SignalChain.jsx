const WIDTH = 1200;
const HEIGHT = 210;
const BUS_Y = 84;
const BUS_START = 34;
const BUS_END = WIDTH - 34;

// The voice, left to right. Two oscillators into a mixer, through the
// filter and the amplifier, out via the effects — the path every patch on
// this page takes, and the reason the same six words keep appearing in the
// descriptions below.
const NODES = [
  { id: 'mix', label: 'MIX', at: 0.24, glyph: 'sum' },
  { id: 'vcf', label: 'VCF', at: 0.45, glyph: 'lowpass' },
  { id: 'vca', label: 'VCA', at: 0.64, glyph: 'gain' },
  { id: 'fx', label: 'FX', at: 0.82, glyph: 'delay' },
];

const SOURCES = [
  { id: 'osc-1', label: 'OSC 1', offset: -40 },
  { id: 'osc-2', label: 'OSC 2', offset: 40 },
];

// Modulators sit below the bus and dash upward into the stage they move.
const MODULATORS = [
  { id: 'lfo', label: 'LFO', target: 'vcf', glyph: 'sine' },
  { id: 'env', label: 'ENV', target: 'vca', glyph: 'adsr' },
];

const NODE_RADIUS = 17;
const MOD_Y = 168;

const xAt = (fraction) => BUS_START + (BUS_END - BUS_START) * fraction;

/** The little drawing inside a node — what that stage does, in one stroke. */
function NodeGlyph({ glyph, x, y }) {
  if (glyph === 'sum') {
    return (
      <g className="chain__glyph">
        <line x1={x - 7} y1={y} x2={x + 7} y2={y} />
        <line x1={x} y1={y - 7} x2={x} y2={y + 7} />
      </g>
    );
  }
  if (glyph === 'lowpass') {
    return (
      <path className="chain__glyph" d={`M${x - 8} ${y + 4} L${x} ${y + 4} L${x + 3} ${y - 4} L${x + 8} ${y + 6}`} />
    );
  }
  if (glyph === 'gain') {
    return (
      <path className="chain__glyph" d={`M${x - 8} ${y + 6} L${x - 2} ${y - 6} L${x + 8} ${y - 6}`} />
    );
  }
  return (
    <g className="chain__glyph">
      <line x1={x - 8} y1={y + 6} x2={x - 8} y2={y - 6} />
      <line x1={x - 1} y1={y + 6} x2={x - 1} y2={y - 2} />
      <line x1={x + 6} y1={y + 6} x2={x + 6} y2={y + 2} />
    </g>
  );
}

/** The modulator's own shape: one LFO cycle, or an ADSR break line. */
function ModGlyph({ glyph, x, y }) {
  if (glyph === 'sine') {
    return (
      <path
        className="chain__glyph"
        d={`M${x - 14} ${y} C${x - 9} ${y - 11}, ${x - 4} ${y - 11}, ${x} ${y} S${x + 9} ${y + 11}, ${x + 14} ${y}`}
      />
    );
  }
  return (
    <path
      className="chain__glyph"
      d={`M${x - 14} ${y + 7} L${x - 8} ${y - 8} L${x - 3} ${y - 1} L${x + 5} ${y - 1} L${x + 14} ${y + 7}`}
    />
  );
}

/**
 * The masthead figure: the signal path itself, drawn as a schematic.
 *
 * Every patch bank on this page is a set of positions for these six stages,
 * so the page opens with the stages rather than with a photograph of one
 * particular machine — the catalogue covers nine of them and favouring one
 * in the masthead would be a lie about what the site is.
 *
 * The travelling dots are audio going through it. They are CSS animations,
 * so `prefers-reduced-motion` stops them in the stylesheet along with
 * everything else.
 */
function SignalChain() {
  const mixX = xAt(NODES[0].at);

  return (
    <svg
      className="chain"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Schematic of a synthesiser voice: two oscillators into a mixer, then filter, amplifier and effects, with an LFO modulating the filter and an envelope modulating the amplifier."
    >
      {/* The bus, drawn under everything so the nodes sit on it. */}
      <line className="chain__bus" x1={mixX} y1={BUS_Y} x2={BUS_END} y2={BUS_Y} />

      {SOURCES.map(({ id, label, offset }) => {
        const y = BUS_Y + offset;
        return (
          <g key={id}>
            <line className="chain__bus" x1={BUS_START} y1={y} x2={BUS_START + 96} y2={y} />
            <line
              className="chain__bus"
              x1={BUS_START + 96}
              y1={y}
              x2={mixX - NODE_RADIUS}
              y2={BUS_Y}
            />
            <circle className="chain__jack" cx={BUS_START} cy={y} r="5" />
            <text className="chain__label" x={BUS_START + 12} y={y - 11}>{label}</text>
          </g>
        );
      })}

      {NODES.map(({ id, label, at, glyph }) => {
        const x = xAt(at);
        return (
          <g key={id}>
            <circle className="chain__node" cx={x} cy={BUS_Y} r={NODE_RADIUS} />
            <NodeGlyph glyph={glyph} x={x} y={BUS_Y} />
            <text className="chain__label" x={x} y={BUS_Y - NODE_RADIUS - 12} textAnchor="middle">
              {label}
            </text>
          </g>
        );
      })}

      {MODULATORS.map(({ id, label, target, glyph }) => {
        const node = NODES.find((candidate) => candidate.id === target);
        const x = xAt(node.at);
        return (
          <g key={id}>
            <path
              className="chain__mod"
              d={`M${x} ${MOD_Y - 20} L${x} ${BUS_Y + NODE_RADIUS + 4}`}
            />
            <ModGlyph glyph={glyph} x={x} y={MOD_Y - 40} />
            <text className="chain__label" x={x} y={MOD_Y - 4} textAnchor="middle">{label}</text>
          </g>
        );
      })}

      {/* Output. */}
      <circle className="chain__jack chain__jack--out" cx={BUS_END} cy={BUS_Y} r="7" />
      <text className="chain__label" x={BUS_END} y={BUS_Y - 22} textAnchor="middle">OUT</text>

      {/*
        Audio on the bus. Three dots, staggered, looping the run from the
        mixer to the output jack. They start at the mixer's own x and are
        animated by a CSS translate, so the run length has to reach the
        stylesheet — hence the custom property rather than a hard-coded
        pixel count that would silently desync if a node moved.
      */}
      <g
        className="chain__flow"
        style={{ '--chain-run': `${BUS_END - mixX}px` }}
        aria-hidden="true"
      >
        {[0, 1, 2].map((index) => (
          <circle
            key={index}
            className="chain__pulse"
            style={{ '--pulse-index': index }}
            cx={mixX}
            cy={BUS_Y}
            r="4"
          />
        ))}
      </g>
    </svg>
  );
}

export default SignalChain;
export { xAt, NODES, BUS_START, BUS_END, BUS_Y, WIDTH, HEIGHT };
