'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import {
  Compass,
  CheckCircle2,
  Clock,
  RotateCcw,
  ChevronDown,
  Check,
  Lock,
  ArrowRight,
  Loader2,
  HelpCircle,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { CompetencyRadarChart, DomainScore } from '@/components/dashboard/learner/CompetencyRadarChart';

interface RoadmapStep {
  id: string;
  stepNumber: number;
  domainCode: string;
  competencyCode: string;
  skillName: string;
  title: string;
  description: string;
  durationMinutes: number;
  pointReward: number;
  status: 'completed' | 'in_progress' | 'locked';
  completedAt?: string;
  contentMarkdown: string;
}

interface LearningModuleRow {
  id: string;
  domain_code?: string;
  skill_code?: string;
  title: string;
  description?: string;
  duration_minutes?: number;
  point_reward?: number;
  content_markdown?: string;
  order_index?: number;
}

interface UserProgressRow {
  module_id: string;
  is_completed: boolean;
  completed_at?: string;
}

interface AIStatusState {
  loading: boolean;
  connected: boolean;
  model?: string;
  latencyMs?: number;
  error?: string;
}

interface AIAnalysisData {
  id?: string;
  overallLevel?: string;
  overallSummary?: string;
  pedagogicalFeedback?: string;
  strengths?: string[];
  weaknesses?: string[];
  skillGaps?: Array<{ skillId?: string; skillCode?: string; skillName?: string; score?: number; gapPercentage?: number; description?: string }>;
  learningPathway?: Array<{ stepNumber: number; title: string; objective: string; duration: string }>;
}

interface CompetencyProfileData {
  hasTakenAssessment?: boolean;
  totalAssessmentsCompleted?: number;
  latestSubmissionId?: string | null;
  overallScore: number;
  radarData: DomainScore[];
  insights?: {
    strongest: { code: string; name: string; score: number; level: string } | null;
    weakest: { code: string; name: string; score: number; level: string; isGap: boolean } | null;
  } | null;
  latestAnalysis?: AIAnalysisData | null;
}

