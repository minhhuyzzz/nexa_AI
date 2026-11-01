'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  ChevronRight,
  ArrowRight,
  Loader2,
  BookOpen,
  Award,
  Database,
  Users,
  Lightbulb,
  Shield,
  Wrench,
  RotateCcw,
  List,
  LayoutGrid,
  Check,
  X,
  Target,
  Trophy,
} from 'lucide-react';
import { DomainScore } from '@/components/dashboard/personal/CompetencyRadarChart';
import { LearningPathHeroIllustration } from '@/components/dashboard/personal/LearningPathHeroIllustration';
import { EditGoalModal, UserLearningGoal } from '@/components/dashboard/personal/EditGoalModal';

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

interface CompetencyProfileData {
  hasTakenAssessment?: boolean;
  totalAssessmentsCompleted?: number;
  latestSubmissionId?: string | null;
  overallScore: number | null;
  radarData: DomainScore[];
}

function normalizeDomainCode(rawCode?: string | null): string {
  if (!rawCode) return 'D1';
  const clean = rawCode.trim().toUpperCase();
  if (clean.startsWith('DOMAIN_')) {
    return `D${clean.replace('DOMAIN_', '')}`;
  }
  if (clean.startsWith('DOMAIN')) {
    return `D${clean.replace('DOMAIN', '')}`;
  }
  if (/^D[1-5]$/.test(clean)) {
    return clean;
  }
  return clean;
}

