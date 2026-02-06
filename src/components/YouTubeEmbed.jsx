function YouTubeEmbed({ videoId, title = "YouTube video", width = "100%", height = "220px" }) {
  return (
    <iframe
      src={`https://www.youtube.com/embed/${videoId}`}
      title={title}
      width={width}
      height={height}
      frameBorder="0"
      allowFullScreen
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    />
  );
}

export default YouTubeEmbed;
