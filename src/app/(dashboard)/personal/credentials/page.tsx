'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { MasterCertificateCard } from '@/components/dashboard/personal/MasterCertificateCard';

interface CredentialData {
  candidateName: string;
  points: number;
  requiredPoints: number;
  pointsNeeded: number;
  isUnlocked: boolean;
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
  const isUnlocked = data?.isUnlocked ?? points >= 450;
  const targetPoints = 450;
  const pointsRemaining = Math.max(0, targetPoints - points);
  const progressPercent = Math.min(100, Math.round((points / targetPoints) * 100));

  const credentialCode =
    data?.masterCredential?.credential_code ||
    (isUnlocked ? 'NX-2026-MASTER-8F3A2B' : 'NX-2026-MASTER-LOCKED');
  const issuedAt = data?.masterCredential?.issued_at;
  const qrDataUrl = data?.masterCredential?.qr_data;
  const verificationUrl = data?.masterCredential?.id
    ? `/verify/${data.masterCredential.id}`
    : `/verify/${credentialCode}`;

  return (
    <div className="space-y-5">
      {/* 1. Header Banner */}
      <div className="p-5 sm:p-6 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              HỒ SƠ CHỨNG CHỈ
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Chứng Chỉ Năng Lực Số
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cấp độ mở khóa: <strong className="text-slate-800">Level 4: Highly Advanced (450 điểm)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3.5 py-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`}
              strokeWidth={1.75}
            />
            Làm mới
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      {/* 2. Thanh tiến độ tách riêng ở trên */}
      <div className="p-4 sm:p-5 rounded-md bg-white border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 font-medium gap-1">
          <span>
            Tiến độ mở khóa: <strong className="text-slate-900 font-mono">{points} / {targetPoints} điểm</strong> ({progressPercent}%)
          </span>
          <span className={isUnlocked ? 'font-semibold text-emerald-700' : 'font-semibold text-sky-700'}>
            {isUnlocked ? 'Đã đủ điều kiện mở khóa Level 4' : `Còn thiếu ${pointsRemaining} điểm`}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isUnlocked ? 'bg-emerald-600' : 'bg-sky-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 3. Phôi chứng chỉ (Mờ khi khóa, Rõ khi mở khóa) */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-md border border-slate-200 text-xs text-slate-500">
          <RefreshCw className="w-6 h-6 text-sky-600 animate-spin mx-auto mb-2" strokeWidth={1.75} />
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
        />
      )}
    </div>
  );
}
