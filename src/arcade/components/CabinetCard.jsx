function CabinetCard({ game, onSelect }) {
  return (
    <button
      className="cabinet-card"
      onClick={() => onSelect(game.id)}
      style={{ '--cabinet-accent': game.accent }}
    >
      <div className="cabinet-screen">
        <div className="cabinet-scanlines" />
        <span className="cabinet-game-icon">{game.id === 'space-invaders' ? '/\\' : game.id === 'asteroids' ? '<>' : '[]'}</span>
      </div>
      <div className="cabinet-marquee">
        <span className="cabinet-name">{game.name}</span>
      </div>
      <p className="cabinet-desc">{game.description}</p>
      <div className="cabinet-controls">
        <div className="cabinet-joystick" />
        <div className="cabinet-buttons">
          <span className="cabinet-btn cabinet-btn--cyan" />
          <span className="cabinet-btn cabinet-btn--violet" />
        </div>
      </div>
      <span className="cabinet-insert-coin">INSERT COIN</span>
    </button>
  );
}

export default CabinetCard;
