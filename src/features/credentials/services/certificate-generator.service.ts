import crypto from 'crypto';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { removeVietnameseTones } from '@/lib/utils/vietnamese';

export interface CertificateInput {
  credentialId: string;
  credentialCode: string;
  candidateName: string;
  assessmentTitle: string;
  scorePercentage: number;
  totalScore: number;
  maxScore: number;
  competencyLevel: string;
  issuedAt: Date;
  verificationBaseUrl?: string;
}

export interface GeneratedCertificate {
  pdfBytes: Uint8Array;
  contentHash: string;
  pdfHash: string;
  qrDataUrl: string;
  verificationUrl: string;
}

export class CertificateGeneratorService {
  /**
   * Generates a high-precision vector PDF certificate with dual SHA-256 hashes and dynamic QR code.
   */
  public static async generate(input: CertificateInput): Promise<GeneratedCertificate> {
    const baseUrl =
      input.verificationBaseUrl ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify/${input.credentialId}`;

    // 1. Calculate Hash 1: Metadata Content Canonical SHA-256
    const metadataCanonical = JSON.stringify({
      credentialId: input.credentialId,
      credentialCode: input.credentialCode,
      candidateName: input.candidateName,
      assessmentTitle: input.assessmentTitle,
      scorePercentage: Number(input.scorePercentage.toFixed(2)),
      totalScore: Number(input.totalScore.toFixed(2)),
      maxScore: Number(input.maxScore.toFixed(2)),
      competencyLevel: input.competencyLevel,
      issuedAt: input.issuedAt.toISOString(),
      framework: 'EU DigComp 3.0 / ND 13/2023/ND-CP',
    });

    const contentHash = crypto
      .createHash('sha256')
      .update(metadataCanonical)
      .digest('hex');

    // 2. Generate QR code as PNG buffer
    const qrPngBuffer = await QRCode.toBuffer(verificationUrl, {
      width: 130,
      margin: 1,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    });

    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 200,
      margin: 2,
    });

    // 3. Create PDF Document (A4 Landscape: 841.89 x 595.28 pt)
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([841.89, 595.28]);
    const { width, height } = page.getSize();

    // Embed fonts
    const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);
    const fontMonoBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

    // Embed QR image
    const qrImage = await pdfDoc.embedPng(qrPngBuffer);

    // Color palette (Academic Slate & Sky Blue)
    const charcoal = rgb(15 / 255, 23 / 255, 42 / 255); // #0F172A
    const slateGray = rgb(100 / 255, 116 / 255, 139 / 255); // #64748B
    const skyBlue = rgb(2 / 255, 132 / 255, 199 / 255); // #0284C7
    const borderColor = rgb(226 / 255, 232 / 255, 240 / 255); // #E2E8F0
    const cardBg = rgb(248 / 255, 250 / 255, 252 / 255); // #F8FAFC

    // --- Outer & Inner Decorative Borders ---
    page.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      borderColor,
      borderWidth: 1.5,
      color: rgb(1, 1, 1),
    });

    page.drawRectangle({
      x: 28,
      y: 28,
      width: width - 56,
      height: height - 56,
      borderColor: skyBlue,
      borderWidth: 0.75,
    });

    // Top Header Banner
    const brandText = 'NEXA DIGITAL COMPETENCY ASSESSMENT PLATFORM';
    page.drawText(brandText, {
      x: width / 2 - (fontMonoBold.widthOfTextAtSize(brandText, 10) / 2),
      y: height - 60,
      size: 10,
      font: fontMonoBold,
      color: skyBlue,
    });

    const certTitle = 'CERTIFICATE OF DIGITAL COMPETENCE';
    page.drawText(certTitle, {
      x: width / 2 - (fontBold.widthOfTextAtSize(certTitle, 22) / 2),
      y: height - 90,
      size: 22,
      font: fontBold,
      color: charcoal,
    });

    const certSubTitle = 'CHUNG NHAN DAT CHUAN NANG LUC SO QUOC GIA';
    page.drawText(certSubTitle, {
      x: width / 2 - (fontHelvetica.widthOfTextAtSize(certSubTitle, 12) / 2),
      y: height - 110,
      size: 12,
      font: fontHelvetica,
      color: slateGray,
    });

    const standardRef =
      'Standardized under EU DigComp 3.0 Framework & Vietnam Decree 13/2023/ND-CP';
    page.drawText(standardRef, {
      x: width / 2 - (fontHelvetica.widthOfTextAtSize(standardRef, 9) / 2),
      y: height - 126,
      size: 9,
      font: fontHelvetica,
      color: slateGray,
    });

    // Recipient Section
    const certifyText = 'This is proudly awarded to / Chung nhan trao cho:';
    page.drawText(certifyText, {
      x: width / 2 - (fontHelvetica.widthOfTextAtSize(certifyText, 11) / 2),
      y: height - 170,
      size: 11,
      font: fontHelvetica,
      color: slateGray,
    });

    const cleanCandidateName = removeVietnameseTones(input.candidateName).toUpperCase();
    page.drawText(cleanCandidateName, {
      x: width / 2 - (fontBold.widthOfTextAtSize(cleanCandidateName, 26) / 2),
      y: height - 208,
      size: 26,
      font: fontBold,
      color: charcoal,
    });

    // Divider Line under name
    page.drawLine({
      start: { x: width / 2 - 160, y: height - 222 },
      end: { x: width / 2 + 160, y: height - 222 },
      thickness: 1,
      color: skyBlue,
    });

    // Assessment description
    const passedText =
      'for successfully demonstrating standardized digital knowledge, critical problem solving and legal compliance in:';
    page.drawText(passedText, {
      x: width / 2 - (fontHelvetica.widthOfTextAtSize(passedText, 10) / 2),
      y: height - 245,
      size: 10,
      font: fontHelvetica,
      color: slateGray,
    });

    const cleanExamTitle = removeVietnameseTones(input.assessmentTitle);
    page.drawText(cleanExamTitle, {
      x: width / 2 - (fontBold.widthOfTextAtSize(cleanExamTitle, 14) / 2),
      y: height - 268,
      size: 14,
      font: fontBold,
      color: charcoal,
    });

    // Performance Summary Card
    const cardX = 60;
    const cardY = height - 370;
    const cardW = width - 120;
    const cardH = 80;

    page.drawRectangle({
      x: cardX,
      y: cardY,
      width: cardW,
      height: cardH,
      color: cardBg,
      borderColor,
      borderWidth: 1,
    });

    // Metric 1: Score
    page.drawText('FINAL SCORE / DIEM SO', {
      x: cardX + 30,
      y: cardY + 54,
      size: 9,
      font: fontMono,
      color: slateGray,
    });
    const scoreVal = `${input.scorePercentage.toFixed(1)}% (${input.totalScore.toFixed(1)}/${input.maxScore.toFixed(0)})`;
    page.drawText(scoreVal, {
      x: cardX + 30,
      y: cardY + 28,
      size: 16,
      font: fontMonoBold,
      color: skyBlue,
    });

    // Metric 2: Level
    page.drawText('COMPETENCY LEVEL', {
      x: cardX + 280,
      y: cardY + 54,
      size: 9,
      font: fontMono,
      color: slateGray,
    });
    page.drawText(input.competencyLevel, {
      x: cardX + 280,
      y: cardY + 28,
      size: 16,
      font: fontMonoBold,
      color: charcoal,
    });

    // Metric 3: Credential Code
    page.drawText('CREDENTIAL ID / SO HIEU', {
      x: cardX + 510,
      y: cardY + 54,
      size: 9,
      font: fontMono,
      color: slateGray,
    });
    page.drawText(input.credentialCode, {
      x: cardX + 510,
      y: cardY + 28,
      size: 15,
      font: fontMonoBold,
      color: charcoal,
    });

    // Bottom Cryptographic Verification & QR Section
    const qrDim = 95;
    const qrX = width - 60 - qrDim;
    const qrY = 48;

    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: qrDim,
      height: qrDim,
    });

    const qrLabel = 'SCAN TO VERIFY';
    page.drawText(qrLabel, {
      x: qrX + qrDim / 2 - fontMonoBold.widthOfTextAtSize(qrLabel, 8) / 2,
      y: qrY - 10,
      size: 8,
      font: fontMonoBold,
      color: charcoal,
    });

    // Left Bottom Signatures & Legal Authority
    const issueDateStr = input.issuedAt.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    page.drawText(`Date of Issuance / Ngay cap: ${issueDateStr}`, {
      x: 60,
      y: 115,
      size: 9,
      font: fontHelvetica,
      color: slateGray,
    });

    page.drawText('Certified by NEXA Examination Council & AI Evaluation Gateway', {
      x: 60,
      y: 100,
      size: 9,
      font: fontBold,
      color: charcoal,
    });

    // Dual SHA-256 Cryptographic Print
    page.drawText('DUAL CRYPTOGRAPHIC SHA-256 TAMPER-PROOF INTEGRITY:', {
      x: 60,
      y: 78,
      size: 7.5,
      font: fontMonoBold,
      color: slateGray,
    });

    const hash1Text = `SHA-256 (Metadata Content): ${contentHash}`;
    page.drawText(hash1Text, {
      x: 60,
      y: 65,
      size: 7,
      font: fontMono,
      color: charcoal,
    });

    const verifyKioskUrl = `Online Verification Kiosk: ${verificationUrl}`;
    page.drawText(verifyKioskUrl, {
      x: 60,
      y: 52,
      size: 7,
      font: fontMono,
      color: skyBlue,
    });

    // 4. Serialize PDF document to bytes
    const pdfBytes = await pdfDoc.save();

    // 5. Calculate Hash 2: Document Integrity SHA-256 over exact PDF byte stream
    const pdfHash = crypto.createHash('sha256').update(pdfBytes).digest('hex');

    return {
      pdfBytes,
      contentHash,
      pdfHash,
      qrDataUrl,
      verificationUrl,
    };
  }
}
