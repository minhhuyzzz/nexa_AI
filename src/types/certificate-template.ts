export interface CertificateTemplateConfig {
  signerName: string;
  signerTitle: string;
  signatureStyle: string; // 'Michael Henson' | 'Thomas Ridley' | 'CUSTOM_SVG'
  signatureSvgData: string | null;
  sealType: 'SYSTEM_SVG' | 'CUSTOM_SVG';
  sealSvgData: string | null;
  sealText: string;
  validityType: 'LIFETIME' | 'CUSTOM_YEARS';
  validityYears: number | null;
  updatedAt?: string;
}

export const DEFAULT_CERTIFICATE_TEMPLATE: CertificateTemplateConfig = {
  signerName: 'Dr. Michael Henson',
  signerTitle: 'CHAIRMAN OF THE ASSESSMENT BOARD',
  signatureStyle: 'Michael Henson',
  signatureSvgData: null,
  sealType: 'SYSTEM_SVG',
  sealSvgData: null,
  sealText: 'DIGITAL COMPETENCE ASSESSMENT COUNCIL',
  validityType: 'LIFETIME',
  validityYears: null,
};
