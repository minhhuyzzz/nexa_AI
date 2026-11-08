'use client';

import React from 'react';
import { UnitCompetencyMetric } from '../types/org-analytics.types';
import { Users, Filter, CheckCircle2, AlertCircle, School } from 'lucide-react';

interface Props {
  units: UnitCompetencyMetric[];
  selectedClassId?: string;
  onFilterClass: (classId: string) => void;
}

export function UnitComparisonTable({ units, selectedClassId, onFilterClass }: Props) {
  if (units.length === 0) {
    return (
      <div className="p-8 text-center rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114]">
        <School className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto mb-2" strokeWidth={1.75} />
        <h3 className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
          Chưa có lớp học / đơn vị trực thuộc
        </h3>
        <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5">
          Tạo lớp và phân công thành viên trong mục Quản lý Lớp học để bắt đầu so sánh năng lực giữa các đơn vị.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] overflow-hidden shadow-xs">
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
            So Sánh Năng Lực Theo Đơn Vị / Lớp Học
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Đối chiếu mức độ hoàn thành chuẩn năng lực số giữa các tập thể trong tổ chức.
          </p>
        </div>
        <div className="text-[11px] text-slate-400 dark:text-neutral-500">
          Tổng số <span className="font-mono font-semibold text-slate-700 dark:text-neutral-300">{units.length}</span> đơn vị
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-900/60 text-slate-600 dark:text-neutral-300 font-semibold">
              <th className="py-3 px-4">Tên đơn vị / Lớp</th>
              <th className="py-3 px-4 text-right">Sĩ số</th>
              <th className="py-3 px-4 text-right">Bài thi đã duyệt</th>
              <th className="py-3 px-4 text-right">Điểm TB</th>
              <th className="py-3 px-4 text-center">Khoảng trống cần bồi dưỡng</th>
              <th className="py-3 px-4 text-center">5 Miền cốt lõi (D1 - D5)</th>
              <th className="py-3 px-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="">
            {units.map((unit) => {
              const isSelected = selectedClassId === unit.classId;
              const hasData = unit.evaluatedCount > 0;

              return (
                <tr
                  key={unit.classId}
                  className={`hover:bg-slate-50/80 dark:hover:bg-zinc-900/50 transition-colors ${
                    isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-neutral-100">
                    <div className="flex items-center gap-2">
                      <span>{unit.className}</span>
                      {isSelected && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium">
                          Đang lọc
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-neutral-400">
                    {unit.totalMembers}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-neutral-400">
                    {unit.evaluatedCount}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-neutral-100">
                    {hasData ? `${unit.averageScore}đ` : (
                      <span className="text-slate-400 dark:text-neutral-500 font-normal italic">
                        Chưa có dữ liệu
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {hasData ? (
                      unit.gapDomainCodes.length > 0 ? (
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {unit.gapDomainCodes.map((code) => (
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
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-center gap-1.5">
                      {['D1', 'D2', 'D3', 'D4', 'D5'].map((code) => {
                        const dScore = unit.domainScores[code];
                        const isDPassed = dScore !== null && dScore >= 70;
                        const isDGap = dScore !== null && dScore < 60;

                        return (
                          <div
                            key={code}
                            title={`${code}: ${dScore !== null ? `${dScore}đ` : 'Chưa có'}`}
                            className={`w-7 py-0.5 text-center text-[10px] font-mono rounded font-semibold ${
                              dScore === null
                                ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-neutral-500'
                                : isDPassed
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40'
                                : isDGap
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40'
                                : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                            }`}
                          >
                            {code}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onFilterClass(unit.classId)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-neutral-200'
                      }`}
                    >
                      <Filter className="w-3 h-3" />
                      {isSelected ? 'Bỏ lọc' : 'Lọc đơn vị'}
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