function LearningPathContent() {
  const [steps, setSteps] = useState<RoadmapStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLessonModal, setActiveLessonModal] = useState<RoadmapStep | null>(null);
  const [expandedDomain, setExpandedDomain] = useState<string | null>('D1');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Learning Goal State & Modal
  const [learningGoal, setLearningGoal] = useState<UserLearningGoal>({
    title: 'Nâng cao kỹ năng sử dụng công nghệ trong học tập và công việc',
    track: 'Lộ trình cơ bản',
    pace: 'Học theo tốc độ riêng',
  });
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);

  // Competency Profile State
  const [competencyProfile, setCompetencyProfile] = useState<CompetencyProfileData | null>(null);

  // 1. Fetch Competency Profile
  const fetchCompetencyProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/personal/competency-profile', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.profile) {
          setCompetencyProfile(json.profile);
        }
      }
    } catch {
      // Fallback
    }
  }, []);

  // 2. Fetch Learning Modules & User Progress via Server API
  const fetchLearningPath = useCallback(async () => {
    try {
      const res = await fetch('/api/personal/learning-path', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.modules) && json.modules.length > 0) {
          const userProgressMap = new Map<string, any>();
          if (Array.isArray(json.progress)) {
            json.progress.forEach((p: any) => userProgressMap.set(p.module_id, p));
          }

          const mapped: RoadmapStep[] = json.modules.map((m: any, idx: number) => {
            const prog = userProgressMap.get(m.id);
            const isCompleted = prog?.is_completed;
            const normDomain = normalizeDomainCode(m.domain_code || `D${(idx % 5) + 1}`);

            return {
              id: m.id,
              stepNumber: idx + 1,
              domainCode: normDomain,
              competencyCode: m.skill_code || `${(idx % 5) + 1}.1`,
              skillName: m.skill_code ? `Kỹ năng ${m.skill_code}` : 'Kỹ năng số cốt lõi',
              title: m.title,
              description: m.description || 'Chuyên đề bồi dưỡng năng lực số theo khung chuẩn hóa 5 miền.',
              durationMinutes: m.duration_minutes || 20,
              pointReward: m.point_reward || 30,
              status: isCompleted ? 'completed' : 'in_progress',
              completedAt: prog?.completed_at ? new Date(prog.completed_at).toLocaleDateString('vi-VN') : undefined,
              contentMarkdown: m.content_markdown || 'Nội dung học liệu đang được hoàn thiện.',
            };
          });

          setSteps(mapped);
          return;
        }
      }
    } catch {
      // Graceful fallback to curriculum without error overlay
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. Fetch Learning Goal
  const fetchGoal = useCallback(async () => {
    try {
      const res = await fetch('/api/personal/goals', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.goal) {
          setLearningGoal({
            title: json.goal.title || 'Nâng cao kỹ năng sử dụng công nghệ trong học tập và công việc',
            track: json.goal.track || 'Lộ trình cơ bản',
            pace: json.goal.pace || 'Học theo tốc độ riêng',
          });
        }
      }
    } catch {
      // Fallback
    }
  }, []);

  const handleSaveGoal = async (updatedGoal: UserLearningGoal) => {
    const res = await fetch('/api/personal/goals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedGoal),
    });
    if (!res.ok) {
      throw new Error('Lỗi cập nhật mục tiêu');
    }
    setLearningGoal(updatedGoal);
    setToastMessage('Đã cập nhật mục tiêu học tập thành công!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    fetchCompetencyProfile();
    fetchLearningPath();
    fetchGoal();
  }, [fetchCompetencyProfile, fetchLearningPath, fetchGoal]);

  const totalStepsCount = steps.length;
  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const inProgressCount = steps.filter((s) => s.status === 'in_progress').length;
  const unstartedCount = Math.max(0, totalStepsCount - completedCount - inProgressCount);
  const overallProgressPercent = totalStepsCount > 0 ? Math.min(100, Math.round((completedCount / totalStepsCount) * 100)) : 0;

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

      if (activeLessonModal && activeLessonModal.id === stepId) {
        setActiveLessonModal({
          ...activeLessonModal,
          status: 'completed',
          completedAt: 'Vừa xong',
        });
      }

      setToastMessage(data.message || 'Tuyệt vời! Bạn đã hoàn thành bài học và được cộng điểm PTS.');
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      console.error('Error completing module:', err);
      setToastMessage('Lỗi kết nối khi lưu tiến độ học tập.');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // 5 Standard Digital Competency Domains with dynamic calculation
  const domainDefinitions = [
    {
      code: 'D1',
      number: 1,
      title: 'Thông tin & Dữ liệu',
      desc: 'Tìm kiếm, đánh giá và quản lý thông tin hiệu quả trong môi trường số.',
      icon: Database,
      numBg: 'bg-blue-600',
      iconBoxBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
      badgeBorder: 'border-blue-200 bg-blue-50 text-blue-600',
    },
    {
      code: 'D2',
      number: 2,
      title: 'Giao tiếp & Cộng tác',
      desc: 'Giao tiếp, chia sẻ và làm việc hiệu quả trong môi trường số.',
      icon: Users,
      numBg: 'bg-emerald-600',
      iconBoxBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
      badgeBorder: 'border-slate-200 bg-slate-100 text-slate-500',
    },
    {
      code: 'D3',
      number: 3,
      title: 'Sáng tạo nội dung số',
      desc: 'Tạo và chỉnh sửa nội dung số có trách nhiệm, hiểu bản quyền và giấy phép.',
      icon: Lightbulb,
      numBg: 'bg-amber-500',
      iconBoxBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
      badgeBorder: 'border-slate-200 bg-slate-100 text-slate-500',
    },
    {
      code: 'D4',
      number: 4,
      title: 'An toàn & Bảo mật',
      desc: 'Bảo vệ dữ liệu, thiết bị và tài khoản cá nhân trong không gian mạng.',
      icon: Shield,
      numBg: 'bg-purple-600',
      iconBoxBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
      badgeBorder: 'border-slate-200 bg-slate-100 text-slate-500',
    },
    {
      code: 'D5',
      number: 5,
      title: 'Giải quyết vấn đề',
      desc: 'Ứng dụng công nghệ để giải quyết vấn đề trong học tập và công việc thường nhật.',
      icon: Wrench,
      numBg: 'bg-teal-600',
      iconBoxBg: 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400',
      badgeBorder: 'border-slate-200 bg-slate-100 text-slate-500',
    },
  ];

  const domainMilestones = domainDefinitions.map((d) => {
    const domainSteps = steps.filter((s) => s.domainCode === d.code);
    const totalLessons = domainSteps.length;
    const completedLessons = domainSteps.filter((s) => s.status === 'completed').length;
    let status: 'completed' | 'learning' | 'unstarted' = 'unstarted';
    if (totalLessons > 0 && completedLessons === totalLessons) {
      status = 'completed';
    } else if (completedLessons > 0 || domainSteps.some((s) => s.status === 'in_progress')) {
      status = 'learning';
    }
    return {
      ...d,
      totalLessons,
      completedLessons,
      status,
    };
  });

  const currentLesson =
    steps.find((s) => s.status === 'in_progress') ||
    steps[0] ||
    null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-neutral-900 text-white text-xs font-medium flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2">
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs ml-4 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-850">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
              LỘ TRÌNH PHÁT TRIỂN NĂNG LỰC SỐ
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
            Lộ Trình Của Tôi
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Hành trình học tập được cá nhân hóa theo mục tiêu của bạn. Học theo tốc độ riêng và phát triển toàn diện 5 miền năng lực số.
          </p>
        </div>

        <Link
          href="/personal/assessments"
          className="px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-zinc-200 text-xs font-semibold inline-flex items-center gap-2 transition-colors shadow-2xs shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" strokeWidth={1.75} />
          <span>Đánh giá lại năng lực</span>
        </Link>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Hero Lesson, 5 Milestones, Certificate Card */}
        <div className="lg:col-span-8 space-y-6">
          {/* Hero "ĐANG HỌC" Card (Gradient + Inline 3D Vector Illustration) */}
          <div className="p-6 sm:p-7 rounded-2xl border border-blue-100/90 dark:border-blue-900/40 bg-gradient-to-r from-blue-50/90 via-sky-50/40 to-blue-50/20 dark:from-blue-950/30 dark:to-zinc-900 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-8 space-y-3">
                {currentLesson ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold font-mono uppercase tracking-wider">
                        ĐANG HỌC
                      </span>
                      <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">
                        Bài {currentLesson.stepNumber} / {totalStepsCount}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                      {currentLesson.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
                      {currentLesson.description}
                    </p>

                    <div className="flex items-center gap-5 text-xs text-slate-500 dark:text-neutral-400 flex-wrap pt-1 font-mono">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                        <span>Học liệu</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                        <span>{currentLesson.durationMinutes} phút</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                        <span>+{currentLesson.pointReward} PTS</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveLessonModal(currentLesson)}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
                      >
                        <span>▶ Tiếp tục học</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveLessonModal(currentLesson)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <span>Xem chi tiết &rarr;</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold font-mono uppercase tracking-wider">
                        LỘ TRÌNH 5 MIỀN
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                      Chương trình Bồi dưỡng Năng lực Số
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
                      Lộ trình học tập toàn diện được xây dựng theo chuẩn 5 miền năng lực số quốc gia.
                    </p>

                    <div className="pt-2">
                      <Link
                        href="/personal/assessments"
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/20"
                      >
                        <span>Làm bài khảo thí để xác định lộ trình &rarr;</span>
                      </Link>
                    </div>
                  </>
                )}
              </div>

              {/* 3D Inline Illustration on Right */}
              <div className="hidden md:flex md:col-span-4 justify-center items-center">
                <LearningPathHeroIllustration />
              </div>
            </div>
          </div>

          {/* Section: "Các chặng phát triển năng lực số" */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Các chặng phát triển năng lực số
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  5 miền năng lực giúp bạn phát triển toàn diện trong học tập và công việc.
                </p>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-neutral-100 font-bold shadow-2xs'
                      : 'text-slate-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                >
                  <List className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Dạng danh sách</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-neutral-100 font-bold shadow-2xs'
                      : 'text-slate-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Dạng thẻ</span>
                </button>
              </div>
            </div>

            {/* List / Grid of 5 Milestones */}
            <div className={viewMode === 'list' ? 'space-y-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
              {domainMilestones.map((milestone) => {
                const Icon = milestone.icon;
                const isExpanded = expandedDomain === milestone.code;
                const progressRatio = milestone.totalLessons > 0 ? Math.round((milestone.completedLessons / milestone.totalLessons) * 100) : 0;

                return (
                  <div
                    key={milestone.code}
                    className="rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-slate-300 dark:hover:border-zinc-700 transition-all overflow-hidden"
                  >
                    <div
                      onClick={() => setExpandedDomain(isExpanded ? null : milestone.code)}
                      className="p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Number Indicator with Unique Milestone Color */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 text-white ${milestone.numBg}`}
                        >
                          {milestone.number}
                        </div>

                        {/* Domain Icon Pastel Box */}
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${milestone.iconBoxBg}`}>
                          <Icon className="w-5 h-5" strokeWidth={1.75} />
                        </div>

                        <div className="min-w-0 pr-2">
                          <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 truncate">
                            {milestone.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-neutral-400 truncate mt-0.5">
                            {milestone.desc}
                          </p>

                          {/* Mini Progress */}
                          <div className="flex items-center gap-3 mt-2">
                            <div className="w-28 sm:w-44 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  milestone.completedLessons > 0 ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-300 dark:bg-zinc-700'
                                }`}
                                style={{ width: `${progressRatio}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">
                              {milestone.completedLessons} / {milestone.totalLessons} bài
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {milestone.status === 'completed' ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                            Hoàn thành
                          </span>
                        ) : milestone.status === 'learning' ? (
                          <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs font-semibold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                            Đang học
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-neutral-400 border border-slate-200 dark:border-zinc-700 text-xs font-medium">
                            Chưa bắt đầu
                          </span>
                        )}
                        <ChevronRight
                          className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      </div>
                    </div>

                    {/* Expanded Lessons inside Milestone */}
                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-zinc-850 space-y-2.5 animate-in fade-in-50">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-neutral-500 font-mono block mb-2">
                          Danh sách học phần thuộc {milestone.title}:
                        </span>
                        {steps.filter((s) => s.domainCode === milestone.code).length > 0 ? (
                          steps
                            .filter((s) => s.domainCode === milestone.code)
                            .map((step) => (
                              <div
                                key={step.id}
                                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 text-xs"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                      step.status === 'completed'
                                        ? 'bg-emerald-600 text-white'
                                        : 'border border-slate-300 dark:border-zinc-700'
                                    }`}
                                  >
                                    {step.status === 'completed' && <Check className="w-3 h-3 stroke-[2.5]" />}
                                  </div>
                                  <div className="truncate">
                                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                      {step.title}
                                    </span>
                                    <div className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono mt-0.5">
                                      {step.durationMinutes} phút &bull; +{step.pointReward} PTS
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setActiveLessonModal(step)}
                                  className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-neutral-800 dark:text-zinc-200 transition-colors shrink-0 cursor-pointer shadow-2xs"
                                >
                                  {step.status === 'completed' ? 'Xem lại' : 'Học bài'}
                                </button>
                              </div>
                            ))
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-400 dark:text-neutral-500">
                            Các bài học cho miền này đang được cập nhật thêm vào chương trình.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Certificate Banner Card at bottom */}
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Trophy className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Ôn luyện lộ trình để sẵn sàng cho bài thi cấp chứng chỉ
                </h4>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Chứng chỉ năng lực số chuẩn hóa được cấp dựa trên kết quả khảo thí sát hạch và thẩm định minh chứng thực tế.
                </p>
              </div>
            </div>

            <Link
              href="/personal/credentials"
              className="px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
            >
              <span>Xem điều kiện cấp chứng chỉ</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </Link>
          </div>
        </div>

        {/* Right Column (4 cols): Goal Widget, Roadmap Progress, Recent Lessons, Next Suggestions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Mục tiêu của bạn */}
          <div className="p-6 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-850">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-500" strokeWidth={2} />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Mục tiêu của bạn
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditGoalOpen(true)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Chỉnh sửa
              </button>
            </div>

            <p className="text-xs text-neutral-800 dark:text-zinc-200 font-medium leading-relaxed">
              {learningGoal.title}
            </p>

            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-850 text-slate-600 dark:text-zinc-300 text-[10px] font-medium border border-slate-200 dark:border-zinc-700">
                {learningGoal.track}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-850 text-slate-600 dark:text-zinc-300 text-[10px] font-medium border border-slate-200 dark:border-zinc-700">
                {learningGoal.pace}
              </span>
            </div>
          </div>

          {/* Card 2: Tiến độ lộ trình */}
          <div className="p-6 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-850">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Tiến độ lộ trình
              </h3>
              <Link
                href="/personal/competency"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Xem chi tiết
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {/* Circular Gauge */}
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100 dark:text-zinc-800"
                    strokeWidth="3.2"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-blue-600 dark:text-blue-400 transition-all duration-500"
                    strokeDasharray={`${overallProgressPercent}, 100`}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-bold text-xs text-neutral-900 dark:text-neutral-100 font-mono">
                  {overallProgressPercent}%
                </span>
              </div>

              <div>
                <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Đã hoàn thành {completedCount} / {totalStepsCount} bài học
                </div>
                <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5">
                  Duy trì 15 phút mỗi ngày để đạt mục tiêu
                </p>
              </div>
            </div>

            {/* Segmented Progress Bar */}
            <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full flex overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${totalStepsCount > 0 ? (completedCount / totalStepsCount) * 100 : 0}%` }}
                title={`Đã hoàn thành ${completedCount}`}
              />
              <div
                className="bg-amber-500 h-full transition-all duration-300"
                style={{ width: `${totalStepsCount > 0 ? (inProgressCount / totalStepsCount) * 100 : 0}%` }}
                title={`Đang học ${inProgressCount}`}
              />
              <div
                className="bg-slate-200 dark:bg-zinc-700 h-full flex-1 transition-all duration-300"
                title={`Chưa học ${unstartedCount}`}
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-850 text-xs">
              <div className="flex items-center justify-between text-neutral-700 dark:text-zinc-300">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Đã hoàn thành</span>
                </span>
                <span className="font-mono font-bold">{completedCount}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-700 dark:text-zinc-300">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Đang học</span>
                </span>
                <span className="font-mono font-bold">{inProgressCount}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-700 dark:text-zinc-300">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-zinc-700" />
                  <span>Chưa học</span>
                </span>
                <span className="font-mono font-bold">{unstartedCount}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Kế hoạch học tập */}
          <div className="p-6 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-850">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Kế hoạch học tập
              </h3>
              <Link
                href="/personal/settings"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Cài đặt lịch &rarr;
              </Link>
            </div>

            <div className="space-y-3 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800 space-y-1.5">
                <div className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Mục tiêu hàng ngày</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                  Dành 15–20 phút mỗi ngày để hoàn thành 1 chuyên đề và duy trì chuỗi học tập.
                </p>
              </div>

              {currentLesson ? (
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-1 shrink-0" />
                    <div className="truncate">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {currentLesson.title}
                      </div>
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                        Bài học đề xuất tiếp theo &bull; {currentLesson.durationMinutes} phút
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveLessonModal(currentLesson)}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0 cursor-pointer"
                  >
                    Học ngay
                  </button>
                </div>
              ) : (
                <div className="text-center py-2 text-[11px] text-slate-400 dark:text-neutral-500">
                  Chưa có lịch hẹn cụ thể. Đặt lịch nhắc trong cài đặt cá nhân.
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Gợi ý tiếp theo */}
          <div className="p-6 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-850">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Gợi ý tiếp theo
              </h3>
              <Link
                href="/personal/assessments"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Xem tất cả &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              <Link
                href="/personal/assessments"
                className="p-3.5 rounded-xl border border-slate-200/70 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-900/60 bg-slate-50 dark:bg-zinc-900/60 flex items-center justify-between gap-3 text-xs transition-colors group block"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                      Làm bài đánh giá định kỳ
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                      Kiểm tra sự tiến bộ sau 4 tuần
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
              </Link>

              <Link
                href="/personal/groups"
                className="p-3.5 rounded-xl border border-slate-200/70 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-900/60 bg-slate-50 dark:bg-zinc-900/60 flex items-center justify-between gap-3 text-xs transition-colors group block"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                      Tham gia lớp học
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                      Học cùng bạn bè và rèn luyện theo nhóm
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Detail / Action Modal */}
      {activeLessonModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111114] rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 max-w-xl w-full shadow-2xl space-y-4 text-xs text-neutral-800 dark:text-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-850">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 font-mono text-[10px] font-bold">
                  {activeLessonModal.domainCode}
                </span>
                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                  {activeLessonModal.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveLessonModal(null)}
                className="text-slate-400 hover:text-neutral-900 dark:hover:text-neutral-100 text-xs font-semibold p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            <p className="text-slate-600 dark:text-neutral-400 leading-relaxed text-xs">
              {activeLessonModal.description}
            </p>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 space-y-2">
              <div className="text-[11px] font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
                Nội Dung Trọng Tâm:
              </div>
              <div className="text-xs text-neutral-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                {activeLessonModal.contentMarkdown}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-slate-500 font-mono text-[11px]">
                Thời lượng: {activeLessonModal.durationMinutes} phút &bull; Thưởng: +{activeLessonModal.pointReward} PTS
              </div>
              <div className="flex items-center gap-2">
                {activeLessonModal.status !== 'completed' && (
                  <button
                    type="button"
                    onClick={() => handleCompleteStep(activeLessonModal.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Đánh dấu đã hoàn thành
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveLessonModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-neutral-800 dark:text-zinc-200 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Edit Learning Goal Modal */}
      <EditGoalModal
        isOpen={isEditGoalOpen}
        onClose={() => setIsEditGoalOpen(false)}
        currentGoal={learningGoal}
        onSave={handleSaveGoal}
      />
    </div>
  );
}

export default function PersonalLearningPathPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Đang tải lộ trình học tập...</span>
        </div>
      }
    >
      <LearningPathContent />
    </Suspense>
  );
}
