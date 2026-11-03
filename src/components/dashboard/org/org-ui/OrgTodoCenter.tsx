import Link from 'next/link';
import { Users, CheckSquare, Calendar, ShieldCheck, ChevronRight } from 'lucide-react';

interface OrgTodoCenterProps {
  orgSlug: string;
  pendingRequestsCount: number;
  pendingGradingCount: number;
  scheduledCampaignsCount: number;
}

export function OrgTodoCenter({
  orgSlug,
  pendingRequestsCount = 0,
  pendingGradingCount = 0,
  scheduledCampaignsCount = 0,
}: OrgTodoCenterProps) {
  const totalTodos = pendingRequestsCount + pendingGradingCount + scheduledCampaignsCount;

  const todoItems = [
    {
      title: 'Yêu cầu tham gia',
      count: pendingRequestsCount,
      subtext: pendingRequestsCount > 0 ? 'Cần kiểm tra và phê duyệt' : 'Chưa có yêu cầu mới',
      href: `/org/${orgSlug}/members`,
      icon: Users,
      badgeColor: pendingRequestsCount > 0
        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
        : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-neutral-400 border-slate-200 dark:border-zinc-700',
    },
    {
      title: 'Bài chờ phê duyệt',
      count: pendingGradingCount,
      subtext: pendingGradingCount > 0 ? 'Cần giảng viên chốt điểm' : 'Không có bài chờ chấm',
      href: `/org/${orgSlug}/grading`,
      icon: CheckSquare,
      badgeColor: pendingGradingCount > 0
        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
        : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-neutral-400 border-slate-200 dark:border-zinc-700',
    },
    {
      title: 'Đợt cần triển khai',
      count: scheduledCampaignsCount,
      subtext: scheduledCampaignsCount > 0 ? 'Đợt thi sắp tới cần theo dõi' : 'Đã vào guồng vận hành',
      href: `/org/${orgSlug}/campaigns`,
      icon: Calendar,
      badgeColor: scheduledCampaignsCount > 0
        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
        : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-neutral-400 border-slate-200 dark:border-zinc-700',
    },
  ];

  return (
    <div className="rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs flex flex-col justify-between h-full">
      <div className="p-4 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
            Trung tâm xử lý
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
            Các công việc cần hành động từ đơn vị
          </p>
        </div>
        <span
          className={`px-2 py-0.5 text-[10px] font-semibold font-mono rounded border ${
            totalTodos > 0
              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-zinc-700'
          }`}
        >
          {totalTodos > 0 ? `${totalTodos} việc` : 'Không có việc mới'}
        </span>
      </div>

      <div className="p-3 divide-y divide-slate-100 dark:divide-zinc-850 flex-1">
        {todoItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              className="flex items-center justify-between p-2.5 rounded-md hover:bg-slate-50/80 dark:hover:bg-zinc-900/60 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-center text-slate-500 dark:text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-colors">
                  <Icon className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                    {item.subtext}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono font-bold text-xs px-2 py-0.5 rounded border tabular-nums ${item.badgeColor}`}
                >
                  {item.count}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-3 border-t border-slate-100 dark:border-zinc-800/80">
        <div className="p-2.5 rounded bg-slate-50/80 dark:bg-zinc-900/50 border border-slate-200/70 dark:border-zinc-800 flex items-start gap-2 text-[11px] text-slate-600 dark:text-neutral-400 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" strokeWidth={1.75} />
          <span>
            Hệ thống chỉ xác nhận điểm <strong className="text-neutral-900 dark:text-neutral-100 font-semibold">đã được duyệt</strong> để cấp chứng nhận và phân tích kết quả.
          </span>
        </div>
      </div>
    </div>
  );
}
