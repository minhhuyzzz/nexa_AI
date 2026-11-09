'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Download,
  Share2,
  TrendingUp,
  Clock,
  AlertTriangle,
  Lightbulb,
  Bell,
  UserCheck,
  MessageSquare,
  Users,
  CheckCircle2,
  BarChart2,
  ExternalLink,
} from 'lucide-react';
import type { OrgClassItem } from './types';

export interface AtRiskMember {
  userId: string;
  name: string;
  code: string;
  issue: string;
  issueType: 'missing' | 'low_score' | 'not_started';
  progress: number;
}

export interface ClassDomainScoreItem {
  domainCode: 'D1' | 'D2' | 'D3' | 'D4' | 'D5';
  name: string;
  score: number | null;
  testedCount: number;
}

export interface ClassAnalyticsRealData {
  participationRate: number | null;
  pendingGradingCount: number;
  atRiskCount: number;
  averageScore: number | null;
  completedSubmissionsCount: number;
  totalSubmissionsNeeded: number;
  atRiskMembers: AtRiskMember[];
  classDomainScores?: ClassDomainScoreItem[];
}

export interface OrgClassAnalyticsViewProps {
  slug: string;
  classData: OrgClassItem;
  analyticsData?: ClassAnalyticsRealData;
  classDomainScores?: ClassDomainScoreItem[];
}

