import YouTubeEmbed from './YouTubeEmbed';
import ModulePanel from './ModulePanel';

function MusicItem({ item, style }) {
  return (
    <ModulePanel style={style}>
      <h3 className="module__title">{item.title}</h3>
      <div className="module__media">
        <YouTubeEmbed videoId={item.videoId} />
      </div>
      <p className="module__desc">{item.description}</p>
      <div className="module__actions">
        <a
          href={`https://www.youtube.com/watch?v=${item.videoId}`}
          className="btn btn--ghost"
          target="_blank"
          rel="noopener noreferrer"
        >
          Listen on YouTube
        </a>
      </div>
    </ModulePanel>
  );
}

export default MusicItem;
