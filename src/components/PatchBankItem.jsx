import YouTubeEmbed from './YouTubeEmbed';

function PatchBankItem({ bank }) {
  return (
    <div className="store-item">
      <h3>{bank.name}</h3>
      <p>{bank.description}</p>

      {Array.isArray(bank.audioDemo) && bank.audioDemo.length > 0 && (
        bank.audioDemo.map((videoId, index) => (
          videoId && (
            <div key={index} className="youtube-embed-container">
              <YouTubeEmbed videoId={videoId} />
            </div>
          )
        ))
      )}

      <a className="btn-primary download-btn" href={bank.downloadLink}>
        Download
      </a>
    </div>
  );
}

export default PatchBankItem;
