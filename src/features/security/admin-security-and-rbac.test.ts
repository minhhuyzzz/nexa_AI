import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requirePlatformAdmin, requirePlatformPermission } from '@/lib/auth/admin-guard';
import { PATCH as usersPATCH, GET as usersGET } from '@/app/api/admin/users/route';
import { GET as rolesGET, POST as rolesPOST, DELETE as rolesDELETE } from '@/app/api/admin/roles/route';
import { GET as auditLogsGET } from '@/app/api/admin/audit-logs/route';
import { NextRequest } from 'next/server';

// Mock Supabase Server
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockAdminSignOut = vi.fn();
const mockAdminUpdate = vi.fn();
const mockAdminSelect = vi.fn();
const mockAdminFrom = vi.fn((table: string): any => {
  if (table === 'profiles') {
    return {
      select: mockAdminSelect,
      update: mockAdminUpdate,
    };
  }
  return { select: vi.fn(), update: vi.fn() };
});

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
    from: (table: string) => mockAdminFrom(table),
  })),
}));

vi.mock('@/lib/audit/admin-audit.service', () => ({
  recordAdminAudit: vi.fn().mockResolvedValue({ id: 'audit-1' }),
  extractClientIp: vi.fn().mockReturnValue('127.0.0.1'),
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

  describe('RBAC-ROLES-01: Quản lý Quản trị viên & Phân quyền (/api/admin/roles)', () => {
    it('cho phép SUPER_ADMIN xem danh sách vai trò phân tách (Super Admins và Platform Admins)', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'super-admin-1', email: 'admin.nexa@gmail.com' } },
        error: null,
      });
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: { role: 'ADMIN', admin_role: 'SUPER_ADMIN', is_suspended: false },
            }),
          }),
        }),
      });
      mockAdminFrom.mockReturnValueOnce({
        select: vi.fn().mockResolvedValueOnce({
          data: [
            {
              id: 'usr-1',
              email: 'admin.nexa@gmail.com',
              full_name: 'Trần Minh Huy',
              nickname: 'huy',
              role: 'ADMIN',
              admin_role: 'SUPER_ADMIN',
              created_at: '2026-01-01',
              is_suspended: false,
            },
            {
              id: 'usr-2',
              email: 'staff@example.com',
              full_name: 'Staff Admin',
              nickname: 'staff',
              role: 'ADMIN',
              admin_role: 'ADMIN',
              created_at: '2026-01-02',
              is_suspended: false,
            },
            {
              id: 'usr-3',
              email: 'learner@example.com',
              full_name: 'Học viên A',
              nickname: 'learner',
              role: 'LEARNER',
              admin_role: 'LEARNER',
              created_at: '2026-01-03',
              is_suspended: false,
            },
          ],
          error: null,
        }),
      });

      const res = await rolesGET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.superAdmins).toBeDefined();
      expect(body.superAdmins.length).toBeGreaterThanOrEqual(1);
      expect(body.superAdmins[0].isImmutable).toBe(true);
      expect(body.platformAdmins).toHaveLength(1);
      expect(body.platformAdmins[0].email).toBe('staff@example.com');
      expect(body.platformAdmins[0].isImmutable).toBe(false);
    });

    it('từ chối 403 khi Quản trị viên thường (ADMIN) cố gắng truy cập /api/admin/roles', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'staff-1', email: 'staff@example.com' } },
        error: null,
      });
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: { role: 'ADMIN', admin_role: 'ADMIN', is_suspended: false },
            }),
          }),
        }),
      });

      const res = await rolesGET();
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toContain('MANAGE_ROLES');
    });

    it('cho phép SUPER_ADMIN gán quyền ADMIN cho một người dùng đã đăng ký', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'super-admin-1', email: 'admin.nexa@gmail.com' } },
        error: null,
      });
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: { role: 'ADMIN', admin_role: 'SUPER_ADMIN', is_suspended: false },
            }),
          }),
        }),
      });

      const mockSelect = vi.fn().mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          maybeSingle: vi.fn().mockResolvedValueOnce({
            data: { id: 'learner-1', email: 'newadmin@example.com', admin_role: 'LEARNER' },
            error: null,
          }),
        }),
      });
      const mockUpdate = vi.fn().mockReturnValueOnce({
        eq: vi.fn().mockResolvedValueOnce({ error: null }),
      });
      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return { select: mockSelect, update: mockUpdate };
        }
        return { select: vi.fn(), update: vi.fn() };
      });

      const req = new NextRequest('http://localhost:3000/api/admin/roles', {
        method: 'POST',
        body: JSON.stringify({ email: 'newadmin@example.com' }),
      });
      const res = await rolesPOST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({ admin_role: 'ADMIN' });
    });

    it('từ chối 400 khi cố gắng cấp quyền ADMIN cho email vốn là Super Admin trong ENV', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'super-admin-1', email: 'admin.nexa@gmail.com' } },
        error: null,
      });
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: { role: 'ADMIN', admin_role: 'SUPER_ADMIN', is_suspended: false },
            }),
          }),
        }),
      });

      const req = new NextRequest('http://localhost:3000/api/admin/roles', {
        method: 'POST',
        body: JSON.stringify({ email: 'admin.nexa@gmail.com' }),
      });
      const res = await rolesPOST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Chủ sở hữu nền tảng');
    });

    it('từ chối 403 khi cố gắng thu hồi quyền của Super Admin (Bất biến Root of Trust)', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'super-admin-1', email: 'admin.nexa@gmail.com' } },
        error: null,
      });
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: { role: 'ADMIN', admin_role: 'SUPER_ADMIN', is_suspended: false },
            }),
          }),
        }),
      });

      mockAdminFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: { id: 'super-1', email: 'admin.nexa@gmail.com', admin_role: 'SUPER_ADMIN' },
              error: null,
            }),
          }),
        }),
      });

      const req = new NextRequest('http://localhost:3000/api/admin/roles', {
        method: 'DELETE',
        body: JSON.stringify({ userId: 'super-1' }),
      });
      const res = await rolesDELETE(req);
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toContain('Không thể thu hồi quyền của Chủ sở hữu nền tảng');
    });

    it('cho phép SUPER_ADMIN thu hồi quyền ADMIN của Quản trị viên (hạ cấp về LEARNER)', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'super-admin-1', email: 'admin.nexa@gmail.com' } },
        error: null,
      });
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: { role: 'ADMIN', admin_role: 'SUPER_ADMIN', is_suspended: false },
            }),
          }),
        }),
      });

      const mockSelectRevoke = vi.fn().mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          maybeSingle: vi.fn().mockResolvedValueOnce({
            data: { id: 'staff-1', email: 'staff@example.com', admin_role: 'ADMIN' },
            error: null,
          }),
        }),
      });
      const mockUpdateRevoke = vi.fn().mockReturnValueOnce({
        eq: vi.fn().mockResolvedValueOnce({ error: null }),
      });
      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return { select: mockSelectRevoke, update: mockUpdateRevoke };
        }
        return { select: vi.fn(), update: vi.fn() };
      });

      const req = new NextRequest('http://localhost:3000/api/admin/roles', {
        method: 'DELETE',
        body: JSON.stringify({ userId: 'staff-1' }),
      });
      const res = await rolesDELETE(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(mockUpdateRevoke).toHaveBeenCalledWith({ admin_role: 'LEARNER' });
    });
  });

  describe('RBAC-AUDIT-01: Khóa quyền xem Nhật ký kiểm toán (/api/admin/audit-logs)', () => {
    it('từ chối 403 khi Quản trị viên thường (ADMIN) gọi API xem audit logs', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'staff-1', email: 'staff@example.com' } },
        error: null,
      });
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: { role: 'ADMIN', admin_role: 'ADMIN', is_suspended: false },
            }),
          }),
        }),
      });

      const req = new NextRequest('http://localhost:3000/api/admin/audit-logs');
      const res = await auditLogsGET(req);
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toContain('VIEW_AUDIT');
    });

    it('cho phép SUPER_ADMIN xem audit logs và trả về tổng số Chủ sở hữu nền tảng (totalSuperAdmins)', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'super-admin-1', email: 'admin.nexa@gmail.com' } },
        error: null,
      });
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: { role: 'ADMIN', admin_role: 'SUPER_ADMIN', is_suspended: false },
            }),
          }),
        }),
      });

      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'admin_audit_logs') {
          return {
            select: vi.fn().mockImplementation((_cols: string, opts?: any) => {
              if (opts?.head) {
                return {
                  count: 10,
                  then: (resolve: any) => resolve({ count: 10, error: null }),
                  gte: vi.fn().mockResolvedValue({ count: 5, error: null }),
                };
              }
              return {
                order: vi.fn().mockReturnValueOnce({
                  limit: vi.fn().mockResolvedValueOnce({
                    data: [
                      {
                        id: 'log-1',
                        admin_id: 'super-admin-1',
                        admin_email: 'admin.nexa@gmail.com',
                        action: 'LOGIN',
                        target_type: 'SYSTEM',
                        target_id: 'sys',
                        details: {},
                        ip_address: '127.0.0.1',
                        created_at: new Date().toISOString(),
                      },
                    ],
                    error: null,
                  }),
                }),
              };
            }),
          };
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'super-admin-1',
                    email: 'admin.nexa@gmail.com',
                    full_name: 'Trần Minh Huy',
                    nickname: 'huy',
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const req = new NextRequest('http://localhost:3000/api/admin/audit-logs');
      const res = await auditLogsGET(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.stats).toBeDefined();
      expect(body.stats.totalSuperAdmins).toBeGreaterThanOrEqual(1);
    });
  });

  describe('USERS-FILTER-01: Lọc ẩn toàn bộ Super Admin và Admin khỏi /api/admin/users', () => {
    it('chỉ trả về học viên và khách hàng, ẩn sạch Super Admin và Admin', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'super-admin-1', email: 'admin.nexa@gmail.com' } },
        error: null,
      });
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            maybeSingle: vi.fn().mockResolvedValueOnce({
              data: { role: 'ADMIN', admin_role: 'SUPER_ADMIN', is_suspended: false },
            }),
          }),
        }),
      });

      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValueOnce({
              order: vi.fn().mockResolvedValueOnce({
                data: [
                  {
                    id: 'usr-super',
                    email: 'admin.nexa@gmail.com',
                    role: 'ADMIN',
                    admin_role: 'SUPER_ADMIN',
                    plan_tier: 'ENTERPRISE',
                    created_at: '2026-01-01',
                  },
                  {
                    id: 'usr-admin',
                    email: 'staff@example.com',
                    role: 'ADMIN',
                    admin_role: 'ADMIN',
                    plan_tier: 'ENTERPRISE',
                    created_at: '2026-01-02',
                  },
                  {
                    id: 'usr-learner',
                    email: 'student@example.com',
                    role: 'LEARNER',
                    admin_role: 'LEARNER',
                    plan_tier: 'BASIC',
                    created_at: '2026-01-03',
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        if (table === 'assessment_submissions') {
          return {
            select: vi.fn().mockResolvedValueOnce({ data: [], error: null }),
          };
        }
        return { select: vi.fn() };
      });

      const res = await usersGET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.users).toHaveLength(1);
      expect(body.users[0].email).toBe('student@example.com');
      expect(body.users[0].role).toBe('LEARNER');
    });
  });
});
