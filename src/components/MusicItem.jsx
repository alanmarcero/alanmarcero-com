import YouTubeEmbed from './YouTubeEmbed';
import { cardGlowHandlers } from '../utils/cardGlow';

function MusicItem({ item, style }) {
  return (
    <div className="store-item" style={style} {...cardGlowHandlers}>
      <h3>{item.title}</h3>
      <YouTubeEmbed videoId={item.videoId} />
      <p>{item.description}</p>
      <a
        href={`https://www.youtube.com/watch?v=${item.videoId}`}
        className="btn-primary youtube-button"
        target="_blank"
        rel="noopener noreferrer"
      >
        Listen on YouTube
      </a>
    </div>
  );
}

export default MusicItem;
