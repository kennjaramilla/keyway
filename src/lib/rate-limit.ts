/**
 * Sliding-window limiter kept in memory. It's per server instance, which is enough
 * to stop a runaway client; a shared store (e.g. Redis) is the production version.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>();
  return {
    /** Records a hit for `key`, or says how many seconds to wait when over the limit. */
    take(key: string, now: number = Date.now()) {
      const recent = (hits.get(key) ?? []).filter((at) => now - at < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return { ok: false as const, retryAfter: Math.ceil((recent[0]! + windowMs - now) / 1000) };
      }
      hits.set(key, [...recent, now]);
      return { ok: true as const };
    },
    reset: () => hits.clear(),
  };
}
