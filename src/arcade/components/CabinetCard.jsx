function CabinetCard({ game, onSelect }) {
  return (
    <button
      className="crt-monitor"
      onClick={() => onSelect(game.id)}
      style={{ '--monitor-accent': game.accent }}
    >
      <div className="crt-monitor-bezel">
        <div className="crt-monitor-screen">
          <div className="crt-monitor-scanlines" />
          <div className="crt-monitor-vignette" />
          <div className="crt-monitor-reflection" />
          <div className="crt-monitor-content">
            <span className="crt-monitor-title">{game.name}</span>
            <span className="crt-monitor-insert">INSERT COIN</span>
          </div>
        </div>
      </div>
      <p className="crt-monitor-desc">{game.description}</p>
    </button>
  );
}

export default CabinetCard;
