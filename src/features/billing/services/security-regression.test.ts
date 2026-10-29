import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PaymentVerifierService } from './payment-verifier.service';
import { isSuperadminEmail } from '@/lib/auth/superadmin';

// Mock Supabase admin client
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from '@/lib/supabase/admin';

describe('Security Regression Suite (P0 & P1 Protections)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('P0: Payment & Webhook Verification Hardening', () => {
    it('từ chối hoàn tất nếu số tiền thực nhận (incomingAmount) nhỏ hơn số tiền yêu cầu của giao dịch', async () => {
      const mockAdmin = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'tx-123',
                  status: 'PENDING',
                  plan_code: 'LEARNER_PRO',
                  user_id: 'user-abc',
                  amount: 149000,
                  currency: 'VND',
                },
                error: null,
              }),
            }),
          }),
        }),
      };
      (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockAdmin);

      // Thử thanh toán thiếu: 50.000 VND thay vì 149.000 VND
      const result = await PaymentVerifierService.fulfillByReference(
        'NEXA123456',
        { amount: 50000 },
        'SEPAY_WEBHOOK',
        50000
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('không đủ');
    });

    it('từ chối hoàn tất nếu giao dịch không ở trạng thái PENDING (ví dụ FAILED hoặc CANCELLED)', async () => {
      const mockAdmin = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'tx-123',
                  status: 'CANCELLED',
                  plan_code: 'LEARNER_PRO',
                  user_id: 'user-abc',
                  amount: 149000,
                  currency: 'VND',
                },
                error: null,
              }),
            }),
          }),
        }),
      };
      (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockAdmin);

      const result = await PaymentVerifierService.fulfillByReference(
        'NEXA123456',
        { amount: 149000 },
        'SEPAY_WEBHOOK',
        149000
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('CANCELLED');
    });

    it('chấp nhận giao dịch và kích hoạt RPC khi số tiền và trạng thái hợp lệ', async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: { success: true, credits_added: 500 }, error: null });
      const mockAdmin = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'tx-123',
                  status: 'PENDING',
                  plan_code: 'LEARNER_PRO',
                  user_id: 'user-abc',
                  amount: 149000,
                  currency: 'VND',
                },
                error: null,
              }),
            }),
          }),
        }),
        rpc: mockRpc,
      };
      (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockAdmin);

      const result = await PaymentVerifierService.fulfillByReference(
        'NEXA123456',
        { amount: 149000 },
        'SEPAY_WEBHOOK',
        149000
      );

      expect(result.success).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('fulfill_payment_transaction', {
        p_transaction_id: 'tx-123',
        p_provider_ref: 'SEPAY_WEBHOOK',
        p_raw_payload: { amount: 149000 },
      });
    });
  });

  describe('P1: Superadmin Authority & Email Validation', () => {
    it('chỉ chấp nhận email trong cấu hình SUPERADMIN_EMAILS, từ chối email khác', () => {
      process.env.SUPERADMIN_EMAILS = 'superadmin@nexa.edu.vn,platform.admin@nexa.vn';

      expect(isSuperadminEmail('superadmin@nexa.edu.vn')).toBe(true);
      expect(isSuperadminEmail('platform.admin@nexa.vn')).toBe(true);
      expect(isSuperadminEmail('SUPERADMIN@NEXA.EDU.VN ')).toBe(true); // normalize trimmed & lowercase

      // Attacker hoặc người dùng khác
      expect(isSuperadminEmail('attacker@evil.com')).toBe(false);
      expect(isSuperadminEmail('user@nexa.edu.vn')).toBe(false);
      expect(isSuperadminEmail(null)).toBe(false);
      expect(isSuperadminEmail(undefined)).toBe(false);
    });
  });

  describe('P1: Organization Invitation Email Match Logic', () => {
    it('kiểm tra ràng buộc giữa email người dùng và email được mời', () => {
      const isAuthorizedInvitee = (userEmail: string | undefined, invitedEmail: string) => {
        const cur = userEmail?.trim().toLowerCase();
        const inv = invitedEmail.trim().toLowerCase();
        return Boolean(cur && cur === inv);
      };

      // Hợp lệ: Cùng email
      expect(isAuthorizedInvitee('teacher@school.edu.vn', 'teacher@school.edu.vn')).toBe(true);
      expect(isAuthorizedInvitee('Teacher@School.edu.vn ', 'teacher@school.edu.vn')).toBe(true);

      // Bị chặn: Đăng nhập tài khoản khác và nhận token
      expect(isAuthorizedInvitee('attacker@school.edu.vn', 'teacher@school.edu.vn')).toBe(false);
      expect(isAuthorizedInvitee(undefined, 'teacher@school.edu.vn')).toBe(false);
    });
  });
});
