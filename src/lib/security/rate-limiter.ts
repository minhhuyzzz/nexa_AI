/**
 * In-Memory Sliding Window Rate Limiter
 * Provides thread-safe, lightweight protection for API boundaries against brute-force and DoS.
 */

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

interface RequestLog {
  timestamps: number[];
}

const store = new Map<string, RequestLog>();

// Periodically clean up stale keys to prevent memory leak
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of store.entries()) {
    // If all timestamps are older than 1 hour, purge
    if (record.timestamps.every((ts) => now - ts > 3600 * 1000)) {
      store.delete(key);
    }
  }
}

/**
 * Checks whether the given key is allowed under the rate limit.
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  cleanupStaleEntries();

  const now = Date.now();
  const windowStart = now - options.windowMs;

  let record = store.get(key);
  if (!record) {
    record = { timestamps: [] };
    store.set(key, record);
  }

  // Retain only timestamps within the current sliding window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= options.limit) {
    const oldestTimestamp = record.timestamps[0];
    const resetAt = oldestTimestamp + options.windowMs;
    const retryAfterMs = Math.max(0, resetAt - now);
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfterSeconds,
    };
  }

  // Record this request
  record.timestamps.push(now);

  return {
    allowed: true,
    remaining: options.limit - record.timestamps.length,
    resetAt: now + options.windowMs,
    retryAfterSeconds: 0,
  };
}

/**
 * Clears the in-memory store (primarily used in tests)
 */
export function resetRateLimiter(): void {
  store.clear();
  lastCleanup = Date.now();
}

/**
 * Helper to extract client IP from Next.js request headers
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return headers.get('x-real-ip') || '127.0.0.1';
}
