import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as createOrg } from '@/app/api/admin/organizations/route';
import { POST as inviteOwner } from '@/app/api/admin/organizations/invite-owner/route';
import { sendOrgOwnerWelcomeEmail, sendOrgInvitationEmail } from '@/lib/email/email-service';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth/admin-guard', () => ({
  requirePlatformAdmin: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';

describe('Admin Organization Creation & Owner Direct Elevation Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.RESEND_API_KEY;
  });

  it('tự động nâng cấp quyền ORG_OWNER vào user_organizations nếu email đã có tài khoản trên hệ thống', async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
      isAuthorized: true,
      user: { id: 'admin-id', email: 'admin@nexa.edu.vn' },
    });

    const mockUpsertUserOrg = vi.fn().mockResolvedValue({ error: null });
    const mockInsertInvite = vi.fn().mockResolvedValue({ error: null });

    const mockAdminSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'existing-user-123', email: 'owner.existing@nexa.edu.vn', full_name: 'Nguyen Van A' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'organizations') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'org-uuid-999',
                    name: 'Đại Học Quốc Gia',
                    code: 'DHQG',
                    slug: 'dhqg',
                    status: 'ACTIVE',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'user_organizations') {
          return {
            upsert: mockUpsertUserOrg,
          };
        }
        if (table === 'organization_invitations') {
          return {
            insert: mockInsertInvite,
          };
        }
        return {};
      }),
    };

    vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/admin/organizations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Đại Học Quốc Gia',
        code: 'DHQG',
        contactEmail: 'owner.existing@nexa.edu.vn',
        contactName: 'Nguyen Van A',
        expectedLearners: 1000,
      }),
    });

    const res = await createOrg(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.isDirectAssigned).toBe(true);
    expect(body.organization.status).toBe('ACTIVE');

    // Kiểm chứng upsert vào user_organizations với quyền ORG_OWNER
    expect(mockUpsertUserOrg).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'existing-user-123',
        organization_id: 'org-uuid-999',
        org_role: 'ORG_OWNER',
        status: 'ACTIVE',
      }),
      { onConflict: 'user_id, organization_id' }
    );

    // Kiểm chứng lời mời được ghi nhận trạng thái ACCEPTED
    expect(mockInsertInvite).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 'org-uuid-999',
        email: 'owner.existing@nexa.edu.vn',
        org_role: 'ORG_OWNER',
        status: 'ACCEPTED',
      })
    );
  });

  it('tạo lời mời PENDING và sinh URL /accept-invite khi email chưa có tài khoản', async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
      isAuthorized: true,
      user: { id: 'admin-id', email: 'admin@nexa.edu.vn' },
    });

    const mockInsertInvite = vi.fn().mockResolvedValue({ error: null });

    const mockAdminSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }
        if (table === 'organizations') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'org-uuid-888',
                    name: 'Trường Đại Học Mới',
                    code: 'DH-MOI',
                    slug: 'dh-moi',
                    status: 'PENDING_OWNER',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'organization_invitations') {
          return {
            insert: mockInsertInvite,
          };
        }
        return {};
      }),
    };

    vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/admin/organizations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Trường Đại Học Mới',
        code: 'DH-MOI',
        contactEmail: 'new.owner@donvi.edu.vn',
        expectedLearners: 500,
      }),
    });

    const res = await createOrg(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.isDirectAssigned).toBe(false);
    expect(body.inviteUrl).toContain('/accept-invite?token=');
    expect(body.inviteUrl).not.toContain('/personal/accept-invite');

    expect(mockInsertInvite).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 'org-uuid-888',
        email: 'new.owner@donvi.edu.vn',
        org_role: 'ORG_OWNER',
        status: 'PENDING',
      })
    );
  });

  it('email-service xử lý an toàn chế độ fallback khi chưa có RESEND_API_KEY', async () => {
    delete process.env.RESEND_API_KEY;

    const res1 = await sendOrgOwnerWelcomeEmail({
      toEmail: 'owner@test.com',
      orgName: 'Tổ Chức Test',
      orgSlug: 'test-org',
    });

    expect(res1.success).toBe(false);
    expect(res1.fallback).toBe(true);

    const res2 = await sendOrgInvitationEmail({
      toEmail: 'newuser@test.com',
      orgName: 'Tổ Chức Test',
      inviteUrl: 'http://localhost:3000/accept-invite?token=123',
    });

    expect(res2.success).toBe(false);
    expect(res2.fallback).toBe(true);
  });

  it('invite-owner nâng trực tiếp thành ORG_OWNER nếu tài khoản đã tồn tại', async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
      isAuthorized: true,
      user: { id: 'admin-id', email: 'admin@nexa.edu.vn' },
    });

    const mockUpsertUserOrg = vi.fn().mockResolvedValue({ error: null });
    const mockUpdateOrg = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const mockAdminSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'org-111',
                    name: 'Tổ Chức X',
                    slug: 'to-chuc-x',
                    contact_email: 'existing.leader@nexa.edu.vn',
                  },
                  error: null,
                }),
              }),
            }),
            update: mockUpdateOrg,
          };
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'user-leader-111', email: 'existing.leader@nexa.edu.vn', full_name: 'Leader X' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'user_organizations') {
          return {
            upsert: mockUpsertUserOrg,
          };
        }
        if (table === 'organization_invitations') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      }),
    };

    vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/admin/organizations/invite-owner', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: '11111111-1111-1111-1111-111111111111',
        email: 'existing.leader@nexa.edu.vn',
      }),
    });

    const res = await inviteOwner(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.isDirectAssigned).toBe(true);
    expect(mockUpsertUserOrg).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-leader-111',
        org_role: 'ORG_OWNER',
        status: 'ACTIVE',
      }),
      { onConflict: 'user_id, organization_id' }
    );
  });
});
