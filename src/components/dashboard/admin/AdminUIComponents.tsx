import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, Info, AlertTriangle, ChevronRight, LucideIcon } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* 1. Admin KPI Card (Theo chuẩn 4 thẻ đỉnh trang trong Ảnh 1, 2, 4, 6, 9...)  */
/* -------------------------------------------------------------------------- */

interface AdminKpiCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  timeframe?: string;
  icon: LucideIcon;
  badge?: React.ReactNode;
}

export function AdminKpiCard({
  label,
  value,
  change,
  changeType = 'positive',
  timeframe = 'So với 30 ngày trước',
  icon: Icon,
  badge,
}: AdminKpiCardProps) {
  const isPositive = changeType === 'positive';
  const isNegative = changeType === 'negative';

  return (
    <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-zinc-700 transition-all">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-850 text-slate-700 dark:text-zinc-300 border border-slate-100 dark:border-zinc-800">
            <Icon className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">
            {label}
          </span>
        </div>

        {badge ? (
          badge
        ) : change ? (
          <span
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold tabular-nums ${
              isPositive
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                : isNegative
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
            }`}
          >
            {isPositive && <ArrowUpRight className="w-3 h-3" />}
            {isNegative && <ArrowDownRight className="w-3 h-3" />}
            {change}
          </span>
        ) : null}
      </div>

      <div>
        <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white tabular-nums font-mono">
          {value}
        </div>
        {timeframe && (
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
            {timeframe}
          </p>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Admin Queue Card (Hàng đợi cần xử lý - Chuẩn Ảnh 1)                      */
/* -------------------------------------------------------------------------- */

interface AdminQueueCardProps {
  title: string;
  count?: number | string;
  statusText?: string;
  statusVariant?: 'blue' | 'emerald' | 'amber';
  description: string;
  actionText: string;
  actionHref: string;
  icon: LucideIcon;
}

export function AdminQueueCard({
  title,
  count,
  statusText,
  statusVariant = 'blue',
  description,
  actionText,
  actionHref,
  icon: Icon,
}: AdminQueueCardProps) {
  return (
    <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-zinc-700 transition-all">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 shrink-0">
              <Icon className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              {title}
            </h3>
          </div>

          {count !== undefined && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 tabular-nums">
              {count}
            </span>
          )}

          {statusText && (
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                statusVariant === 'emerald'
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                  : 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
              }`}
            >
              {statusText}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-4 pt-1">
        <Link
          href={actionHref}
          className="min-h-[44px] sm:min-h-0 py-2 sm:py-0 inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-800 hover:text-blue-600 dark:text-zinc-200 dark:hover:text-blue-400 transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none rounded-md"
        >
          <span>{actionText}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Admin Notice Banner (Chuẩn Notice trong Ảnh 1, 2, 6, 7...)              */
/* -------------------------------------------------------------------------- */

interface AdminNoticeBannerProps {
  variant?: 'info' | 'warning';
  title?: string;
  message: string;
  actionText?: string;
  actionHref?: string;
}

export function AdminNoticeBanner({
  variant = 'info',
  title,
  message,
  actionText,
  actionHref,
}: AdminNoticeBannerProps) {
  const isInfo = variant === 'info';

  return (
    <div
      className={`rounded-xl p-4 flex items-start justify-between gap-3 text-xs border ${
        isInfo
          ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-900/50 text-blue-900 dark:text-blue-200'
          : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
      }`}
    >
      <div className="flex items-start gap-2.5">
        {isInfo ? (
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" strokeWidth={1.75} />
        ) : (
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" strokeWidth={1.75} />
        )}
        <div>
          {title && <span className="font-semibold block mb-0.5">{title}</span>}
          <span className="leading-relaxed opacity-90">{message}</span>
        </div>
      </div>

      {actionText && actionHref && (
        <Link
          href={actionHref}
          className={`shrink-0 font-semibold underline underline-offset-2 hover:opacity-80 inline-flex items-center gap-1 ${
            isInfo ? 'text-blue-700 dark:text-blue-300' : 'text-amber-800 dark:text-amber-300'
          }`}
        >
          <span>{actionText}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. Phễu Phát Triển Năng Lực Số (Funnel Component - Chuẩn Ảnh 1)            */
/* -------------------------------------------------------------------------- */

export interface FunnelStep {
  label: string;
  value: number;
  conversionRate?: string;
}

export function AdminFunnelChart({ steps }: { steps: FunnelStep[] }) {
  const maxValue = Math.max(...steps.map((s) => s.value), 1);

  return (
    <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Phễu phát triển năng lực số
            </h3>
            <Info className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Hành trình người dùng trên nền tảng trong 30 ngày gần nhất.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 items-end pt-6 pb-2">
        {steps.map((step, idx) => {
          const heightPercent = Math.max(20, Math.round((step.value / maxValue) * 100));
          return (
            <div key={idx} className="flex flex-col items-center">
              {/* Value on top */}
              <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 tabular-nums mb-1">
                {step.value.toLocaleString('vi-VN')}
              </div>

              {/* Bar */}
              <div className="w-full flex items-center justify-center">
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${heightPercent}px`,
                    backgroundColor:
                      idx === 0
                        ? '#DBEAFE'
                        : idx === 1
                        ? '#BFDBFE'
                        : idx === 2
                        ? '#93C5FD'
                        : idx === 3
                        ? '#60A5FA'
                        : '#2563EB',
                  }}
                />
              </div>

              {/* Conversion rate indicator */}
              {step.conversionRate && idx < steps.length - 1 && (
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono font-medium mt-1">
                  {step.conversionRate} →
                </div>
              )}

              {/* Label below */}
              <div className="text-[10px] sm:text-[11px] text-center text-slate-600 dark:text-neutral-400 mt-2 line-clamp-2 leading-tight">
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. Chỉ Số 5 Miền Toàn Nền Tảng (Domain Score Bars - Chuẩn Ảnh 1)            */
/* -------------------------------------------------------------------------- */

export interface DomainScore {
  name: string;
  score: number;
}

export function AdminFiveDomainScores({
  domains,
  subtitle = 'Điểm năng lực số trung bình của tất cả người dùng (thang 0 – 100).',
}: {
  domains: DomainScore[];
  subtitle?: string;
}) {
  return (
    <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
          Chỉ số 5 miền toàn nền tảng
        </h3>
        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 mb-4">
          {subtitle}
        </p>

        <div className="space-y-3.5">
          {domains.map((dom, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-neutral-300">
                  {dom.name}
                </span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {dom.score.toFixed(1).replace('.', ',')}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, dom.score))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 6. Admin Pagination Bar (Thanh phân trang chuẩn Ảnh 2, 4, 6...)             */
/* -------------------------------------------------------------------------- */

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  recordsPerPage?: number;
  onPageChange?: (page: number) => void;
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalRecords,
  recordsPerPage = 10,
  onPageChange,
}: AdminPaginationProps) {
  const startRecord = (currentPage - 1) * recordsPerPage + 1;
  const endRecord = Math.min(currentPage * recordsPerPage, totalRecords);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 text-xs text-slate-500 dark:text-neutral-400">
      <div>
        Hiển thị{' '}
        <span className="font-semibold text-neutral-900 dark:text-neutral-200">
          {startRecord} – {endRecord}
        </span>{' '}
        trong{' '}
        <span className="font-semibold text-neutral-900 dark:text-neutral-200">
          {totalRecords.toLocaleString('vi-VN')}
        </span>{' '}
        bản ghi
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Trang trước"
            onClick={() => onPageChange && onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-2.5 py-1 min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          >
            &lt;
          </button>
          <span className="px-3 py-1 rounded-md bg-blue-600 text-white font-bold">
            {currentPage}
          </span>
          {totalPages > 1 && (
            <button
              type="button"
              onClick={() => onPageChange && onPageChange(currentPage + 1)}
              className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
            >
              {Math.min(currentPage + 1, totalPages)}
            </button>
          )}
          {totalPages > 3 && <span className="px-1 text-slate-500">...</span>}
          {totalPages > 2 && (
            <button
              type="button"
              onClick={() => onPageChange && onPageChange(totalPages)}
              className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
            >
              {totalPages}
            </button>
          )}
          <button
            type="button"
            aria-label="Trang sau"
            onClick={() => onPageChange && onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-2.5 py-1 min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
