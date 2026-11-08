'use client';

import React from 'react';
import { CampaignCompetencyMetric } from '../types/org-analytics.types';
import { Calendar, Filter, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface Props {
  campaigns: CampaignCompetencyMetric[];
  selectedCampaignId?: string;
  onFilterCampaign: (campaignId: string) => void;
}

export function CampaignAnalyticsView({
  campaigns,
  selectedCampaignId,
  onFilterCampaign,
}: Props) {
  if (campaigns.length === 0) {
    return (
      <div className="p-8 text-center rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114]">
        <Calendar className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto mb-2" strokeWidth={1.75} />
        <h3 className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
          Chưa có đợt khảo thí nào
        </h3>
        <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5">
          Tạo đợt đánh giá mới để phân công bài thi chuẩn và quản lý tiến độ khảo thí tập thể.
        </p>
      </div>
    );
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Đang diễn ra
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
            <CheckCircle2 className="w-3 h-3 text-slate-500" />
            Đã hoàn thành
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
            <Clock className="w-3 h-3" />
            Sắp diễn ra
          </span>
        );
      case 'GRADING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
            <Clock className="w-3 h-3" />
            Đang chấm bài
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] overflow-hidden shadow-xs">
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
            Danh Sách Đợt Đánh Giá & Khảo Thí
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Thống kê tiến độ nộp bài và kết quả phê duyệt theo từng chiến dịch tổ chức.
          </p>
        </div>
        <div className="text-[11px] text-slate-400 dark:text-neutral-500">
          Tổng số <span className="font-mono font-semibold text-slate-700 dark:text-neutral-300">{campaigns.length}</span> đợt
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-900/60 text-slate-600 dark:text-neutral-300 font-semibold">
              <th className="py-3 px-4">Tên đợt đánh giá</th>
              <th className="py-3 px-4 text-center">Trạng thái</th>
              <th className="py-3 px-4">Thời gian</th>
              <th className="py-3 px-4 text-right">Lượt nộp</th>
              <th className="py-3 px-4 text-right">Đã duyệt</th>
              <th className="py-3 px-4 text-right">Điểm TB</th>
              <th className="py-3 px-4 text-center">Khoảng trống cần bồi dưỡng</th>
              <th className="py-3 px-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="">
            {campaigns.map((cmp) => {
              const isSelected = selectedCampaignId === cmp.campaignId;
              const hasData = cmp.evaluatedCount > 0;

              return (
                <tr
                  key={cmp.campaignId}
                  className={`hover:bg-slate-50/80 dark:hover:bg-zinc-900/50 transition-colors ${
                    isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-neutral-100">
                    <div className="flex items-center gap-2">
                      <span>{cmp.title}</span>
                      {isSelected && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium">
                          Đang lọc
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {formatStatus(cmp.status)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-neutral-400 font-mono text-[11px] tabular-nums">
                    {new Date(cmp.startsAt).toLocaleDateString('vi-VN')} – {new Date(cmp.endsAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-neutral-400">
                    {cmp.totalSubmissions}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-neutral-400">
                    {cmp.evaluatedCount}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-neutral-100">
                    {hasData ? `${cmp.averageScore}đ` : (
                      <span className="text-slate-400 dark:text-neutral-500 font-normal italic">
                        Chưa có dữ liệu
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {hasData ? (
                      cmp.gapDomainCodes.length > 0 ? (
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {cmp.gapDomainCodes.map((code) => (
                            <span
                              key={code}
                              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40"
                              title={`Miền ${code} dưới 60đ`}
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                          Đồng đều
                        </span>
                      )
                    ) : (
                      <span className="text-slate-400 dark:text-neutral-500 italic">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onFilterCampaign(cmp.campaignId)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-neutral-200'
                      }`}
                    >
                      <Filter className="w-3 h-3" />
                      {isSelected ? 'Bỏ lọc' : 'Lọc đợt này'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
