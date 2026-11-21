/**
 * Chuẩn hóa chuỗi IP: lọc bỏ tiền tố ::ffff:, bỏ cổng nếu có, chuẩn hóa IPv6 loopback
 */
function cleanIpString(rawIp?: string | null): string | null {
  if (!rawIp) return null;
  let ip = rawIp.trim();

  // 1. Chuẩn hóa IPv4-mapped IPv6 (::ffff:1.2.3.4 -> 1.2.3.4)
  if (ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }

  // 2. Chuẩn hóa loopback
  if (ip === '::1' || ip === 'localhost') {
    return '127.0.0.1';
  }

  // 3. Tách cổng ở IPv4 nếu có dạng 1.2.3.4:5678 (chỉ áp dụng nếu có đúng 1 dấu hai chấm)
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(ip)) {
    ip = ip.split(':')[0];
  }

  return ip || null;
}

/**
 * Trích xuất địa chỉ IP thực từ request headers theo thứ tự ưu tiên độ tin cậy:
 * 1. req.ip (NextRequest Edge runtime)
 * 2. x-vercel-forwarded-for (Vercel edge network)
 * 3. cf-connecting-ip (Cloudflare edge proxy)
 * 4. x-real-ip (Nginx / Vercel proxy)
 * 5. x-forwarded-for (Client IP đầu tiên trong chuỗi proxy)
 */
export function extractClientIp(req?: any): string {
  try {
    if (!req) return '127.0.0.1';

    // 1. Kiểm tra thuộc tính ip trực tiếp của NextRequest
    if (typeof req.ip === 'string' && req.ip.trim()) {
      const cleaned = cleanIpString(req.ip);
      if (cleaned) return cleaned;
    }

    const headers = req.headers || (typeof req.get === 'function' ? req : null);
    if (!headers || typeof headers.get !== 'function') return '127.0.0.1';

    // 2. Vercel edge header (chống spoofing tốt nhất trên hạ tầng Vercel)
    const vercelForwarded = headers.get('x-vercel-forwarded-for');
    if (vercelForwarded) {
      const firstIp = vercelForwarded.split(',')[0];
      const cleaned = cleanIpString(firstIp);
      if (cleaned) return cleaned;
    }

    // 3. Cloudflare connecting IP
    const cfIp = headers.get('cf-connecting-ip');
    if (cfIp) {
      const cleaned = cleanIpString(cfIp);
      if (cleaned) return cleaned;
    }

    // 4. x-real-ip
    const realIp = headers.get('x-real-ip');
    if (realIp) {
      const cleaned = cleanIpString(realIp);
      if (cleaned) return cleaned;
    }

    // 5. x-forwarded-for tiêu chuẩn
    const forwarded = headers.get('x-forwarded-for');
    if (forwarded) {
      const firstIp = forwarded.split(',')[0];
      const cleaned = cleanIpString(firstIp);
      if (cleaned) return cleaned;
    }
  } catch {}

  return '127.0.0.1';
}
