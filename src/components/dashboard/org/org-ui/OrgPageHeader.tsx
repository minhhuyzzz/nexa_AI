import Link from 'next/link';
import { Building2, Calendar, Users } from 'lucide-react';

interface OrgPageHeaderProps {
  orgName: string;
  orgSlug: string;
  contractNumber?: string;
  isActiveEntitlement?: boolean;
  canManage: boolean;
}

export function OrgPageHeader({
  orgName,
  orgSlug,
  contractNumber,
  isActiveEntitlement = true,
  canManage,
}: OrgPageHeaderProps) {
  return (
    <div className="p-5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-xs">
            <Building2 className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-0.5">
              ĐIỀU HÀNH TỔ CHỨC
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                {orgName}
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-semibold font-mono rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Gói Business Plus
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
              Quản lý đánh giá, phát triển và chứng nhận năng lực số dựa trên minh chứng.
            </p>
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href={`/org/${orgSlug}/campaigns/new`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Tạo đợt đánh giá</span>
            </Link>
            <Link
              href={`/org/${orgSlug}/members`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-700 dark:text-zinc-300 text-xs font-semibold transition-colors shadow-xs"
            >
              <Users className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" strokeWidth={1.75} />
              <span>Mời thành viên</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
