'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckSquare,
  Award,
  Trophy,
  Flame,
  ChevronRight,
  Clock,
  BookOpen,
  HelpCircle,
  X,
  Check,
  Target,
  Layers,
  Crown,
  Database,
  Users,
  Lightbulb,
  Shield,
  Wrench,
  LogIn,
  Video,
  Share2,
  Info,
  Circle,
  CheckCircle2,
} from 'lucide-react';
import { CompetencyRadarChart, DomainScore } from '@/components/dashboard/personal/CompetencyRadarChart';
import { DashboardHeroIllustration } from '@/components/dashboard/personal/DashboardHeroIllustration';
import { OrgAssignmentsWidget, OrgTaskItem } from '@/components/dashboard/personal/OrgAssignmentsWidget';

interface RealAssessment {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  passing_score: number;
  point_reward?: number;
  is_published?: boolean;
  status?: string;
}

interface LeaderboardUser {
  rank: number;
  name: string;
  points: string;
  avatar: string;
  avatarUrl?: string | null;
  isMe: boolean;
}

export default function LearnerDashboardPage() {
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingAssessments, setLoadingAssessments] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [leaderboardTab, setLeaderboardTab] = useState<'week' | 'month' | 'all'>('week');



  const [stats, setStats] = useState<{
    nickname: string;
    fullName?: string;
    avatarUrl?: string | null;
    points: number;
    totalLoginDays: number;
    loginStreak: number;
    levelCode: string;
    levelNextTarget: number;
    isCertUnlocked: boolean;
    certPointsNeeded?: number;
    newLoginToday: boolean;
  }>({
    nickname: 'Học viên',
    fullName: 'Học viên',
    avatarUrl: null,
    points: 0,
    totalLoginDays: 0,
    loginStreak: 0,
    levelCode: 'Level 1: Basic',
    levelNextTarget: 150,
    isCertUnlocked: false,
    newLoginToday: false,
  });

  const [competencyProfile, setCompetencyProfile] = useState<{
    hasTakenAssessment?: boolean;
    totalAssessmentsCompleted?: number;
    assessedDomainsCount?: number;
    totalDomainsCount?: number;
    overallScore: number | null;
    radarData: DomainScore[];
    insights: {
      strongest: { code: string; name: string; score: number; level: string } | null;
      weakest: { code: string; name: string; score: number; level: string; isGap: boolean } | null;
    } | null;
  } | null>(null);

  const [assessments, setAssessments] = useState<RealAssessment[]>([]);
  const [baselineTest, setBaselineTest] = useState<{ id: string; title: string; duration_minutes?: number } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [orgWork, setOrgWork] = useState<{
    hasOrganization: boolean;
    organization: { name: string; slug: string } | null;
    tasks: OrgTaskItem[];
  }>({ hasOrganization: false, organization: null, tasks: [] });

  const loadLeaderboard = useCallback(async (period: 'week' | 'month' | 'all' = leaderboardTab) => {
    setLoadingLeaderboard(true);
    try {
      const res = await fetch(`/api/leaderboard?period=${period}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.leaderboard && Array.isArray(json.leaderboard)) {
          const topUsers = json.leaderboard.slice(0, 5).map((entry: any) => ({
            rank: entry.rank,
            name: entry.displayName || 'Học viên ẩn danh',
            points: `${entry.points || 0} PTS`,
            avatar: (entry.displayName || 'NX').slice(0, 2).toUpperCase(),
            avatarUrl: entry.avatarUrl || null,
            isMe: json.currentUserRank ? entry.userId === json.currentUserRank.userId : false,
          }));

          if (json.currentUserRank && !topUsers.some((u: any) => u.isMe)) {
            topUsers.push({
              rank: json.currentUserRank.rank,
              name: `${json.currentUserRank.displayName || 'Bạn'} (Bạn)`,
              points: `${json.currentUserRank.points || 0} PTS`,
              avatar: (json.currentUserRank.displayName || 'NX').slice(0, 2).toUpperCase(),
              avatarUrl: json.currentUserRank.avatarUrl || null,
              isMe: true,
            });
          }

          setLeaderboard(topUsers);
        }
      }
    } catch (e) {
      console.error('Failed to load leaderboard:', e);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [leaderboardTab]);

  useEffect(() => {
    async function loadStats() {
      setLoadingStats(true);
      try {
        const res = await fetch('/api/personal/profile-stats', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setStats({
              nickname: json.user?.nickname || 'Học viên',
              fullName: json.user?.fullName || json.user?.nickname || 'Học viên',
              avatarUrl: json.user?.avatarUrl || null,
              points: json.stats?.points ?? 0,
              totalLoginDays: json.stats?.totalLoginDays ?? 0,
              loginStreak: json.stats?.loginStreak ?? 0,
              levelCode: json.stats?.level?.code ?? 'Level 1: Basic',
              levelNextTarget: json.stats?.level?.nextTarget ?? 150,
              isCertUnlocked: json.stats?.certificate?.isUnlocked ?? false,
              newLoginToday: json.stats?.newLoginToday ?? false,
            });
          }
        }
      } catch (e) {
        console.error('Failed to load user profile stats:', e);
      } finally {
        setLoadingStats(false);
      }
    }

    async function loadAssessments() {
      setLoadingAssessments(true);
      try {
        const res = await fetch('/api/personal/assessments', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.assessments && Array.isArray(json.assessments)) {
            setAssessments(json.assessments.slice(0, 3));
          }
        }
      } catch (e) {
        console.error('Failed to load assessments:', e);
      } finally {
        setLoadingAssessments(false);
      }
    }

    async function loadBaselineAssessment() {
      try {
        const res = await fetch('/api/assessments/baseline', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.baselineAssessment) {
            setBaselineTest(json.baselineAssessment);
          }
        }
      } catch (e) {
        console.error('Failed to load baseline assessment:', e);
      }
    }

    async function loadCompetencyProfile() {
      try {
        const res = await fetch('/api/personal/competency-profile', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.profile) {
            setCompetencyProfile(json.profile);
          }
        }
      } catch (e) {
        console.error('Failed to load competency profile:', e);
      }
    }

    async function loadOrgWork() {
      try {
        const res = await fetch('/api/personal/organization-work', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.hasOrganization) {
            setOrgWork({
              hasOrganization: true,
              organization: json.organization,
              tasks: json.tasks || [],
            });
          }
        }
      } catch (e) {
        console.warn('Failed to load organization work:', e);
      }
    }

    loadStats();
    loadAssessments();
    loadBaselineAssessment();
    loadLeaderboard();
    loadCompetencyProfile();
    loadOrgWork();

    const handleProfileUpdate = () => {
      loadStats();
      loadCompetencyProfile();
      loadAssessments();
      loadBaselineAssessment();
      loadLeaderboard();
      loadOrgWork();
    };

    window.addEventListener('profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('profile-updated', handleProfileUpdate);
  }, []);

  const progressRatio = Math.min(100, Math.round((stats.points / (stats.levelNextTarget || 150)) * 100));
  const baselineTestId = baselineTest?.id || null;

  // Real 7-day week calendar calculated dynamically from current date and real login streak
  const weekDays = useMemo(() => {
    const now = new Date();
    const jsDay = now.getDay();
    const currentDayIdx = jsDay === 0 ? 6 : jsDay - 1; // 0 for Monday (T2) .. 6 for Sunday (CN)
    const monday = new Date(now);
    monday.setDate(now.getDate() - currentDayIdx);

    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    return labels.map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isToday = i === currentDayIdx;
      const isFuture = i > currentDayIdx;
      const daysDiff = currentDayIdx - i;
      const isDone = !isFuture && (daysDiff < stats.loginStreak && stats.loginStreak > 0);

      return {
        label,
        num: d.getDate(),
        done: isDone,
        today: isToday,
      };
    });
  }, [stats.loginStreak]);

  // 5 Standard domains without any DigComp text
  const defaultRadarData: DomainScore[] = [
    { code: 'D1', name: 'Thông tin & Dữ liệu', score: competencyProfile?.radarData?.[0]?.score ?? null, target: 70 },
    { code: 'D2', name: 'Giao tiếp & Hợp tác', score: competencyProfile?.radarData?.[1]?.score ?? null, target: 70 },
    { code: 'D3', name: 'Sáng tạo Nội dung số', score: competencyProfile?.radarData?.[2]?.score ?? null, target: 70 },
    { code: 'D4', name: 'An toàn & Bảo mật', score: competencyProfile?.radarData?.[3]?.score ?? null, target: 70 },
    { code: 'D5', name: 'Giải quyết Vấn đề', score: competencyProfile?.radarData?.[4]?.score ?? null, target: 70 },
  ];

  const currentRadarData = competencyProfile?.radarData?.length ? competencyProfile.radarData : defaultRadarData;
  const passedDomainsCount = currentRadarData.filter((d) => (d.score ?? 0) >= 70).length;
  const priorityDomain = currentRadarData.find((d) => (d.score ?? 0) < 70) || currentRadarData[0];

  const domainIcons: Record<string, any> = {
    D1: Database,
    D2: Users,
    D3: Lightbulb,
    D4: Shield,
    D5: Wrench,
  };

  const dynamicStepperItems = currentRadarData.map((d, index) => {
    const isPassed = (d.score ?? 0) >= 70;
    const isAssessed = d.score !== null;
    const isActive = competencyProfile?.hasTakenAssessment ? d.code === priorityDomain?.code : index === 0;
    const tag = isPassed
      ? 'Đạt chuẩn'
      : isActive
      ? 'Cần ưu tiên'
      : isAssessed
      ? 'Chưa đạt'
      : 'Chưa đánh giá';

    return {
      step: index + 1,
      code: d.code,
      name: d.name,
      icon: domainIcons[d.code] || Database,
      active: isActive,
      done: isPassed,
      tag,
    };
  });

  // Master progression milestones - Automatically calculated from real user activities & DB records (P1-05)
  const masterMilestones = [
    {
      id: 'm1',
      title: 'Hoàn thành bài đánh giá đầu vào',
      done: Boolean(competencyProfile?.hasTakenAssessment),
      actionHref: baselineTestId ? `/personal/take/${baselineTestId}` : undefined,
      actionLabel: baselineTestId ? 'Làm ngay' : 'Chưa có đề',
    },
    {
      id: 'm2',
      title: 'Bắt đầu bài học đầu tiên trong lộ trình',
      done: Boolean(competencyProfile?.totalAssessmentsCompleted && competencyProfile.totalAssessmentsCompleted > 0),
      actionHref: '/personal/learning-path',
      actionLabel: 'Học ngay',
    },
    {
      id: 'm3',
      title: 'Đạt chuẩn ít nhất 1 miền năng lực (≥ 70%)',
      done: Boolean(currentRadarData.some((d) => (d.score ?? 0) >= 70)),
      actionHref: '/personal/competency',
      actionLabel: 'Xem hồ sơ',
    },
    {
      id: 'm4',
      title: 'Duy trì chuỗi chuyên cần 3 ngày',
      done: stats.loginStreak >= 3,
      progressInfo: `${Math.min(stats.loginStreak, 3)}/3 ngày`,
    },
    {
      id: 'm5',
      title: 'Tích lũy 50 PTS hoạt động',
      done: stats.points >= 50,
      progressInfo: `${Math.min(stats.points, 50)}/50 PTS`,
    },
    {
      id: 'm6',
      title: 'Nhận chứng chỉ Năng lực số chuẩn hóa',
      done: Boolean(stats.isCertUnlocked),
      actionHref: '/personal/credentials',
      actionLabel: 'Xem chuẩn',
    },
  ];
  const completedMilestonesCount = masterMilestones.filter((m) => m.done).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header & Quick Indicators (Chuỗi và Level hòa với nền, không viền khung) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-2 border-b border-slate-100 dark:border-zinc-850">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
              {loadingStats ? (
                <span className="inline-block w-48 h-8 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse align-middle" />
              ) : (
                `Xin chào, ${stats.fullName && stats.fullName !== 'Học viên' ? stats.fullName : stats.nickname}! 👋`
              )}
            </h1>
            {!loadingStats && stats.newLoginToday && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold flex items-center gap-1 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                +1 PTS chuyên cần hôm nay
              </span>
            )}
          </div>
        </div>

        {/* Quick Indicators: Streak & Level (Borderless, Background-transparent, seamlessly blending with page) */}
        <div className="flex items-center gap-8 text-xs text-neutral-700 dark:text-zinc-300 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Streak Days Tracker (Hòa vào nền, không viền, không rớt dòng) */}
          <div className="p-0 bg-transparent border-0 shadow-none">
            <div className="flex items-center justify-between gap-3 text-[11px] mb-1.5">
              <div className="flex items-center gap-1.5 text-neutral-900 dark:text-neutral-100 font-bold whitespace-nowrap">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Chuỗi {stats.loginStreak} ngày</span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono whitespace-nowrap">
                (Tổng {stats.totalLoginDays} ngày)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {weekDays.map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] text-slate-400 dark:text-neutral-500 font-medium">{item.label}</span>
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-mono tabular-nums transition-colors ${
                      item.done
                        ? 'bg-amber-500 text-white font-bold shadow-2xs'
                        : item.today
                        ? 'border-2 border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold'
                        : 'bg-slate-200/60 dark:bg-zinc-800 text-slate-500 dark:text-neutral-400'
                    }`}
                  >
                    {item.done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : item.num}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Level Progress Gauge (Hòa vào nền, không viền) */}
          <div className="p-0 bg-transparent border-0 shadow-none flex items-center gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200/70 dark:text-zinc-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-blue-600 dark:text-blue-400 transition-all duration-500"
                  strokeDasharray={`${Math.max(6, progressRatio)}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute font-bold text-xs text-blue-700 dark:text-blue-300 font-mono tabular-nums">
                {stats.points}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 font-mono">
                  {stats.levelCode}
                </span>
                <button
                  type="button"
                  onClick={() => setShowLevelModal(true)}
                  className="text-[10px] text-slate-400 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 underline cursor-pointer"
                  title="Xem chi tiết các mốc cấp bậc"
                >
                  (Quy định cấp độ)
                </button>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 whitespace-nowrap">
                <strong className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">{stats.points}</strong> / {stats.levelNextTarget} PTS
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Hero Banner: Thiết lập Hồ sơ Năng lực Số Ban Đầu hoặc Tiếp tục học tập (P1-05) */}
      <div className="relative overflow-hidden p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-blue-50/90 via-sky-50/40 to-blue-50/20 dark:from-blue-950/30 dark:to-zinc-900 border border-blue-100/90 dark:border-blue-900/40 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[11px] font-bold font-mono uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
              <span>{competencyProfile?.hasTakenAssessment ? 'LỘ TRÌNH CÁ NHÂN' : 'KHẢO THÍ ĐẦU VÀO'}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              {competencyProfile?.hasTakenAssessment
                ? 'Tiếp tục Lộ trình Bồi dưỡng Năng lực Số'
                : 'Thiết lập Hồ sơ Năng lực Số Ban Đầu'}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed max-w-2xl">
              {competencyProfile?.hasTakenAssessment
                ? `Hồ sơ của bạn đã xác định ${passedDomainsCount}/5 miền đạt chuẩn. Hãy hoàn thành các bài học ở miền "${priorityDomain?.name}" để nâng cao trình độ.`
                : 'Hoàn thành bài đánh giá đầu vào để hệ thống xây dựng lộ trình phù hợp với bạn. Khảo thí xác định chính xác điểm mạnh và khoảng trống cần bồi dưỡng.'}
            </p>

            <div className="flex items-center gap-5 text-xs text-slate-500 dark:text-neutral-400 flex-wrap pt-1 font-medium">
              <span className="flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
                <span>{competencyProfile?.hasTakenAssessment ? 'Tự chủ thời gian' : '15 – 20 phút'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
                <span>5 miền năng lực</span>
              </span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              {competencyProfile?.hasTakenAssessment ? (
                <Link
                  href="/personal/learning-path"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-sm shadow-blue-500/20"
                >
                  <span>Vào bài học tiếp theo</span>
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                </Link>
              ) : baselineTestId ? (
                <Link
                  href={`/personal/take/${baselineTestId}`}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-sm shadow-blue-500/20"
                >
                  <span>Làm bài khảo thí ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                </Link>
              ) : (
                <button
                  disabled
                  className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-neutral-400 text-xs font-semibold inline-flex items-center gap-2 cursor-not-allowed"
                >
                  <span>Chưa mở đợt khảo thí</span>
                </button>
              )}
              <Link
                href="/personal/learning-path"
                className="px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                <span>Tìm hiểu thêm</span>
              </Link>
            </div>
          </div>

          {/* Hero 3D Illustration */}
          <div className="hidden md:flex md:col-span-4 justify-center items-center">
            <DashboardHeroIllustration />
          </div>
        </div>
      </div>

      {/* 3. Four Key Metric Cards — Trung tính làm chủ đạo, xanh Cobalt nhấn hành động */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Completed Assessments */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 mb-1">
            <span className="font-medium text-neutral-700 dark:text-zinc-300">Bài đã hoàn thành</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-300">
              <CheckSquare className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums my-1">
            {competencyProfile?.totalAssessmentsCompleted ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-neutral-500">Bài khảo thí hợp lệ</div>
        </div>

        {/* Card 2: Domains Passed */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 mb-1">
            <span className="font-medium text-neutral-700 dark:text-zinc-300">Miền đạt chuẩn</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-300">
              <Target className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div className={`font-extrabold text-neutral-900 dark:text-neutral-100 my-1 ${
            competencyProfile?.hasTakenAssessment ? 'text-3xl font-mono tabular-nums' : 'text-xl'
          }`}>
            {competencyProfile?.hasTakenAssessment ? `${passedDomainsCount} / 5` : 'Chưa đánh giá'}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-neutral-500">
            {competencyProfile?.hasTakenAssessment ? 'Đạt mức ≥ 70%' : 'Cần làm bài khảo thí ban đầu'}
          </div>
        </div>

        {/* Card 3: Activity Points (PTS) */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 mb-1">
            <span className="font-medium text-neutral-700 dark:text-zinc-300">Điểm tích lũy (PTS)</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-300">
              <Trophy className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums my-1">
            {stats.points}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-neutral-500">Tổng điểm hoạt động</div>
        </div>

        {/* Card 4: Certification Status (Interactive CTA — Nhấn Cobalt Blue) */}
        <Link
          href="/personal/credentials"
          className="p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between group hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 mb-1">
            <span className="font-medium text-neutral-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Chứng chỉ Năng lực số
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
              <Award className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-neutral-100 my-1 truncate flex items-center justify-between">
            <span>{stats.isCertUnlocked ? 'Đã hoàn thành' : 'Chưa hoàn thành'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-[10px] text-slate-400 dark:text-neutral-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            Chuẩn Năng lực số Quốc gia &rarr;
          </div>
        </Link>
      </div>

      {/* 3.5. Organization Work Section (V3: Từ tổ chức của bạn) */}
      {orgWork.hasOrganization && (
        <OrgAssignmentsWidget
          organizationName={orgWork.organization?.name || 'Tổ chức của bạn'}
          tasks={orgWork.tasks}
        />
      )}

      {/* 4. Middle Section: Competency Profile (Conditional: Empty State vs Radar Chart) */}
      {!competencyProfile?.hasTakenAssessment ? (
        <div className="p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-850">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
                  HỒ SƠ NĂNG LỰC SỐ
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                Chưa có dữ liệu đánh giá năng lực số
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-zinc-850 text-slate-600 dark:text-neutral-300 border border-slate-200 dark:border-zinc-700 w-fit">
              Trạng thái: Chưa khảo thí
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed max-w-3xl">
            Để xây dựng biểu đồ mạng nhện năng lực số và lộ trình học tập cá nhân hóa, bạn cần hoàn thành bài khảo thí ban đầu. Bài đánh giá gồm các câu hỏi tình huống thực tế bao quát toàn diện 5 miền năng lực số chuẩn hóa.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/60">
              <div className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 mb-1">
                1. Khảo thí 5 miền
              </div>
              <div className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                Đo lường từ Thông tin số, Giao tiếp, Sáng tạo, An toàn đến Giải quyết vấn đề.
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/60">
              <div className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 mb-1">
                2. Chẩn đoán khoảng trống
              </div>
              <div className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                Nhận diện chính xác kỹ năng cần nâng cao mà không bị đánh đồng điểm tổng.
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/60">
              <div className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 mb-1">
                3. Lộ trình cá nhân hóa
              </div>
              <div className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                Tự động đề xuất các chuyên đề bồi dưỡng đúng điểm yếu cần bù đắp.
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <Link
              href={`/personal/take/${baselineTestId}`}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-sm shadow-blue-500/20"
            >
              <span>Đánh giá năng lực ban đầu</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
            </Link>
            <Link
              href="/personal/competency"
              className="px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-medium transition-colors shadow-2xs"
            >
              <span>Tìm hiểu khung 5 miền</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Radar Chart */}
          <div className="lg:col-span-6 p-6 sm:p-7 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-850">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Năng lực số của bạn
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Kết quả từ các bài đánh giá, làm bài và hoạt động học tập.
                </p>
              </div>
              <Link
                href="/personal/competency"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1"
              >
                <span>Xem chi tiết</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="py-4 flex justify-center">
              <CompetencyRadarChart data={currentRadarData} size={310} />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-850 flex items-center justify-center gap-6 text-[11px] text-slate-600 dark:text-neutral-400 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 dark:bg-blue-400" />
                <span>Năng lực hiện tại</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t border-dashed border-slate-400 dark:border-zinc-500" />
                <span>Chuẩn mục tiêu (70%)</span>
              </div>
            </div>
          </div>

          {/* Right: 5 Domains Progress Breakdown */}
          <div className="lg:col-span-6 p-6 sm:p-7 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-850">
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Tiến độ theo 5 miền năng lực
                </h3>
                <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400">
                  Chuẩn mục tiêu ≥ 70%
                </span>
              </div>

              <div className="space-y-4 py-4">
                {currentRadarData.map((d) => {
                  const hasAssessed = Boolean(d.score !== null);
                  const scoreVal = d.score ?? 0;
                  const isPassed = hasAssessed && scoreVal >= 70;
                  const isGap = hasAssessed && scoreVal < 70 && scoreVal > 0;

                  return (
                    <div key={d.code} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100 w-6 shrink-0">
                            {d.code}
                          </span>
                          <span className="text-neutral-800 dark:text-zinc-200 truncate font-medium">
                            {d.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-semibold text-xs text-neutral-900 dark:text-neutral-100 tabular-nums">
                            {hasAssessed ? `${scoreVal}%` : '—'}
                          </span>
                          {hasAssessed ? (
                            isPassed ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                Đạt chuẩn
                              </span>
                            ) : isGap ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                                Cần cải thiện
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-zinc-850 text-slate-500 dark:text-neutral-400 border border-slate-200 dark:border-zinc-750">
                                Chưa đạt
                              </span>
                            )
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-neutral-400 border border-slate-200 dark:border-zinc-700">
                              Chưa đánh giá
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar with 70% threshold tick */}
                      <div className="relative w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            !hasAssessed
                              ? 'bg-transparent'
                              : isPassed
                              ? 'bg-blue-600 dark:bg-blue-400'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${hasAssessed ? Math.min(100, scoreVal) : 0}%` }}
                        />
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-zinc-500 z-10"
                          style={{ left: '70%' }}
                          title="Chuẩn mục tiêu 70%"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-850 flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Kết quả được xác minh từ các bài khảo thí và nộp bài hợp lệ.</span>
              </span>
              <Link
                href="/personal/learning-path"
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline shrink-0 ml-2"
              >
                Vào lộ trình &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 5. Row 1 of Bottom: Lộ Trình Học Tập (Stepper) & Bảng Xếp Hạng */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Lộ trình học tập dành cho bạn (Horizontal Stepper) */}
        <div className="lg:col-span-8 p-6 sm:p-7 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-850">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Lộ trình học tập dành cho bạn
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Các chuyên đề được gợi ý dựa trên chuẩn 5 miền năng lực số.
                </p>
              </div>
              <Link
                href="/personal/learning-path"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Xem lộ trình &rarr;
              </Link>
            </div>

            {/* Stepper with 5 nodes (P1-05: Dynamic based on radarData) */}
            <div className="py-8 flex items-center justify-between relative px-2 sm:px-6">
              {/* Stepper connecting line */}
              <div className="absolute left-8 right-8 top-1/2 -translate-y-5 h-0.5 bg-slate-200 dark:bg-zinc-800 z-0" />

              {dynamicStepperItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="flex flex-col items-center z-10 text-center max-w-[95px]">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                        item.done
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25 ring-4 ring-emerald-50 dark:ring-emerald-950/60'
                          : item.active
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-4 ring-blue-50 dark:ring-blue-950/60'
                          : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-neutral-500'
                      }`}
                    >
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <span className="text-[11px] font-semibold text-neutral-800 dark:text-zinc-200 mt-2.5 truncate w-full" title={item.name}>
                      {item.step}. {item.name.split('&')[0]}
                    </span>
                    <span
                      className={`text-[9px] mt-0.5 ${
                        item.done
                          ? 'text-emerald-700 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900'
                          : item.active
                          ? 'text-blue-600 dark:text-blue-400 font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900'
                          : 'text-slate-400 dark:text-neutral-500'
                      }`}
                    >
                      {item.tag}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-zinc-850 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-neutral-400 font-medium">Chặng 1: Xây dựng nền tảng thông tin &amp; dữ liệu</span>
            <Link
              href="/personal/learning-path"
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Học ngay &rarr;
            </Link>
          </div>
        </div>

        {/* Card 2: Bảng xếp hạng mini (Hiển thị avatar ảnh thật cho Top 1) */}
        <div className="lg:col-span-4 p-6 sm:p-7 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-850">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" strokeWidth={1.75} />
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Bảng xếp hạng
                </h3>
              </div>
              <Link
                href="/personal/leaderboard"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Xem tất cả &rarr;
              </Link>
            </div>

            {/* Tabs: Tuần này / Tháng này / Tất cả */}
            <div className="flex items-center gap-1 my-3 p-1 rounded-xl bg-slate-100 dark:bg-zinc-850 border border-slate-200/60 dark:border-zinc-800 text-[11px]">
              {(['week', 'month', 'all'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setLeaderboardTab(tab);
                    loadLeaderboard(tab);
                  }}
                  className={`flex-1 py-1 rounded-lg text-center font-medium transition-colors cursor-pointer ${
                    leaderboardTab === tab
                      ? 'bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 font-bold shadow-2xs'
                      : 'text-slate-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  {tab === 'week' ? 'Tuần này' : tab === 'month' ? 'Tháng này' : 'Tất cả'}
                </button>
              ))}
            </div>

            {/* List Top 5 */}
            <div className="space-y-1.5">
              {loadingLeaderboard ? (
                <div className="space-y-2 py-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-9 rounded-xl bg-slate-100 dark:bg-zinc-850 animate-pulse" />
                  ))}
                </div>
              ) : leaderboard.length > 0 ? (
                leaderboard.slice(0, 5).map((user) => {
                  const avatarSrc = user.avatarUrl || (user.isMe && stats.avatarUrl ? stats.avatarUrl : null);
                  return (
                    <div
                      key={`${user.rank}-${user.name}`}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                        user.rank === 1
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 font-semibold'
                          : 'hover:bg-slate-50 dark:hover:bg-zinc-900 text-neutral-800 dark:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {user.rank === 1 ? (
                          <Crown className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                        ) : (
                          <span className="w-4 text-center font-mono font-bold text-slate-400 dark:text-neutral-500 shrink-0">
                            {user.rank}
                          </span>
                        )}
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-zinc-200 shrink-0 overflow-hidden border border-slate-200/80">
                          {avatarSrc ? (
                            <img src={avatarSrc} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{user.avatar}</span>
                          )}
                        </div>
                        <span className="truncate max-w-[130px] font-medium">{user.name}</span>
                      </div>
                      <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100 shrink-0 tabular-nums">
                        {user.points}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">Chưa có dữ liệu</div>
              )}
            </div>
          </div>

          <div className="pt-2 text-center text-[11px] text-slate-400 dark:text-neutral-500">
            Xếp hạng dựa trên tổng điểm PTS tích lũy hợp lệ
          </div>
        </div>
      </div>

      {/* 6. Row 2 of Bottom: Hoạt động gần đây, Gợi ý cho bạn & Mục tiêu nhanh (Có ảnh minh họa thật) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Hoạt động gần đây */}
        <div className="p-6 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-zinc-850">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Hoạt động gần đây
              </h3>
              <Link
                href="/personal/leaderboard"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Xem tất cả &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {stats.points > 0 ? (
                <>
                  {stats.newLoginToday && (
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <LogIn className="w-4 h-4" strokeWidth={1.75} />
                        </div>
                        <div className="truncate">
                          <div className="font-medium text-neutral-900 dark:text-neutral-100 truncate">Điểm danh hôm nay</div>
                          <div className="text-[10px] text-slate-400 font-mono">Chuyên cần chuỗi {stats.loginStreak} ngày</div>
                        </div>
                      </div>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full text-[11px] shrink-0">
                        +1 PTS
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Trophy className="w-4 h-4" strokeWidth={1.75} />
                      </div>
                      <div className="truncate">
                        <div className="font-medium text-neutral-900 dark:text-neutral-100 truncate">Tổng điểm tích lũy</div>
                        <div className="text-[10px] text-slate-400 font-mono">Đã ghi nhận trên hệ thống</div>
                      </div>
                    </div>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full text-[11px] shrink-0">
                      {stats.points} PTS
                    </span>
                  </div>
                </>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 dark:text-neutral-500">
                  Chưa có hoạt động ghi nhận điểm. Làm bài khảo thí hoặc học bài để nhận PTS.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-slate-100 dark:border-zinc-850 text-right">
            <Link
              href="/personal/leaderboard"
              className="text-[11px] text-slate-400 hover:text-blue-600 transition-colors"
            >
              Lịch sử ghi nhận điểm &rarr;
            </Link>
          </div>
        </div>

        {/* Card 2: Gợi ý cho bạn (Sử dụng ảnh minh họa thật đầy đủ) */}
        <div className="p-6 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 pb-3 mb-3 border-b border-slate-100 dark:border-zinc-850">
              <Lightbulb className="w-4 h-4 text-amber-500" strokeWidth={1.75} />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Gợi ý cho bạn
              </h3>
            </div>

            <div className="space-y-3">
              <Link
                href="/personal/learning-path"
                className="p-2.5 rounded-xl border border-slate-200/70 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-800 flex items-center justify-between gap-3 text-xs transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src="/images/suggestions/suggestion-article.svg"
                    alt="Khung năng lực số"
                    className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-2xs"
                  />
                  <div className="truncate">
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                      Tìm hiểu về Khung năng lực số
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-neutral-500">Bài viết &bull; 10 phút</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
              </Link>

              <Link
                href="/personal/learning-path"
                className="p-2.5 rounded-xl border border-slate-200/70 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-800 flex items-center justify-between gap-3 text-xs transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src="/images/suggestions/suggestion-video.svg"
                    alt="Hướng dẫn học hiệu quả"
                    className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-2xs"
                  />
                  <div className="truncate">
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                      Hướng dẫn học hiệu quả với NEXA
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-neutral-500">Video &bull; 8 phút</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
              </Link>

              <Link
                href="/personal/groups"
                className="p-2.5 rounded-xl border border-slate-200/70 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-800 flex items-center justify-between gap-3 text-xs transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src="/images/suggestions/suggestion-event.svg"
                    alt="Lớp học cộng đồng"
                    className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-2xs"
                  />
                  <div className="truncate">
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                      Tham gia lớp học cộng đồng
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-neutral-500">Sự kiện &bull; Cập nhật thường xuyên</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
              </Link>
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-slate-100 dark:border-zinc-850 text-right">
            <Link
              href="/personal/learning-path"
              className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Xem tất cả học liệu &rarr;
            </Link>
          </div>
        </div>

        {/* Card 3: Mục tiêu nhanh (Tự động đồng bộ theo tiến trình thực tế, không tick tay) */}
        <div className="p-6 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-zinc-850">
              <div className="flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Mục tiêu nhanh
                </h3>
              </div>
              <Link
                href="/personal/settings"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Thiết lập mục tiêu &rarr;
              </Link>
            </div>

            <div className="space-y-2.5">
              {masterMilestones.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-2.5 text-xs text-neutral-800 dark:text-zinc-200 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {m.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={2} />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 dark:text-zinc-600 shrink-0" strokeWidth={1.75} />
                    )}
                    <span
                      className={`leading-snug truncate text-[11px] sm:text-xs ${
                        m.done
                          ? 'line-through text-slate-400 dark:text-neutral-500 font-normal'
                          : 'text-neutral-800 dark:text-zinc-200 font-medium'
                      }`}
                      title={m.title}
                    >
                      {m.title}
                    </span>
                  </div>

                  <div className="shrink-0 flex items-center gap-1">
                    {m.progressInfo && !m.done && (
                      <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">
                        {m.progressInfo}
                      </span>
                    )}
                    {!m.done && m.actionHref && (
                      <Link
                        href={m.actionHref}
                        className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 transition-colors"
                      >
                        {m.actionLabel}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-slate-100 dark:border-zinc-850 flex items-center justify-between text-[11px] text-slate-400 dark:text-neutral-500">
            <span>
              Tiến độ: <strong className="font-mono text-neutral-900 dark:text-neutral-100">{completedMilestonesCount}</strong> / {masterMilestones.length} hoàn thành
            </span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Tự động đồng bộ
            </span>
          </div>
        </div>
      </div>

      {/* Level Tier Explanation Modal */}
      {showLevelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111114] rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 max-w-lg w-full shadow-xl space-y-4 text-xs text-neutral-800 dark:text-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-850">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                  Hệ Thống 4 Cấp Độ Năng Lực Số Chuẩn Hóa
                </h3>
              </div>
              <button
                onClick={() => setShowLevelModal(false)}
                className="text-slate-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 text-xs font-semibold p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            <p className="text-slate-500 dark:text-neutral-400 leading-relaxed text-[11px]">
              Cấp độ phản ánh mức độ thành thạo thực tế của người học qua các bài khảo thí chuẩn hóa, thực hành nộp minh chứng và đánh giá năng lực số theo khung tham chiếu chuẩn quốc gia.
            </p>

            {/* 4 Standardized Levels */}
            <div className="space-y-2.5">
              {[
                {
                  code: 'Level 1: Basic',
                  range: '0 – 149 PTS',
                  desc: 'Thao tác cơ bản có hướng dẫn, giải quyết các tác vụ số đơn giản thường nhật.',
                },
                {
                  code: 'Level 2: Intermediate',
                  range: '150 – 299 PTS',
                  desc: 'Tự chủ độc lập, hiểu rõ công cụ số và tự giải quyết các vấn đề thường gặp.',
                },
                {
                  code: 'Level 3: Advanced',
                  range: '300 – 449 PTS',
                  desc: 'Thành thạo chuyên sâu, làm việc cùng công nghệ và tối ưu hóa giải pháp số.',
                },
                {
                  code: 'Level 4: Highly Advanced',
                  range: 'Từ 450 PTS trở lên',
                  desc: 'Chuyên gia chiến lược, đề xuất giải pháp số sáng tạo và phát triển hệ sinh thái.',
                },
              ].map((tier) => (
                <div
                  key={tier.code}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs font-mono">
                      {tier.code}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-neutral-400 leading-relaxed">
                      {tier.desc}
                    </div>
                  </div>
                  <span className="font-medium text-slate-600 dark:text-neutral-400 text-[11px] font-mono shrink-0 whitespace-nowrap pt-0.5">
                    {tier.range}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowLevelModal(false)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
