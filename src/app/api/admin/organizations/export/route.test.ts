import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { GET } from './route';

vi.mock('@/lib/auth/admin-guard', () => ({
  requirePlatformAdmin: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';

describe('GET /api/admin/organizations/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('từ chối 401 khi user chưa đăng nhập', async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
      isAuthorized: false,
      errorResponse: NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 }),
    });

    const req = new NextRequest('http://localhost:3000/api/admin/organizations/export');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('xuất file Excel (.xlsx) gồm 2 sheet chuẩn khi Admin có quyền', async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
      isAuthorized: true,
      user: { id: 'admin-1', email: 'admin@nexa.ai' } as any,
    });

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'organizations') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'org-1',
                    name: 'Đại học Bách Khoa',
                    code: 'BK-HCM',
                    slug: 'bk-hcm',
                    contact_name: 'TS. Nguyễn Văn A',
                    contact_email: 'owner@bkhcm.edu.vn',
                    contact_phone: '0901234567',
                    max_members: 500,
                    status: 'ACTIVE',
                    is_active: true,
                    created_at: '2026-01-15T00:00:00Z',
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        if (table === 'user_organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ organization_id: 'org-1' }],
                error: null,
              }),
            }),
          };
        }
        if (table === 'organization_entitlements') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    organization_id: 'org-1',
                    max_seats: 500,
                    ai_credits_granted: 10000,
                    ai_credits_used: 150,
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        if (table === 'business_inquiries') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'inq-1',
                    org_name: 'Công ty Công nghệ NEXA',
                    contact_name: 'Trần Minh Huy',
                    contact_email: 'huy@nexa.ai',
                    contact_phone: '0987654321',
                    expected_learners: 200,
                    status: 'NEW',
                    created_at: '2026-02-01T00:00:00Z',
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }),
    };

    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/admin/organizations/export');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    expect(res.headers.get('Content-Disposition')).toContain('nexa_b2b_organizations_');
    expect(res.headers.get('Content-Disposition')).toContain('.xlsx');

    // Đọc buffer kiểm tra 2 sheet
    const arrayBuffer = await res.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    expect(workbook.worksheets.length).toBe(2);
    expect(workbook.worksheets[0].name).toBe('Tổ chức B2B');
    expect(workbook.worksheets[1].name).toBe('Yêu cầu tư vấn B2B');

    // Kiểm tra dòng tiêu đề và dữ liệu sheet 1
    const sheet1 = workbook.getWorksheet('Tổ chức B2B');
    expect(sheet1?.getRow(1).getCell(2).value).toBe('Tên tổ chức');
    expect(sheet1?.getRow(2).getCell(2).value).toBe('Đại học Bách Khoa');
    expect(sheet1?.getRow(2).getCell(3).value).toBe('BK-HCM');
    expect(sheet1?.getRow(2).getCell(7).value).toBe(500);

    // Kiểm tra dòng tiêu đề và dữ liệu sheet 2
    const sheet2 = workbook.getWorksheet('Yêu cầu tư vấn B2B');
    expect(sheet2?.getRow(1).getCell(2).value).toBe('Tên đơn vị');
    expect(sheet2?.getRow(2).getCell(2).value).toBe('Công ty Công nghệ NEXA');
    expect(sheet2?.getRow(2).getCell(6).value).toBe(200);
  });
});
