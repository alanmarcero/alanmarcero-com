import YouTubeEmbed from './YouTubeEmbed';
import ModulePanel from './ModulePanel';

function PatchBankItem({ bank, style, onDownload }) {
  return (
    <ModulePanel style={style}>
      <h3 className="module__title">{bank.name}</h3>
      <p className="module__desc">{bank.description}</p>

      {bank.audioDemo?.filter(Boolean).map((videoId) => (
        <div key={videoId} className="module__media">
          <YouTubeEmbed videoId={videoId} />
        </div>
      ))}

      <div className="module__actions">
        <a className="btn" href={bank.downloadLink} onClick={onDownload}>
          Download
        </a>
      </div>
    </ModulePanel>
  );
}

export default PatchBankItem;
