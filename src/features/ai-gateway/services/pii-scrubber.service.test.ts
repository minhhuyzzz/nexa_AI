import { describe, it, expect } from 'vitest';
import { PIIScrubberService } from './pii-scrubber.service';

describe('PIIScrubberService (Nghị định 13/2023/NĐ-CP Compliance)', () => {
  it('should scrub email addresses correctly', () => {
    const input = 'Vui lòng liên hệ nguyen.van.a@example.com hoặc test_user@nexa.edu.vn để xử lý sự cố.';
    const scrubbed = PIIScrubberService.scrub(input);
    expect(scrubbed).not.toContain('nguyen.van.a@example.com');
    expect(scrubbed).not.toContain('test_user@nexa.edu.vn');
    expect(scrubbed).toContain('[EMAIL_REDACTED]');
  });

  it('should scrub Vietnamese phone numbers (10 digits)', () => {
    const input = 'Gọi ngay hotline khẩn cấp 0912345678 hoặc số cá nhân 0987654321 trong 72 giờ.';
    const scrubbed = PIIScrubberService.scrub(input);
    expect(scrubbed).not.toContain('0912345678');
    expect(scrubbed).not.toContain('0987654321');
    expect(scrubbed).toContain('[PHONE_REDACTED]');
  });

  it('should scrub Citizen Identity Card numbers (CCCD - 12 digits)', () => {
    const input = 'Số định danh cá nhân của tôi là 001201009876 cần được bảo vệ.';
    const scrubbed = PIIScrubberService.scrub(input);
    expect(scrubbed).not.toContain('001201009876');
    expect(scrubbed).toContain('[NATIONAL_ID_REDACTED]');
  });

  it('should scrub 16-digit bank card numbers', () => {
    const input = 'Thẻ thanh toán số 4111222233334444 đã bị rò rỉ dữ liệu.';
    const scrubbed = PIIScrubberService.scrub(input);
    expect(scrubbed).not.toContain('4111222233334444');
    expect(scrubbed).toContain('[BANK_CARD_REDACTED]');
  });

  it('should preserve benign technical text and legal citations', () => {
    const input = 'Căn cứ theo Điều 23 Nghị định 13/2023/NĐ-CP, doanh nghiệp phải thông báo sự cố trong 72 giờ.';
    const scrubbed = PIIScrubberService.scrub(input);
    expect(scrubbed).toContain('Nghị định 13/2023/NĐ-CP');
    expect(scrubbed).toContain('72 giờ');
  });
});
