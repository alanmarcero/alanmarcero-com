function NoResults({ query }) {
  return (
    <div className="no-results">
      <div className="no-results-icon">&#128269;</div>
      <p className="no-results-message">No results for &ldquo;{query}&rdquo;</p>
      <p className="no-results-suggestion">Try different keywords or clear the search</p>
    </div>
  );
}

export default NoResults;
