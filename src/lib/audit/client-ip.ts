/**
 * Trích xuất địa chỉ IP thực từ request headers (x-forwarded-for hoặc x-real-ip)
 */
export function extractClientIp(req?: any): string {
  try {
    if (!req) return '127.0.0.1';
    const headers = req.headers || (typeof req.get === 'function' ? req : null);
    if (!headers || typeof headers.get !== 'function') return '127.0.0.1';
    const forwarded = headers.get('x-forwarded-for');
    if (forwarded) {
      const firstIp = forwarded.split(',')[0]?.trim();
      if (firstIp) return firstIp;
    }
    const realIp = headers.get('x-real-ip');
    if (realIp) {
      return realIp.trim();
    }
  } catch {}
  return '127.0.0.1';
}
