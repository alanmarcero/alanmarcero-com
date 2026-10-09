import { WaveformDivider } from '../../../../src/components/graphics';

/** The readout masthead both chart pages open with. `children` sit under the standfirst. */
function PageHeader({
  kicker, title, intro, children,
}) {
  return (
    <header className="tm-header">
      <a href="/" className="tm-back">&larr; Back to console</a>
      <p className="kicker tm-kicker">{kicker}</p>
      <h1 className="tm-title">{title}</h1>
      <p className="tm-sub">{intro}</p>
      {children}
      <WaveformDivider variant="saw" className="tm-divider" />
    </header>
  );
}

export default PageHeader;
