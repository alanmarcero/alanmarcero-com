const supportsAsyncClipboard = () =>
  typeof navigator !== 'undefined' && Boolean(navigator.clipboard?.writeText);

/**
 * Copy text to the clipboard. Prefers the async Clipboard API (secure
 * contexts) and falls back to a hidden textarea + execCommand for older or
 * non-secure contexts — and when the async API refuses (permission denied).
 * Resolves to true on success, false otherwise.
 */
export async function copyToClipboard(text) {
  if (!supportsAsyncClipboard()) return legacyCopy(text);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return legacyCopy(text);
  }
}

function legacyCopy(text) {
  if (typeof document === 'undefined') return false;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    return document.execCommand('copy');
  } catch {
    // execCommand throws in some browsers rather than returning false.
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}
