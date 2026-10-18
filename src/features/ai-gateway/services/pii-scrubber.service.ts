/**
 * PII Scrubber Service
 * Compliant with Decree 13/2023/ND-CP on Personal Data Protection
 * Sanitizes sensitive identifiable data before dispatching to external LLMs.
 */

export class PIIScrubberService {
  private static readonly EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  private static readonly VN_PHONE_REGEX = /(?:\+84|0)(?:3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}/g;
  private static readonly CCCD_REGEX = /\b[0-9]{9}\b|\b[0-9]{12}\b/g;
  private static readonly BANK_CARD_REGEX = /\b(?:\d{4}[ -]?){3}\d{4}\b/g;

  /**
   * Redacts sensitive personal identifiable information from text.
   */
  public static scrub(input: string): string {
    if (!input || typeof input !== 'string') return '';

    return input
      .replace(this.EMAIL_REGEX, '[EMAIL_REDACTED]')
      .replace(this.VN_PHONE_REGEX, '[PHONE_REDACTED]')
      .replace(this.BANK_CARD_REGEX, '[BANK_CARD_REDACTED]')
      .replace(this.CCCD_REGEX, '[NATIONAL_ID_REDACTED]');
  }
}
