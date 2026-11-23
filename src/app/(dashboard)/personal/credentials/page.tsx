'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, HelpCircle, Eye, Award } from 'lucide-react';
import { MasterCertificateCard } from '@/components/dashboard/personal/MasterCertificateCard';
import { CertificateCriteriaModal } from '@/components/credentials/CertificateCriteriaModal';
import { SampleCertificateModal } from '@/components/credentials/SampleCertificateModal';

interface CredentialData {
  candidateName: string;
  points: number;
  requiredPoints: number;
  pointsNeeded: number;
  isUnlocked: boolean;
  isRoadmapCompleted?: boolean;
  completedSteps?: number;
  totalSteps?: number;
  masterCredential?: {
    id: string;
    credential_code: string;
    issued_at: string;
    qr_data?: string;
  } | null;
}

export default function LearnerCredentialsPage() {
  const [data, setData] = useState<CredentialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCriteriaOpen, setIsCriteriaOpen] = useState(false);
  const [isSampleOpen, setIsSampleOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/credentials/my');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setError('Không thể tải thông tin chứng chỉ vào lúc này');
      }
    } catch {
      setError('Lỗi kết nối khi tải chứng chỉ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const candidateName = data?.candidateName || 'Học Viên Nexa';
  const points = data?.points ?? 0;
  const targetPoints = 10000;
  const isUnlocked = false; // Luôn khóa mốc 10.000 điểm theo chính sách nền tảng

  const credentialCode = data?.masterCredential?.credential_code || undefined;
  const issuedAt = data?.masterCredential?.issued_at;
  const qrDataUrl = data?.masterCredential?.qr_data;
  const verificationUrl = data?.masterCredential?.id
    ? `/verify/${data.masterCredential.id}`
    : credentialCode
    ? `/verify/${credentialCode}`
    : undefined;

  return (
    <div className="space-y-6">
      {/* 1. Header Tinh Gọn & Đẳng Cấp */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Chứng chỉ số
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-[11px] font-semibold text-slate-600 dark:text-neutral-400">
              Vô thời hạn
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400">
            Văn bằng chứng nhận năng lực số chính thức được bảo chứng bởi Hội đồng Khảo thí NEXA AI
          </p>
        </div>

        {/* Action Buttons: Xem điều kiện, Xem phôi mẫu, Làm mới */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsCriteriaOpen(true)}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-neutral-800 dark:text-zinc-200 text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Xem các tiêu chí thẩm định để nhận chứng chỉ"
          >
            <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
            <span>Điều kiện cấp bằng</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSampleOpen(true)}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" strokeWidth={1.75} />
            <span>Xem trước phôi mẫu</span>
          </button>

          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="min-h-[40px] px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-neutral-600 dark:text-zinc-400 text-xs font-medium inline-flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            title="Tải lại dữ liệu"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`}
              strokeWidth={1.75}
            />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* 2. Khung Phôi Chứng Chỉ Thu Nhỏ Tinh Tế (Đã bỏ thẻ tiến độ điểm số) */}
      {loading ? (
        <div className="p-16 text-center bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 text-xs text-slate-500 dark:text-neutral-400">
          <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-2" strokeWidth={1.75} />
          Đang tải dữ liệu chứng nhận...
        </div>
      ) : (
        <MasterCertificateCard
          candidateName={candidateName}
          points={points}
          isUnlocked={isUnlocked}
          credentialCode={credentialCode}
          issuedAt={issuedAt}
          verificationUrl={verificationUrl}
          qrDataUrl={qrDataUrl}
          onOpenSampleModal={() => setIsSampleOpen(true)}
          onOpenCriteriaModal={() => setIsCriteriaOpen(true)}
        />
      )}

      {/* 3. Modals */}
      <CertificateCriteriaModal
        isOpen={isCriteriaOpen}
        onClose={() => setIsCriteriaOpen(false)}
        currentPoints={points}
        requiredPoints={targetPoints}
      />

      <SampleCertificateModal
        isOpen={isSampleOpen}
        onClose={() => setIsSampleOpen(false)}
      />
    </div>
  );
}
