import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { getOrgAuthContext } from '@/lib/auth/org-guard';
import { createAdminClient } from '@/lib/supabase/admin';

vi.mock('@/lib/auth/org-guard', () => ({
  getOrgAuthContext: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

describe('POST /api/organizations/[orgId]/campaigns/[campaignId]/publish (UC-O11)', () => {
  const mockOrgId = 'org-123';
  const mockCampaignId = 'camp-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('từ chối 403 nếu không có quyền quản trị tổ chức', async () => {
    vi.mocked(getOrgAuthContext).mockResolvedValue({
      isAuthorized: false,
      user: { id: 'user-1' },
      organization: { id: mockOrgId, name: 'Org Test', slug: 'org-test', is_active: true },
      role: 'MEMBER',
      isSuperadmin: false,
    } as any);

    const res = await POST({} as Request, {
      params: Promise.resolve({ orgId: mockOrgId, campaignId: mockCampaignId }),
    });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain('Bạn không có quyền quản trị tổ chức này');
  });

  it('từ chối 403 nếu vai trò là ASSESSOR không phải ORG_ADMIN hoặc ORG_OWNER', async () => {
    vi.mocked(getOrgAuthContext).mockResolvedValue({
      isAuthorized: true,
      user: { id: 'user-1' },
      organization: { id: mockOrgId, name: 'Org Test', slug: 'org-test', is_active: true },
      role: 'ASSESSOR',
      isSuperadmin: false,
    } as any);

    const res = await POST({} as Request, {
      params: Promise.resolve({ orgId: mockOrgId, campaignId: mockCampaignId }),
    });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain('Chỉ Quản trị viên hoặc Chủ sở hữu tổ chức mới có quyền công bố điểm toàn đợt');
  });

  it('công bố kết quả thành công khi có quyền ORG_ADMIN', async () => {
    vi.mocked(getOrgAuthContext).mockResolvedValue({
      isAuthorized: true,
      user: { id: 'admin-1' },
      organization: { id: mockOrgId, name: 'Org Test', slug: 'org-test', is_active: true },
      role: 'ORG_ADMIN',
      isSuperadmin: false,
    } as any);

    const mockAdminSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'assessment_campaigns') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: mockCampaignId,
                      title: 'Khảo sát Quý 4',
                      organization_id: mockOrgId,
                      security_settings: {},
                    },
                    error: null,
                  }),
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
        if (table === 'assessment_submissions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  { id: 'sub-1', user_id: 'user-1', total_score: 80, status: 'EVALUATED' },
                  { id: 'sub-2', user_id: 'user-2', total_score: 90, status: 'EVALUATED' },
                ],
                error: null,
              }),
            }),
          };
        }
        if (table === 'user_notifications') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      }),
    };

    vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any);

    const res = await POST({} as Request, {
      params: Promise.resolve({ orgId: mockOrgId, campaignId: mockCampaignId }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.resultsPublished).toBe(true);
    expect(json.totalParticipants).toBe(2);
  });
});
