import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth/admin-guard', () => ({
  requirePlatformAdmin: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/audit/admin-audit.service', () => ({
  recordAdminAudit: vi.fn(),
}));

import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordAdminAudit } from '@/lib/audit/admin-audit.service';

describe('Admin Settings API (/api/admin/settings)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET: từ chối 403 nếu người dùng không có quyền quản trị cài đặt', async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
      isAuthorized: false,
      errorResponse: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }) as any,
    });

    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('GET: trả về danh sách cài đặt nền tảng từ system_settings', async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
      isAuthorized: true,
      user: { id: 'admin-1', email: 'admin@nexa.edu.vn' },
    });

    const mockRecords = [
      { key: 'general_config', value: { platformName: 'NEXA AI Test' }, updated_at: '2026-11-23' },
      { key: 'gamification_reward_policy', value: { baselineSurveyPts: 25 }, updated_at: '2026-11-23' },
    ];

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockRecords,
          error: null,
        }),
      }),
    } as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.settings.general_config.platformName).toBe('NEXA AI Test');
    expect(body.settings.gamification_reward_policy.baselineSurveyPts).toBe(25);
  });

  it('POST: từ chối 400 nếu dữ liệu cấu hình vi phạm validation', async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
      isAuthorized: true,
      user: { id: 'admin-1', email: 'admin@nexa.edu.vn' },
    });

    const req = new NextRequest('http://localhost:3000/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify({
        platformName: '',
        supportEmail: 'not-an-email',
        baselineSurveyPts: -10, // Invalid negative points
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Dữ liệu cấu hình không hợp lệ');
  });

  it('POST: lưu thành công, upsert system_settings, đồng bộ assessments.point_reward và ghi audit log', async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
      isAuthorized: true,
      user: { id: 'admin-1', email: 'admin@nexa.edu.vn' },
    });

    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const updateAssessmentsMock = vi.fn().mockReturnValue({
      or: vi.fn().mockResolvedValue({ error: null }),
    });

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'system_settings') {
          return { upsert: upsertMock };
        }
        if (table === 'assessments') {
          return { update: updateAssessmentsMock };
        }
        return {};
      }),
    } as any);

    const payload = {
      platformName: 'NEXA AI EdTech',
      supportEmail: 'support@nexa.edu.vn',
      systemTimezone: 'Asia/Ho_Chi_Minh',
      dateTimeFormat: 'DD/MM/YYYY HH:mm',
      maintenanceMode: false,
      defaultLanguage: 'vi',
      dailyLoginPts: 2,
      streakMilestonePts: 15,
      contributionApprovedPts: 30,
      baselineSurveyPts: 50,
    };

    const req = new NextRequest('http://localhost:3000/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // Kiểm tra upsert
    expect(upsertMock).toHaveBeenCalledTimes(1);
    const upsertArgs = upsertMock.mock.calls[0][0];
    const gamificationSetting = upsertArgs.find((item: any) => item.key === 'gamification_reward_policy');
    expect(gamificationSetting.value.baselineSurveyPts).toBe(50);
    expect(gamificationSetting.value.dailyLoginPts).toBe(2);

    // Kiểm tra đồng bộ assessments
    expect(updateAssessmentsMock).toHaveBeenCalledWith({ point_reward: 50 });

    // Kiểm tra audit log
    expect(recordAdminAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: 'admin-1',
        action: 'UPDATE_SYSTEM_SETTINGS',
      })
    );
  });
});
