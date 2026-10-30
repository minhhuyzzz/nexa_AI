'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import {
  Compass,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Check,
  ArrowRight,
  ExternalLink,
  Loader2,
  HelpCircle,
  Sparkles,
  RefreshCw,
  AlertCircle,
  BookOpen,
  Award,
  Globe,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { DomainScore } from '@/components/dashboard/personal/CompetencyRadarChart';
import { CuratedCourse } from '@/features/courses/data/curated-courses';

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
  status: 'completed' | 'in_progress';
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
  overallScore: number | null;
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
  const [curatedCourses, setCuratedCourses] = useState<CuratedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // AI Connection State
  const [aiStatus, setAiStatus] = useState<AIStatusState>({
    loading: true,
    connected: false,
  });

  // Competency Profile State
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

  // 2. Fetch Competency Profile
  const fetchCompetencyProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/personal/competency-profile');
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

  // 3. Fetch Curated External Courses
  const fetchCuratedCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/courses');
      if (res.ok) {
        const json = await res.json();
        setCuratedCourses(json.courses || []);
      }
    } catch {
      // Fallback
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

  // 4. Fetch Learning Modules & User Progress
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

        return {
          id: m.id,
          stepNumber: idx + 1,
          domainCode: m.domain_code || `D${(idx % 5) + 1}`,
          competencyCode: m.skill_code || `${(idx % 5) + 1}.1`,
          skillName: m.skill_code ? `Kỹ năng ${m.skill_code}` : 'Kỹ năng số cốt lõi',
          title: m.title,
          description: m.description || 'Chuyên đề bồi dưỡng năng lực số theo khung chuẩn DigComp 3.0.',
          durationMinutes: m.duration_minutes || 20,
          pointReward: m.point_reward || 30,
          status: isCompleted ? 'completed' : 'in_progress',
          completedAt: prog?.completed_at ? new Date(prog.completed_at).toLocaleDateString('vi-VN') : undefined,
          contentMarkdown: m.content_markdown || 'Nội dung học liệu đang được biên tập.',
        };
      });

      setSteps(mapped);
    } catch (err) {
      console.error('Error loading learning path:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    checkAIConnection();
    fetchCompetencyProfile();
    fetchCuratedCourses();
    fetchLearningPath();
  }, [checkAIConnection, fetchCompetencyProfile, fetchCuratedCourses, fetchLearningPath]);

  const completedCount = steps.filter((s) => s.status === 'completed').length;

  const handleCompleteStep = async (stepId: string) => {
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
        prev.map((step) => {
          if (step.id === stepId) {
            return { ...step, status: 'completed', completedAt: 'Vừa xong' };
          }
          return step;
        })
      );

      setToastMessage(data.message || 'Tuyệt vời! Bạn đã hoàn thành học liệu và nhận điểm thưởng rèn luyện.');
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      console.error('Error completing module:', err);
      setToastMessage('Lỗi kết nối khi lưu tiến độ học tập.');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const radarData = competencyProfile?.radarData || [
    { code: 'D1', name: 'Thông tin & Dữ liệu', score: null, target: 70 },
    { code: 'D2', name: 'Giao tiếp & Hợp tác', score: null, target: 70 },
    { code: 'D3', name: 'Sáng tạo Nội dung số', score: null, target: 70 },
    { code: 'D4', name: 'An toàn & Bảo mật', score: null, target: 70 },
    { code: 'D5', name: 'Giải quyết Vấn đề', score: null, target: 70 },
  ];

  const assessedDomains = radarData.filter((d) => d.score !== null);
  const gapDomains = assessedDomains.filter((d) => (d.score as number) < 70);
  const proficientDomains = assessedDomains.filter((d) => (d.score as number) >= 70);
  const unassessedDomains = radarData.filter((d) => d.score === null);

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              LỘ TRÌNH PHÁT TRIỂN NĂNG LỰC SỐ
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Lộ Trình Của Tôi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Củng cố 5 miền năng lực số DigComp: học liệu thực hành trong NEXA kết hợp khóa học tuyển chọn từ nguồn uy tín.
          </p>
        </div>

        {/* On-Demand AI Action Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTriggerAIAnalysis}
            disabled={isAnalyzing || !competencyProfile?.hasTakenAssessment}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors shadow-xs"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} />
                <span>AI đang phân tích...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-sky-200" strokeWidth={1.75} />
                <span>Phân tích AI theo yêu cầu</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-md bg-slate-900 text-white text-xs font-medium flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white text-xs ml-4 font-mono">
            Đóng
          </button>
        </div>
      )}

      {/* Error notification */}
      {analysisError && (
        <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" strokeWidth={1.75} />
            <span>{analysisError}</span>
          </div>
          <button onClick={() => setAnalysisError(null)} className="text-rose-500 hover:text-rose-700 text-xs font-mono">
            Bỏ qua
          </button>
        </div>
      )}

      {/* 2. Overview Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Miền đã đánh giá</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums mt-1">
            {assessedDomains.length}
            <span className="text-sm font-normal text-slate-400 ml-1">/ 5 miền</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Khảo thí chuẩn hóa theo DigComp</div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Khoảng trống cần bồi dưỡng (&lt; 70%)</div>
          <div className="text-2xl font-extrabold text-amber-600 font-mono tabular-nums mt-1">
            {gapDomains.length}
            <span className="text-sm font-normal text-slate-400 ml-1">miền ưu tiên</span>
          </div>
          <div className="text-[11px] text-amber-700 mt-1">Dựa trên kết quả khảo thí thực tế</div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Học phần NEXA hoàn thành</div>
          <div className="text-2xl font-extrabold text-sky-600 font-mono tabular-nums mt-1">
            {completedCount}
            <span className="text-sm font-normal text-slate-400 ml-1">/ {steps.length} bài</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Học tự do không khóa tuần tự</div>
        </div>
      </div>

      {/* AI Pedagogical Feedback Box (if available) */}
      {aiAnalysis && (
        <div className="p-4 rounded-md bg-sky-50/60 border border-sky-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-900">
            <Sparkles className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
            <span>Đánh Giá Sư Phạm Từ AI Gateway ({aiAnalysis.overallLevel || 'INTERMEDIATE'})</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            {aiAnalysis.pedagogicalFeedback || aiAnalysis.overallSummary || 'Hệ thống đã cập nhật gợi ý lộ trình bồi dưỡng.'}
          </p>
        </div>
      )}

      {/* 3. Section: PRIORITY GAP DOMAINS (< 70%) */}
      {gapDomains.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
              Miền Năng Lực Cần Ưu Tiên Cải Thiện (&lt; 70%)
            </h2>
          </div>

          <div className="space-y-4">
            {gapDomains.map((dom) => {
              const domModules = steps.filter((s) => s.domainCode === dom.code);
              const domCourses = curatedCourses.filter((c) => c.domain_codes.includes(dom.code));

              return (
                <div
                  key={dom.code}
                  className="rounded-md border border-amber-200 bg-white shadow-xs overflow-hidden"
                >
                  {/* Domain Header */}
                  <div className="p-4 bg-amber-50/40 border-b border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 text-xs font-mono font-bold">
                        {dom.code}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{dom.name}</h3>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Điểm hiện tại: <strong className="font-mono">{dom.score}%</strong> / Chuẩn mục tiêu 70%
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/personal/assessments"
                      className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
                    >
                      <span>Đánh giá lại miền này</span>
                      <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </Link>
                  </div>

                  {/* 2-Column Pathway */}
                  <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Column A: Học liệu thực hành trong NEXA */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 pb-1 border-b border-slate-100">
                        <BookOpen className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
                        <span>Học liệu thực hành trên NEXA</span>
                      </div>

                      {domModules.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Đang cập nhật học liệu NEXA cho miền này.</p>
                      ) : (
                        <div className="space-y-2">
                          {domModules.map((mod) => (
                            <div
                              key={mod.id}
                              className="p-3 rounded-md border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="text-xs font-bold text-slate-900">{mod.title}</h4>
                                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{mod.description}</p>
                                </div>
                                {mod.status === 'completed' && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                    Đã học
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
                                  <span>{mod.durationMinutes} phút</span>
                                </span>

                                <div className="flex items-center gap-2">
                                  {mod.status !== 'completed' && (
                                    <button
                                      type="button"
                                      onClick={() => handleCompleteStep(mod.id)}
                                      className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-semibold transition-colors shadow-2xs"
                                    >
                                      Đánh dấu đã học
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Column B: Khóa học tuyển chọn từ đối tác uy tín */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 pb-1 border-b border-slate-100">
                        <Globe className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />
                        <span>Khóa học được tuyển chọn (NEXA Curated)</span>
                      </div>

                      {domCourses.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Chưa có khóa học ngoài được tuyển chọn cho miền này.</p>
                      ) : (
                        <div className="space-y-2">
                          {domCourses.map((crs) => (
                            <div
                              key={crs.id}
                              className="p-3 rounded-md border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">
                                      {crs.provider}
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      {crs.price_type === 'FREE' ? 'Miễn phí' : 'Có phí'}
                                    </span>
                                  </div>
                                  <h4 className="text-xs font-bold text-slate-900">{crs.title}</h4>
                                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{crs.short_description}</p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
                                  <span>{crs.duration}</span>
                                </span>

                                <a
                                  href={crs.official_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors shadow-2xs"
                                >
                                  <span>Xem tại nguồn</span>
                                  <ExternalLink className="w-3 h-3 text-slate-500" strokeWidth={1.75} />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Section: PROFICIENT DOMAINS (>= 70%) */}
      {proficientDomains.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
              Miền Đã Đạt Chuẩn Mục Tiêu (&ge; 70%)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {proficientDomains.map((dom) => (
              <div
                key={dom.code}
                className="p-3.5 rounded-md border border-slate-200 bg-white shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-xs font-mono font-bold">
                    {dom.code}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{dom.name}</h4>
                    <p className="text-[11px] text-emerald-700 font-medium">Đạt chuẩn mục tiêu</p>
                  </div>
                </div>
                <span className="text-sm font-bold font-mono text-slate-900 tabular-nums">
                  {dom.score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Section: UNASSESSED DOMAINS */}
      {unassessedDomains.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 font-mono">
              Miền Chưa Có Dữ Liệu Đánh Giá
            </h2>
          </div>

          <div className="p-4 rounded-md border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-700">
                Bạn còn <strong>{unassessedDomains.length} miền</strong> ({unassessedDomains.map((d) => d.code).join(', ')}) chưa có dữ liệu khảo thí.
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Làm bài đánh giá để hệ thống đo lường và đưa ra gợi ý chính xác thay vì gán nhãn yếu ngẫu nhiên.
              </p>
            </div>
            <Link
              href="/personal/assessments"
              className="px-3.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors shrink-0 shadow-xs"
            >
              <span>Làm bài khảo thí ngay</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LearnerLearningPathPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-sky-600 mb-2" strokeWidth={1.75} />
          <p className="text-xs">Đang tải lộ trình học tập cá nhân...</p>
        </div>
      }
    >
      <LearningPathContent />
    </Suspense>
  );
}
