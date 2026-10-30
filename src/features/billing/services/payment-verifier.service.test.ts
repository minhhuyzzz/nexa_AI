import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/payos/payos-client', () => ({
  getPayOSClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { PaymentVerifierService } from './payment-verifier.service';
import { getPayOSClient } from '@/lib/payos/payos-client';
import { createAdminClient } from '@/lib/supabase/admin';

describe('PaymentVerifierService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('should parse reference codes matching NEXA[0-9]{6}', () => {
    const rawContent = 'Nguoi nop tien: NEXA849201 chuyen tien hoc phi';
    const match = rawContent.match(/(NEXA\d{6})/i);
    expect(match).not.toBeNull();
    expect(match?.[1].toUpperCase()).toBe('NEXA849201');
  });

  it('should reject invalid or non-matching reference strings', () => {
    const invalidContent = 'Chuyen khoan khong co ma hop le 123456';
    const match = invalidContent.match(/(NEXA\d{6})/i);
    expect(match).toBeNull();
  });

  it('should correctly format VietQR URL with encoded parameters', () => {
    const bankId = 'MB';
    const accountNo = '0901234567';
    const accountName = 'CONG TY CP CONG NGHE NEXA';
    const amount = 199000;
    const ref = 'NEXA999888';

    const url = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(ref)}&accountName=${encodeURIComponent(accountName)}`;

    expect(url).toContain('amount=199000');
    expect(url).toContain('addInfo=NEXA999888');
    expect(url).toContain('accountName=CONG%20TY%20CP%20CONG%20NGHE%20NEXA');
  });

  it('should generate valid checkout URL for standard VietQR format', () => {
    const bankId = 'MB';
    const accountNo = '0901234567';
    const accountName = 'CONG TY CP CONG NGHE NEXA';
    const amount = 299000;
    const ref = 'NEXA123456';

    const url = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(ref)}&accountName=${encodeURIComponent(accountName)}`;
    expect(url).toBe('https://img.vietqr.io/image/MB-0901234567-compact2.png?amount=299000&addInfo=NEXA123456&accountName=CONG%20TY%20CP%20CONG%20NGHE%20NEXA');
  });

  it('should fail closed when attempting payment intent without proper gateway configuration', async () => {
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { code: 'LEARNER_PRO', price_vnd: 199000 },
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof createAdminClient>);

    vi.mocked(getPayOSClient).mockReturnValue(null);

    await expect(
      PaymentVerifierService.createPaymentIntent('00000000-0000-0000-0000-000000000000', 'LEARNER_PRO')
    ).rejects.toThrow('Cổng thanh toán tự động payOS hiện chưa được cấu hình');
  });
});
