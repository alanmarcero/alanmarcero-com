import YouTubeEmbed from './YouTubeEmbed';
import { cardGlowHandlers } from '../utils/cardGlow';

function PatchBankItem({ bank, style, onDownload }) {
  return (
    <div className="store-item" style={style} {...cardGlowHandlers}>
      <h3>{bank.name}</h3>
      <p>{bank.description}</p>

      {bank.audioDemo?.filter(Boolean).map((videoId) => (
        <div key={videoId} className="youtube-embed-container">
          <YouTubeEmbed videoId={videoId} />
        </div>
      ))}

      <a className="btn-primary download-btn" href={bank.downloadLink} onClick={onDownload}>
        Download
      </a>
    </div>
  );
}

export default PatchBankItem;
