import YouTubeEmbed from './YouTubeEmbed';
import ModulePanel from './ModulePanel';

const HERO_WIDTH = 1600;
const HERO_HEIGHT = 900;

function PatchBankItem({ bank, style, onDownload, eager = false }) {
  return (
    <ModulePanel style={style}>
      {bank.image && (
        <img
          className="module__hero"
          src={bank.image}
          srcSet={`${bank.image} ${HERO_WIDTH}w`}
          sizes="(max-width: 40rem) calc(100vw - 2.5rem), 28rem"
          alt={bank.imageAlt}
          width={HERO_WIDTH}
          height={HERO_HEIGHT}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}
      <div className="module__head">
        <h3 className="module__title">{bank.name}</h3>
        {bank.count ? (
          <span className="module__badge">{bank.count} patches</span>
        ) : null}
      </div>
      <p className="module__desc">{bank.description}</p>
      {bank.instruments?.length > 0 && (
        <ul className="module__tags" aria-label="Compatible instruments">
          {bank.instruments.map((instrument) => (
            <li key={instrument} className="module__tag">{instrument}</li>
          ))}
        </ul>
      )}

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
