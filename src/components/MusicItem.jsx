import YouTubeEmbed from './YouTubeEmbed';

function MusicItem({ item, style }) {
  return (
    <div className="store-item" style={style}>
      <h3>{item.title}</h3>
      <YouTubeEmbed videoId={item.videoId} />
      <p>{item.description}</p>
      <a
        href={`https://www.youtube.com/watch?v=${item.videoId}`}
        className="btn-primary youtube-button"
        target="_blank"
        rel="noopener noreferrer"
      >
        Watch on YouTube
      </a>
    </div>
  );
}

export default MusicItem;
