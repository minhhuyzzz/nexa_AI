'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
  Building2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { BusinessRenewalModal } from './plan/BusinessRenewalModal';

interface OrgSuspendedViewProps {
  orgId: string;
  orgName: string;
  orgSlug: string;
  userRole: string;
  userEmail?: string;
}

export function OrgSuspendedView({
  orgId,
  orgName,
  orgSlug,
  userRole,
  userEmail,
}: OrgSuspendedViewProps) {
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [renewalSubmitted, setRenewalSubmitted] = useState(false);

  const isManager =
    userRole === 'ORG_OWNER' ||
    userRole === 'ORG_ADMIN' ||
    userRole === 'Chủ sở hữu' ||
    userRole === 'Quản trị viên';

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-white dark:bg-[#0A0A0B] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/personal/dashboard"
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về không gian cá nhân</span>
            </Link>
            <span className="text-slate-300 dark:text-zinc-700">|</span>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-zinc-300">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="font-semibold">{orgName}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                Tạm ngưng dịch vụ
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-neutral-400">
            Tài khoản: <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">{userEmail || '—'}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 flex flex-col justify-center">
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#111114] p-8 sm:p-10 shadow-xs space-y-8">
          {/* Status Badge & Icon */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/60 dark:border-rose-900/60">
              <Clock className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                Hợp đồng đang tạm ngưng / Cần gia hạn
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                Không gian làm việc của {orgName} đang tạm dừng
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 mt-2 leading-relaxed">
                Tổ chức hiện đang tạm ngưng hoạt động do hợp đồng dịch vụ Business đã hết hạn hoặc đang trong giai đoạn chuyển tiếp. Các chức năng tạo đợt khảo thí và quản lý thành viên tạm thời bị khóa.
              </p>
            </div>
          </div>

          {/* Data Preservation Reassurance (Chuẩn AGENTS.md: Bảo toàn dữ liệu 100%) */}
          <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 p-4 sm:p-5 flex items-start gap-3.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" strokeWidth={1.75} />
            <div className="text-xs text-neutral-800 dark:text-zinc-200 space-y-1">
              <div className="font-semibold text-emerald-900 dark:text-emerald-300">
                Toàn bộ dữ liệu của tổ chức được bảo toàn an toàn tuyệt đối
              </div>
              <p className="text-slate-600 dark:text-neutral-400 leading-relaxed">
                NEXA cam kết không xóa lịch sử thi, kết quả đánh giá 5 miền năng lực số, ngân hàng đề thi và danh sách học viên của đơn vị. Mọi dữ liệu sẽ được khôi phục nguyên vẹn ngay khi tổ chức được gia hạn hoặc kích hoạt lại.
              </p>
            </div>
          </div>

          {/* Actions depending on user role */}
          {renewalSubmitted ? (
            <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/40 p-5 text-center space-y-2">
              <div className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Đã gửi yêu cầu gia hạn tới Ban điều hành NEXA!</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-neutral-400">
                Yêu cầu của bạn đang nằm trong hàng đợi duyệt gia hạn. Quản trị viên nền tảng sẽ xử lý và kích hoạt lại không gian làm việc trong thời gian sớm nhất.
              </p>
            </div>
          ) : isManager ? (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-500 dark:text-neutral-400">
                  Bạn đang đăng nhập với quyền: <strong className="text-neutral-900 dark:text-neutral-100">{userRole}</strong>
                </div>

                <div className="flex items-center gap-2.5">
                  <Link
                    href="/personal/dashboard"
                    className="flex-1 sm:flex-initial text-center px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-semibold text-neutral-800 dark:text-zinc-200 transition-colors"
                  >
                    Về trang cá nhân
                  </Link>

                  <button
                    onClick={() => setIsRenewalModalOpen(true)}
                    className="flex-1 sm:flex-initial text-center px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Gửi yêu cầu gia hạn dịch vụ</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                  Bạn là thành viên của tổ chức này. Vui lòng liên hệ <strong>Chủ sở hữu hoặc Quản trị viên</strong> của đơn vị để tiến hành thủ tục gia hạn hợp đồng.
                </div>

                <Link
                  href="/personal/dashboard"
                  className="text-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shrink-0"
                >
                  Về trang cá nhân
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 text-center text-xs text-slate-400 dark:text-neutral-500">
        NEXA AI · Nền tảng đánh giá và phát triển năng lực số chuẩn 5 miền
      </footer>

      {/* Business Renewal Modal */}
      <BusinessRenewalModal
        isOpen={isRenewalModalOpen}
        onClose={() => setIsRenewalModalOpen(false)}
        organizationId={orgId}
        organizationName={orgName}
        onSuccess={() => {
          setRenewalSubmitted(true);
        }}
      />
    </div>
  );
}
