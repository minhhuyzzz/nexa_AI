'use client';

import React, { useState } from 'react';
import {
  Lock,
  Award,
  Download,
  ExternalLink,
  Printer,
  Eye,
  HelpCircle,
} from 'lucide-react';
import { CertificateCanvas } from '@/components/credentials/CertificateCanvas';
import { SampleCertificateModal } from '@/components/credentials/SampleCertificateModal';
import { CertificateCriteriaModal } from '@/components/credentials/CertificateCriteriaModal';

interface MasterCertificateCardProps {
  candidateName: string;
  points: number;
  isUnlocked: boolean;
  credentialCode?: string;
  issuedAt?: string;
  verificationUrl?: string;
  qrDataUrl?: string;
  onOpenSampleModal?: () => void;
  onOpenCriteriaModal?: () => void;
}

export function MasterCertificateCard({
  candidateName,
  points,
  isUnlocked,
  credentialCode,
  issuedAt,
  verificationUrl,
  qrDataUrl,
  onOpenSampleModal,
  onOpenCriteriaModal,
}: MasterCertificateCardProps) {
  const [internalSampleOpen, setInternalSampleOpen] = useState(false);
  const [internalCriteriaOpen, setInternalCriteriaOpen] = useState(false);

  const handleOpenSample = onOpenSampleModal || (() => setInternalSampleOpen(true));
  const handleOpenCriteria = onOpenCriteriaModal || (() => setInternalCriteriaOpen(true));

  const displayVerifyUrl =
    verificationUrl ||
    (credentialCode && typeof window !== 'undefined'
      ? `${window.location.origin}/verify/${credentialCode}`
      : credentialCode
      ? `/verify/${credentialCode}`
      : '');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Action Header Strip (Khi đã mở khóa) */}
      {isUnlocked && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/90 dark:border-zinc-800/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50 uppercase tracking-wider">
                  CHỨNG NHẬN ĐÃ CẤP PHÁT
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                Chứng Nhận Năng Lực Số Toàn Diện
              </h2>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {credentialCode && (
              <a
                href={`/api/credentials/${credentialCode}/pdf`}
                download={`NEXA-Certificate-${credentialCode}.pdf`}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải bản PDF gốc</span>
              </a>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-neutral-700 dark:text-neutral-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>In văn bằng</span>
            </button>

            {credentialCode && (
              <a
                href={`/verify/${credentialCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-neutral-700 dark:text-neutral-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Đối soát trực tuyến</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Thu Nhỏ Phôi Chứng Chỉ Vừa Vặn & Tinh Tế */}
      <div className="w-full relative">
        {/* Certificate Canvas Layer */}
        <div
          className={`transition-all duration-300 ${
            !isUnlocked
              ? 'filter blur-[5px] opacity-35 pointer-events-none select-none'
              : ''
          }`}
        >
          <CertificateCanvas
            candidateName={candidateName}
            credentialCode={credentialCode}
            issuedAt={issuedAt}
            verificationUrl={displayVerifyUrl}
            qrDataUrl={qrDataUrl}
            isSample={false}
          />
        </div>

          {/* Central Lock Minimalist Badge (Chỉ hiện khi chưa mở khóa) */}
          {!isUnlocked && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 pointer-events-none">
              <button
                type="button"
                onClick={handleOpenSample}
                className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-white/95 dark:bg-zinc-950/95 border border-slate-200/90 dark:border-zinc-800 shadow-lg backdrop-blur-md pointer-events-auto cursor-pointer hover:scale-105 hover:border-blue-500/80 transition-all duration-200"
                title="Văn bằng đang tạm khóa. Nhấn để xem trước phôi mẫu chuẩn."
                aria-label="Văn bằng đang tạm khóa. Nhấn để xem trước phôi mẫu chuẩn."
              >
                <div className="w-11 h-11 rounded-full bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <Lock className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 dark:text-neutral-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 mt-1.5 transition-colors">
                  Xem phôi mẫu
                </span>
              </button>
            </div>
          )}
        </div>

      {/* Internal Modals (dự phòng khi không truyền props) */}
      {!onOpenSampleModal && (
        <SampleCertificateModal
          isOpen={internalSampleOpen}
          onClose={() => setInternalSampleOpen(false)}
        />
      )}

      {!onOpenCriteriaModal && (
        <CertificateCriteriaModal
          isOpen={internalCriteriaOpen}
          onClose={() => setInternalCriteriaOpen(false)}
          currentPoints={points}
          requiredPoints={10000}
        />
      )}
    </div>
  );
}
