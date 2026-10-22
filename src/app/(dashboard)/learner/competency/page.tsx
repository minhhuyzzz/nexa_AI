'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Compass,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Award,
  Layers,
  ChevronRight,
  BookOpen,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface DomainProgress {
  domainCode: string;
  name: string;
  score: number;
  level: string;
  competenciesCount: number;
  completedCount: number;
  status: 'MASTERED' | 'PROFICIENT' | 'NEEDS_IMPROVEMENT' | 'UNASSESSED';
}

export default function LearnerCompetencyHubPage() {
  const supabase = createClient();
  const [domains, setDomains] = useState<DomainProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasTakenAssessment, setHasTakenAssessment] = useState(false);

  const fetchCompetencyData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Fetch live domains and competencies
      const { data: domainsData } = await supabase
        .from('competency_domains')
        .select(`
          id,
          code,
          title,
          domain_index,
          competencies (
            id,
            skill_code,
            title
          )
        `)
        .order('domain_index', { ascending: true });

      // 2. Fetch latest competency analysis for user
      let analysis: any = null;
      if (user) {
        const { data: analysisData } = await supabase
          .from('competency_analyses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        analysis = analysisData;
      }

      const radar = (analysis?.radar_data as Record<string, number>) || {};
      const hasAnalysis = Boolean(analysis);
      setHasTakenAssessment(hasAnalysis);

      const mapped: DomainProgress[] = (domainsData || []).map((dom: any, idx: number) => {
        const compCount = dom.competencies?.length || 4;
        const domainKey = dom.code || `D${idx + 1}`;
        const score = hasAnalysis ? (radar[domainKey] || radar[`Miền ${idx + 1}`] || 75) : 0;
        
        let level = 'Chưa khảo thí';
        let status: DomainProgress['status'] = 'UNASSESSED';

        if (hasAnalysis) {
          if (score >= 80) {
            level = 'Advanced';
            status = 'MASTERED';
          } else if (score >= 60) {
            level = 'Intermediate';
            status = 'PROFICIENT';
          } else {
            level = 'Basic';
            status = 'NEEDS_IMPROVEMENT';
          }
        }

        return {
          domainCode: dom.code || `0${idx + 1}`,
          name: dom.title,
          score,
          level,
          competenciesCount: compCount,
          completedCount: hasAnalysis ? (score >= 60 ? compCount : Math.floor(compCount / 2)) : 0,
          status,
        };
      });

      setDomains(mapped);
    } catch (err) {
      console.error('Error fetching competency data:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchCompetencyData();
  }, [fetchCompetencyData]);

  const averageScore = domains.length > 0
    ? Math.round(domains.reduce((sum, d) => sum + d.score, 0) / domains.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              KHUNG NĂNG LỰC SỐ
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Hồ Sơ Năng Lực Số Cá Nhân
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Bản đồ đánh giá năng lực qua 5 miền và 21 kỹ năng số thành phần với dữ liệu khảo thí thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/learner/competency/analysis"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <Sparkles className="w-4 h-4" strokeWidth={1.75} />
            <span>Phân tích AI &amp; Lộ trình</span>
          </Link>
        </div>
      </div>

      {/* Banner if unassessed */}
      {!hasTakenAssessment && !loading && (
        <div className="p-4 rounded-md bg-sky-50 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4 text-sky-700" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-sky-900">
                Bạn chưa thực hiện bài khảo thí năng lực số nào
              </h3>
              <p className="text-[11px] text-sky-700 mt-0.5">
                Hãy hoàn thành bài đánh giá 10 câu trắc nghiệm để hệ thống AI lập bản đồ 5 miền năng lực cho bạn.
              </p>
            </div>
          </div>

          <Link
            href="/learner/assessments"
            className="px-3.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors shrink-0 shadow-xs"
          >
            <span>Làm bài khảo thí ngay</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          </Link>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Điểm năng lực tổng thể</div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums mt-1">
            {loading ? '-' : averageScore}
            <span className="text-sm font-normal text-slate-400 ml-1">/ 100</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
            {hasTakenAssessment ? 'Dựa trên đợt khảo thí gần nhất' : 'Chưa có dữ liệu khảo thí'}
          </div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Kỹ năng đã hoàn thành</div>
          <div className="text-3xl font-extrabold text-sky-600 font-mono tabular-nums mt-1">
            {loading ? '-' : domains.reduce((sum, d) => sum + d.completedCount, 0)}
            <span className="text-sm font-normal text-slate-400 ml-1">/ 21 kỹ năng</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Chuẩn hóa theo khung DigComp 3.0</div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Khoảng trống cần bồi dưỡng (&lt; 60%)</div>
          <div className="text-3xl font-extrabold text-amber-600 font-mono tabular-nums mt-1">
            {loading ? '-' : domains.filter((d) => d.score < 60 && d.status !== 'UNASSESSED').length}
            <span className="text-sm font-normal text-slate-400 ml-1">miền năng lực</span>
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            Được phát hiện tự động bởi AI Gateway
          </div>
        </div>
      </div>

      {/* 5 Domains Grid */}
      <div className="space-y-4">
        <div className="text-xs uppercase tracking-wider text-slate-500 font-bold font-mono">
          Tiến Độ 5 Miền Năng Lực Số
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-sky-600 mb-2" strokeWidth={1.75} />
            <p className="text-xs">Đang tải khung năng lực từ CSDL Supabase...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {domains.map((dom) => (
              <div
                key={dom.domainCode}
                className="p-4 rounded-md border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-mono font-bold">
                      {dom.domainCode}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{dom.name}</h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-medium font-mono">{dom.level}</span>
                    <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
                      {dom.score}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      dom.score >= 80
                        ? 'bg-emerald-600'
                        : dom.score >= 60
                        ? 'bg-sky-600'
                        : dom.score > 0
                        ? 'bg-amber-500'
                        : 'bg-slate-200'
                    }`}
                    style={{ width: `${Math.max(dom.score, 2)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>
                    Đã đạt {dom.completedCount}/{dom.competenciesCount} kỹ năng thành phần
                  </span>

                  {dom.status === 'UNASSESSED' ? (
                    <Link
                      href="/learner/assessments"
                      className="text-sky-600 font-semibold inline-flex items-center gap-1 hover:underline"
                    >
                      <span>Làm bài khảo thí để đánh giá</span>
                      <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </Link>
                  ) : dom.score < 60 ? (
                    <Link
                      href="/learner/learning-path"
                      className="text-amber-700 font-semibold inline-flex items-center gap-1 hover:underline"
                    >
                      <span>Luyện tập lấp khoảng trống</span>
                      <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </Link>
                  ) : (
                    <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      Đạt chuẩn năng lực
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
