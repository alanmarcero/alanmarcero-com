/**
 * Whether any of the fields contains the query, ignoring case. An empty
 * query matches everything, and a missing field matches nothing.
 */
export const matchesQuery = (query, ...fields) => {
  if (!query) return true;
  const needle = query.toLowerCase();
  return fields.some((field) => (field || '').toLowerCase().includes(needle));
};
