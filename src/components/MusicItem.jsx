import YouTubeEmbed from './YouTubeEmbed';

function MusicItem({ item }) {
  return (
    <div className="store-item">
      <h3>{item.title}</h3>
      <YouTubeEmbed videoId={item.videoId} />
      <p>{item.description}</p>
    </div>
  );
}

export default MusicItem;
