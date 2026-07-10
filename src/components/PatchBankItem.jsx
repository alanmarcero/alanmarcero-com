import YouTubeEmbed from './YouTubeEmbed';
import ModulePanel from './ModulePanel';

function PatchBankItem({ bank, style, onDownload }) {
  return (
    <ModulePanel style={style}>
      <div className="module__head">
        <h3 className="module__title">{bank.name}</h3>
        {bank.count ? (
          <span className="module__badge">{bank.count} patches</span>
        ) : null}
      </div>
      <p className="module__desc">{bank.description}</p>

      {bank.audioDemo?.filter(Boolean).map((videoId) => (
        <div key={videoId} className="module__media">
          <YouTubeEmbed videoId={videoId} title={`${bank.name} audio demo`} />
        </div>
      ))}

      <div className="module__actions">
        <a className="btn btn--download" href={bank.downloadLink} onClick={onDownload}>
          Download
        </a>
      </div>
    </ModulePanel>
  );
}

export default PatchBankItem;
