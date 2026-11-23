'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Award } from 'lucide-react';
import { OfficialRedSeal } from './OfficialRedSeal';

export interface CertificateCanvasProps {
  candidateName?: string;
  credentialCode?: string;
  issuedAt?: string;
  verificationUrl?: string;
  qrDataUrl?: string;
  isSample?: boolean;
  className?: string;
  signerName?: string;
  signerTitle?: string;
  signatureStyle?: string;
  signatureSvgData?: string | null;
  sealType?: 'SYSTEM_SVG' | 'CUSTOM_SVG';
  sealSvgData?: string | null;
  sealText?: string;
  validityType?: 'LIFETIME' | 'CUSTOM_YEARS';
  validityYears?: number | null;
}

export function CertificateCanvas({
  candidateName,
  credentialCode,
  issuedAt,
  verificationUrl,
  qrDataUrl,
  isSample = false,
  className = '',
  signerName = 'Dr. Michael Henson',
  signerTitle = 'CHAIRMAN OF THE ASSESSMENT BOARD',
  signatureStyle = 'Michael Henson',
  signatureSvgData,
  sealType = 'SYSTEM_SVG',
  sealSvgData,
  sealText = 'DIGITAL COMPETENCE ASSESSMENT COUNCIL',
  validityType = 'LIFETIME',
  validityYears,
}: CertificateCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [liveQrUrl, setLiveQrUrl] = useState<string>(qrDataUrl || '');

  // Calculate dynamic responsive scale based on container width
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        if (width > 0) {
          setScale(width / 960);
        }
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const displayDate = isSample
    ? 'October 15, 2026'
    : issuedAt
    ? new Date(issuedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

  const displayName = isSample
    ? (candidateName || 'Nguyen Van A')
    : (candidateName || 'NEXA Candidate');

  const displayCode = isSample
    ? 'XXXXXX'
    : (credentialCode?.replace(/^CERT-2026-?/, '') || credentialCode || 'NX-VALID');

  const displayValidity = validityType === 'CUSTOM_YEARS' && validityYears
    ? `${validityYears} Years`
    : 'Lifetime';

  const displayVerifyUrl =
    verificationUrl ||
    (credentialCode && typeof window !== 'undefined'
      ? `${window.location.origin}/verify/${credentialCode}`
      : credentialCode
      ? `/verify/${credentialCode}`
      : '');

  // Generate dynamic QR code
  useEffect(() => {
    if (!isSample && displayVerifyUrl && !qrDataUrl) {
      QRCode.toDataURL(displayVerifyUrl, {
        width: 260,
        margin: 1,
        color: {
          dark: '#162A45',
          light: '#FFFFFF',
        },
      })
        .then((url) => setLiveQrUrl(url))
        .catch((err) => console.error('Error generating live QR:', err));
    } else if (isSample) {
      QRCode.toDataURL('https://nexa.ai.vn/verify', {
        width: 260,
        margin: 1,
        color: {
          dark: '#162A45',
          light: '#FFFFFF',
        },
      })
        .then((url) => setLiveQrUrl(url))
        .catch(() => {});
    }
  }, [isSample, displayVerifyUrl, qrDataUrl]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-[960/679] overflow-hidden rounded-2xl border border-slate-200/90 dark:border-zinc-800 shadow-md bg-white select-none ${className}`}
    >
      {/* Scaled Canvas Container fixed at 960x679 standard landscape A4 ratio */}
      <div
        style={{
          width: 960,
          height: 679,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
        className="absolute top-0 left-0 p-8 flex flex-col justify-between bg-white text-slate-900 font-sans overflow-hidden"
      >
        {/* ROYAL DOUBLE GOLD ORNAMENTAL BORDER FRAME (Định hình khung văn bằng hoàng gia) */}
        <div className="absolute inset-5 border border-[#C5A059]/50 pointer-events-none rounded-xl" />
        <div className="absolute inset-[26px] border border-[#D4AF37]/35 pointer-events-none rounded-lg" />

        {/* TOP-LEFT: BRAND COBALT RIBBON BANNER WITH GOLD MEDALLION */}
        <div className="absolute top-0 left-8 z-10 flex flex-col items-center">
          <div
            className="w-14 h-28 bg-[#1E40AF] shadow-sm flex flex-col items-center pt-3 relative"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 84%, 0 100%)',
            }}
          >
            <div className="relative w-11 h-11 rounded-full p-0.5 bg-amber-200 border-2 border-amber-400 shadow-2xs flex items-center justify-center">
              <div className="absolute -bottom-2 left-1 w-2.5 h-4 bg-amber-400 rotate-[-20deg] rounded-xs" />
              <div className="absolute -bottom-2 right-1 w-2.5 h-4 bg-amber-400 rotate-[20deg] rounded-xs" />

              <div className="relative z-10 w-full h-full rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border border-amber-300 flex items-center justify-center bg-amber-200">
                  <Award className="w-4 h-4 text-amber-800" strokeWidth={1.75} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TOP-RIGHT: VINTAGE GOLD FLOURISH ORNAMENT */}
        <div className="absolute top-3 right-3 pointer-events-none opacity-85">
          <svg
            className="w-24 h-24"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M98 2C98 30 75 52 48 52C32 52 20 40 20 25C20 12 30 2 42 2C52 2 60 10 60 20C60 28 54 34 46 34C40 34 36 30 36 24C36 19 40 16 44 16"
              stroke="#C5A059"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M98 2C70 2 48 25 48 52C48 68 60 80 75 80C88 80 98 70 98 58C98 48 90 40 80 40C72 40 66 46 66 54C66 60 70 64 76 64"
              stroke="#D4AF37"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="44" cy="16" r="2" fill="#C5A059" />
            <circle cx="76" cy="64" r="2" fill="#D4AF37" />
            <path d="M98 2L98 22M98 2L78 2" stroke="#D4AF37" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>

        {/* BOTTOM-LEFT: VINTAGE GOLD FLOURISH ORNAMENT */}
        <div className="absolute bottom-3 left-3 pointer-events-none opacity-85">
          <svg
            className="w-24 h-24 rotate-180"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M98 2C98 30 75 52 48 52C32 52 20 40 20 25C20 12 30 2 42 2C52 2 60 10 60 20C60 28 54 34 46 34C40 34 36 30 36 24C36 19 40 16 44 16"
              stroke="#C5A059"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M98 2C70 2 48 25 48 52C48 68 60 80 75 80C88 80 98 70 98 58C98 48 90 40 80 40C72 40 66 46 66 54C66 60 70 64 76 64"
              stroke="#D4AF37"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="44" cy="16" r="2" fill="#C5A059" />
            <circle cx="76" cy="64" r="2" fill="#D4AF37" />
            <path d="M98 2L98 22M98 2L78 2" stroke="#D4AF37" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>

        {/* BOTTOM-RIGHT: LAYERED COBALT & GOLD ACCENT WAVES (COMPACT & CLEAN) */}
        <div className="absolute bottom-0 right-0 pointer-events-none w-36 h-24 z-0">
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 200 C80 180, 160 130, 220 70 C250 40, 275 10, 300 0 L300 30 C275 40, 250 70, 220 100 C160 160, 80 200, 0 200 Z"
              fill="#C5A059"
              opacity="0.85"
            />
            <path
              d="M40 200 C120 180, 190 140, 245 80 C275 45, 290 20, 300 10 L300 200 Z"
              fill="#2563EB"
            />
          </svg>
        </div>

        {/* CENTER WATERMARK: LAUREL WREATH */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.09] z-0">
          <svg
            className="w-[440px] h-[440px]"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g stroke="#C5A059" strokeWidth="1.5" strokeLinecap="round">
              <path d="M100 170 C60 160, 35 125, 45 80 C50 60, 65 40, 85 30" />
              <path d="M48 85 C35 75, 40 60, 52 70" fill="#C5A059" />
              <path d="M42 105 C28 98, 30 82, 44 92" fill="#C5A059" />
              <path d="M46 125 C32 122, 32 105, 48 114" fill="#C5A059" />
              <path d="M58 145 C44 145, 42 130, 58 134" fill="#C5A059" />
              <path d="M75 160 C62 165, 58 150, 74 150" fill="#C5A059" />
              <path d="M58 65 C48 50, 60 40, 68 55" fill="#C5A059" />
              <path d="M74 45 C66 32, 80 25, 84 40" fill="#C5A059" />

              <path d="M100 170 C140 160, 165 125, 155 80 C150 60, 135 40, 115 30" />
              <path d="M152 85 C165 75, 160 60, 148 70" fill="#C5A059" />
              <path d="M158 105 C172 98, 170 82, 156 92" fill="#C5A059" />
              <path d="M154 125 C168 122, 168 105, 152 114" fill="#C5A059" />
              <path d="M142 145 C156 145, 158 130, 142 134" fill="#C5A059" />
              <path d="M125 160 C138 165, 142 150, 126 150" fill="#C5A059" />
              <path d="M142 65 C152 50, 140 40, 132 55" fill="#C5A059" />
              <path d="M126 45 C134 32, 120 25, 116 40" fill="#C5A059" />
            </g>
          </svg>
        </div>

        {/* SAMPLE CORNER BADGE */}
        {isSample && (
          <div className="absolute top-4 right-14 z-20 pointer-events-none">
            <div className="px-3.5 py-1 rounded-full border border-slate-300/90 bg-white/95 backdrop-blur-xs text-slate-500 font-semibold text-[10px] tracking-wider uppercase shadow-2xs">
              SPECIMEN &bull; REFERENCE TEMPLATE
            </div>
          </div>
        )}

        {/* ===================== MAIN CERTIFICATE CONTENT ===================== */}
        <div className="relative z-10 flex flex-col items-center text-center justify-between h-full pt-1">
          {/* 1. Header Titles (To, Uy Nghi, Cân Đối) */}
          <div className="space-y-1.5 max-w-xl mx-auto pt-2">
            <h1 className="text-[46px] font-extrabold tracking-[0.22em] text-[#1E3A8A] uppercase font-sans leading-none">
              CERTIFICATE
            </h1>
            <p className="text-[13px] font-bold tracking-[0.32em] text-[#2563EB] uppercase">
              OF DIGITAL COMPETENCE
            </p>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.24em] pt-0.5">
              NEXA AI DIGITAL COMPETENCE ASSESSMENT COUNCIL
            </div>
          </div>

          {/* 2. Recipient Presentation (Hero Element Chiếm 65% Bề Ngang) */}
          <div className="my-auto py-3 w-full max-w-3xl space-y-2">
            <p className="text-sm text-slate-500 font-serif italic">
              This certificate is proudly presented to
            </p>

            {/* Candidate Name in Authentic Calligraphy Font (To Bản 64px Nổi Bật) */}
            <div className="py-1">
              <div
                className="text-[64px] text-[#1E3A8A] font-normal tracking-wide drop-shadow-2xs select-text leading-tight"
                style={{
                  fontFamily: 'var(--font-script), "Alex Brush", cursive, Georgia, serif',
                }}
              >
                {displayName}
              </div>
            </div>

            {/* Center Motif (Không viền ngang theo AGENTS.md) */}
            <div className="flex items-center justify-center max-w-md mx-auto py-0.5">
              <div className="w-2 h-2 rotate-45 bg-amber-500" />
            </div>

            {/* Commendation Paragraph (Mở Rộng Ra 680px, Chữ Đầy Đặn) */}
            <p className="text-[13.5px] text-slate-600 leading-relaxed max-w-2xl mx-auto font-sans pt-1">
              For successfully demonstrating comprehensive proficiency, analytical mastery, and critical problem-solving skills across foundational digital competency domains in alignment with international standards.
            </p>

            {/* Award Date & Lifetime Validity Pill */}
            <div className="pt-2.5 flex flex-wrap items-center justify-center gap-3">
              <span className="inline-block px-4 py-1.5 rounded-full bg-slate-50/90 border border-slate-200/90 text-xs text-slate-800 font-semibold shadow-2xs">
                Issue Date: <strong className="font-bold text-slate-900">{displayDate}</strong>
              </span>
              <span className="inline-block px-4 py-1.5 rounded-full bg-slate-50/90 border border-slate-200/90 text-xs text-slate-800 font-semibold shadow-2xs">
                Validity: <strong className="font-bold text-slate-900">{displayValidity}</strong>
              </span>
            </div>
          </div>

          {/* 3. Bottom Row: QR Code & Verification (Left) and 1 Signer with Official Red Seal (Right) */}
          <div className="w-full grid grid-cols-12 items-end pt-3 pb-2 gap-4 px-4">
            {/* Left Column: QR Code & Verification ID */}
            <div className="col-span-5 flex items-center gap-3.5 text-left">
              <div className="w-20 h-20 p-1 bg-white border-2 border-[#C5A059]/70 rounded-xs shadow-2xs shrink-0 flex items-center justify-center">
                {liveQrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={liveQrUrl}
                    alt="QR Code for Credential Verification"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 animate-pulse rounded-xs" />
                )}
              </div>

              <div className="space-y-0.5 text-xs text-slate-500 font-mono">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">
                  CREDENTIAL ID
                </div>
                <div className="font-bold text-slate-900 tracking-wider text-[13px]">
                  {displayCode}
                </div>
              </div>
            </div>

            {/* Right Column: 1 Council Member with Official SVG Red Seal (Dời ra vùng thoáng trên nền trắng) */}
            <div className="col-span-7 flex items-center justify-end text-center pr-8">
              <div className="relative inline-block pr-2">
                {/* Official Red Seal SVG Overlapping Signature (1/3 overlap) */}
                <div className="absolute -left-12 -top-6 z-10 pointer-events-none">
                  <OfficialRedSeal
                    size={96}
                    sealText={sealText}
                    customSvgData={sealType === 'CUSTOM_SVG' ? sealSvgData : null}
                  />
                </div>

                {/* Council Signer Signature & Name */}
                <div className="relative z-0 space-y-1">
                  <div className="h-11 flex items-end justify-center">
                    {signatureStyle === 'CUSTOM_SVG' && signatureSvgData ? (
                      <div
                        className="h-full flex items-end justify-center select-none"
                        dangerouslySetInnerHTML={{ __html: signatureSvgData }}
                      />
                    ) : (
                      <span
                        className="text-[34px] text-slate-800 font-normal select-none"
                        style={{
                          fontFamily: 'var(--font-script), "Alex Brush", cursive, serif',
                        }}
                      >
                        {signatureStyle === 'CUSTOM_SVG' ? (signerName || 'Dr. Michael Henson') : (signatureStyle || 'Dr. Michael Henson')}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-900 font-sans">
                    {signerName}
                  </div>
                  <div className="text-[9.5px] text-slate-500 uppercase tracking-wider font-sans">
                    {signerTitle}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
