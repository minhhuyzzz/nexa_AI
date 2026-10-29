import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as handleWebhook } from '@/app/api/webhooks/payment/route';
import { POST as handleMockPay } from '@/app/api/billing/mock-pay/route';

// Mock Supabase clients
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

describe('Payment Webhook & Mock Pay Security Suite', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.PAYMENT_WEBHOOK_SECRET = 'secret_test_key_123';
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllEnvs();
  });

  describe('POST /api/webhooks/payment', () => {
    it('trả về 401 nếu thiếu header Authorization / x-webhook-secret', async () => {
      const req = new NextRequest('http://localhost:3000/api/webhooks/payment', {
        method: 'POST',
        body: JSON.stringify({ referenceCode: 'NEXA123456', amount: 149000 }),
      });

      const res = await handleWebhook(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain('Thiếu header');
    });

    it('trả về 401 nếu mã bí mật webhook không khớp', async () => {
      const req = new NextRequest('http://localhost:3000/api/webhooks/payment', {
        method: 'POST',
        headers: {
          'x-webhook-secret': 'wrong_secret',
        },
        body: JSON.stringify({ referenceCode: 'NEXA123456', amount: 149000 }),
      });

      const res = await handleWebhook(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain('Sai mã bí mật');
    });

    it('trả về 400 nếu webhook body thiếu thông tin số tiền (amount)', async () => {
      const req = new NextRequest('http://localhost:3000/api/webhooks/payment', {
        method: 'POST',
        headers: {
          'x-webhook-secret': 'secret_test_key_123',
        },
        body: JSON.stringify({
          referenceCode: 'NEXA123456',
          content: 'Thanh toan NEXA123456',
          // khong co amount
        }),
      });

      const res = await handleWebhook(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Dữ liệu webhook không hợp lệ');
    });

    it('trả về 400 nếu webhook không chứa mã đối soát NEXA hợp lệ', async () => {
      const req = new NextRequest('http://localhost:3000/api/webhooks/payment', {
        method: 'POST',
        headers: {
          'x-webhook-secret': 'secret_test_key_123',
        },
        body: JSON.stringify({
          content: 'Chuyen khoan khong ma',
          amount: 149000,
        }),
      });

      const res = await handleWebhook(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Không tìm thấy mã đối soát NEXA');
    });

    it('trả về 422 nếu số tiền gửi lên nhỏ hơn số tiền yêu cầu trong giao dịch DB', async () => {
      const mockAdmin = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'tx-test-id',
                  status: 'PENDING',
                  plan_code: 'LEARNER_PRO',
                  user_id: 'user-123',
                  amount: 199000,
                  currency: 'VND',
                },
                error: null,
              }),
            }),
          }),
        }),
      };
      (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockAdmin);

      const req = new NextRequest('http://localhost:3000/api/webhooks/payment', {
        method: 'POST',
        headers: {
          'x-webhook-secret': 'secret_test_key_123',
        },
        body: JSON.stringify({
          content: 'Thanh toan goi NEXA654321',
          transferAmount: 50000, // Chi gui 50.000 thay vi 199.000
        }),
      });

      const res = await handleWebhook(req);
      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error).toContain('không đủ');
    });
  });

  describe('POST /api/billing/mock-pay', () => {
    it('bị chặn hoàn toàn (403 Forbidden) trên môi trường production', async () => {
      vi.stubEnv('NODE_ENV', 'production');

      const req = new NextRequest('http://localhost:3000/api/billing/mock-pay', {
        method: 'POST',
        body: JSON.stringify({ referenceCode: 'NEXA123456' }),
      });

      const res = await handleMockPay(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain('Production');
    });

    it('yêu cầu xác thực tài khoản (401) nếu chưa đăng nhập', async () => {
      vi.stubEnv('NODE_ENV', 'development');

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('No session') }),
        },
      };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

      const req = new NextRequest('http://localhost:3000/api/billing/mock-pay', {
        method: 'POST',
        body: JSON.stringify({ referenceCode: 'NEXA123456' }),
      });

      const res = await handleMockPay(req);
      expect(res.status).toBe(401);
    });
  });
});
