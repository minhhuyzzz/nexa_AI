import Link from 'next/link';
import { AlertCircle, Target, ArrowRight } from 'lucide-react';

interface OrgNoticeBannerProps {
  type: 'unactivated' | 'action';
  orgSlug: string;
  membersCount?: number;
  pendingGradingCount?: number;
  pendingRequestsCount?: number;
  canManage?: boolean;
}

export function OrgNoticeBanner({
  type,
  orgSlug,
  membersCount = 0,
  pendingGradingCount = 0,
  pendingRequestsCount = 0,
  canManage = false,
}: OrgNoticeBannerProps) {
  if (type === 'unactivated') {
    return null;
  }

  // Type === 'action'
  const hasAction = pendingGradingCount > 0 || pendingRequestsCount > 0;
  if (!hasAction) return null;

  return (
    <div className="p-4 rounded-md border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
            <Target className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Việc cần chú ý hôm nay
            </h3>
            <p className="text-xs text-slate-600 dark:text-neutral-400 mt-0.5 leading-relaxed">
              <b className="font-mono text-neutral-900 dark:text-neutral-100 font-semibold">{pendingGradingCount} bài</b> đang chờ chấm và{' '}
              <b className="font-mono text-neutral-900 dark:text-neutral-100 font-semibold">{pendingRequestsCount} yêu cầu</b> gia nhập chờ duyệt. Ưu tiên hoàn tất chấm để cập nhật báo cáo 5 miền.
            </p>
          </div>
        </div>
        <Link
          href={`/org/${orgSlug}/grading`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shrink-0 shadow-xs"
        >
          <span>Mở bàn chấm</span>
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
        </Link>
      </div>
    </div>
  );
}