export function OrgClassAnalyticsView({
  slug,
  classData,
  analyticsData,
  classDomainScores,
}: OrgClassAnalyticsViewProps) {
  const [remindedUserIds, setRemindedUserIds] = useState<string[]>([]);

  const handleRemind = (userId: string) => {
    setRemindedUserIds((prev) => [...prev, userId]);
  };

  const participationRate = analyticsData?.participationRate ?? classData.participationRate ?? null;
  const pendingGradingCount = analyticsData?.pendingGradingCount ?? classData.pendingGradingCount ?? 0;
  const atRiskCount = analyticsData?.atRiskCount ?? 0;
  const averageScore = analyticsData?.averageScore ?? null;
  const completedCount = analyticsData?.completedSubmissionsCount ?? 0;
  const totalNeeded = analyticsData?.totalSubmissionsNeeded ?? (classData.membersCount * classData.assignmentsCount);
  const atRiskMembers = analyticsData?.atRiskMembers ?? [];

  const rawDomainScores = classDomainScores ?? analyticsData?.classDomainScores ?? [];
  const defaultDomains: ClassDomainScoreItem[] = [
    { domainCode: 'D1', name: 'Thông tin & Dữ liệu', score: null, testedCount: 0 },
    { domainCode: 'D2', name: 'Giao tiếp & Hợp tác', score: null, testedCount: 0 },
    { domainCode: 'D3', name: 'Sáng tạo nội dung số', score: null, testedCount: 0 },
    { domainCode: 'D4', name: 'An toàn & Bảo mật', score: null, testedCount: 0 },
    { domainCode: 'D5', name: 'Giải quyết Vấn đề', score: null, testedCount: 0 },
  ];
  const effectiveDomainScores = rawDomainScores.length > 0 ? rawDomainScores : defaultDomains;

  const completionPercent = totalNeeded > 0 ? Math.min(100, Math.round((completedCount / totalNeeded) * 100)) : 0;
  const strokeDash = Math.round((completionPercent / 100) * 238);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400">
        <Link href={`/org/${slug}`} className="hover:text-blue-600 transition-colors">
          Điều hành
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <Link href={`/org/${slug}/classes`} className="hover:text-blue-600 transition-colors">
          Lớp &amp; nhóm
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <Link href={`/org/${slug}/classes/${classData.id}`} className="hover:text-blue-600 transition-colors">
          {classData.name}
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
          Báo cáo lớp
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            {classData.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Báo cáo tiến độ, mức độ tham gia và hiệu quả học tập thực tế của lớp {classData.term ? `trong ${classData.term}` : ''}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/org/${slug}/analytics?classId=${classData.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 transition shadow-2xs"
          >
            <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Phân tích 5 miền năng lực</span>
          </Link>
          <Link
            href={`/org/${slug}/grading`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Chấm bài ({pendingGradingCount})</span>
          </Link>
        </div>
      </div>

      {/* Row 1: KPI strip & Fast Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* KPI Strip (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-4 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 pb-1">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
              Tình hình lớp thực tế
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3 divide-x text-xs">
            <div className="space-y-1">
              <span className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100">
                {participationRate !== null ? `${participationRate}%` : '---'}
              </span>
              <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                tỷ lệ tham gia
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                {classData.membersCount} thành viên
              </p>
            </div>

            <div className="space-y-1 pl-3">
              <span className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100">
                {pendingGradingCount}
              </span>
              <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                bài chờ chấm
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                Từ các đợt thi đã nộp
              </p>
            </div>

            <div className="space-y-1 pl-3">
              <span className="text-lg font-bold font-mono text-amber-600">
                {atRiskCount}
              </span>
              <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                cần chú ý
              </p>
              <p className="text-[10px] text-amber-600 font-mono">
                {atRiskCount > 0 ? 'Chưa nộp / Điểm thấp' : 'Đúng tiến độ'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Insights (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-4 space-y-2.5 shadow-xs">
          <div className="flex items-center gap-2 pb-1">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
              Nhận định nhanh từ dữ liệu
            </h3>
          </div>

          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-neutral-300">
            <li className="flex items-start gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
              <span>
                {participationRate !== null
                  ? `Mức độ tham gia đạt ${participationRate}% trên tổng số ${classData.membersCount} thành viên.`
                  : `Lớp có ${classData.membersCount} học viên nhưng chưa phát sinh lượt làm bài.`}
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <span>
                {pendingGradingCount > 0
                  ? `Hiện có ${pendingGradingCount} bài đánh giá đang chờ khảo thí viên chấm điểm.`
                  : 'Toàn bộ bài nộp đã được chấm và công bố điểm đầy đủ.'}
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${atRiskCount > 0 ? 'bg-rose-500' : 'bg-emerald-500'} mt-1.5 shrink-0`} />
              <span>
                {atRiskCount > 0
                  ? `Có ${atRiskCount} thành viên thiếu bài nộp hoặc điểm đánh giá dưới 50%.`
                  : 'Toàn bộ học viên trong lớp đều duy trì tiến độ hoàn thành tốt.'}
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Row 2: Completion Progress Card */}
      <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-5 shadow-xs">
        <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono pb-2 mb-3">
          Tiến độ hoàn thành bài đánh giá của lớp
        </h3>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="38"
                className="stroke-slate-100 dark:stroke-zinc-800"
                strokeWidth="12"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="38"
                className="stroke-blue-600"
                strokeWidth="12"
                strokeDasharray={`${strokeDash} 238`}
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-base font-bold font-mono text-neutral-900 dark:text-neutral-100">
                {completionPercent}%
              </span>
              <span className="text-[9px] text-slate-500">Hoàn thành</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
              <div className="text-slate-500 text-[11px]">Đã nộp &amp; chấm</div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                {completedCount} bài
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Trên tổng {totalNeeded} lượt cần nộp
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
              <div className="text-slate-500 text-[11px]">Chờ chấm điểm</div>
              <div className="text-lg font-bold text-amber-600 mt-1">
                {pendingGradingCount} bài
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Cần phản hồi khảo thí
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
              <div className="text-slate-500 text-[11px]">Điểm trung bình lớp</div>
              <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                {averageScore !== null ? `${averageScore} đ` : 'Chưa có'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Tính trên các bài đã có kết quả
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2.5: 5 Domains Competency Section (F14) */}
      <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
                5 miền năng lực số của lớp
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
              Kết quả đánh giá tổng hợp theo 5 miền năng lực số từ các bài khảo thí đã hoàn tất.
            </p>
          </div>

          <Link
            href={`/org/${slug}/analytics?classId=${classData.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition self-start sm:self-auto"
          >
            <span>Báo cáo chuyên sâu 5 miền</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 5 Domains Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1">
          {effectiveDomainScores.map((domain) => {
            const hasScore = domain.score !== null;
            return (
              <div
                key={domain.domainCode}
                className="p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                      {domain.domainCode}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">
                      {domain.testedCount > 0 ? `${domain.testedCount} bài` : '0 bài'}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 leading-snug line-clamp-2">
                    {domain.name}
                  </h4>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-baseline justify-between">
                    {hasScore ? (
                      <span className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100">
                        {domain.score}%
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-neutral-500 italic">
                        Chưa đủ dữ liệu
                      </span>
                    )}

                    {hasScore && (
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          domain.score! >= 70
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {domain.score! >= 70 ? 'Đạt chuẩn' : 'Cần cải thiện'}
                      </span>
                    )}
                  </div>

                  {/* Progress bar container */}
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                    {hasScore && (
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          domain.score! >= 70 ? 'bg-blue-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, domain.score!))}%` }}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 3: At Risk Members & Action Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* At-risk table (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
                Danh sách cần chú ý ({atRiskMembers.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                Thành viên chưa làm bài, thiếu bài nộp hoặc điểm đánh giá dưới chuẩn mục tiêu.
              </p>
            </div>
          </div>

          {atRiskMembers.length === 0 ? (
            <div className="p-8 text-center rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Không có thành viên nào chậm tiến độ
              </div>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Tất cả thành viên trong lớp đều đang hoàn thành đúng hạn các bài khảo thí được giao.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-zinc-800 rounded-md overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-900 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-2 px-3">Thành viên</th>
                    <th className="py-2 px-3">Vấn đề cần chú ý</th>
                    <th className="py-2 px-3">Tiến độ</th>
                    <th className="py-2 px-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="">
                  {atRiskMembers.map((m) => (
                    <tr key={m.userId} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-neutral-900 dark:text-neutral-100">{m.name}</p>
                        <p className="text-[10px] font-mono text-slate-500">{m.code}</p>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                          <AlertTriangle className="w-3 h-3" /> {m.issue}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                        {m.progress}%
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemind(m.userId)}
                          disabled={remindedUserIds.includes(m.userId)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 disabled:opacity-50 cursor-pointer"
                        >
                          {remindedUserIds.includes(m.userId) ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600">Đã nhắc</span>
                            </>
                          ) : (
                            <>
                              <Bell className="w-3 h-3" />
                              <span>Nhắc nhở</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action recommendations (5 cols) */}
        <div className="lg:col-span-5 space-y-3 bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-4 shadow-xs">
          <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono pb-1">
            Đề xuất hành động từ hệ thống
          </h3>

          <div className="space-y-2.5 text-xs">
            {pendingGradingCount > 0 && (
              <Link
                href={`/org/${slug}/grading`}
                className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 hover:bg-slate-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-800 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                      Chấm {pendingGradingCount} bài còn tồn đọng
                    </p>
                    <p className="text-[11px] text-slate-500">Mở phòng chấm thi để phản hồi học viên kịp thời.</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            )}

            <Link
              href={`/org/${slug}/analytics?classId=${classData.id}`}
              className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 hover:bg-slate-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-800 transition flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shrink-0">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                    Xem hồ sơ 5 miền năng lực số
                  </p>
                  <p className="text-[11px] text-slate-500">Phân tích khoảng trống năng lực số của lớp.</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              href={`/org/${slug}/classes/${classData.id}`}
              className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 hover:bg-slate-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-800 transition flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                    Quản lý danh sách thành viên
                  </p>
                  <p className="text-[11px] text-slate-500">Xem {classData.membersCount} học viên và phân chia nhóm.</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
