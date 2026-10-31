/**
 * PII Scrubber Service
 * Compliant with Decree 13/2023/ND-CP on Personal Data Protection
 * Sanitizes sensitive identifiable data before dispatching to external LLMs.
 */

export class PIIScrubberService {
  private static readonly EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
  private static readonly VN_PHONE_REGEX = /(?:\+84|84|0)(?:3[2-9]|5[689]|7[06-9]|8[1-9]|9\d)\d{7}\b/g;
  private static readonly CCCD_REGEX = /\b\d{12}\b|\b\d{9}\b/g;
  private static readonly STUDENT_ID_REGEX = /\b(?:MSSV|MSHV|Mã sinh viên|Mã học viên|SV)[\s:_-]*([A-Za-z0-9_-]{5,15})\b/gi;
  private static readonly STANDALONE_STUDENT_ID_REGEX = /\b(?:20|19)\d{6,8}\b/g;
  private static readonly BANK_CARD_REGEX = /\b(?:\d{4}[ -]?){3}\d{4}\b/g;
  private static readonly NAME_INTRO_REGEX = /(?:Họ\s*(?:và|&)?\s*tên|Tên\s*em\s*là|Tên\s*tôi\s*là|Em\s*tên\s*là|Tôi\s*là)[\s:]+([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+){1,4})/g;

  /**
   * Redacts sensitive personal identifiable information from text.
   */
  public static scrub(input: string): string {
    if (!input || typeof input !== 'string') return '';

    return input
      .replace(this.EMAIL_REGEX, '[EMAIL_REDACTED]')
      .replace(this.VN_PHONE_REGEX, '[PHONE_REDACTED]')
      .replace(this.BANK_CARD_REGEX, '[BANK_CARD_REDACTED]')
      .replace(this.STUDENT_ID_REGEX, '[STUDENT_ID_REDACTED]')
      .replace(this.NAME_INTRO_REGEX, (match, p1) => match.replace(p1, '[NAME_REDACTED]'))
      .replace(this.CCCD_REGEX, '[NATIONAL_ID_REDACTED]')
      .replace(this.STANDALONE_STUDENT_ID_REGEX, '[STUDENT_ID_REDACTED]');
  }
}
