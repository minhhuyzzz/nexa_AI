import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

vi.mock('@/lib/auth/org-guard', () => ({
  getOrgAuthContext: vi.fn(),
}));

import { getOrgAuthContext } from '@/lib/auth/org-guard';

describe('/api/org/[slug]/analytics/ai-insights Route Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('từ chối 401 nếu chưa đăng nhập hoặc không có quyền', async () => {
    vi.mocked(getOrgAuthContext).mockResolvedValueOnce({
      isAuthorized: false,
    } as any);

    const req = new Request('http://localhost:3000/api/org/fpt/analytics/ai-insights', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req, { params: Promise.resolve({ slug: 'fpt' }) });
    expect(res.status).toBe(401);
  });

  it('từ chối 400 nếu tổ chức chưa có bài nộp được duyệt (evaluatedCount = 0)', async () => {
    vi.mocked(getOrgAuthContext).mockResolvedValueOnce({
      isAuthorized: true,
      role: 'ORG_ADMIN',
      organization: { id: 'org-1', slug: 'fpt', name: 'FPT' },
    } as any);

    const req = new Request('http://localhost:3000/api/org/fpt/analytics/ai-insights', {
      method: 'POST',
      body: JSON.stringify({
        evaluatedCount: 0,
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ slug: 'fpt' }) });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Chưa có đủ');
  });

  it('trả về bản phân tích sư phạm có cấu trúc hợp lệ khi có dữ liệu khảo thí', async () => {
    vi.mocked(getOrgAuthContext).mockResolvedValueOnce({
      isAuthorized: true,
      role: 'ORG_ADMIN',
      organization: { id: 'org-1', slug: 'fpt', name: 'FPT' },
    } as any);

    const req = new Request('http://localhost:3000/api/org/fpt/analytics/ai-insights', {
      method: 'POST',
      body: JSON.stringify({
        orgName: 'Trường FPT Polytechnic',
        evaluatedCount: 45,
        overallScore: 74.5,
        passRate: 82.2,
        domains: [
          { domainCode: 'D1', name: 'Thông tin & Dữ liệu', score: 81.2, coverageRate: 95.5 },
          { domainCode: 'D5', name: 'Giải quyết Vấn đề', score: 58.4, coverageRate: 88.0 },
        ],
        bestDomain: { domainCode: 'D1', name: 'Thông tin & Dữ liệu', score: 81.2 },
        priorityGapDomain: { domainCode: 'D5', name: 'Giải quyết Vấn đề', score: 58.4 },
        timeRangeText: 'Năm 2026',
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ slug: 'fpt' }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.executiveSummary).toBeDefined();
    expect(data.strengthsAnalysis).toBeDefined();
    expect(data.gapIntervention).toBeDefined();
    expect(Array.isArray(data.strategicRoadmap)).toBe(true);
    expect(Array.isArray(data.recommendedWorkshops)).toBe(true);
  });
});
