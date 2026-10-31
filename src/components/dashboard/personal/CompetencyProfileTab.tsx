'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Compass,
  Award,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Loader2,
  Calendar,
  FileCheck,
  Play,
} from 'lucide-react';

interface DomainProgress {
  domainCode: string;
  name: string;
  score: number | null;
  level: string;
  competenciesCount: number;
  completedCount: number;
  status: 'MASTERED' | 'PROFICIENT' | 'DEVELOPING' | 'INSUFFICIENT_DATA';
}

interface CompetencyProfileTabProps {
  userId?: string;
}

export function CompetencyProfileTab({ userId }: CompetencyProfileTabProps) {
  const [domains, setDomains] = useState<DomainProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [totalEvidenceCount, setTotalEvidenceCount] = useState<number>(0);
  const [baselineSnapshot, setBaselineSnapshot] = useState<{ overallScore: number; createdAt: string } | null>(null);

  const fetchProfileCompetency = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/personal/competency-radar');
      if (res.ok) {
        const data = await res.json();
        setOverallScore(data.overallScore ?? null);
        setTotalEvidenceCount(data.totalEvidenceCount || 0);
        setBaselineSnapshot(data.baselineSnapshot || null);

        const mapped: DomainProgress[] = ((data.domains as any[]) || []).map((dom) => ({
          domainCode: dom.domainCode,
          name: dom.domainTitle,
          score: dom.score,
          level: dom.level || 'Chưa xếp bậc',
          competenciesCount: dom.totalSkillsCount || 5,
          completedCount: dom.assessedSkillsCount || 0,
          status: dom.status || (dom.score !== null ? 'PROFICIENT' : 'INSUFFICIENT_DATA'),
        }));
        setDomains(mapped);
      }
    } catch (err) {
      console.error('Error loading competency profile tab:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfileCompetency();
  }, [fetchProfileCompetency]);

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" strokeWidth={1.75} />
        <p className="text-xs">Đang tải hồ sơ năng lực 5 miền đã kiểm chứng...</p>
      </div>
    );
  }

  const hasAnyAssessment = domains.some((d) => d.score !== null);
  const assessedDomainsCount = domains.filter((d) => d.score !== null).length;

  return (
    <div className="space-y-6">
      {/* 1. Overview Summary Card */}
      <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-md p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono">
                HỒ SƠ NĂNG LỰC SỐ CÔNG DÂN (DIGCOMP 3.0)
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              Điểm Đánh Giá 5 Miền &amp; Bằng Chứng Khảo Thí
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-2xl">
              Hồ sơ ghi nhận minh chứng khảo thí thực tế từ các bài đánh giá chuẩn hóa. Không suy đoán hoặc giả lập điểm số khi chưa có bài làm hợp lệ.
            </p>
          </div>

          <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-zinc-850 pt-3 sm:pt-0 sm:pl-6 shrink-0">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 block mb-0.5">
                Điểm trung bình
              </span>
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-zinc-100">
                {overallScore !== null ? `${Math.round(overallScore)}/100` : '--'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {assessedDomainsCount}/5 Miền đã kiểm chứng
              </span>
            </div>

            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 block mb-0.5">
                Bằng chứng số
              </span>
              <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
                {totalEvidenceCount}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Bài thi &amp; nhiệm vụ</span>
            </div>
          </div>
        </div>

        {/* Baseline comparison if exists */}
        {baselineSnapshot && overallScore !== null && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-850 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={1.75} />
              <span>
                So với bài khảo thí đầu vào ({baselineSnapshot.overallScore}đ vào ngày{' '}
                {new Date(baselineSnapshot.createdAt).toLocaleDateString('vi-VN')}):{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                  +{Math.max(0, Math.round(overallScore - baselineSnapshot.overallScore))} điểm
                </strong>
              </span>
            </div>
            <Link
              href="/personal/learning-path"
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold inline-flex items-center gap-1"
            >
              <span>Xem lộ trình phát triển</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </Link>
          </div>
        )}
      </div>

      {/* 2. 5 DigComp Domains Bar Breakdown */}
      <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-md p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-850 pb-3">
          <h3 className="font-bold text-slate-900 dark:text-zinc-100 uppercase text-xs tracking-wide">
            Chi tiết 5 miền năng lực số chuẩn hóa
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
            Chuẩn đạt mục tiêu: &ge; 70%
          </span>
        </div>

        <div className="space-y-4">
          {domains.map((dom) => {
            const hasScore = dom.score !== null;
            const scoreVal = dom.score ?? 0;
            const isPassed = hasScore && scoreVal >= 70;

            return (
              <div
                key={dom.domainCode}
                className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/60 space-y-2.5 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                      Miền {dom.domainCode}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100">
                      {dom.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {hasScore ? (
                      <>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            isPassed
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {dom.level} ({scoreVal}%)
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-sm">
                          {scoreVal}/100
                        </span>
                      </>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200/80 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700">
                        Chưa có bằng chứng đánh giá
                      </span>
                    )}
                  </div>
                </div>

                {/* Performance Bar */}
                <div className="space-y-1">
                  <div className="h-2.5 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden relative">
                    {/* 70% Target benchmark marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-zinc-500 z-10"
                      style={{ left: '70%' }}
                      title="Mục tiêu chuẩn đạt: 70%"
                    />
                    {hasScore && (
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isPassed ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-blue-600 dark:bg-blue-400'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, scoreVal))}%` }}
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                    <span>0%</span>
                    <span className="font-semibold text-slate-500 dark:text-zinc-400">Chuẩn đạt: 70%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!hasAnyAssessment && (
          <div className="p-4 rounded-md border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/40 text-xs text-blue-900 dark:text-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <strong>Chưa có dữ liệu khảo thí:</strong> Hãy hoàn thành bài đánh giá đầu vào chuẩn hóa để hệ thống phân tích và kiến tạo hồ sơ năng lực số cho bạn.
            </div>
            <Link
              href="/personal/assessments"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shrink-0"
            >
              <Play className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Làm bài đánh giá</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
