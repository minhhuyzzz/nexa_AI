import Link from 'next/link';
import { BarChart2, ArrowRight } from 'lucide-react';

export interface DomainScoreItem {
  domainId: string;
  domainCode: string;
  name: string;
  score: number | null;
  testedCount?: number;
  passedCount?: number;
}

interface OrgDomainBarsProps {
  domains: DomainScoreItem[];
  orgSlug: string;
  hasAnyData: boolean;
}

export function OrgDomainBars({ domains, orgSlug, hasAnyData }: OrgDomainBarsProps) {
  return (
    <div className="rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs flex flex-col justify-between h-full">
      <div className="p-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
            Hồ sơ năng lực số &bull; 5 miền
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
            Dữ liệu chấm hợp lệ của tổ chức, không suy luận khi thiếu minh chứng
          </p>
        </div>
        <Link
          href={`/org/${orgSlug}/analytics`}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1 shrink-0 transition-colors"
        >
          <span>Xem báo cáo</span>
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
        </Link>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-center">
        {!hasAnyData ? (
          <div className="p-6 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-400 dark:text-neutral-500 mb-2.5">
              <BarChart2 className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Chưa đủ minh chứng để tính điểm
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 max-w-sm">
              NEXA không hiển thị 0% cho miền chưa được đánh giá. Điểm chỉ xuất hiện sau khi có minh chứng được chấm hợp lệ.
            </p>
            <Link
              href={`/org/${orgSlug}/analytics`}
              className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-neutral-700 dark:text-zinc-300 transition-colors shadow-xs"
            >
              <span>Tìm hiểu báo cáo</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </Link>
          </div>
        ) : (
          <div className="space-y-3.5">
            {domains.map((d) => {
              const score = d.score;
              const hasScore = score !== null;
              const isPassing = score !== null && score >= 70;
              const fillPercent = score !== null ? Math.min(100, Math.max(0, score)) : 0;

              return (
                <div key={d.domainCode} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-800 dark:text-zinc-200 truncate max-w-[240px]">
                      {d.name}
                    </span>
                    <span className="font-mono text-xs tabular-nums text-neutral-900 dark:text-neutral-100 font-bold shrink-0">
                      {hasScore ? `${score}%` : '—'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    {hasScore && (
                      <div
                        className={`h-full rounded-full transition-all ${
                          isPassing
                            ? 'bg-blue-600 dark:bg-blue-500'
                            : 'bg-amber-500 dark:bg-amber-400'
                        }`}
                        style={{ width: `${fillPercent}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400">
        <span>&bull; Điểm trung bình các bài đã duyệt</span>
        <span className="font-mono">Mục tiêu tham chiếu: 70%</span>
      </div>
    </div>
  );
}
