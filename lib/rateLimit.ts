/**
 * Simple in-memory sliding-window rate limiter.
 * Good enough for a single-container personal server.
 */

const buckets = new Map<string, number[]>();

/**
 * @param key       identifier, e.g. client IP
 * @param limit     max requests allowed in the window
 * @param windowMs  window length in milliseconds
 * @returns true if the request is allowed, false if rate-limited
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;

  const times = buckets.get(key) ?? [];
  // Drop timestamps outside the window
  const fresh = times.filter(t => t > cutoff);

  if (fresh.length >= limit) {
    buckets.set(key, fresh);
    return false;
  }

  fresh.push(now);
  buckets.set(key, fresh);
  return true;
}

/** Extract client IP from Next.js request headers (works behind a proxy). */
export function getClientIp(req: { headers: { get: (k: string) => string | null } }): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}
