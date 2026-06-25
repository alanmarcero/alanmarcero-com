function NoResults({ query }) {
  return (
    <div className="no-results">
      <svg
        className="no-results__scope"
        viewBox="0 0 200 40"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 20 H88 L96 13 L104 27 L112 20 H200"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="no-results__message">
        No signal for <span className="no-results__query">&ldquo;{query}&rdquo;</span>
      </p>
      <p className="no-results__hint">Try different keywords, or clear the search.</p>
    </div>
  );
}

export default NoResults;
