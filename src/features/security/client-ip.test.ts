import { describe, it, expect } from 'vitest';
import { extractClientIp } from '@/lib/audit/client-ip';

describe('Audit Client IP Extraction: Vercel, Cloudflare, IPv6/IPv4 normalization', () => {
  it('trả về 127.0.0.1 khi không có request hoặc headers rỗng', () => {
    expect(extractClientIp()).toBe('127.0.0.1');
    expect(extractClientIp(null)).toBe('127.0.0.1');
    expect(extractClientIp({})).toBe('127.0.0.1');
  });

  it('ưu tiên req.ip nếu được cung cấp trực tiếp bởi NextRequest Edge', () => {
    const req = {
      ip: '113.187.226.79',
      headers: new Headers({ 'x-forwarded-for': '1.1.1.1' }),
    };
    expect(extractClientIp(req)).toBe('113.187.226.79');
  });

  it('ưu tiên x-vercel-forwarded-for khi chạy trên Vercel', () => {
    const req = {
      headers: new Headers({
        'x-vercel-forwarded-for': '171.250.163.175, 10.0.0.1',
        'x-forwarded-for': 'fake-spoofed-ip, 171.250.163.175',
      }),
    };
    expect(extractClientIp(req)).toBe('171.250.163.175');
  });

  it('trích xuất đúng cf-connecting-ip khi qua proxy Cloudflare', () => {
    const req = {
      headers: new Headers({
        'cf-connecting-ip': '14.161.45.88',
        'x-forwarded-for': '172.68.0.1, 14.161.45.88',
      }),
    };
    expect(extractClientIp(req)).toBe('14.161.45.88');
  });

  it('trích xuất IP đầu tiên trong chuỗi x-forwarded-for tiêu chuẩn', () => {
    const req = {
      headers: new Headers({
        'x-forwarded-for': '42.112.50.12, 103.20.10.1',
      }),
    };
    expect(extractClientIp(req)).toBe('42.112.50.12');
  });

  it('loại bỏ tiền tố IPv4-mapped IPv6 (::ffff:)', () => {
    const req = {
      headers: new Headers({
        'x-forwarded-for': '::ffff:171.250.163.175',
      }),
    };
    expect(extractClientIp(req)).toBe('171.250.163.175');
  });

  it('loại bỏ cổng đính kèm trong IPv4', () => {
    const req = {
      headers: new Headers({
        'x-real-ip': '113.187.226.79:54321',
      }),
    };
    expect(extractClientIp(req)).toBe('113.187.226.79');
  });

  it('chuẩn hóa ::1 và localhost thành 127.0.0.1', () => {
    expect(extractClientIp({ headers: new Headers({ 'x-real-ip': '::1' }) })).toBe('127.0.0.1');
    expect(extractClientIp({ headers: new Headers({ 'x-real-ip': 'localhost' }) })).toBe('127.0.0.1');
  });
});
