import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit, resetRateLimiter } from './rate-limiter';

describe('Security: In-Memory Sliding Window Rate Limiter', () => {
  beforeEach(() => {
    resetRateLimiter();
    vi.useRealTimers();
  });

  it('allows requests within the defined threshold', () => {
    const key = 'test-ip-1';
    const limit = 5;
    const windowMs = 60 * 1000;

    for (let i = 0; i < limit; i++) {
      const result = checkRateLimit(key, { limit, windowMs });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(limit - (i + 1));
    }
  });

  it('blocks requests exceeding the threshold and provides retryAfterSeconds', () => {
    const key = 'test-ip-2';
    const limit = 3;
    const windowMs = 60 * 1000;

    // Consume all 3 allowed slots
    for (let i = 0; i < limit; i++) {
      checkRateLimit(key, { limit, windowMs });
    }

    // 4th request must be blocked
    const blockedResult = checkRateLimit(key, { limit, windowMs });
    expect(blockedResult.allowed).toBe(false);
    expect(blockedResult.remaining).toBe(0);
    expect(blockedResult.retryAfterSeconds).toBeGreaterThan(0);
    expect(blockedResult.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it('isolates rate limits by distinct keys (e.g. different IP addresses)', () => {
    const limit = 2;
    const windowMs = 60 * 1000;

    // IP A exhausts limit
    checkRateLimit('ip-a', { limit, windowMs });
    checkRateLimit('ip-a', { limit, windowMs });
    expect(checkRateLimit('ip-a', { limit, windowMs }).allowed).toBe(false);

    // IP B must still be allowed
    const resultB = checkRateLimit('ip-b', { limit, windowMs });
    expect(resultB.allowed).toBe(true);
    expect(resultB.remaining).toBe(1);
  });

  it('resets allowed quota after time window passes', () => {
    vi.useFakeTimers();
    const key = 'test-ip-timer';
    const limit = 2;
    const windowMs = 10 * 1000; // 10s

    checkRateLimit(key, { limit, windowMs });
    checkRateLimit(key, { limit, windowMs });
    expect(checkRateLimit(key, { limit, windowMs }).allowed).toBe(false);

    // Advance time by 11 seconds
    vi.advanceTimersByTime(11 * 1000);

    const freshResult = checkRateLimit(key, { limit, windowMs });
    expect(freshResult.allowed).toBe(true);
    expect(freshResult.remaining).toBe(1);
  });
});
