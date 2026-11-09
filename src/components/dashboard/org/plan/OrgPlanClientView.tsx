'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  CreditCard,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  FileText,
  Cpu,
  ShieldCheck,
  Calendar,
  Sparkles,
} from 'lucide-react';
import type { OrgEntitlementSummary } from '@/features/billing/services/quota-enforcement.service';
import { BusinessRenewalModal } from './BusinessRenewalModal';
import { UpgradeCelebrationModal } from '@/components/dashboard/UpgradeCelebrationModal';

interface OrgPlanClientViewProps {
  organization: {
    id: string;
    name: string;
    slug: string;
    code?: string;
  };
  entitlements: OrgEntitlementSummary;
  memberCount: number;
  assessmentCount: number;
  pendingRenewal?: {
    id: string;
    period_months: number;
    requested_seats?: number;
    created_at: string;
    notes?: string;
  } | null;
  renewalHistory?: Array<{
    id: string;
    period_months: number;
    status: string;
    created_at: string;
    reviewed_at?: string;
  }>;
  ownerName: string;
  isManager: boolean;
}

export function OrgPlanClientView({
  organization,
  entitlements,
  memberCount,
  assessmentCount,
  pendingRenewal: initialPending,
  renewalHistory = [],
  ownerName,
  isManager,
}: OrgPlanClientViewProps) {
  const router = useRouter();
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [pendingRenewal, setPendingRenewal] = useState(initialPending);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

  const isActive = Boolean(entitlements.isActive);
  const isProvisioning = Boolean(entitlements.isProvisioning || entitlements.status === 'PROVISIONING');
  const daysRemaining = entitlements.daysRemaining ?? 0;
  const isExpiring = !isProvisioning && isActive && daysRemaining <= 30;

  const maxSeats = entitlements.maxSeats || 50;
  const remainingSeats = Math.max(0, maxSeats - memberCount);
  const seatPercent = Math.min(100, Math.round((memberCount / maxSeats) * 100));

  const maxAssessments = entitlements.maxAssessments || 100;
  const remainingAssessments = Math.max(0, maxAssessments - assessmentCount);
  const assessmentPercent = Math.min(100, Math.round((assessmentCount / maxAssessments) * 100));

  const creditsGranted = entitlements.aiCreditsGranted || 0;
  const creditsUsed = entitlements.aiCreditsUsed || 0;
  const creditsRemaining = entitlements.remainingCredits || 0;
  const creditPercent = creditsGranted > 0 ? Math.min(100, Math.round((creditsUsed / creditsGranted) * 100)) : 0;

  const formattedExpiresAt = entitlements.expiresAt
    ? new Date(entitlements.expiresAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'Chưa xác định';

  const formattedStartsAt = entitlements.startsAt
    ? new Date(entitlements.startsAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'Chưa xác định';

  const handleRenewalSuccess = () => {
    setPendingRenewal({
      id: 'temp',
      period_months: 12,
      created_at: new Date().toISOString(),
    });
    setShowCelebrationModal(true);
    router.refresh();
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Gói Business
          </h1>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden p-6 rounded-lg border border-slate-200 dark:border-zinc-800 bg-[#111726] text-white shadow-sm">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/dashboard/nexa-07-goi-su-dung.png"
            alt="NEXA Business Plan"
            fill
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="object-cover opacity-20 object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d1424] via-[#0d1424]/90 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div>
              {isActive ? (
                isExpiring ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Sắp hết hạn
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Gói đang hoạt động
                  </span>
                )
              ) : isProvisioning ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  <Clock className="w-3 h-3 text-blue-400" />
                  Đang hoàn tất kích hoạt
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  Hết hạn
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {isProvisioning ? 'Đang cấp gói Business' : entitlements.planName || 'Gói Business'}
            </h2>
            <p className="text-xs text-slate-300">
              {isProvisioning
                ? 'NEXA đang chuẩn bị quyền lợi dành cho tổ chức. Hạn mức và ngày hết hạn sẽ tự xuất hiện ngay sau khi hoàn tất.'
                : 'Không gian của bạn đang có đầy đủ quyền lợi của gói Business. Không phụ thuộc vào gói cá nhân.'}
            </p>

            {/* Metadata strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Kích hoạt từ</span>
                <strong className="text-white font-mono tabular-nums">
                  {formattedStartsAt}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Hạn dùng đến</span>
                <strong className="text-white font-mono tabular-nums">
                  {formattedExpiresAt}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Quản trị viên đại diện</span>
                <strong className="text-white truncate block">
                  {ownerName}
                </strong>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="relative z-10 flex flex-col items-start lg:items-end justify-center gap-2.5 shrink-0 pt-4 lg:pt-0">
            {isActive && (
              <span className="text-xs font-medium text-slate-300">
                {isExpiring ? (
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Gói sẽ hết hạn sau {daysRemaining} ngày
                  </span>
                ) : (
                  <span>Còn <strong className="font-mono text-white">{daysRemaining}</strong> ngày trong kỳ hiện tại</span>
                )}
              </span>
            )}

            {isManager && (
              <>
                {pendingRenewal ? (
                  <button
                    disabled
                    className="h-9 px-4 rounded-md border border-amber-400/40 bg-amber-500/20 text-amber-300 text-xs font-semibold flex items-center gap-2 cursor-not-allowed"
                  >
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    <span>Đang chờ gia hạn</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsRenewOpen(true)}
                    className="h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Gia hạn gói</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Quyền lợi trong gói */}
        <div className="p-6 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs space-y-5">
          <div className="pb-3">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Quyền lợi trong gói
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Cập nhật từ dữ liệu cấp phát cho tổ chức
            </p>
          </div>

          <div className="space-y-4">
            {/* 1. Ghế thành viên */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  Ghế thành viên
                </span>
                <span className="font-mono tabular-nums text-slate-600 dark:text-neutral-400">
                  <strong className="text-neutral-900 dark:text-neutral-100">{memberCount}</strong> / {maxSeats}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    seatPercent > 90 ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${seatPercent}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                {remainingSeats > 0 ? (
                  <span>Còn <strong className="text-blue-600 dark:text-blue-400 font-mono">{remainingSeats}</strong> ghế có thể mời thêm</span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">Đã sử dụng hết số ghế được cấp</span>
                )}
              </div>
            </div>

            {/* 2. Đề đánh giá (Không giới hạn cho tổ chức B2B) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  Số đề đánh giá
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono tabular-nums text-slate-600 dark:text-neutral-400">
                    Đã tạo: <strong className="text-neutral-900 dark:text-neutral-100">{assessmentCount}</strong> đề
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
                    Không giới hạn
                  </span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-emerald-100 dark:bg-emerald-950/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300 w-full"
                />
              </div>
              <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                Gói Business không giới hạn số lượng đề khảo thí năng lực số nội bộ
              </div>
            </div>

            {/* 3. AI credits */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-blue-600" />
                  AI credits
                </span>
                <span className="font-mono tabular-nums text-slate-600 dark:text-neutral-400">
                  <strong className="text-neutral-900 dark:text-neutral-100">{creditsUsed.toLocaleString('vi-VN')}</strong> / {creditsGranted.toLocaleString('vi-VN')}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    creditPercent > 90 ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${creditPercent}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                <strong className="text-blue-600 dark:text-blue-400 font-mono">{creditsRemaining.toLocaleString('vi-VN')}</strong> credits khả dụng phục vụ chấm tự luận & khảo thí
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Lịch sử dịch vụ */}
        <div className="p-6 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs space-y-5 flex flex-col justify-between">
          <div>
            <div className="pb-3">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Lịch sử dịch vụ
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Những thay đổi đối với gói của tổ chức
              </p>
            </div>

            <div className="space-y-3.5 pt-3">
              {/* Event 1: Kích hoạt */}
              <div className="flex items-start gap-3 text-xs">
                <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-neutral-900 dark:text-neutral-100 font-medium">
                    Gói {entitlements.planName || 'Business'} đã được kích hoạt
                  </strong>
                  <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono tabular-nums">
                    {formattedStartsAt} &bull; Do NEXA Admin thực hiện
                  </span>
                </div>
              </div>

              {/* Event 2: Nếu có pending request */}
              {pendingRenewal && (
                <div className="flex items-start gap-3 text-xs p-2.5 rounded-md bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                  <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <strong className="block text-amber-900 dark:text-amber-200 font-semibold">
                      Yêu cầu gia hạn đã gửi ({pendingRenewal.period_months} tháng)
                    </strong>
                    <span className="text-[11px] text-amber-700 dark:text-amber-400 font-mono tabular-nums">
                      {new Date(pendingRenewal.created_at).toLocaleDateString('vi-VN')} &bull; Đang chờ NEXA xác nhận
                    </span>
                  </div>
                </div>
              )}

              {/* Past history */}
              {renewalHistory
                .filter((r) => r.status === 'APPROVED')
                .map((r) => (
                  <div key={r.id} className="flex items-start gap-3 text-xs">
                    <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="block text-neutral-900 dark:text-neutral-100 font-medium">
                        Đã gia hạn thành công {r.period_months} tháng
                      </strong>
                      <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono tabular-nums">
                        {r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString('vi-VN') : 'Chờ duyệt'} &bull; Đã phê duyệt
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Bottom notice */}
          <div className="p-3.5 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
            <strong className="text-neutral-800 dark:text-zinc-200 block mb-0.5">Bảo toàn dữ liệu:</strong>
            Bạn không cần tạo lại tổ chức khi gia hạn. Các lớp học, ngân hàng đề thi, bài đã nộp và báo cáo 5 miền được giữ nguyên liên tục.
          </div>
        </div>
      </div>

      {/* Modal Gia hạn */}
      <BusinessRenewalModal
        isOpen={isRenewOpen}
        onClose={() => setIsRenewOpen(false)}
        organizationId={organization.id}
        organizationName={organization.name}
        planName={entitlements.planName || 'Gói Business'}
        currentExpiresAt={entitlements.expiresAt}
        currentSeats={maxSeats}
        onSuccess={handleRenewalSuccess}
      />

      {/* Modal Vinh danh & Chúc mừng nâng cấp / kích hoạt gói Business */}
      <UpgradeCelebrationModal
        isOpen={showCelebrationModal}
        onClose={() => setShowCelebrationModal(false)}
        type="ORG_BUSINESS"
        planName={entitlements.planName || 'NEXA Business B2B'}
        targetName={organization.name}
        seats={maxSeats}
        credits={creditsGranted}
        primaryActionUrl={`/org/${organization.slug}`}
        primaryActionLabel="Vào không gian tổ chức"
      />
    </div>
  );
}
