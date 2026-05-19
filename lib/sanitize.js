/**
 * lib/sanitize.js
 * Strips HTML tags from user-generated content to prevent XSS.
 * Uses a simple regex for the server-safe case (no DOM available in RSC).
 * For client components, DOMPurify could be added as an enhancement.
 */

/**
 * Remove all HTML/script tags and null bytes from a string.
 * Safe to call on any user-supplied text field before storing it.
 */
export function sanitizeText(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '')        // strip HTML tags
    .replace(/\0/g, '')             // strip null bytes
    .trim();
}

/**
 * Sanitize an object's string values.
 * Only processes the keys you specify.
 */
export function sanitizeFields(obj, keys) {
  const out = { ...obj };
  for (const key of keys) {
    if (typeof out[key] === 'string') out[key] = sanitizeText(out[key]);
  }
  return out;
}
