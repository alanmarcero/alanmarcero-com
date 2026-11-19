// Old single-page anchors and the home search query. Keep the inline script in
// index.html in step with HASH_ROUTES.
export const HASH_ROUTES = {
  store: '/patches',
  'compatible-instruments': '/patches#compatible-instruments',
  'music-remixes': '/music',
  contact: '/contact',
};

const isHomePath = (pathname) => {
  const path = (pathname || '/').replace(/\/+$/, '') || '/';
  return path === '/' || path === '/index.html';
};

/**
 * Where an old home URL should go, or null when it should stay.
 * `loc` is a Location-like `{ pathname, search, hash }`.
 */
export function legacyRedirectFromLocation(loc) {
  if (!isHomePath(loc.pathname)) return null;

  const hash = (loc.hash || '').replace(/^#/, '');
  const q = new URLSearchParams(loc.search || '').get('q');
  const dest = HASH_ROUTES[hash];

  if (dest) {
    const [path, frag] = dest.split('#');
    const search = q ? `?q=${encodeURIComponent(q)}` : '';
    return `${path}${search}${frag ? `#${frag}` : ''}`;
  }

  if (q) return `/patches?q=${encodeURIComponent(q)}`;
  return null;
}
