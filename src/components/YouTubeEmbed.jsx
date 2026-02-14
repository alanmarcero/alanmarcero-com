function YouTubeEmbed({ videoId, title = "YouTube video", width = "100%", height = "220px" }) {
  return (
    <iframe
      src={`https://www.youtube.com/embed/${videoId}`}
      title={title}
      width={width}
      height={height}
      allowFullScreen
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation allow-top-navigation-by-user-activation"
    />
  );
}

export default YouTubeEmbed;
