import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as handlePayOSWebhook } from '@/app/api/webhooks/payos/route';
import { PaymentVerifierService } from '@/features/billing/services/payment-verifier.service';

vi.mock('@/lib/payos/payos-client', () => ({
  getPayOSClient: vi.fn(),
}));

import { getPayOSClient } from '@/lib/payos/payos-client';

describe('payOS Webhook Security & Verification Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('trả về 503 nếu payOS client chưa được cấu hình API keys', async () => {
    (getPayOSClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const req = new NextRequest('http://localhost:3000/api/webhooks/payos', {
      method: 'POST',
      body: JSON.stringify({ code: '00', data: {} }),
    });

    const res = await handlePayOSWebhook(req);
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toContain('chưa được cấu hình');
  });

  it('trả về 400 nếu chữ ký webhook payOS không hợp lệ', async () => {
    const mockPayOS = {
      webhooks: {
        verify: vi.fn().mockRejectedValue(new Error('Chữ ký không khớp')),
      },
    };
    (getPayOSClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockPayOS);

    const req = new NextRequest('http://localhost:3000/api/webhooks/payos', {
      method: 'POST',
      body: JSON.stringify({ code: '00', data: {}, signature: 'invalid' }),
    });

    const res = await handlePayOSWebhook(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Chữ ký');
  });

  it('xác nhận webhook thành công khi payOS gửi ping kiểm tra kết nối (test orderCode 123)', async () => {
    const mockPayOS = {
      webhooks: {
        verify: vi.fn().mockResolvedValue({
          orderCode: 123,
          amount: 2000,
          description: 'Ma don hang test',
          code: '00',
        }),
      },
    };
    (getPayOSClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockPayOS);

    const req = new NextRequest('http://localhost:3000/api/webhooks/payos', {
      method: 'POST',
      body: JSON.stringify({ code: '00', data: { orderCode: 123 } }),
    });

    const res = await handlePayOSWebhook(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toContain('confirmation');
  });

  it('đối soát và nâng cấp gói thành công khi nhận webhook thanh toán hợp lệ', async () => {
    const mockPayOS = {
      webhooks: {
        verify: vi.fn().mockResolvedValue({
          orderCode: 849201,
          amount: 149000,
          description: 'NEXA 849201',
          code: '00',
        }),
      },
    };
    (getPayOSClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockPayOS);

    const fulfillSpy = vi.spyOn(PaymentVerifierService, 'fulfillByReference').mockResolvedValue({
      success: true,
      result: { success: true },
    });

    const req = new NextRequest('http://localhost:3000/api/webhooks/payos', {
      method: 'POST',
      body: JSON.stringify({
        code: '00',
        data: { orderCode: 849201, amount: 149000, code: '00' },
      }),
    });

    const res = await handlePayOSWebhook(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(fulfillSpy).toHaveBeenCalledWith('849201', expect.any(Object), 'PAYOS', 149000);
  });
});
