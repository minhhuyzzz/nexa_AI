import { TrendingUp, Award, BarChart2 } from 'lucide-react';
import { DomainMetric } from '@/features/analytics/services/org-competency-analytics.service';

interface Props {
  domains: DomainMetric[];
  passRate: number;
  totalEvaluated: number;
}

export function CampaignComparisonChart({
  domains,
  passRate,
  totalEvaluated,
}: Props) {
  if (totalEvaluated === 0) {
    return (
      <div className="p-8 text-center rounded-md border border-slate-200 bg-white">
        <BarChart2 className="w-8 h-8 text-slate-300 mx-auto mb-2" strokeWidth={1.75} />
        <h3 className="text-xs font-semibold text-slate-700">Chưa có dữ liệu khảo thí chính thức</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Biểu đồ phân tích 5 miền sẽ tự động xuất hiện sau khi các bài thi được giảng viên phê duyệt điểm.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {domains.map((d) => {
          const score = d.score;
          const isGap = score !== null && score < 60;
          const isPassed = score !== null && score >= 70;

          return (
            <div
              key={d.domainCode}
              className="p-3.5 rounded-md border border-slate-200 bg-white shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                    {d.domainCode}
                  </span>
                  {score !== null && (
                    <span
                      className={`text-[10px] font-semibold ${
                        isPassed
                          ? 'text-emerald-700'
                          : isGap
                          ? 'text-amber-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {isPassed ? 'Đạt chuẩn' : isGap ? 'Cần bồi dưỡng' : 'Cơ bản'}
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-semibold text-slate-900 leading-snug line-clamp-1">
                  {d.name}
                </h4>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-[10px] text-slate-400">Điểm TB:</span>
                  <span className="text-xs font-mono font-bold tabular-nums text-slate-900">
                    {score !== null ? `${score}%` : 'Chưa đủ dữ liệu'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isPassed
                        ? 'bg-sky-600'
                        : isGap
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`}
                    style={{ width: `${Math.min(100, score || 0)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
