function PatchBankItem({ bank }) {
  return (
    <div className="store-item">
      <h3>{bank.name}</h3>
      <p>{bank.description}</p>

      {/* YouTube embeds */}
      {Array.isArray(bank.audioDemo) && bank.audioDemo.length > 0 && (
        bank.audioDemo.map((videoId, index) => (
          videoId && (
            <div key={index} className="youtube-embed-container">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          )
        ))
      )}

      <a className="download-btn" href={bank.downloadLink}>
        Download
      </a>
    </div>
  );
}

export default PatchBankItem;