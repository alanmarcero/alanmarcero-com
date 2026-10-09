import { WaveformDivider } from '../../../../../src/components/graphics';

/** The readout masthead the page opens with. `children` sit under the standfirst. */
function PageHeader({
  kicker, title, intro, children,
}) {
  return (
    <header className="dd-header">
      <a href="/" className="dd-back">&larr; Back to console</a>
      <p className="kicker dd-kicker">{kicker}</p>
      <h1 className="dd-title">{title}</h1>
      <p className="dd-sub">{intro}</p>
      {children}
      <WaveformDivider variant="saw" className="dd-divider" />
    </header>
  );
}

export default PageHeader;
