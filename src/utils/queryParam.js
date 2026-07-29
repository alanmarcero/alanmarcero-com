/**
 * Write a query param into the address bar without adding a history entry.
 *
 * A falsy `value` removes the param. The path and hash are preserved, so this
 * is safe to call while the reader is parked on an in-page anchor. Shared by
 * the `?q=` search sync and the `?era=` time-travel sync — both need the same
 * "set-or-drop one param, leave the rest of the URL alone" behavior.
 */
export function writeQueryParam(name, value) {
  if (typeof window === 'undefined') return;

  // set() replaces in place, so an existing param keeps its position in the
  // query string; delete-then-set would shuffle it to the end.
  const params = new URLSearchParams(window.location.search);
  if (value) params.set(name, value);
  if (!value) params.delete(name);

  const qs = params.toString();
  const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', next);
}
