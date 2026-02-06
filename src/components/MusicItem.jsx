import YouTubeEmbed from './YouTubeEmbed';

function MusicItem({ item, style }) {
  return (
    <div className="store-item" style={style}>
      <h3>{item.title}</h3>
      <YouTubeEmbed videoId={item.videoId} />
      <p>{item.description}</p>
    </div>
  );
}

export default MusicItem;
