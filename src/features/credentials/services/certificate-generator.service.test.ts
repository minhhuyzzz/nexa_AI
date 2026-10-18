import { describe, it, expect } from 'vitest';
import { CertificateGeneratorService } from './certificate-generator.service';

describe('CertificateGeneratorService (Dual SHA-256 & QR Vector PDF)', () => {
  it('should generate valid PDF bytes and dual SHA-256 hashes', async () => {
    const input = {
      credentialId: 'e0000000-0000-0000-0000-000000000001',
      credentialCode: 'NX-2024-TEST01',
      candidateName: 'Nguyễn Văn An',
      assessmentTitle: 'Bài Đánh Giá Năng Lực Số Chuẩn Hóa DigComp 2.2',
      scorePercentage: 88.5,
      totalScore: 88.5,
      maxScore: 100,
      competencyLevel: 'ADVANCED',
      issuedAt: new Date('2026-10-17T00:00:00Z'),
      verificationBaseUrl: 'http://localhost:3000',
    };

    const result = await CertificateGeneratorService.generate(input);

    // 1. Verify PDF bytes
    expect(result.pdfBytes).toBeInstanceOf(Uint8Array);
    expect(result.pdfBytes.length).toBeGreaterThan(1000);

    // PDF magic bytes: %PDF-
    const headerString = String.fromCharCode(...result.pdfBytes.slice(0, 5));
    expect(headerString).toBe('%PDF-');

    // 2. Verify Hash 1: Metadata Content Hash
    expect(result.contentHash).toMatch(/^[0-9a-f]{64}$/);

    // 3. Verify Hash 2: Document Integrity Hash
    expect(result.pdfHash).toMatch(/^[0-9a-f]{64}$/);

    // Hashes must be distinct
    expect(result.contentHash).not.toBe(result.pdfHash);

    // 4. Verify QR verification URL
    expect(result.verificationUrl).toBe('http://localhost:3000/verify/e0000000-0000-0000-0000-000000000001');
    expect(result.qrDataUrl).toContain('data:image/png;base64,');
  });
});
