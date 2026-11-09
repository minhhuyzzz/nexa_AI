'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  Loader2,
  Bot,
  Lightbulb,
  X,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import {
  BestDomainMetric,
  PriorityGapDomain,
  CoverageWarningMetric,
  OrgAnalyticsSummary,
} from '../types/org-analytics.types';
import { OrgAiInsightResult } from '@/app/api/org/[slug]/analytics/ai-insights/route';

interface AnalyticsInsightPanelProps {
  bestDomain: BestDomainMetric | null;
  priorityGapDomain: PriorityGapDomain | null;
  coverageWarningDomain: CoverageWarningMetric | null;
  suggestedActions: string[];
  orgSlug: string;
  orgName?: string;
  summary?: OrgAnalyticsSummary;
  hasEvaluatedData?: boolean;
  timeRangeLabel?: string;
}

export function AnalyticsInsightPanel({
  bestDomain,
  priorityGapDomain,
  coverageWarningDomain,
  suggestedActions,
  orgSlug,
  orgName = 'Tổ chức',
  summary,
  hasEvaluatedData = false,
  timeRangeLabel = 'Toàn bộ thời gian',
}: AnalyticsInsightPanelProps) {
  // AI Insights State
  const [aiData, setAiData] = useState<OrgAiInsightResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const hasRuleInsights = Boolean(bestDomain || priorityGapDomain || coverageWarningDomain);

  const handleRequestAiInsights = async () => {
    if (!hasEvaluatedData || !summary) return;
    setIsAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch(`/api/org/${orgSlug}/analytics/ai-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgName,
          evaluatedCount: summary.evaluatedSubmissions,
          overallScore: summary.overallAverageScore,
          passRate: summary.overallPassRate,
          domains: summary.domains.map((d) => ({
            domainCode: d.domainCode,
            name: d.name,
            score: d.score,
            coverageRate: d.coverageRate,
          })),
          priorityGapDomain: summary.priorityGapDomain,
          bestDomain: summary.bestDomain,
          timeRangeText: timeRangeLabel,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Lỗi khi yêu cầu phân tích AI');
      }

      const data: OrgAiInsightResult = await res.json();
      setAiData(data);
      setIsAiModalOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể kết nối với dịch vụ AI';
      setAiError(msg);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-2xs flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-3 h-3" />
            </div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Nhận định &amp; Ưu tiên hành động
            </h2>
          </div>

          {/* Quick badge */}
          {hasEvaluatedData && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              5 Miền
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
          Phát hiện khoảng trống và đề xuất giải pháp bồi dưỡng dựa trên dữ liệu thật.
        </p>
      </div>

      {/* Content Area */}
      <div className="mt-4 flex-1 flex flex-col justify-center">
        {!hasEvaluatedData ? (
          /* TRƯỜNG HỢP 1: CHƯA CÓ BÀI THI ĐƯỢC CHẤM/DUYỆT */
          <div className="py-6 px-4 text-center rounded-xl bg-slate-50/60 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-zinc-800/80 my-auto">
            <div className="w-9 h-9 rounded-xl bg-blue-100/60 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-neutral-800 dark:text-zinc-200">
              Chưa có dữ liệu khảo thí đủ điều kiện
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed max-w-xs mx-auto">
              NEXA AI sẽ tự động phân tích thế mạnh, nhận diện khoảng cách 5 miền và đề xuất lộ trình bồi dưỡng khi có kết quả khảo thí đầu tiên.
            </p>
            <div className="mt-3.5">
              <Link
                href={`/org/${orgSlug}/assessments`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition-colors"
              >
                <span>Giao bài hoặc tạo đợt thi</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ) : (
          /* TRƯỜNG HỢP 2: ĐÃ CÓ KẾT QUẢ ĐÁNH GIÁ THỰC TẾ */
          <div className="space-y-3 text-xs">
            {/* Nút Kích Hoạt Phân Tích Chuyên Sâu Bằng AI */}
            <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 dark:from-blue-950/30 dark:to-zinc-900/40 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-blue-800 dark:text-blue-300 font-bold text-[11px] tracking-wide uppercase">
                  <Bot className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Trợ lý sư phạm NEXA AI</span>
                </div>
                {aiData && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Đã sẵn sàng
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-600 dark:text-neutral-300 leading-relaxed">
                {aiData
                  ? 'Bản phân tích quản trị và chuyên đề bồi dưỡng đã được tạo cho kỳ này.'
                  : 'Yêu cầu NEXA AI đọc toàn bộ 5 miền để tổng hợp chiến lược quản trị và chuyên đề bồi dưỡng.'}
              </p>

              <button
                type="button"
                onClick={aiData ? () => setIsAiModalOpen(true) : handleRequestAiInsights}
                disabled={isAiLoading}
                className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>NEXA AI đang phân tích 5 miền...</span>
                  </>
                ) : aiData ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Xem báo cáo phân tích NEXA AI</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Phân tích chuyên sâu với NEXA AI</span>
                  </>
                )}
              </button>

              {aiError && (
                <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                  {aiError}
                </div>
              )}
            </div>

            {/* Các nhận định sư phạm dựa trên quy tắc (Rule-based) */}
            {hasRuleInsights ? (
              <div className="space-y-2.5">
                {/* 1. Miền mạnh nhất */}
                {bestDomain && (
                  <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/80 dark:border-emerald-900/40 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" strokeWidth={2} />
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                        Miền mạnh nhất
                      </div>
                      <div className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100">
                        {bestDomain.domainCode} — {bestDomain.name}
                      </div>
                      <div className="text-[10px] text-slate-600 dark:text-neutral-400 font-mono">
                        {bestDomain.score} điểm &bull; Độ phủ {bestDomain.coverageRate !== null ? `${bestDomain.coverageRate}%` : 'Đầy đủ'}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Miền cần bồi dưỡng */}
                {priorityGapDomain && (
                  <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/80 dark:border-amber-900/40 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" strokeWidth={2} />
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                        Miền cần bồi dưỡng
                      </div>
                      <div className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100">
                        {priorityGapDomain.domainCode} — {priorityGapDomain.name}
                      </div>
                      <div className="text-[10px] text-slate-600 dark:text-neutral-400 font-mono">
                        {priorityGapDomain.score} điểm &bull; Mức cần ưu tiên hỗ trợ trong 5 miền
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Cảnh báo độ phủ (nếu có miền dưới 90%) */}
                {coverageWarningDomain && (
                  <div className="p-2.5 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" strokeWidth={1.75} />
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">
                        Cảnh báo độ phủ dữ liệu
                      </div>
                      <div className="text-[11px] text-neutral-700 dark:text-zinc-300 leading-relaxed">
                        Độ phủ miền {coverageWarningDomain.domainCode} đạt {coverageWarningDomain.coverageRate}%, thấp hơn mức khuyến nghị 90%.
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Đề xuất hành động theo quy tắc */}
                {suggestedActions.length > 0 && (
                  <div className="pt-2 space-y-1">
                    <div className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                      Đề xuất hành động
                    </div>
                    <ul className="space-y-1 text-[11px] text-neutral-800 dark:text-zinc-200">
                      {suggestedActions.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-blue-600 dark:text-blue-400 font-bold shrink-0">({idx + 1})</span>
                          <span className="leading-snug">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Action Footer */}
      {hasEvaluatedData && (
        <div className="mt-4 pt-3 flex items-center justify-between">
          <Link
            href={`/org/${orgSlug}/campaigns`}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 group"
          >
            <span>Khởi tạo đợt bồi dưỡng mới</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      )}

      {/* Modal / Dialog Hiển thị Báo Cáo Phân Tích NEXA AI */}
      {isAiModalOpen && aiData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                    Báo cáo Phân tích Chiến lược NEXA AI
                  </h3>
                  <div className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center gap-2">
                    <span>{orgName}</span>
                    <span>&bull;</span>
                    <span>{timeRangeLabel}</span>
                    <span>&bull;</span>
                    <span className="font-mono text-[10px]">{aiData.modelUsed}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-neutral-800 dark:text-zinc-200">
              {/* 1. Tóm tắt quản trị */}
              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 space-y-1.5">
                <div className="text-[11px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Bản tóm tắt quản trị cho Lãnh đạo</span>
                </div>
                <p className="text-xs leading-relaxed text-neutral-800 dark:text-zinc-200">
                  {aiData.executiveSummary}
                </p>
              </div>

              {/* 2. So sánh Thế mạnh & Điểm nghẽn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1.5">
                  <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Thế mạnh nổi trội</span>
                  </div>
                  <p className="text-xs leading-relaxed text-neutral-700 dark:text-zinc-300">
                    {aiData.strengthsAnalysis}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 space-y-1.5">
                  <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Điểm nghẽn cần can thiệp</span>
                  </div>
                  <p className="text-xs leading-relaxed text-neutral-700 dark:text-zinc-300">
                    {aiData.gapIntervention}
                  </p>
                </div>
              </div>

              {/* 3. Lộ trình chiến lược 3 giai đoạn */}
              {aiData.strategicRoadmap.length > 0 && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-neutral-200 uppercase tracking-wide">
                    Lộ trình hành động đề xuất
                  </div>
                  <ul className="space-y-2">
                    {aiData.strategicRoadmap.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs">
                        <span className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 4. Đề xuất chuyên đề bồi dưỡng */}
              {aiData.recommendedWorkshops.length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-neutral-200 uppercase tracking-wide flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Chuyên đề bồi dưỡng kiến nghị</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {aiData.recommendedWorkshops.map((ws, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">
                            {ws.topic}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold">
                            {ws.targetDomain}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                          <strong>Đối tượng:</strong> {ws.targetAudience}
                        </div>
                        <div className="text-[11px] text-neutral-600 dark:text-zinc-300">
                          {ws.rationale}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50/50 dark:bg-zinc-900/30 flex items-center justify-between">
              <button
                type="button"
                onClick={handleRequestAiInsights}
                disabled={isAiLoading}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isAiLoading ? 'animate-spin' : ''}`} />
                <span>Phân tích lại</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
