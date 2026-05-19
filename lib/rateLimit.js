/**
 * lib/rateLimit.js
 * In-memory client-side rate limiter (per browser tab).
 * Prevents users from accidentally or maliciously spamming actions
 * like match requests, messages, or form submissions.
 *
 * For true server-side rate limiting, pair this with a Supabase
 * Edge Function or Vercel Middleware that checks a `rate_limits` table.
 */

const buckets = new Map();

/**
 * Check whether an action is allowed under a rate limit.
 *
 * @param {string} key      - Unique key for this action (e.g. `match_request:userId`)
 * @param {number} maxCalls - Max calls allowed in the window
 * @param {number} windowMs - Window size in milliseconds
 * @returns {{ allowed: boolean, retryAfterMs: number }}
 */
export function checkRateLimit(key, maxCalls, windowMs) {
  const now  = Date.now();
  const bucket = buckets.get(key) || { calls: [], windowStart: now };

  // Discard calls outside the current window
  bucket.calls = bucket.calls.filter(t => now - t < windowMs);

  if (bucket.calls.length >= maxCalls) {
    const oldest = bucket.calls[0];
    const retryAfterMs = windowMs - (now - oldest);
    buckets.set(key, bucket);
    return { allowed: false, retryAfterMs: Math.ceil(retryAfterMs / 1000) };
  }

  bucket.calls.push(now);
  buckets.set(key, bucket);
  return { allowed: true, retryAfterMs: 0 };
}

/**
 * Convenience wrapper: throws a user-friendly error if the limit is hit.
 */
export function assertRateLimit(key, maxCalls, windowMs, message) {
  const { allowed, retryAfterMs } = checkRateLimit(key, maxCalls, windowMs);
  if (!allowed) {
    throw new Error(message || `Too many requests. Please wait ${retryAfterMs}s before trying again.`);
  }
}
