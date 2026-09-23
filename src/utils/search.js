/**
 * Build an `Array.filter` predicate that matches `query` case-insensitively
 * against the named fields of each item. An empty query matches everything.
 */
export const createSearchFilter = (query, ...fields) => {
  const lowerQuery = query.toLowerCase();
  return (item) => {
    if (!lowerQuery) return true;
    const searchableText = fields.map((field) => item[field] || '').join(' ').toLowerCase();
    return searchableText.includes(lowerQuery);
  };
};
