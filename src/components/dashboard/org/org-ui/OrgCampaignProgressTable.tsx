import Link from 'next/link';
import { Calendar, ArrowRight, ChevronRight, Plus } from 'lucide-react';

export interface CampaignProgressItem {
  id: string;
  title: string;
  subtitle?: string;
  status: string;
  startsAt?: string | null;
  endsAt?: string | null;
  totalAssigned: number;
  submittedCount: number;
}

interface OrgCampaignProgressTableProps {
  campaigns: CampaignProgressItem[];
  orgSlug: string;
  canManage?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: 'Đang mở',
    className: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  SCHEDULED: {
    label: 'Sắp diễn ra',
    className: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  COMPLETED: {
    label: 'Đã hoàn thành',
    className: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-zinc-700',
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
};

export function OrgCampaignProgressTable({
  campaigns,
  orgSlug,
  canManage = false,
}: OrgCampaignProgressTableProps) {
  return (
    <div className="rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs flex flex-col justify-between h-full">
      <div className="p-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
            Đợt đánh giá đang theo dõi
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
            Tiến độ triển khai, số bài nộp và trạng thái phê duyệt
          </p>
        </div>
        <Link
          href={`/org/${orgSlug}/campaigns`}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1 shrink-0 transition-colors"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
        </Link>
      </div>

      <div className="p-0 flex-1 flex flex-col justify-center">
        {campaigns.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-400 dark:text-neutral-500 mb-2.5">
              <Calendar className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Chưa có đợt đánh giá
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 max-w-sm">
              Khi có đề thi và lớp học, bạn có thể khởi tạo đợt khảo thí đầu tiên để giao bài tới học viên.
            </p>
            {canManage && (
              <Link
                href={`/org/${orgSlug}/campaigns/new`}
                className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Tạo đợt đầu tiên</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-zinc-900/60 text-[10px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
                  <th className="py-2.5 px-4">Tên đợt</th>
                  <th className="py-2.5 px-4">Tiến độ</th>
                  <th className="py-2.5 px-4">Trạng thái</th>
                  <th className="py-2.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {campaigns.slice(0, 5).map((c) => {
                  const percent = c.totalAssigned > 0
                    ? Math.min(100, Math.round((c.submittedCount / c.totalAssigned) * 100))
                    : (c.submittedCount > 0 ? 100 : 0);
                  const statusInfo = STATUS_CONFIG[c.status] || {
                    label: c.status,
                    className: 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-zinc-800',
                  };

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-[180px]">
                          {c.title}
                        </div>
                        {c.subtitle && (
                          <div className="text-[11px] text-slate-500 dark:text-neutral-400 truncate max-w-[180px]">
                            {c.subtitle}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] tabular-nums text-slate-600 dark:text-neutral-300 mb-1">
                          {c.submittedCount}/{c.totalAssigned} đã nộp
                        </div>
                        <div className="w-24 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/org/${orgSlug}/campaigns/${c.id}`}
                          className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                          <span>Chi tiết</span>
                          <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
