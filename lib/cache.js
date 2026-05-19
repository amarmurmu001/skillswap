/** In-memory TTL cache for Supabase reads (per browser tab). */

const store = new Map();
/** In-flight promises — prevents duplicate network requests when two callers
 *  miss the cache at the same moment (cache stampede protection). */
const inflight = new Map();

export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

export function cacheSet(key, value, ttlMs) {
  store.set(key, { value, expires: Date.now() + ttlMs });
}

export function cacheDelete(key) {
  store.delete(key);
  inflight.delete(key);
}

export function cacheDeletePrefix(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
  for (const key of inflight.keys()) {
    if (key.startsWith(prefix)) inflight.delete(key);
  }
}

/**
 * Fetch with TTL caching + in-flight deduplication.
 *
 * If a fetch for `key` is already in-flight, all concurrent callers
 * await the same promise instead of firing duplicate network requests.
 */
export async function cacheFetch(key, ttlMs, fetcher) {
  // 1. Serve from cache if still valid
  const hit = cacheGet(key);
  if (hit !== undefined) return hit;

  // 2. Serve from in-flight promise if one is already running
  if (inflight.has(key)) return inflight.get(key);

  // 3. Start a new fetch, register it as in-flight
  const promise = fetcher().then(
    (value) => {
      cacheSet(key, value, ttlMs);
      inflight.delete(key);
      return value;
    },
    (err) => {
      inflight.delete(key);
      throw err;
    }
  );

  inflight.set(key, promise);
  return promise;
}
