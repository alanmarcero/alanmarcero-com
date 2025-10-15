function MusicItem({ item }) {
  return (
    <div className="store-item">
      <h3>{item.title}</h3>
      <iframe
        src={`https://www.youtube.com/embed/${item.videoId}`}
        width="100%"
        height="220px"
        frameBorder="0"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
      <p>{item.description}</p>
    </div>
  );
}

export default MusicItem;