import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// 1. Handlers under test
import { POST as registerPOST } from '@/app/api/auth/register/route';
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { POST as submitInquiryPOST } from '@/app/api/organizations/inquiry/route';
import { GET as getJoinCodeGET } from '@/app/api/join/org/[joinCode]/route';

// 2. Mocks
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockRpc = vi.fn();
const mockResetPasswordForEmail = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
    rpc: mockRpc,
  })),
}));

const mockAdminFrom = vi.fn();
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: mockAdminFrom,
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
                data: { role: 'LEARNER', points: 0 },
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
              eq: vi.fn().mockResolvedValue({ data: [] }),
            })),
          })),
        };
      }
      return { select: vi.fn() };
    }),
  })),
}));

describe('Actor: Guest — Comprehensive Use Case Verification (UC-G01 to UC-G08)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // UC-G04: Đăng ký tài khoản (Register Account)
  // =========================================================================
  describe('UC-G04: Đăng ký tài khoản (Register Account)', () => {
    it('từ chối 400 khi thiếu thông tin hoặc mật khẩu xác nhận không khớp', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: 'Khách Test',
          email: 'guest@example.com',
          password: 'Password123!',
          confirmPassword: 'MismatchPassword',
        }),
      });

      const res = await registerPOST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Mật khẩu xác nhận không khớp');
    });

    it('từ chối 400 khi email không đúng định dạng', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: 'Khách Test',
          email: 'invalid-email',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        }),
      });

      const res = await registerPOST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('đăng ký thành công và yêu cầu xác thực email khi đăng ký mới', async () => {
      mockRpc.mockResolvedValueOnce({ data: true, error: null });
      mockSignUp.mockResolvedValueOnce({
        data: {
          user: { id: 'usr-guest-001', email: 'guest@nexa.vn', identities: [{ id: 'ident-001' }] },
          session: null,
        },
        error: null,
      });

      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: 'Nguyễn Khách',
          email: 'guest@nexa.vn',
          password: 'SecurePassword123',
          confirmPassword: 'SecurePassword123',
        }),
      });

      const res = await registerPOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.requiresEmailConfirmation).toBe(true);
    });
  });

  // =========================================================================
  // UC-G05: Đăng nhập hệ thống (Authenticate & Session Init)
  // =========================================================================
  describe('UC-G05: Đăng nhập hệ thống (Authenticate & Session Init)', () => {
    it('từ chối 401 khi mật khẩu hoặc email không chính xác', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      });

      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'guest@nexa.vn', password: 'wrong' }),
      });

      const res = await loginPOST(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain('Email hoặc mật khẩu không chính xác');
    });

    it('đăng nhập thành công và trả về URL điều hướng vào /personal/dashboard', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: 'usr-guest-001', email: 'guest@nexa.vn' },
          session: { access_token: 'fake-token' },
        },
        error: null,
      });

      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'guest@nexa.vn', password: 'correctpassword' }),
      });

      const res = await loginPOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.redirectUrl).toBe('/personal/dashboard');
    });
  });

  // =========================================================================
  // UC-G07: Gửi yêu cầu tư vấn gói Business (Submit B2B Inquiry)
  // =========================================================================
  describe('UC-G07: Gửi yêu cầu tư vấn gói Business', () => {
    it('từ chối 400 khi thiếu thông tin đơn vị hoặc số điện thoại không hợp lệ', async () => {
      const req = new NextRequest('http://localhost:3000/api/organizations/inquiry', {
        method: 'POST',
        body: JSON.stringify({
          name: '',
          contactName: 'Người đại diện',
          email: 'contact@school.edu.vn',
          phone: '123', // Quá ngắn
        }),
      });

      const res = await submitInquiryPOST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBeDefined();
    });

    it('ghi nhận yêu cầu thành công vào business_inquiries với trạng thái NEW', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'inq-99', org_name: 'Đại Học Quốc Tế ABC', status: 'NEW' },
            error: null,
          }),
        }),
      });

      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'business_inquiries') {
          return { insert: mockInsert };
        }
        return {};
      });

      const req = new NextRequest('http://localhost:3000/api/organizations/inquiry', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Đại Học Quốc Tế ABC',
          contactName: 'Thầy Nguyễn Văn Trưởng Khoa',
          email: 'dean@abc.edu.vn',
          phone: '0987654321',
          type: 'EDUCATIONAL',
          expectedLearners: 1200,
          notes: 'Khảo sát năng lực số cho 1200 sinh viên.',
        }),
      });

      const res = await submitInquiryPOST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.inquiry.status).toBe('NEW');
      expect(mockInsert).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // UC-G08: Mở liên kết mời tham gia (Inspect Join Link / Code)
  // =========================================================================
  describe('UC-G08: Mở liên kết mời tham gia qua Mã Code', () => {
    it('từ chối 404 khi mã tham gia không tồn tại', async () => {
      mockAdminFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      const req = new NextRequest('http://localhost:3000/api/join/org/INVALID-CODE');
      const res = await getJoinCodeGET(req, {
        params: Promise.resolve({ joinCode: 'INVALID-CODE' }),
      });

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.valid).toBe(false);
      expect(body.error).toContain('không tồn tại');
    });

    it('từ chối 400 khi mã tham gia đã bị thu hồi bởi quản trị viên', async () => {
      mockAdminFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'code-revoked',
                code: 'REVOKED-2026',
                is_revoked: true,
                expires_at: new Date(Date.now() + 1000000).toISOString(),
                used_count: 10,
                max_uses: 50,
              },
              error: null,
            }),
          }),
        }),
      });

      const req = new NextRequest('http://localhost:3000/api/join/org/REVOKED-2026');
      const res = await getJoinCodeGET(req, {
        params: Promise.resolve({ joinCode: 'REVOKED-2026' }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.valid).toBe(false);
      expect(body.error).toContain('đã bị thu hồi');
    });

    it('trả về 200 thông tin tổ chức khi mã tham gia hợp lệ', async () => {
      mockAdminFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'code-valid-01',
                code: 'VALID-2026',
                title: 'Mã gia nhập Tân sinh viên K26',
                is_revoked: false,
                expires_at: new Date(Date.now() + 10000000).toISOString(),
                used_count: 5,
                max_uses: 200,
                organizations: {
                  id: 'org-abc',
                  name: 'Đại Học Bách Khoa',
                  slug: 'dai-hoc-bach-khoa',
                  code: 'BKU',
                  type: 'EDUCATIONAL',
                  status: 'ACTIVE',
                  is_active: true,
                },
              },
              error: null,
            }),
          }),
        }),
      });

      const req = new NextRequest('http://localhost:3000/api/join/org/VALID-2026');
      const res = await getJoinCodeGET(req, {
        params: Promise.resolve({ joinCode: 'VALID-2026' }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.valid).toBe(true);
      expect(body.organization.name).toBe('Đại Học Bách Khoa');
      expect(body.organization.slug).toBe('dai-hoc-bach-khoa');
    });
  });
});
