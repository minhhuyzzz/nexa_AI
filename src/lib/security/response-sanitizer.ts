/**
 * Security: Data Leakage Prevention & Error Masking
 * Strips secrets, private metadata, and database query internals before returning to client.
 */

const BLOCKED_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /hash/i,
  /service_role/i,
  /raw_token/i,
  /jwt_secret/i,
  /api_key/i,
  /private_key/i,
];

/**
 * Deeply sanitizes an object or array to remove sensitive fields
 */
export function sanitizeResponseData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeResponseData(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      const isBlocked = BLOCKED_KEY_PATTERNS.some((pattern) => pattern.test(key));
      if (!isBlocked) {
        sanitized[key] = sanitizeResponseData(value);
      }
    }

    return sanitized as T;
  }

  return data;
}

const DATABASE_LEAK_PATTERNS = [
  /relation\s+".*"\s+does\s+not\s+exist/i,
  /syntax\s+error\s+at\s+or\s+near/i,
  /null\s+value\s+in\s+column/i,
  /violates\s+foreign\s+key\s+constraint/i,
  /violates\s+check\s+constraint/i,
  /SELECT\s+.*\s+FROM/i,
  /INSERT\s+INTO/i,
  /UPDATE\s+.*\s+SET/i,
  /DELETE\s+FROM/i,
];

/**
 * Masks internal database exceptions or stack details into safe, sanitized user messages.
 */
export function maskInternalError(err: unknown): string {
  if (!err) return 'Lỗi hệ thống';

  const rawMessage = err instanceof Error ? err.message : String(err);

  const containsDbLeak = DATABASE_LEAK_PATTERNS.some((pattern) =>
    pattern.test(rawMessage)
  );

  if (containsDbLeak) {
    return 'Lỗi xử lý cơ sở dữ liệu. Vui lòng thử lại sau.';
  }

  return rawMessage;
}
