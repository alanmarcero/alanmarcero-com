import { useState, useEffect } from 'react';
import { LAMBDA_URL } from '../../config';

/**
 * Releases and remixes, fetched at request time from the site's own API.
 * Written for this page rather than shared with the original — same data
 * source, our own code.
 *
 * The API gives us exactly two fields, `title` and `videoId`. There is no
 * description, no date, no artwork; a request returns ~640 bytes for nine
 * releases. So every bit of structure this section shows has to be derived
 * from the title string, and the title strings turn out to carry it:
 *
 *   Alan-M - Famicom
 *   Alan-M - Famicom (Temple 1 Remix)
 *   Sean Tyas - Melbourne (Alan-M Remix)
 *   Johnson & Corbett Vs. Alan-M - Ibiza Sun (Original Mix)
 *
 * Three facts are in there. Who made it, what the work is, and which
 * version of that work this is. Nine flat rows are really six works, three
 * of which have a second version — a relationship the list used to hide by
 * rendering every release as an unrelated sibling.
 */

/** The site's owner, as he appears in his own titles. Lowercased for compare. */
const SELF = 'alan-m';

/** "(Original Mix)" names a version and denotes the absence of a rework. */
const ORIGINAL = /^original(\s+mix)?$/i;

const lower = (value) => (value || '').toLowerCase();

/**
 * Split one release title into `{ artists, work, version }` and name the
 * role it plays.
 *
 * Deliberately total: any string returns a usable shape. A title with no
 * " - " is all work and no artist; a title with no trailing parenthetical
 * has no version; an empty title still yields something renderable, because
 * the alternative is a blank row and a blank row reads as a bug.
 */
export function parseRelease(item) {
  const title = String(item?.title ?? '').trim();

  // A trailing parenthetical is the version. Anchored and non-nested, so a
  // stray "(" mid-title cannot swallow the rest of the string.
  const versionMatch = title.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
  const head = (versionMatch ? versionMatch[1] : title).trim();
  const version = versionMatch ? versionMatch[2].trim() : null;

  // The FIRST " - " divides artists from work. Later ones belong to the work,
  // which is why this is an indexOf and not a split.
  const divider = head.indexOf(' - ');
  const artists = divider > 0 ? head.slice(0, divider).trim() : null;
  const work = (divider > 0 ? head.slice(divider + 3) : head).trim();

  const isOriginal = !version || ORIGINAL.test(version);

  // Whose hands were on it. `remixer` is the interesting one: someone else's
  // track that he reworked, which is a different claim from his own release.
  let role = 'original';
  if (lower(version).includes(SELF)) role = 'remixer';
  else if (!isOriginal) role = 'remixed';

  return {
    ...item,
    title,
    artists,
    work: work || title || 'Untitled',
    version,
    isOriginal,
    role,
  };
}

/**
 * Collapse parsed releases into works, preserving the order the API sent
 * them and putting each work's original ahead of its reworks.
 *
 * Grouped on the work alone rather than artist+work: "Ibiza Sun" arrives
 * twice with the same credit and different versions, and a reader looking
 * for it wants one entry, not two.
 */
export function groupByWork(releases) {
  const order = [];
  const groups = new Map();

  for (const release of releases) {
    const key = lower(release.work);
    if (!groups.has(key)) {
      groups.set(key, { key, work: release.work, artists: release.artists, versions: [] });
      order.push(key);
    }
    groups.get(key).versions.push(release);
  }

  return order.map((key) => {
    const group = groups.get(key);
    return {
      ...group,
      // Stable sort, so anything that is not the original keeps arrival order.
      versions: [...group.versions].sort((a, b) => Number(b.isOriginal) - Number(a.isOriginal)),
    };
  });
}

export default function useMusic() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(LAMBDA_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        return response.json();
      })
      .then((payload) => setItems(payload.items ?? []))
      .catch((cause) => {
        if (cause.name === 'AbortError') return;
        setError(cause.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { items, loading, error };
}
