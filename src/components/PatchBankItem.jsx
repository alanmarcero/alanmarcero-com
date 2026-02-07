import YouTubeEmbed from './YouTubeEmbed';

function PatchBankItem({ bank, style }) {
  return (
    <div className="store-item" style={style}>
      <h3>{bank.name}</h3>
      <p>{bank.description}</p>

      {bank.audioDemo?.filter(Boolean).map((videoId) => (
        <div key={videoId} className="youtube-embed-container">
          <YouTubeEmbed videoId={videoId} />
        </div>
      ))}

      <a className="btn-primary download-btn" href={bank.downloadLink}>
        Download
      </a>
    </div>
  );
}

export default PatchBankItem;