function LearningPathContent() {
  const supabase = createClient();
  const [steps, setSteps] = useState<RoadmapStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // AI Connection State
  const [aiStatus, setAiStatus] = useState<AIStatusState>({
    loading: true,
    connected: false,
  });

  // Competency Profile & Radar State
  const [competencyProfile, setCompetencyProfile] = useState<CompetencyProfileData | null>(null);

  // Interactive AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // 1. Check AI Connection Status
  const checkAIConnection = useCallback(async () => {
    setAiStatus((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/ai/status');
      const data = await res.json();
      if (res.ok && data.connected) {
        setAiStatus({
          loading: false,
          connected: true,
          model: data.model || 'gemini-3.8-flash',
          latencyMs: data.latencyMs,
        });
      } else {
        setAiStatus({
          loading: false,
          connected: false,
          model: data.model,
          error: data.error || 'Không phản hồi từ Gemini API',
        });
      }
    } catch (err) {
      setAiStatus({
        loading: false,
        connected: false,
        error: err instanceof Error ? err.message : 'Lỗi kết nối máy chủ',
      });
    }
  }, []);

  // 2. Fetch Competency Profile for Radar & Insights
  const fetchCompetencyProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/learner/competency-profile');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setCompetencyProfile(json);
          if (json.latestAnalysis) {
            setAiAnalysis(json.latestAnalysis);
          }
        }
      }
    } catch {
      // Fallback handled by component defaults
    }
  }, []);

  // Trigger On-Demand AI Analysis
  const handleTriggerAIAnalysis = async () => {
    if (!competencyProfile?.latestSubmissionId) {
      setToastMessage('Bạn chưa hoàn thành bài khảo thí nào để AI phân tích.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await fetch('/api/ai/analyze-competency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: competencyProfile.latestSubmissionId }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.analysis) {
        setAiAnalysis(data.analysis);
        setToastMessage('Hệ thống AI đã hoàn tất nhận xét sư phạm và cập nhật lộ trình cá nhân hóa!');
        setTimeout(() => setToastMessage(null), 5000);
      } else {
        setAnalysisError(data.error || 'Không thể tạo nhận xét từ AI lúc này.');
      }
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ khi gọi AI');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 3. Fetch Learning Modules & User Progress
  const fetchLearningPath = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: modulesData } = await supabase
        .from('learning_modules')
        .select('*')
        .eq('is_published', true)
        .order('order_index', { ascending: true });

      const userProgressMap = new Map<string, UserProgressRow>();
      if (user) {
        const { data: progressData } = await supabase
          .from('user_learning_progress')
          .select('*')
          .eq('user_id', user.id);

        ((progressData as UserProgressRow[]) || []).forEach((p) => {
          userProgressMap.set(p.module_id, p);
        });
      }

      const rows = (modulesData as LearningModuleRow[]) || [];
      const mapped: RoadmapStep[] = rows.map((m, idx) => {
        const prog = userProgressMap.get(m.id);
        const isCompleted = prog?.is_completed;

        let status: 'completed' | 'in_progress' | 'locked' = 'locked';
        if (isCompleted) {
          status = 'completed';
        } else if (idx === 0 || (idx > 0 && userProgressMap.get(rows[idx - 1]?.id)?.is_completed)) {
          status = 'in_progress';
        }

        return {
          id: m.id,
          stepNumber: idx + 1,
          domainCode: m.domain_code || `D${idx + 1}`,
          competencyCode: m.skill_code || `${idx + 1}.1`,
          skillName: m.skill_code ? `Kỹ năng ${m.skill_code}` : 'Kỹ năng số cốt lõi',
          title: m.title,
          description: m.description || 'Chuyên đề bồi dưỡng năng lực số theo khung chuẩn DigComp 3.0.',
          durationMinutes: m.duration_minutes || 20,
          pointReward: m.point_reward || 30,
          status,
          completedAt: prog?.completed_at ? new Date(prog.completed_at).toLocaleDateString('vi-VN') : undefined,
          contentMarkdown: m.content_markdown || 'Nội dung học liệu đang được biên tập.',
        };
      });

      setSteps(mapped);
      if (mapped.length > 0) {
        const firstActive = mapped.find((s) => s.status === 'in_progress') || mapped[0];
        setExpandedStepId(firstActive.id);
      }
    } catch (err) {
      console.error('Error loading learning path:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    checkAIConnection();
    fetchCompetencyProfile();
    fetchLearningPath();
  }, [checkAIConnection, fetchCompetencyProfile, fetchLearningPath]);

  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  const handleCompleteStep = async (stepId: string) => {
    const targetStep = steps.find((s) => s.id === stepId);
    if (!targetStep) return;

    try {
      const res = await fetch('/api/learning/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: stepId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setToastMessage(data.error || 'Không thể ghi nhận hoàn thành bài học.');
        setTimeout(() => setToastMessage(null), 4000);
        return;
      }

      setSteps((prev) =>
        prev.map((step, idx) => {
          if (step.id === stepId) {
            return { ...step, status: 'completed', completedAt: 'Vừa xong' };
          }
          if (idx > 0 && prev[idx - 1].id === stepId && step.status === 'locked') {
            return { ...step, status: 'in_progress' };
          }
          return step;
        })
      );

      setToastMessage(data.message || 'Tuyệt vời! Bạn đã hoàn thành học liệu, nhận điểm thưởng và mở khóa bước tiếp theo.');
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      console.error('Error completing module:', err);
      setToastMessage('Lỗi kết nối khi lưu tiến độ học tập.');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header & AI Connectivity Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              LỘ TRÌNH PHÁT TRIỂN NĂNG LỰC SỐ
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Lộ Trình Bồi Dưỡng &amp; Khung Năng Lực AI
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi sơ đồ radar 5 miền, nhận xét sư phạm AI và học tập các chuyên đề bồi dưỡng khoảng trống kỹ năng (&lt; 70%).
          </p>
        </div>

        {/* AI Live Status Badge */}
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1.5 rounded-md border text-xs font-medium flex items-center gap-2 shadow-2xs transition-colors ${
              aiStatus.loading
                ? 'bg-slate-50 border-slate-200 text-slate-500'
                : aiStatus.connected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            {aiStatus.loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
            ) : aiStatus.connected ? (
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            )}

            <span>
              {aiStatus.loading
                ? 'Đang kiểm tra hệ thống AI...'
                : aiStatus.connected
                ? 'Hệ thống Đánh giá AI • Sẵn sàng'
                : 'Hệ thống AI • Ngoại tuyến'}
            </span>

            <button
              type="button"
              onClick={checkAIConnection}
              disabled={aiStatus.loading}
              title="Kiểm tra lại kết nối AI"
              className="ml-1 p-0.5 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${aiStatus.loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <Link
            href="/learner/assessments"
            className="px-3.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Đánh giá lại</span>
          </Link>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-medium shadow-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.75} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Top Section: Radar Chart + Interactive AI Pedagogical Review */}
      <div className="p-6 rounded-md border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Sơ đồ năng lực 5 miền &amp; Chẩn đoán AI
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Phân tích trực quan mạng nhện DigComp 3.0 và nhận xét chẩn đoán sư phạm trực tiếp từ AI.
            </p>
          </div>
          <Link
            href="/learner/competency/analysis"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Xem trang phân tích đầy đủ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
          {/* Radar Chart (6 cols) */}
          <div className="lg:col-span-6 flex justify-center py-2">
            <CompetencyRadarChart data={competencyProfile?.radarData} size={320} />
          </div>

          {/* Interactive AI Diagnostic Column (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-5 rounded-md bg-slate-50 border border-slate-200 space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Nhận xét Sư phạm &amp; Chẩn đoán AI
                  </span>
                  {aiAnalysis && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Đã chẩn đoán
                    </span>
                  )}
                </div>
                <span className="font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-200 font-mono">
                  {competencyProfile?.hasTakenAssessment
                    ? `Điểm: ${competencyProfile.overallScore}/100`
                    : 'Chưa khảo thí'}
                </span>
              </div>

              {/* Case 1: Learner hasn't completed any assessment */}
              {!competencyProfile?.hasTakenAssessment ? (
                <div className="space-y-3 py-2">
                  <div className="p-3.5 rounded-md bg-white border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
                      <Compass className="w-4 h-4 text-sky-600" />
                      <span>Sơ đồ 5 miền đang ở mức khởi điểm 0%</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      Bạn chưa hoàn thành bài khảo thí nào. Hãy làm bài khảo thí đầu tiên để hệ thống ghi nhận điểm thực và kích hoạt nhận xét sư phạm cá nhân hóa từ AI.
                    </p>
                  </div>
                  <Link
                    href="/learner/assessments"
                    className="w-full py-2.5 px-4 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <span>Làm bài khảo thí ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : isAnalyzing ? (
                /* Case 2: AI is currently analyzing */
                <div className="py-8 text-center space-y-3">
                  <Loader2 className="w-7 h-7 text-sky-600 animate-spin mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-900">AI đang phân tích dữ liệu khảo thí...</p>
                    <p className="text-[11px] text-slate-500">Đang đối chiếu rubric DigComp 3.0 và tạo nhận xét sư phạm.</p>
                  </div>
                </div>
              ) : aiAnalysis ? (
                /* Case 3: AI analysis is available */
                <div className="space-y-3">
                  {/* Overall Pedagogical Feedback */}
                  <div className="p-3 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] leading-relaxed">
                    <span className="font-semibold text-slate-900 block mb-1">
                      Nhận xét tổng thể ({aiAnalysis.overallLevel || 'Đạt chuẩn'}):
                    </span>
                    {aiAnalysis.pedagogicalFeedback || aiAnalysis.overallSummary || 'Người học đã hoàn thành bài thi với kết quả được ghi nhận trên hệ thống.'}
                  </div>

                  {/* Strengths */}
                  {aiAnalysis.strengths && aiAnalysis.strengths.length > 0 && (
                    <div className="space-y-1">
                      <span className="font-semibold text-slate-900 text-[11px] block">Miền thế mạnh:</span>
                      <div className="space-y-1">
                        {aiAnalysis.strengths.slice(0, 2).map((s, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                            <span>{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weaknesses / Gaps */}
                  {((aiAnalysis.weaknesses && aiAnalysis.weaknesses.length > 0) || (aiAnalysis.skillGaps && aiAnalysis.skillGaps.length > 0)) && (
                    <div className="space-y-1 pt-1">
                      <span className="font-semibold text-amber-900 text-[11px] block">Khoảng trống cần cải thiện:</span>
                      <div className="space-y-1">
                        {(aiAnalysis.weaknesses || []).slice(0, 2).map((w, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px] text-amber-800 bg-[#FEF3C7]/60 p-2 rounded border border-[#FDE68A]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1 shrink-0" />
                            <span>{w}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleTriggerAIAnalysis}
                      disabled={isAnalyzing}
                      className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Phân tích lại</span>
                    </button>
                    <a
                      href="#roadmap-steps"
                      className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors inline-flex items-center gap-1"
                    >
                      <span>Xem lộ trình bồi dưỡng</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : (
                /* Case 4: Assessment completed, ready for AI trigger */
                <div className="space-y-3.5">
                  <div className="p-3.5 rounded-md bg-white border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Sẵn sàng chẩn đoán năng lực với AI</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      Hệ thống đã ghi nhận điểm thi của bạn. Nhấn nút bên dưới để AI tiến hành nhận xét sư phạm chi tiết, chỉ ra điểm mạnh, điểm yếu và gợi ý chuyên đề khắc phục khoảng trống năng lực.
                    </p>
                  </div>

                  {analysisError && (
                    <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{analysisError}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleTriggerAIAnalysis}
                    disabled={isAnalyzing}
                    className="w-full py-2.5 px-4 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Kích hoạt AI Nhận xét &amp; Đề xuất Lộ trình</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Section: Roadmap 4-Step Breakdown Placed Below */}
      <div id="roadmap-steps" className="space-y-4 pt-2">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Lộ Trình Bồi Dưỡng Khoảng Trống Năng Lực (4 Bước)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chuyên đề học tập tự định hướng theo chuẩn DigComp 3.0, hoàn thành từng bước để mở khóa bước kế tiếp.
            </p>
          </div>
        </div>

        {/* Gap Domains Highlight Banner */}
        {competencyProfile?.hasTakenAssessment && (
          (() => {
            const gapDomains = competencyProfile.radarData.filter((d) => d.score < 70);
            if (gapDomains.length === 0) {
              return (
                <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                  <span>Xuất sắc! Cả 5 miền năng lực của bạn đều đạt chuẩn &ge; 70%. Bạn có thể tiếp tục học các chuyên đề nâng cao bên dưới.</span>
                </div>
              );
            }
            return (
              <div className="p-4 rounded-md bg-amber-50/70 border border-amber-200 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span>Gợi ý ưu tiên bồi dưỡng khoảng trống năng lực ({gapDomains.length} miền &lt; 70%)</span>
                </div>
                <p className="text-xs text-amber-800">
                  Dựa trên kết quả chẩn đoán, người học còn đang yếu ở các miền sau. Hệ thống khuyến nghị ưu tiên học tập các chuyên đề tương ứng:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {gapDomains.map((d) => (
                    <span
                      key={d.code}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white text-slate-800 border border-amber-300 text-xs font-medium shadow-2xs"
                    >
                      <span className="font-mono font-bold text-amber-700">{d.code}</span>
                      <span>{d.name}</span>
                      <span className="font-mono text-slate-500">({d.score}% / 70%)</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })()
        )}


        {/* Step Cards List */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-sky-600 mb-2" strokeWidth={1.75} />
              <p className="text-xs">Đang tải chuyên đề bồi dưỡng từ CSDL Supabase...</p>
            </div>
          ) : steps.length === 0 ? (
            <div className="p-12 text-center rounded-md border border-slate-200 bg-white">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" strokeWidth={1.75} />
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Chưa có học phần bồi dưỡng</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Hệ thống đang chuẩn bị các học liệu bồi dưỡng theo chuẩn DigComp 3.0.
              </p>
            </div>
          ) : (
            steps.map((step) => {
              const isExpanded = expandedStepId === step.id;
              const isCompleted = step.status === 'completed';
              const isLocked = step.status === 'locked';
              const isInProgress = step.status === 'in_progress';
              const isGapStep =
                competencyProfile?.hasTakenAssessment &&
                competencyProfile.radarData.some((d) => d.code === step.domainCode && d.score < 70);

              return (
                <div
                  key={step.id}
                  className={`rounded-md border transition-all bg-white shadow-xs overflow-hidden ${
                    isInProgress
                      ? 'border-sky-300 ring-1 ring-sky-200'
                      : isCompleted
                      ? 'border-emerald-200'
                      : 'border-slate-200 opacity-80'
                  }`}
                >
                  {/* Step Header */}
                  <div
                    onClick={() => !isLocked && setExpandedStepId(isExpanded ? null : step.id)}
                    className={`p-4 flex items-start sm:items-center justify-between gap-3 cursor-pointer select-none ${
                      isExpanded ? 'bg-slate-50/50 border-b border-slate-100' : ''
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs font-mono ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isInProgress
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : isLocked ? (
                          <Lock className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                        ) : (
                          step.stepNumber
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                            {step.competencyCode}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium truncate">
                            {step.skillName}
                          </span>
                          {isGapStep && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                              Cần cải thiện ({step.domainCode})
                            </span>
                          )}
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {step.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-xs">
                      <div className="hidden sm:flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>{step.durationMinutes}p</span>
                      </div>

                      <div className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded text-emerald-700 bg-emerald-50 border border-emerald-200">
                        +{step.pointReward} điểm
                      </div>

                      {!isLocked && (
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                          strokeWidth={1.75}
                        />
                      )}
                    </div>
                  </div>

                  {/* Step Body */}
                  {isExpanded && !isLocked && (
                    <div className="p-5 space-y-4 bg-white text-xs leading-relaxed text-slate-700">
                      <p className="text-slate-600">{step.description}</p>

                      <div className="p-4 rounded-md bg-slate-50 border border-slate-200 font-mono text-xs whitespace-pre-line leading-relaxed text-slate-800">
                        {step.contentMarkdown}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-[11px] text-slate-400 font-mono">
                          {isCompleted && step.completedAt && (
                            <span>Hoàn thành ngày: {step.completedAt}</span>
                          )}
                        </div>

                        {!isCompleted ? (
                          <button
                            onClick={() => handleCompleteStep(step.id)}
                            className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Đánh dấu đã hoàn thành</span>
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                            <span>Đã đạt yêu cầu</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function LearnerLearningPathPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-xs text-slate-400">
          Đang tải lộ trình bồi dưỡng...
        </div>
      }
    >
      <LearningPathContent />
    </Suspense>
  );
}
