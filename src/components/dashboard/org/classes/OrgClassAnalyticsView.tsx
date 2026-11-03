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
  MoreHorizontal,
} from 'lucide-react';
import type { OrgClassItem } from './types';

interface OrgClassAnalyticsViewProps {
  slug: string;
  classData: OrgClassItem;
}

export function OrgClassAnalyticsView({ slug, classData }: OrgClassAnalyticsViewProps) {
  const [weeksRange, setWeeksRange] = useState<6 | 12>(6);
  const [remindedUserIds, setRemindedUserIds] = useState<string[]>([]);

  const handleRemind = (userId: string) => {
    setRemindedUserIds((prev) => [...prev, userId]);
  };

  const trendData = [
    { week: 'Tuần 1', pct: 78 },
    { week: 'Tuần 2', pct: 83 },
    { week: 'Tuần 3', pct: 86 },
    { week: 'Tuần 4', pct: 88 },
    { week: 'Tuần 5', pct: 89 },
    { week: 'Tuần 6', pct: 92 },
  ];

  const atRiskMembers = [
    {
      userId: 'u1',
      name: 'Nguyễn Tuấn Anh',
      code: 'K65CNTT015',
      issue: 'Thiếu 2 bài nộp',
      issueType: 'missing',
      progress: 42,
      sessions: '1 phiên',
    },
    {
      userId: 'u2',
      name: 'Trần Thảo Vy',
      code: 'K65CNTT032',
      issue: 'Hoạt động thấp',
      issueType: 'low_activity',
      progress: 48,
      sessions: '2 phiên',
    },
    {
      userId: 'u3',
      name: 'Lê Hoàng Minh',
      code: 'K65CNTT047',
      issue: 'Thiếu 1 bài nộp',
      issueType: 'missing',
      progress: 47,
      sessions: '1 phiên',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400">
        <Link href={`/org/${slug}`} className="hover:text-blue-600">
          Điều hành
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <Link href={`/org/${slug}/classes`} className="hover:text-blue-600">
          Lớp & nhóm
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <Link href={`/org/${slug}/classes/${classData.id}`} className="hover:text-blue-600">
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
            Báo cáo tiến độ, mức độ tham gia và hiệu quả học tập của lớp trong đợt {classData.term || 'Học kỳ Fall 2026'}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md hover:bg-slate-50 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Xuất báo cáo
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            Chia sẻ
          </button>
        </div>
      </div>

      {/* Row 1: KPI strip & Fast Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* KPI Strip (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-4 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
              Tình hình lớp
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3 divide-x divide-slate-100 dark:divide-zinc-800 text-xs">
            <div className="space-y-1">
              <span className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100">
                92%
              </span>
              <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                tham gia tuần này
              </p>
              <p className="text-[10px] text-emerald-600 font-mono">Tăng 4 điểm %</p>
            </div>

            <div className="space-y-1 pl-3">
              <span className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100">
                7
              </span>
              <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                bài chờ chấm
              </p>
              <p className="text-[10px] text-slate-500 font-mono">Từ 5 thành viên</p>
            </div>

            <div className="space-y-1 pl-3">
              <span className="text-lg font-bold font-mono text-amber-600">3</span>
              <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                thành viên cần hỗ trợ
              </p>
              <p className="text-[10px] text-amber-600 font-mono">Chậm tiến độ</p>
            </div>
          </div>
        </div>

        {/* Quick Insights (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-4 space-y-2.5 shadow-xs">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 dark:border-zinc-800">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
              Nhận định nhanh
            </h3>
          </div>

          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-neutral-300">
            <li className="flex items-start gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
              <span>Mức độ tham gia đạt 92%, tăng ổn định trong 3 tuần gần đây (+6 điểm %).</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <span>Còn 7 bài đánh giá đang chờ chấm, chủ yếu ở đề &quot;Lập trình Web&quot;.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <span>3 thành viên có tiến độ dưới 50%, cần được nhắc nhở và hỗ trợ thêm.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Row 2: Charts (Trend & Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Trend line chart (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
                Mức độ tham gia theo tuần
              </h3>
              <p className="text-[11px] text-slate-500">
                Tỷ lệ thành viên có hoạt động học tập (truy cập, làm bài, nộp bài)
              </p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded text-xs font-mono">
              <button
                onClick={() => setWeeksRange(6)}
                className={`px-2 py-0.5 rounded ${weeksRange === 6 ? 'bg-white dark:bg-zinc-700 font-bold shadow-xs' : 'text-slate-500'}`}
              >
                6 tuần
              </button>
              <button
                onClick={() => setWeeksRange(12)}
                className={`px-2 py-0.5 rounded ${weeksRange === 12 ? 'bg-white dark:bg-zinc-700 font-bold shadow-xs' : 'text-slate-500'}`}
              >
                12 tuần
              </button>
            </div>
          </div>

          {/* SVG line chart */}
          <div className="h-44 w-full flex items-end justify-between gap-2 pt-4 px-2">
            {trendData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                  {d.pct}%
                </span>
                <div
                  className="w-full max-w-[36px] bg-blue-600/20 hover:bg-blue-600/40 rounded-t border-t-2 border-blue-600 transition-all"
                  style={{ height: `${(d.pct - 60) * 2.5}%` }}
                />
                <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                  {d.week}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Completion Donut & Leaderboard (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Donut card */}
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-4 shadow-xs">
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono pb-2 border-b border-slate-100 dark:border-zinc-800 mb-3">
              Tiến độ hoàn thành đề đánh giá
            </h3>

            <div className="flex items-center justify-between gap-4">
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
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
                    strokeDasharray="200 238"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-base font-bold font-mono text-neutral-900 dark:text-neutral-100">
                    84%
                  </span>
                  <span className="text-[9px] text-slate-500">Hoàn thành</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs font-mono flex-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-blue-600" /> Đã hoàn thành
                  </span>
                  <span className="font-bold">84% (21 đề)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Đang thực hiện
                  </span>
                  <span>8% (2 đề)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-slate-300" /> Chưa bắt đầu
                  </span>
                  <span>8% (2 đề)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-groups Leaderboard */}
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800 mb-2">
              <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
                Nhóm hoạt động nổi bật
              </h3>
              <span className="text-[11px] text-blue-600 font-semibold cursor-pointer">
                Theo nhóm
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { rank: 1, name: 'Nhóm 03', pct: 100, score: 96 },
                { rank: 2, name: 'Nhóm 01', pct: 96, score: 91 },
                { rank: 3, name: 'Nhóm 04', pct: 94, score: 88 },
              ].map((g) => (
                <div key={g.name} className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-zinc-900/60 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center justify-center">
                      {g.rank}
                    </span>
                    <span className="font-sans font-semibold text-neutral-900 dark:text-neutral-100">
                      {g.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-600 font-bold">{g.pct}% tham gia</span>
                    <span className="text-slate-500">Điểm TB: {g.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: At Risk Members & Action Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* At-risk table (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
                Danh sách cần chú ý (3)
              </h3>
              <p className="text-[11px] text-slate-500">
                Thành viên có hoạt động thấp, thiếu bài nộp hoặc tiến độ dưới mục tiêu.
              </p>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-zinc-800 rounded-md overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-900 text-slate-500 font-semibold border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="py-2 px-3">Thành viên</th>
                  <th className="py-2 px-3">Vấn đề cần chú ý</th>
                  <th className="py-2 px-3">Tiến độ</th>
                  <th className="py-2 px-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {atRiskMembers.map((m) => (
                  <tr key={m.userId} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">{m.name}</p>
                      <p className="text-[10px] font-mono text-slate-500">{m.code}</p>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
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
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
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
        </div>

        {/* Action recommendations (5 cols) */}
        <div className="lg:col-span-5 space-y-3 bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-4 shadow-xs">
          <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono pb-2 border-b border-slate-100 dark:border-zinc-800">
            Đề xuất hành động
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded border border-slate-100 dark:border-zinc-800 bg-slate-50/50 hover:bg-slate-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-800 transition cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                    Nhắc hạn nộp bài
                  </p>
                  <p className="text-[11px] text-slate-500">Gửi thông báo đến 7 bài còn chờ chấm.</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            <div className="p-3 rounded border border-slate-100 dark:border-zinc-800 bg-slate-50/50 hover:bg-slate-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-800 transition cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                    Bổ sung giảng viên hỗ trợ
                  </p>
                  <p className="text-[11px] text-slate-500">Phân công thêm trợ giảng cho 3 bạn chậm.</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            <div className="p-3 rounded border border-slate-100 dark:border-zinc-800 bg-slate-50/50 hover:bg-slate-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-800 transition cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                    Mở phiên phản hồi
                  </p>
                  <p className="text-[11px] text-slate-500">Thu thập ý kiến học viên về nội dung.</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
