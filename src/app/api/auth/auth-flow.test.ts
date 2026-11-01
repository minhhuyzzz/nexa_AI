import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as loginPOST } from './login/route';
import { POST as registerPOST } from './register/route';
import { isSuperadminEmail } from '@/lib/auth/superadmin';

// Mock Supabase clients
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
    },
    rpc: mockRpc,
  })),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { role: 'LEARNER', points: 10, total_login_days: 2, login_streak: 1, last_login_date: '2026-10-30' },
              }),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ error: null }),
          })),
        };
      }
      if (table === 'user_organizations') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: [],
              }),
            })),
          })),
        };
      }
      return { select: vi.fn() };
    }),
  })),
}));

describe('Auth Flow Inspection & Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Superadmin Email Detection', () => {
    it('nhận diện đúng email Superadmin mặc định', () => {
      expect(isSuperadminEmail('admin.nexa@gmail.com')).toBe(true);
      expect(isSuperadminEmail('ADMIN.NEXA@GMAIL.COM')).toBe(true);
      expect(isSuperadminEmail('user@gmail.com')).toBe(false);
      expect(isSuperadminEmail(null)).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('từ chối 400 khi thiếu email hoặc password không hợp lệ', async () => {
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'notanemail', password: '' }),
      });

      const res = await loginPOST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('từ chối 403 thân thiện khi email chưa được xác nhận', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Email not confirmed' },
      });

      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com', password: 'password123' }),
      });

      const res = await loginPOST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('Email chưa được xác thực');
    });

    it('từ chối 401 khi mật khẩu sai', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      });

      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com', password: 'wrongpassword' }),
      });

      const res = await loginPOST(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain('Email hoặc mật khẩu không chính xác');
    });

    it('chuyển hướng người dùng thường vào /personal/dashboard', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: 'usr-123', email: 'learner@example.com' },
          session: { access_token: 'valid-token' },
        },
        error: null,
      });

      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'learner@example.com', password: 'password123' }),
      });

      const res = await loginPOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.role).toBe('LEARNER');
      expect(data.redirectUrl).toBe('/personal/dashboard');
    });

    it('chuyển hướng Superadmin vào /admin/dashboard', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: 'adm-001', email: 'admin.nexa@gmail.com' },
          session: { access_token: 'valid-admin-token' },
        },
        error: null,
      });

      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin.nexa@gmail.com', password: 'adminpassword' }),
      });

      const res = await loginPOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.role).toBe('ADMIN');
      expect(data.redirectUrl).toBe('/admin/dashboard');
    });
  });

  describe('POST /api/auth/register', () => {
    it('từ chối 400 khi mật khẩu xác nhận không khớp', async () => {
      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: 'Minh Huy',
          email: 'huy@example.com',
          password: 'password123',
          confirmPassword: 'differentpassword',
        }),
      });

      const res = await registerPOST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Mật khẩu xác nhận không khớp');
    });

    it('trả về requiresEmailConfirmation: true khi đăng ký thành công cần xác thực', async () => {
      mockRpc.mockResolvedValueOnce({ data: true, error: null });
      mockSignUp.mockResolvedValueOnce({
        data: {
          user: { id: 'new-user-1', email: 'new@example.com', identities: [{ id: 'ident-1' }] },
          session: null, // No session means email confirmation required
        },
        error: null,
      });

      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: 'Minh Huy',
          email: 'new@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        }),
      });

      const res = await registerPOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.requiresEmailConfirmation).toBe(true);
      expect(data.message).toContain('Đã gửi liên kết xác thực');
    });
  });
});
