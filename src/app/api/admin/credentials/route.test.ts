import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { POST as revokePOST } from './[id]/revoke/route';
import { GET as templateGET, POST as templatePOST } from './template/route';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';

vi.mock('@/lib/auth/admin-guard', () => ({
  requirePlatformAdmin: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

describe('Admin Credentials APIs (UC-A38)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/credentials', () => {
    it('từ chối 401 khi không đăng nhập tài khoản admin', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValue({
        isAuthorized: false,
        errorResponse: { status: 401, json: async () => ({ error: 'Unauthorized' }) } as any,
      });

      const res = await GET(new Request('http://localhost/api/admin/credentials'));
      expect(res.status).toBe(401);
    });

    it('trả về danh sách chứng chỉ và KPI cho Quản trị viên hệ thống (ADMIN)', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValue({
        isAuthorized: true,
        user: { id: 'admin-1', email: 'admin@nexa.vn', adminRole: 'ADMIN' },
      });

      const mockAdminSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'credentials') {
            return {
              select: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: 'cred-1',
                        credential_code: 'CERT-001',
                        candidate_name: 'Nguyễn Văn A',
                        assessment_title: 'Khảo sát 5 miền',
                        score_percentage: 85,
                        competency_level: 'Master',
                        is_revoked: false,
                        user_id: 'user-1',
                        issued_at: '2026-11-20T10:00:00Z',
                      },
                    ],
                    error: null,
                  }),
                }),
                select: vi.fn().mockResolvedValue({
                  data: [
                    { id: 'cred-1', is_revoked: false },
                  ],
                  error: null,
                }),
              }),
            };
          }
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [{ id: 'user-1', email: 'a@gmail.com' }],
                  error: null,
                }),
              }),
            };
          }
          return {};
        }),
      };

      vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any);

      const res = await GET(new Request('http://localhost/api/admin/credentials'));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.credentials).toHaveLength(1);
      expect(json.credentials[0].credentialCode).toBe('CERT-001');
    });
  });

  describe('POST /api/admin/credentials/[id]/revoke', () => {
    it('thu hồi chứng chỉ thành công và ghi nhận audit log', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValue({
        isAuthorized: true,
        user: { id: 'admin-1', email: 'admin@nexa.vn', adminRole: 'ADMIN' },
      });

      const mockAdminSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'credentials') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: 'cred-1',
                      credential_code: 'CERT-001',
                      candidate_name: 'Nguyễn Văn A',
                      is_revoked: false,
                    },
                    error: null,
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            };
          }
          if (table === 'audit_logs') {
            return {
              insert: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          return {};
        }),
      };

      vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any);

      const req = new Request('http://localhost/api/admin/credentials/cred-1/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRevoked: true, revokedReason: 'Gian lận thi cử' }),
      });

      const res = await revokePOST(req, { params: Promise.resolve({ id: 'cred-1' }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.isRevoked).toBe(true);
      expect(json.revokedReason).toBe('Gian lận thi cử');
    });
  });

  describe('GET & POST /api/admin/credentials/template', () => {
    it('GET trả về cấu hình mặc định khi chưa có dữ liệu trong platform_settings', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValue({
        isAuthorized: true,
        user: { id: 'admin-1', email: 'admin@nexa.vn', adminRole: 'ADMIN' },
      });

      const mockAdminSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            })),
          })),
        })),
      };

      vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any);

      const res = await templateGET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.config.signerName).toBe('Dr. Michael Henson');
      expect(json.config.validityType).toBe('LIFETIME');
    });

    it('POST lưu thành công cấu hình phôi người ký và mộc đỏ', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValue({
        isAuthorized: true,
        user: { id: 'admin-1', email: 'admin@nexa.vn', adminRole: 'ADMIN' },
      });

      const mockAdminSupabase = {
        from: vi.fn(() => ({
          upsert: vi.fn().mockResolvedValue({ error: null }),
        })),
      };

      vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any);

      const req = new Request('http://localhost/api/admin/credentials/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerName: 'GS. Lê Văn Thành',
          signerTitle: 'Giám đốc Học thuật NEXA AI',
          signatureStyle: 'Michael Henson',
          sealType: 'SYSTEM_SVG',
          sealText: 'HỘI ĐỒNG KHẢO THÍ CHÍNH THỨC',
          validityType: 'LIFETIME',
        }),
      });

      const res = await templatePOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.config.signerName).toBe('GS. Lê Văn Thành');
      expect(json.config.sealText).toBe('HỘI ĐỒNG KHẢO THÍ CHÍNH THỨC');
    });
  });
});
