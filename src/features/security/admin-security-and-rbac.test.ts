import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requirePlatformAdmin, requirePlatformPermission } from '@/lib/auth/admin-guard';
import { PATCH as usersPATCH } from '@/app/api/admin/users/route';
import { NextRequest } from 'next/server';

// Mock Supabase Server
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockAdminSignOut = vi.fn();
const mockAdminUpdate = vi.fn();
const mockAdminSelect = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    auth: {
      admin: {
        signOut: mockAdminSignOut,
      },
    },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: mockAdminSelect,
          update: mockAdminUpdate,
        };
      }
      return { select: vi.fn(), update: vi.fn() };
    }),
  })),
}));

vi.mock('@/lib/audit/admin-audit.service', () => ({
  recordAdminAudit: vi.fn().mockResolvedValue({ id: 'audit-1' }),
}));

describe('Phase 1 Security & RBAC: AUTH-SUSP-01, AUTH-REV-01, RBAC-ADMIN-01', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AUTH-SUSP-01: Chặn tài khoản bị tạm khóa', () => {
    it('từ chối 403 khi tài khoản quản trị có cờ is_suspended = true', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'usr-suspended-1', email: 'locked.admin@example.com' } },
        error: null,
      });

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: {
                role: 'ADMIN',
                admin_role: 'CONTENT_ADMIN',
                is_suspended: true,
                suspended_reason: 'Vi phạm nghiêm trọng',
              },
            }),
          }),
        }),
      });

      const result = await requirePlatformAdmin();
      expect(result.isAuthorized).toBe(false);
      expect(result.errorResponse?.status).toBe(403);
      const body = await result.errorResponse?.json();
      expect(body.error).toContain('Tài khoản quản trị của bạn đang bị tạm khóa');
    });

    it('từ chối yêu cầu tự khóa tài khoản của chính mình', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'admin-self-1', email: 'admin.nexa@gmail.com' } },
        error: null,
      });

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: {
                role: 'ADMIN',
                admin_role: 'SUPER_ADMIN',
                is_suspended: false,
              },
            }),
          }),
        }),
      });

      const req = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({
          userId: 'admin-self-1', // same as current user
          action: 'SUSPEND',
          reason: 'Tự khóa',
        }),
      });

      const res = await usersPATCH(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Không thể tự khóa tài khoản của chính mình');
    });
  });

  describe('AUTH-REV-01: Thu hồi phiên thực sự', () => {
    it('gọi signOut toàn cầu và cập nhật tokens_revoked_at vào DB', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'super-admin-1', email: 'admin.nexa@gmail.com' } },
        error: null,
      });

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: {
                role: 'ADMIN',
                admin_role: 'SUPER_ADMIN',
                is_suspended: false,
              },
            }),
          }),
        }),
      });

      mockAdminSignOut.mockResolvedValueOnce({ error: null });
      mockAdminUpdate.mockReturnValueOnce({
        eq: vi.fn().mockResolvedValueOnce({ error: null }),
      });

      const req = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({
          userId: 'target-suspicious-user',
          action: 'REVOKE_SESSION',
        }),
      });

      const res = await usersPATCH(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.message).toContain('Đã thu hồi phiên và buộc đăng xuất');
      expect(mockAdminSignOut).toHaveBeenCalledWith('target-suspicious-user', 'global');
    });
  });

  describe('RBAC-ADMIN-01: Phân tách quyền Admin theo vai trò', () => {
    it('từ chối 403 khi CONTENT_ADMIN gọi quyền VIEW_FINANCE', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'content-admin-1', email: 'content@nexa.vn' } },
        error: null,
      });

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: {
                role: 'ADMIN',
                admin_role: 'CONTENT_ADMIN',
                is_suspended: false,
              },
            }),
          }),
        }),
      });

      const result = await requirePlatformPermission('VIEW_FINANCE');
      expect(result.isAuthorized).toBe(false);
      expect(result.errorResponse?.status).toBe(403);
      const body = await result.errorResponse?.json();
      expect(body.error).toContain('không có quyền thực hiện hành động này (VIEW_FINANCE)');
    });

    it('cho phép khi FINANCE_ADMIN gọi quyền VIEW_FINANCE', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'finance-admin-1', email: 'finance@nexa.vn' } },
        error: null,
      });

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: {
                role: 'ADMIN',
                admin_role: 'FINANCE_ADMIN',
                is_suspended: false,
              },
            }),
          }),
        }),
      });

      const result = await requirePlatformPermission('VIEW_FINANCE');
      expect(result.isAuthorized).toBe(true);
      expect(result.user?.adminRole).toBe('FINANCE_ADMIN');
    });

    it('cho phép SUPER_ADMIN thực hiện mọi quyền hạn', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'super-admin-1', email: 'admin.nexa@gmail.com' } },
        error: null,
      });

      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: {
                role: 'ADMIN',
                admin_role: 'SUPER_ADMIN',
                is_suspended: false,
              },
            }),
          }),
        }),
      });

      const result = await requirePlatformPermission('OPERATE_AI');
      expect(result.isAuthorized).toBe(true);
      expect(result.user?.adminRole).toBe('SUPER_ADMIN');
    });
  });
});
