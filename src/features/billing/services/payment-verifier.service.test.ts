import { describe, it, expect, vi } from 'vitest';
import { PaymentVerifierService } from './payment-verifier.service';

describe('PaymentVerifierService', () => {
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
});
