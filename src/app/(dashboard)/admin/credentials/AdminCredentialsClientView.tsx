'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Search,
  ExternalLink,
  RotateCcw,
  ShieldAlert,
  Loader2,
  X,
  FileCheck2,
  Stamp,
  Sliders,
} from 'lucide-react';
import { CertificateTemplateSettings } from '@/components/credentials/CertificateTemplateSettings';

export interface CredentialItem {
  id: string;
  credentialCode: string;
  candidateName: string;
  email: string;
  assessmentTitle: string;
  scorePercentage: number | null;
  totalScore: number | null;
  competencyLevel: string;
  contentSha256: string;
  isRevoked: boolean;
  revokedReason: string | null;
  issuedAt: string;
  updatedAt: string;
}

export interface KPIStats {
  totalIssued: number;
  validCount: number;
  revokedCount: number;
}

interface Props {
  initialCredentials: CredentialItem[];
  initialKpi: KPIStats;
}

export function AdminCredentialsClientView({ initialCredentials, initialKpi }: Props) {
  const [credentials, setCredentials] = useState<CredentialItem[]>(initialCredentials);
  const [kpi, setKpi] = useState<KPIStats>(initialKpi);
  const [activeTab, setActiveTab] = useState<'ISSUED' | 'TEMPLATE'>('ISSUED');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'REVOKED'>('ALL');

  // Modal State for Revocation
  const [selectedCredential, setSelectedCredential] = useState<CredentialItem | null>(null);
  const [revokedReason, setRevokedReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredList = useMemo(() => {
    return credentials.filter((c) => {
      if (statusFilter === 'VALID' && c.isRevoked) return false;
      if (statusFilter === 'REVOKED' && !c.isRevoked) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchCode = c.credentialCode.toLowerCase().includes(q);
        const matchName = c.candidateName.toLowerCase().includes(q);
        const matchEmail = c.email.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchEmail) return false;
      }
      return true;
    });
  }, [credentials, statusFilter, search]);

  const handleRevokeSubmit = async (isRevoking: boolean) => {
    if (!selectedCredential) return;
    setIsSubmittingAction(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/admin/credentials/${selectedCredential.id}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isRevoked: isRevoking,
          revokedReason: isRevoking ? revokedReason.trim() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi cập nhật chứng chỉ');
      }

      setCredentials((prev) =>
        prev.map((item) => {
          if (item.id === selectedCredential.id) {
            return {
              ...item,
              isRevoked: isRevoking,
              revokedReason: isRevoking ? revokedReason.trim() : null,
            };
          }
          return item;
        })
      );

      setKpi((prev) => ({
        ...prev,
        validCount: isRevoking ? prev.validCount - 1 : prev.validCount + 1,
        revokedCount: isRevoking ? prev.revokedCount + 1 : prev.revokedCount - 1,
      }));

      setSelectedCredential(null);
      setRevokedReason('');
    } catch (err: any) {
      setActionError(err.message || 'Lỗi thao tác');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header: Tinh gọn, hiện đại, chuẩn SaaS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Chứng chỉ số
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Quản lý chứng nhận năng lực số.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/verify"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black text-xs font-medium text-slate-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Trang tra cứu công khai</span>
          </Link>
        </div>
      </div>

      {/* Tab Navigation: Danh sách đã cấp & Cấu hình phôi */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('ISSUED')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'ISSUED'
              ? 'bg-white dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100 shadow-2xs'
              : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
          <span>Danh sách chứng chỉ đã cấp</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-[10px] font-mono">
            {kpi.totalIssued}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('TEMPLATE')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'TEMPLATE'
              ? 'bg-white dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100 shadow-2xs'
              : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <Stamp className="w-3.5 h-3.5 text-red-600 dark:text-red-400" strokeWidth={1.75} />
          <span>Cấu hình phôi & Mộc đỏ</span>
        </button>
      </div>

      {activeTab === 'TEMPLATE' ? (
        <CertificateTemplateSettings />
      ) : (
        <>
          {/* KPI Bento Grid: Phong cách Linear/Vercel tối giản */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-black border border-slate-200/90 dark:border-zinc-800/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">
              Tổng chứng chỉ đã cấp
            </span>
            <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Award className="w-3.5 h-3.5" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums text-neutral-900 dark:text-neutral-100">
              {kpi.totalIssued}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-neutral-500 block mt-1">
              Đạt chuẩn đánh giá từ 70% trở lên
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-black border border-slate-200/90 dark:border-zinc-800/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">
              Đang có hiệu lực
            </span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
              {kpi.validCount}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-neutral-500 block mt-1">
              Đã ký số và sẵn sàng xác thực QR
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-black border border-slate-200/90 dark:border-zinc-800/90 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">
              Đã thu hồi
            </span>
            <div className="w-7 h-7 rounded-md bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-3">
            <span
              className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums ${
                kpi.revokedCount > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-neutral-400 dark:text-neutral-500'
              }`}
            >
              {kpi.revokedCount}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-neutral-500 block mt-1">
              Vô hiệu hóa do vi phạm quy chế
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Tinh chỉnh liền mạch, không khung viền thô */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã, học viên hoặc email..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 dark:focus:border-blue-400 transition-colors shadow-2xs"
          />
        </div>

        {/* Segmented Filter Control */}
        <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-zinc-900 rounded-lg text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-md text-xs transition-all ${
              statusFilter === 'ALL'
                ? 'bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 font-semibold shadow-2xs'
                : 'text-slate-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 font-medium'
            }`}
          >
            Tất cả <span className="font-mono text-[10px] ml-0.5 opacity-70">({kpi.totalIssued})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('VALID')}
            className={`px-3 py-1 rounded-md text-xs transition-all ${
              statusFilter === 'VALID'
                ? 'bg-white dark:bg-black text-emerald-600 dark:text-emerald-400 font-semibold shadow-2xs'
                : 'text-slate-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 font-medium'
            }`}
          >
            Có hiệu lực <span className="font-mono text-[10px] ml-0.5 opacity-70">({kpi.validCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('REVOKED')}
            className={`px-3 py-1 rounded-md text-xs transition-all ${
              statusFilter === 'REVOKED'
                ? 'bg-white dark:bg-black text-red-600 dark:text-red-400 font-semibold shadow-2xs'
                : 'text-slate-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 font-medium'
            }`}
          >
            Đã thu hồi <span className="font-mono text-[10px] ml-0.5 opacity-70">({kpi.revokedCount})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: Bảng danh sách hoặc Empty State tinh gọn */}
      <div className="bg-white dark:bg-black border border-slate-200/90 dark:border-zinc-800/90 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              Danh sách chứng nhận
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-neutral-400">
              {filteredList.length}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-mono">
            Tra cứu thời gian thực
          </span>
        </div>

        {filteredList.length === 0 ? (
          <div className="py-20 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-zinc-900/80 text-slate-400 dark:text-neutral-500 flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Chưa có chứng chỉ nào
            </h3>
            <p className="text-xs text-slate-400 dark:text-neutral-500 max-w-sm mx-auto mt-1">
              Chứng chỉ sẽ tự động được cấp và lưu trữ khi học viên hoàn thành bài khảo thí đạt từ 70% trở lên.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 dark:bg-zinc-900/60 text-slate-500 dark:text-neutral-400 font-medium text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Mã chứng chỉ</th>
                  <th className="py-2.5 px-4 font-medium">Học viên</th>
                  <th className="py-2.5 px-4 font-medium">Khảo thí</th>
                  <th className="py-2.5 px-4 font-medium text-center">Xếp loại</th>
                  <th className="py-2.5 px-4 font-medium text-center">Ngày cấp</th>
                  <th className="py-2.5 px-4 font-medium text-center">Trạng thái</th>
                  <th className="py-2.5 px-4 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 dark:text-zinc-300">
                {filteredList.map((cred) => (
                  <tr
                    key={cred.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    {/* Mã chứng chỉ */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {cred.credentialCode}
                      </span>
                      {cred.contentSha256 && (
                        <span
                          title={cred.contentSha256}
                          className="block text-[10px] text-slate-400 font-mono truncate max-w-[110px] mt-0.5"
                        >
                          {cred.contentSha256.slice(0, 12)}...
                        </span>
                      )}
                    </td>

                    {/* Học viên */}
                    <td className="py-3 px-4">
                      <span className="font-medium text-neutral-900 dark:text-neutral-100 block">
                        {cred.candidateName}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-mono">
                        {cred.email}
                      </span>
                    </td>

                    {/* Khảo thí */}
                    <td className="py-3 px-4 max-w-[220px]">
                      <span className="line-clamp-1 font-normal text-neutral-800 dark:text-neutral-200">
                        {cred.assessmentTitle}
                      </span>
                    </td>

                    {/* Xếp loại */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-zinc-900 text-neutral-800 dark:text-neutral-200">
                        {cred.competencyLevel}
                      </span>
                      {cred.scorePercentage !== null && (
                        <span className="block text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {cred.scorePercentage}%
                        </span>
                      )}
                    </td>

                    {/* Ngày cấp */}
                    <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-500 dark:text-neutral-400">
                      {cred.issuedAt
                        ? new Date(cred.issuedAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        : '--'}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3 px-4 text-center">
                      {cred.isRevoked ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200/80 dark:border-red-900/60">
                            <AlertTriangle className="w-2.5 h-2.5" strokeWidth={2} />
                            Đã thu hồi
                          </span>
                          {cred.revokedReason && (
                            <span
                              title={cred.revokedReason}
                              className="block text-[10px] text-red-500 truncate max-w-[130px] mx-auto mt-0.5"
                            >
                              {cred.revokedReason}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/60">
                          <CheckCircle2 className="w-2.5 h-2.5" strokeWidth={2} />
                          Có hiệu lực
                        </span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/verify/${cred.credentialCode || cred.id}`}
                          target="_blank"
                          title="Trang xác thực QR công khai"
                          className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </Link>

                        {cred.isRevoked ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCredential(cred);
                              setRevokedReason('');
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-800 dark:text-neutral-200 rounded-md transition-colors inline-flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" strokeWidth={1.75} />
                            <span>Khôi phục</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCredential(cred);
                              setRevokedReason('');
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/70 text-red-600 dark:text-red-400 rounded-md border border-red-200/60 dark:border-red-900/40 transition-colors"
                          >
                            Thu hồi
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {/* Revoke / Restore Modal */}
      {selectedCredential && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    selectedCredential.isRevoked
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-600'
                      : 'bg-red-50 dark:bg-red-950 text-red-600'
                  }`}
                >
                  {selectedCredential.isRevoked ? (
                    <RotateCcw className="w-4 h-4" strokeWidth={1.75} />
                  ) : (
                    <AlertTriangle className="w-4 h-4" strokeWidth={1.75} />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {selectedCredential.isRevoked ? 'Khôi phục chứng chỉ' : 'Thu hồi chứng chỉ'}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {selectedCredential.credentialCode}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCredential(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-zinc-300 space-y-1.5 bg-slate-50 dark:bg-zinc-900 p-3.5 rounded-lg border border-slate-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Học viên:</span>
                <strong className="text-neutral-900 dark:text-neutral-100">{selectedCredential.candidateName}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Khảo thí:</span>
                <span className="truncate max-w-[200px] text-right">{selectedCredential.assessmentTitle}</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-400">Kết quả:</span>
                <span>{selectedCredential.competencyLevel} ({selectedCredential.scorePercentage}%)</span>
              </div>
            </div>

            {!selectedCredential.isRevoked && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-800 dark:text-neutral-200 block">
                  Lý do thu hồi chứng nhận <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={revokedReason}
                  onChange={(e) => setRevokedReason(e.target.value)}
                  placeholder="Nhập lý do thu hồi (ví dụ: Vi phạm quy chế thi cử sau phúc khảo...)"
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-hidden focus:border-red-600 transition-colors"
                />
              </div>
            )}

            {actionError && (
              <div className="p-2.5 bg-red-50 dark:bg-red-950/60 text-red-600 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedCredential(null)}
                disabled={isSubmittingAction}
                className="px-3.5 py-1.5 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              {selectedCredential.isRevoked ? (
                <button
                  type="button"
                  onClick={() => handleRevokeSubmit(false)}
                  disabled={isSubmittingAction}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
                >
                  {isSubmittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Xác nhận khôi phục</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleRevokeSubmit(true)}
                  disabled={isSubmittingAction || !revokedReason.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
                >
                  {isSubmittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Xác nhận thu hồi</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
