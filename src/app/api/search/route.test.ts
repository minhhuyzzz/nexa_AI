import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/auth/admin-guard', () => ({
  requirePlatformAdmin: vi.fn(),
}));

vi.mock('@/lib/auth/org-guard', () => ({
  getOrgAuthContext: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { getOrgAuthContext } from '@/lib/auth/org-guard';

describe('Global Search API (/api/search)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Personal Search & Suggestions Scope', () => {
    it('trả về danh mục đề xuất tiêu biểu khi q rỗng', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
        },
      } as any);

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'assessments') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  is: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue({
                        data: [
                          {
                            id: 'asm-1',
                            title: 'Khảo thí Năng lực số Khởi động',
                            duration_minutes: 45,
                            total_questions: 30,
                            passing_score: 70,
                          },
                        ],
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          return { select: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue({ data: [] }) }) };
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/search?scope=personal');
      const res = await GET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.isSuggestions).toBe(true);
      expect(json.results.length).toBeGreaterThan(0);
      expect(json.results.some((r: any) => r.category === 'assessment')).toBe(true);
      expect(json.results.some((r: any) => r.category === 'learning_station')).toBe(true);
    });

    it('tìm kiếm theo từ khóa q trên đề thi và trạm năng lực', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
        },
      } as any);

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'assessments') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  is: vi.fn().mockReturnValue({
                    ilike: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue({
                        data: [
                          {
                            id: 'asm-2',
                            title: 'Đánh giá Kỹ năng Tìm kiếm Thông tin',
                            duration_minutes: 30,
                            passing_score: 70,
                          },
                        ],
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'evaluator_classes') {
            return {
              select: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  or: vi.fn().mockReturnValue({
                    ilike: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue({ data: [] }),
                    }),
                  }),
                }),
              }),
            };
          }
          return { select: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue({ data: [] }) }) };
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/search?scope=personal&q=tìm+kiếm');
      const res = await GET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.isSuggestions).toBe(false);
      expect(json.query).toBe('tìm kiếm');
      expect(json.results.some((r: any) => r.title.includes('Tìm kiếm'))).toBe(true);
    });
  });

  describe('Organization Scope Protection & Search', () => {
    it('từ chối 400 nếu thiếu mã orgSlug', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      } as any);

      const req = new NextRequest('http://localhost:3000/api/search?scope=org');
      const res = await GET(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('orgSlug');
    });

    it('từ chối 403 nếu người dùng không thuộc tổ chức', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'unauth-user' } }, error: null }),
        },
      } as any);

      vi.mocked(getOrgAuthContext).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/search?scope=org&orgSlug=dh-fpt');
      const res = await GET(req);
      expect(res.status).toBe(403);
    });
  });

  describe('Platform Admin Scope Protection', () => {
    it('từ chối 403 nếu người dùng không phải Quản trị viên nền tảng', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'regular-user' } }, error: null }),
        },
      } as any);

      vi.mocked(requirePlatformAdmin).mockResolvedValue({
        isAuthorized: false,
      });

      const req = new NextRequest('http://localhost:3000/api/search?scope=admin&q=test');
      const res = await GET(req);
      expect(res.status).toBe(403);
    });

    it('cho phép Quản trị viên truy vấn người dùng và tổ chức B2B', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-user' } }, error: null }),
        },
      } as any);

      vi.mocked(requirePlatformAdmin).mockResolvedValue({
        isAuthorized: true,
        user: { id: 'admin-user', email: 'admin@nexa.ai', adminRole: 'ADMIN' },
      });

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                or: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: 'user-99',
                        email: 'student@fpt.edu.vn',
                        full_name: 'Nguyễn Văn Test',
                        role: 'LEARNER',
                      },
                    ],
                  }),
                }),
              }),
            };
          }
          if (table === 'organizations') {
            return {
              select: vi.fn().mockReturnValue({
                or: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: 'org-1',
                        name: 'Đại Học Công Nghệ',
                        slug: 'dh-cong-nghe',
                        code: 'DHCN',
                        type: 'UNIVERSITY',
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
                is: vi.fn().mockReturnValue({
                  ilike: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: [] }),
                  }),
                }),
              }),
            };
          }
          return { select: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue({ data: [] }) }) };
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/search?scope=admin&q=cong+nghe');
      const res = await GET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.results.some((r: any) => r.category === 'organization')).toBe(true);
    });
  });
});
