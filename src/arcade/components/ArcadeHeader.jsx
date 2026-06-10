import { WaveformDivider } from '../../components/graphics';

function ArcadeHeader() {
  return (
    <header className="arcade-header">
      <a href="/" className="arcade-back">&larr; Back to console</a>
      <p className="kicker arcade-kicker">// signal diversions</p>
      <h1 className="arcade-title">ARCADE</h1>
      <WaveformDivider variant="square" className="arcade-divider" />
    </header>
  );
}

export default ArcadeHeader;
