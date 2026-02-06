function SkeletonCard() {
  return (
    <div className="store-item skeleton-card" aria-hidden="true">
      <div className="skeleton-bar skeleton-bar--title" />
      <div className="skeleton-bar skeleton-bar--desc" />
      <div className="skeleton-bar skeleton-bar--desc" />
      <div className="skeleton-bar skeleton-bar--button" />
    </div>
  );
}

export default SkeletonCard;
