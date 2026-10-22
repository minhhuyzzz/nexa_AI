'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Lock,
  Award,
  Download,
  ExternalLink,
  Printer,
} from 'lucide-react';

interface MasterCertificateCardProps {
  candidateName: string;
  points: number;
  isUnlocked: boolean;
  credentialCode?: string;
  issuedAt?: string;
  verificationUrl?: string;
  qrDataUrl?: string;
}

export function MasterCertificateCard({
  candidateName,
  points,
  isUnlocked,
  credentialCode = 'NX-2026-MASTER-DEMO',
  issuedAt,
  verificationUrl,
  qrDataUrl,
}: MasterCertificateCardProps) {
  const [liveQrUrl, setLiveQrUrl] = useState<string>(qrDataUrl || '');

  const displayDate = issuedAt
    ? new Date(issuedAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

  const displayVerifyUrl =
    verificationUrl ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/verify/${credentialCode}`
      : `/verify/${credentialCode}`);

  // Generate real dynamic QR code when unlocked
  useEffect(() => {
    if (isUnlocked && displayVerifyUrl) {
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
    }
  }, [isUnlocked, displayVerifyUrl]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Action Header Strip (Chỉ hiển thị khi đã mở khóa) */}
      {isUnlocked && (
        <div className="p-4 sm:p-5 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-emerald-600" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                  CHỨNG NHẬN ĐÃ MỞ KHÓA (LEVEL 4)
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                Chứng Nhận Năng Lực Số Toàn Diện
              </h2>
            </div>
          </div>

          {/* Nút Tải PDF và Tác vụ */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/api/credentials/${credentialCode}/pdf`}
              download={`NEXA-Certificate-${credentialCode}.pdf`}
              className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Tải chứng chỉ (PDF)
            </a>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              In chứng chỉ
            </button>

            <a
              href={`/verify/${credentialCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              Tra cứu trực tuyến
            </a>
          </div>
        </div>
      )}

      {/* The Bespoke Certificate Canvas (A4 Landscape ~ 1.414 : 1) */}
      <div className="relative overflow-hidden rounded-md border border-slate-300 shadow-xs bg-white select-none print:m-0 print:border-none print:shadow-none">
        {/* Lớp phôi chứng chỉ: Làm mờ nhẹ khi đang khóa, sắc nét khi mở khóa */}
        <div
          className={`relative w-full aspect-[1.414/1] min-h-[520px] sm:min-h-[620px] lg:min-h-[680px] p-8 sm:p-12 lg:p-16 flex flex-col justify-between bg-white text-slate-900 overflow-hidden font-sans transition-all duration-300 ${
            !isUnlocked
              ? 'filter blur-[5px] opacity-35 pointer-events-none select-none'
              : ''
          }`}
        >
          {/* Subtle Outer Border Line */}
          <div className="absolute inset-4 sm:inset-6 lg:inset-8 border border-slate-200 pointer-events-none rounded-xs" />

          {/* TOP-LEFT: NAVY RIBBON BANNER WITH 3D GOLD MEDALLION */}
          <div className="absolute top-0 left-8 sm:left-12 lg:left-16 z-10 flex flex-col items-center">
            <div
              className="w-16 sm:w-20 lg:w-24 h-36 sm:h-44 lg:h-52 bg-[#162A45] shadow-md flex flex-col items-center pt-5 sm:pt-7 relative"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 84%, 0 100%)',
              }}
            >
              {/* Gold Medallion Outer Ridges (3D Metallic Seal) */}
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 lg:w-18 lg:h-18 rounded-full p-1 bg-gradient-to-br from-[#F5D77F] via-[#D4AF37] to-[#996515] shadow-lg flex items-center justify-center">
                <div className="absolute -bottom-3 sm:-bottom-4 left-2 w-3 sm:w-4 h-6 sm:h-8 bg-gradient-to-b from-[#D4AF37] to-[#B38728] rotate-[-20deg] rounded-xs shadow-xs" />
                <div className="absolute -bottom-3 sm:-bottom-4 right-2 w-3 sm:w-4 h-6 sm:h-8 bg-gradient-to-b from-[#D4AF37] to-[#B38728] rotate-[20deg] rounded-xs shadow-xs" />

                <div className="relative z-10 w-full h-full rounded-full bg-gradient-to-tr from-[#B38728] via-[#FDF0CD] to-[#D4AF37] border-2 border-[#FFE89E] flex items-center justify-center shadow-inner">
                  <div className="w-8 h-8 sm:w-11 sm:h-11 lg:w-13 lg:h-13 rounded-full border border-[#996515]/40 flex items-center justify-center bg-gradient-to-b from-[#E6C364] to-[#C49726]">
                    <Award className="w-5 h-5 sm:w-7 sm:h-7 text-[#573E0C]" strokeWidth={2} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TOP-RIGHT: VINTAGE GOLD FLOURISHES / SCROLLWORK */}
          <div className="absolute top-4 sm:top-6 lg:top-8 right-4 sm:right-6 lg:right-8 pointer-events-none opacity-90">
            <svg
              className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M98 2C98 30 75 52 48 52C32 52 20 40 20 25C20 12 30 2 42 2C52 2 60 10 60 20C60 28 54 34 46 34C40 34 36 30 36 24C36 19 40 16 44 16"
                stroke="#C5A059"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M98 2C70 2 48 25 48 52C48 68 60 80 75 80C88 80 98 70 98 58C98 48 90 40 80 40C72 40 66 46 66 54C66 60 70 64 76 64"
                stroke="#D4AF37"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <circle cx="44" cy="16" r="2" fill="#C5A059" />
              <circle cx="76" cy="64" r="2" fill="#D4AF37" />
              <path
                d="M98 2L98 22M98 2L78 2"
                stroke="#D4AF37"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* BOTTOM-LEFT: VINTAGE GOLD FLOURISHES / SCROLLWORK */}
          <div className="absolute bottom-4 sm:bottom-6 lg:bottom-8 left-4 sm:left-6 lg:left-8 pointer-events-none opacity-90">
            <svg
              className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rotate-180"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M98 2C98 30 75 52 48 52C32 52 20 40 20 25C20 12 30 2 42 2C52 2 60 10 60 20C60 28 54 34 46 34C40 34 36 30 36 24C36 19 40 16 44 16"
                stroke="#C5A059"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M98 2C70 2 48 25 48 52C48 68 60 80 75 80C88 80 98 70 98 58C98 48 90 40 80 40C72 40 66 46 66 54C66 60 70 64 76 64"
                stroke="#D4AF37"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <circle cx="44" cy="16" r="2" fill="#C5A059" />
              <circle cx="76" cy="64" r="2" fill="#D4AF37" />
              <path
                d="M98 2L98 22M98 2L78 2"
                stroke="#D4AF37"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* BOTTOM-RIGHT: DYNAMIC LAYERED NAVY & GOLD WAVES */}
          <div className="absolute bottom-0 right-0 pointer-events-none w-52 sm:w-72 lg:w-96 h-40 sm:h-56 lg:h-64 z-0">
            <svg
              className="w-full h-full"
              viewBox="0 0 300 200"
              fill="none"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 200 C80 180, 160 130, 220 70 C250 40, 275 10, 300 0 L300 30 C275 40, 250 70, 220 100 C160 160, 80 200, 0 200 Z"
                fill="#C5A059"
                opacity="0.85"
              />
              <path
                d="M40 200 C120 180, 190 140, 245 80 C275 45, 290 20, 300 10 L300 200 Z"
                fill="#162A45"
              />
            </svg>
          </div>

          {/* CENTER WATERMARK: SUBTLE LAUREL WREATH */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.14] z-0">
            <svg
              className="w-80 h-80 sm:w-96 sm:h-96 lg:w-[480px] lg:h-[480px]"
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

          {/* ===================== CERTIFICATE CONTENT ===================== */}
          <div className="relative z-10 flex flex-col items-center text-center justify-between h-full pt-4 sm:pt-6">
            {/* Header Titles */}
            <div className="space-y-1 sm:space-y-1.5 max-w-2xl mx-auto">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-widest text-[#162A45] uppercase font-sans">
                CERTIFICATE
              </h1>
              <p className="text-[11px] sm:text-xs lg:text-sm font-semibold tracking-[0.28em] text-[#162A45]/85 uppercase">
                OF DIGITAL COMPETENCE MASTERY
              </p>
              <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 uppercase tracking-widest pt-1">
                CHỨNG NHẬN ĐẠT CHUẨN NĂNG LỰC SỐ TOÀN DIỆN
              </div>
            </div>

            {/* Recipient Presentation */}
            <div className="my-auto py-4 sm:py-6 w-full max-w-2xl space-y-2">
              <p className="text-xs sm:text-sm text-slate-500 font-serif italic">
                This Certificate is Proudly Presented to / Chứng nhận này trân trọng trao tặng cho
              </p>

              {/* Dynamic Candidate Name in Script Calligraphy */}
              <div className="py-1">
                <div
                  className="text-3xl sm:text-5xl lg:text-6xl text-[#162A45] font-normal tracking-wide drop-shadow-2xs select-text"
                  style={{
                    fontFamily: 'var(--font-script), "Alex Brush", "Great Vibes", "Playfair Display", cursive, Georgia, serif',
                  }}
                >
                  {candidateName}
                </div>
              </div>

              {/* Elegant Underline Divider */}
              <div className="flex items-center justify-center gap-2 max-w-md mx-auto py-1">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#C5A059] to-[#C5A059]" />
                <div className="w-1.5 h-1.5 rotate-45 bg-[#D4AF37]" />
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#C5A059] to-[#C5A059]" />
              </div>

              {/* Commendation Paragraph */}
              <p className="text-[11px] sm:text-xs lg:text-[13px] text-slate-600 leading-relaxed max-w-xl mx-auto pt-1 font-sans">
                Ghi nhận học viên đã xuất sắc hoàn thành chuẩn năng lực cao nhất{' '}
                <strong className="text-slate-900 font-semibold">Level 4: Highly Advanced</strong>{' '}
                thuộc Khung Tham chiếu Năng lực Số Quốc tế DigComp 3.0 &amp; Nghị định 13/2023/NĐ-CP,
                thể hiện tư duy chiến lược số, làm chủ AI và an toàn thông tin chuyên sâu.
              </p>

              {/* Award Date Pill */}
              <div className="pt-2">
                <span className="inline-block px-3.5 py-1 rounded-full bg-slate-50 border border-slate-200/90 text-[10px] sm:text-xs text-slate-700 font-medium">
                  Cấp ngày {displayDate} &bull; Awarded on {displayDate}
                </span>
              </div>
            </div>

            {/* Bottom Row: QR Code Verification (Left) and Signatures (Right) */}
            <div className="w-full grid grid-cols-12 items-end pt-4 sm:pt-6 border-t border-slate-100/80 gap-4">
              {/* Left Column: QR Code & Verification Data */}
              <div className="col-span-12 sm:col-span-5 flex items-center gap-3 text-left">
                {/* Real Dynamic QR Code Image */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 p-1 bg-white border border-[#C5A059]/60 rounded-xs shadow-xs shrink-0 flex items-center justify-center">
                  {liveQrUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={liveQrUrl}
                      alt="Mã QR tra cứu chứng chỉ"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 animate-pulse rounded-xs" />
                  )}
                </div>

                <div className="space-y-0.5 text-[10px] sm:text-[11px] text-slate-500 font-mono">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-sans">
                    MÃ CHỨNG CHỈ / CREDENTIAL ID
                  </div>
                  <div className="font-bold text-slate-900 tracking-wider">
                    {credentialCode}
                  </div>
                  <div className="text-[9px] text-slate-400 font-sans">
                    Quét mã QR để đối soát trực tuyến
                  </div>
                </div>
              </div>

              {/* Right Column: Two Official Signatures */}
              <div className="col-span-12 sm:col-span-7 flex items-center justify-end gap-8 sm:gap-12 text-center">
                <div className="space-y-1">
                  <div className="h-9 sm:h-12 flex items-end justify-center">
                    <span
                      className="text-lg sm:text-2xl text-slate-700 font-serif italic"
                      style={{
                        fontFamily: 'var(--font-script), cursive, serif',
                      }}
                    >
                      Michael Henson
                    </span>
                  </div>
                  <div className="w-28 sm:w-36 h-[1px] bg-slate-300 mx-auto" />
                  <div className="text-[11px] font-bold text-slate-900 font-sans">
                    TS. Michael Henson
                  </div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider font-sans">
                    HỘI ĐỒNG KHẢO THÍ
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="h-9 sm:h-12 flex items-end justify-center">
                    <span
                      className="text-lg sm:text-2xl text-slate-700 font-serif italic"
                      style={{
                        fontFamily: 'var(--font-script), cursive, serif',
                      }}
                    >
                      Thomas Ridley
                    </span>
                  </div>
                  <div className="w-28 sm:w-36 h-[1px] bg-slate-300 mx-auto" />
                  <div className="text-[11px] font-bold text-slate-900 font-sans">
                    Thomas Ridley
                  </div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider font-sans">
                    GIÁM ĐỐC HỌC THUẬT
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lớp phủ Khóa trung tâm (Chỉ hiển thị khi đang khóa) */}
        {!isUnlocked && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-slate-900/5">
            <div className="p-6 sm:p-8 rounded-lg bg-white/95 border border-slate-200 shadow-md text-center max-w-sm space-y-2.5">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mx-auto">
                <Lock className="w-5 h-5 text-slate-700" strokeWidth={1.75} />
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  CHỨNG CHỈ LEVEL 4 ĐANG KHÓA
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Chứng Nhận Năng Lực Số Toàn Diện
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Chứng chỉ sẽ được mở khóa sắc nét khi bạn hoàn thành cấp độ <strong className="text-slate-800">Level 4: Highly Advanced</strong> (450 điểm).
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
