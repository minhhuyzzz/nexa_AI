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

describe('Platform Admin Transactions & Reconciliation API (/api/admin/transactions)', () => {
  const transactionId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST: từ chối khi thiếu proofReference hoặc reason', async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
      isAuthorized: true,
      user: { id: 'admin-uuid', email: 'admin.nexa@gmail.com' },
    });

    const req = new NextRequest('http://localhost:3000/api/admin/transactions', {
      method: 'POST',
      body: JSON.stringify({ transactionId }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('chứng từ');
  });

  it('POST: từ chối 400 nếu giao dịch đã ở trạng thái COMPLETED', async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
      isAuthorized: true,
      user: { id: 'admin-uuid', email: 'admin.nexa@gmail.com' },
    });

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: transactionId,
                status: 'COMPLETED',
                amount: 500000,
                plan_code: 'PRO',
              },
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    const req = new NextRequest('http://localhost:3000/api/admin/transactions', {
      method: 'POST',
      body: JSON.stringify({
        transactionId,
        proofReference: 'VCB-2026-9999',
        reason: 'Khách hàng đối soát lại',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('hoàn tất trước đó');
  });

  it('POST: đối soát thành công giao dịch PENDING và ghi nhận audit log', async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
      isAuthorized: true,
      user: { id: 'admin-uuid', email: 'admin.nexa@gmail.com' },
    });

    const mockRpc = vi.fn().mockResolvedValue({ data: { success: true }, error: null });

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: transactionId,
                status: 'PENDING',
                amount: 500000,
                plan_code: 'PRO',
                user_id: 'user-1',
                transaction_reference: 'TX-9988',
              },
              error: null,
            }),
          }),
        }),
      }),
      rpc: mockRpc,
    } as any);

    const req = new NextRequest('http://localhost:3000/api/admin/transactions', {
      method: 'POST',
      body: JSON.stringify({
        transactionId,
        proofReference: 'VCB-2026-9999',
        reason: 'Đã nhận biến động số dư Vietcombank lúc 15:00',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('fulfill_payment_transaction', expect.objectContaining({
      p_transaction_id: transactionId,
      p_provider_ref: 'VCB-2026-9999',
    }));
    expect(recordAdminAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: 'TRANSACTION_MANUALLY_RECONCILED',
      targetId: transactionId,
    }));
  });
});
