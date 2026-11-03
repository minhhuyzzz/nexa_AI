import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth/org-guard', () => ({
  requireOrgPagePermission: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import { createAdminClient } from '@/lib/supabase/admin';

describe('/api/org/[slug]/analytics/export Route Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('từ chối 403 nếu người dùng không có quyền VIEW_ANALYTICS', async () => {
    vi.mocked(requireOrgPagePermission).mockRejectedValue(new Error('Forbidden: Insufficient permissions'));

    const req = new NextRequest('http://localhost:3000/api/org/test-org/analytics/export');
    const res = await GET(req, { params: Promise.resolve({ slug: 'test-org' }) });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Forbidden');
  });

  it('xuất file CSV UTF-8 BOM thành công với đầy đủ cấu trúc 5 miền và các bài nộp', async () => {
    vi.mocked(requireOrgPagePermission).mockResolvedValue({
      organization: { id: 'org-123', name: 'Trường Đại học Sư phạm', slug: 'dhsp' },
      membership: { role: 'ORG_ADMIN' },
    } as any);

    const mockAdminSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'evaluator_classes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'cls-1', name: 'Lớp Sư phạm Tin', class_members: [{ user_id: 'u-1' }] }],
              }),
            }),
          };
        }
        if (table === 'assessment_campaigns') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'cmp-1',
                      title: 'Khảo sát Đầu vào K48',
                      status: 'COMPLETED',
                      starts_at: '2026-09-01T00:00:00Z',
                      ends_at: '2026-09-15T00:00:00Z',
                      passing_score: 70,
                      class_ids: ['cls-1'],
                    },
                  ],
                }),
              }),
            }),
          };
        }
        if (table === 'assessments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'asm-1' }],
              }),
            }),
          };
        }
        if (table === 'assessment_submissions') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'sub-1',
                    campaign_id: 'cmp-1',
                    user_id: 'u-1',
                    status: 'EVALUATED',
                    percentage: 82,
                    is_passed: true,
                    domain_scores: { D1: 85, D2: 80, D3: 80, D4: 85, D5: 80 },
                    created_at: '2026-09-05T10:00:00Z',
                  },
                ],
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [] }),
            in: vi.fn().mockResolvedValue({ data: [] }),
          }),
        };
      }),
    };

    vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/org/dhsp/analytics/export?campaignId=cmp-1');
    const res = await GET(req, { params: Promise.resolve({ slug: 'dhsp' }) });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/csv');
    expect(res.headers.get('Content-Disposition')).toContain('attachment; filename="nexa-analytics-dhsp-');

    const arrayBuffer = await res.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    // Verify UTF-8 BOM bytes: 0xEF, 0xBB, 0xBF
    expect(bytes[0]).toBe(0xef);
    expect(bytes[1]).toBe(0xbb);
    expect(bytes[2]).toBe(0xbf);

    const csvText = new TextDecoder('utf-8').decode(bytes);
    // Verify content headers
    expect(csvText).toContain('BÁO CÁO PHÂN TÍCH NĂNG LỰC SỐ 5 MIỀN CỐT LÕI - NEXA AI');
    expect(csvText).toContain('Trường Đại học Sư phạm');
    expect(csvText).toContain('Khảo sát Đầu vào K48');
    expect(csvText).toContain('TỔNG HỢP 5 MIỀN NĂNG LỰC SỐ');
    expect(csvText).toContain('"D1"');
    expect(csvText).toContain('"Thông tin & Dữ liệu"');
    expect(csvText).toContain('DANH SÁCH BÀI KHẢO THÍ ĐÃ PHÊ DUYỆT');
    expect(csvText).toContain('"sub-1"');
    expect(csvText).toContain('"ĐẠT CHUẨN"');
  });
});
