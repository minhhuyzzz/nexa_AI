'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckSquare,
  Award,
  Trophy,
  Flame,
  ChevronRight,
  Clock,
  BookOpen,
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
  Compass,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { CompetencyRadarChart, DomainScore } from '@/components/dashboard/personal/CompetencyRadarChart';
import { SilkRibbonHeroIllustration } from '@/components/dashboard/personal/SilkRibbonHeroIllustration';
import { BaselineDiagnosticModal } from '@/components/dashboard/personal/BaselineDiagnosticModal';

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
  const [isBaselineModalOpen, setIsBaselineModalOpen] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingAssessments, setLoadingAssessments] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);



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
    levelCode: 'Cấp độ 1: Cơ bản',
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
    baselineRadarData?: DomainScore[];
    insights: {
      strongest: { code: string; name: string; score: number; level: string } | null;
      weakest: { code: string; name: string; score: number; level: string; isGap: boolean } | null;
    } | null;
  } | null>(null);

  const [assessments, setAssessments] = useState<RealAssessment[]>([]);
  const [baselineTest, setBaselineTest] = useState<{ id: string; title: string; duration_minutes?: number } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [recommendedModules, setRecommendedModules] = useState<{
    id: string;
    title: string;
    duration_minutes: number;
    point_reward: number;
    domain_code: string;
  }[]>([]);
  const [weakestDomainName, setWeakestDomainName] = useState<string>('');
  const router = useRouter();

  const handleCloseBaselineModal = useCallback(() => {
    setIsBaselineModalOpen(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('nexa_dismissed_baseline_modal', 'true');
    }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true);
    try {
      const res = await fetch('/api/leaderboard?period=all', { cache: 'no-store' });
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
  }, []);

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
          const profileData = json.profile || json;
          if (json.success && (profileData.hasTakenAssessment !== undefined || profileData.totalAssessmentsCompleted !== undefined)) {
            setCompetencyProfile(profileData);

            // Tự động mở Modal Khảo thí đầu vào cho tài khoản mới (Lựa chọn 2: Onboarding First có đường lui)
            if (profileData.hasTakenAssessment === false) {
              const dismissed = typeof window !== 'undefined' ? sessionStorage.getItem('nexa_dismissed_baseline_modal') : null;
              if (!dismissed) {
                setIsBaselineModalOpen(true);
              }
            }
          }
        }
      } catch (e) {
        console.error('Failed to load competency profile:', e);
      }
    }

    async function loadRecommendations() {
      try {
        const res = await fetch('/api/personal/learning-path', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.hasTakenAssessment && Array.isArray(json.modules)) {
            const targetDomain = json.unlockedFreeDomain;
            if (targetDomain) {
              const matched = json.modules.filter((m: any) => m.domain_code === targetDomain);
              setRecommendedModules(matched.slice(0, 3));
              const domainTitles: Record<string, string> = {
                '01': 'Thông tin & Dữ liệu số',
                '02': 'Giao tiếp & Cộng tác số',
                '03': 'Sáng tạo Nội dung số',
                '04': 'An toàn & Bảo mật số',
                '05': 'Giải quyết Vấn đề số',
              };
              setWeakestDomainName(domainTitles[targetDomain] || `Miền ${targetDomain}`);
            } else {
              setRecommendedModules([]);
            }
          } else {
            setRecommendedModules([]);
          }
        }
      } catch (e) {
        console.error('Failed to load recommended modules:', e);
      }
    }

    loadStats();
    loadAssessments();
    loadBaselineAssessment();
    loadLeaderboard();
    loadCompetencyProfile();
    loadRecommendations();

    const handleProfileUpdate = () => {
      loadStats();
      loadCompetencyProfile();
      loadAssessments();
      loadBaselineAssessment();
      loadLeaderboard();
      loadRecommendations();
    };

    window.addEventListener('profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('profile-updated', handleProfileUpdate);
  }, []);

  const progressRatio = Math.min(100, Math.round((stats.points / (stats.levelNextTarget || 150)) * 100));
  const baselineTestId = baselineTest?.id || 'a0000000-0000-0000-0000-000000000001';

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

  // 5 Standard domains with full official titles
  const defaultRadarData: DomainScore[] = [
    { code: 'D1', name: 'Thông tin & Dữ liệu số', score: competencyProfile?.radarData?.[0]?.score ?? null, target: 70 },
    { code: 'D2', name: 'Giao tiếp & Cộng tác số', score: competencyProfile?.radarData?.[1]?.score ?? null, target: 70 },
    { code: 'D3', name: 'Sáng tạo Nội dung số & AI', score: competencyProfile?.radarData?.[2]?.score ?? null, target: 70 },
    { code: 'D4', name: 'An toàn & Bảo mật số', score: competencyProfile?.radarData?.[3]?.score ?? null, target: 70 },
    { code: 'D5', name: 'Giải quyết Vấn đề số', score: competencyProfile?.radarData?.[4]?.score ?? null, target: 70 },
  ];

  const currentRadarData = competencyProfile?.radarData?.length ? competencyProfile.radarData : defaultRadarData;
  const passedDomainsCount = currentRadarData.filter((d) => (d.score ?? 0) >= 70).length;

  // Gợi ý miền cần bồi dưỡng: Chỉ xác định khi đã có kết quả khảo thí (lấy miền có điểm thấp nhất)
  const suggestedWeakestDomain = useMemo(() => {
    if (!competencyProfile?.hasTakenAssessment) return null;
    const assessed = currentRadarData.filter((d) => d.score !== null);
    if (assessed.length === 0) return null;
    const sorted = [...assessed].sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
    return sorted[0];
  }, [competencyProfile?.hasTakenAssessment, currentRadarData]);

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
    const isSuggested = Boolean(suggestedWeakestDomain && d.code === suggestedWeakestDomain.code);

    return {
      step: index + 1,
      code: d.code,
      name: d.name,
      icon: domainIcons[d.code] || Database,
      isSuggested,
      done: isPassed,
      score: d.score,
    };
  });

  // Master progression milestones - Sắp xếp hợp lý từ dễ trước đến đích đến hoàn thiện, dữ liệu thật 100%
  const masterMilestones = [
    {
      id: 'm1',
      title: 'Hoàn thành bài đánh giá đầu vào',
      description: 'Làm bài khảo sát nhanh để nhận diện các miền năng lực số và mở khóa lộ trình học tập.',
      icon: Compass,
      done: Boolean(competencyProfile?.hasTakenAssessment),
      actionHref: baselineTestId ? `/personal/assessments/${baselineTestId}` : '/personal/assessments',
      actionLabel: baselineTestId ? 'Làm ngay' : 'Xem danh sách',
    },
    {
      id: 'm2',
      title: 'Bắt đầu bài học đầu tiên trong lộ trình',
      description: 'Tham gia chuyên đề bài học đầu tiên trong lộ trình được cá nhân hóa cho bạn.',
      icon: BookOpen,
      done: Boolean(competencyProfile?.totalAssessmentsCompleted && competencyProfile.totalAssessmentsCompleted > 0),
      actionHref: '/personal/learning-path',
      actionLabel: 'Học ngay',
    },
    {
      id: 'm3',
      title: 'Duy trì chuỗi chuyên cần 3 ngày',
      description: 'Đăng nhập học tập liên tục để hình thành thói quen rèn luyện năng lực số.',
      icon: Flame,
      done: stats.loginStreak >= 3,
      progressInfo: `${Math.min(stats.loginStreak, 3)}/3 ngày`,
    },
    {
      id: 'm4',
      title: 'Tích lũy 50 PTS hoạt động',
      description: 'Tích lũy điểm từ bài khảo thí, hoàn thành bài học và điểm danh chuyên cần.',
      icon: Trophy,
      done: stats.points >= 50,
      progressInfo: `${Math.min(stats.points, 50)}/50 PTS`,
    },
    {
      id: 'm5',
      title: 'Đạt chuẩn ít nhất 1 miền năng lực (≥ 70%)',
      description: 'Nâng cao điểm số của một miền năng lực bất kỳ đạt mức chuẩn 70%.',
      icon: Target,
      done: Boolean(currentRadarData.some((d) => (d.score ?? 0) >= 70)),
      actionHref: '/personal/competency',
      actionLabel: 'Xem hồ sơ',
    },
    {
      id: 'm6',
      title: 'Nhận chứng chỉ Năng lực số chuẩn hóa',
      description: 'Hoàn thành các tiêu chí khảo thí chuẩn hóa để nhận chứng nhận năng lực số NEXA.',
      icon: Award,
      done: Boolean(stats.isCertUnlocked),
      actionHref: '/personal/credentials',
      actionLabel: 'Xem chuẩn',
    },
  ];
  const completedMilestonesCount = masterMilestones.filter((m) => m.done).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header & Quick Indicators (Không viền ngang) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
              {loadingStats ? (
                <span className="inline-block w-48 h-8 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse align-middle" />
              ) : (
                `Xin chào, ${stats.fullName && stats.fullName !== 'Học viên' ? stats.fullName : stats.nickname}!`
              )}
            </h1>
          </div>
        </div>

        {/* Quick Indicators: Streak & Level (Borderless, Background-transparent, seamlessly blending with page) */}
        <div className="flex items-center gap-8 text-xs text-neutral-700 dark:text-zinc-300 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Streak Days Tracker (Hòa vào nền, không viền, không rớt dòng) */}
          <div className="p-0 bg-transparent shadow-none">
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
          <div className="p-0 bg-transparent shadow-none flex items-center gap-3">
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

      {/* 2. Hero Banner: Thiết lập Hồ sơ Năng lực Số Ban Đầu hoặc Tiếp tục học tập (P1-05) - Luxury Silk Wave Theme */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 dark:border-blue-500/30 bg-gradient-to-br from-[#0B1224] via-[#0F1B3B] to-[#0A1026] text-white p-6 sm:p-8 shadow-[0_12px_36px_-8px_rgba(11,18,36,0.35)] dark:shadow-[0_12px_36px_-8px_rgba(0,0,0,0.7)]">
        {/* Ambient Silk Wave Contours & Light Beams (Lớp sóng lụa mờ nền & điểm tụ ánh sáng) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Radial Light Auras */}
          <div className="absolute -top-24 right-0 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute -bottom-24 right-48 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute -top-12 left-1/4 w-72 h-72 rounded-full bg-sky-500/10 blur-3xl" />

          {/* SVG Flowing Ambient Silk Ribbon Streamers */}
          <svg
            className="absolute inset-0 w-full h-full opacity-20"
            viewBox="0 0 1000 300"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M-50 220 C 200 280, 450 120, 700 240 C 850 310, 950 180, 1050 160"
              stroke="url(#ambient-silk-1)"
              strokeWidth="48"
              strokeLinecap="round"
            />
            <path
              d="M-100 160 C 250 80, 500 260, 800 110 C 950 30, 1050 90, 1150 70"
              stroke="url(#ambient-silk-2)"
              strokeWidth="28"
              strokeLinecap="round"
            />
            <path
              d="M100 290 C 350 250, 600 60, 900 160 C 1000 190, 1050 140, 1100 130"
              stroke="url(#ambient-silk-gold)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="8 6"
            />
            <defs>
              <linearGradient id="ambient-silk-1" x1="0" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0" />
                <stop offset="40%" stopColor="#2563EB" stopOpacity="0.4" />
                <stop offset="70%" stopColor="#60A5FA" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="ambient-silk-2" x1="0" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0F172A" stopOpacity="0" />
                <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#93C5FD" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="ambient-silk-gold" x1="0" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#B45309" stopOpacity="0" />
                <stop offset="45%" stopColor="#F59E0B" stopOpacity="0.6" />
                <stop offset="70%" stopColor="#FEF08A" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Banner Content Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-7 lg:col-span-8 space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-200 text-[11px] font-bold font-mono uppercase tracking-wider backdrop-blur-md shadow-2xs">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" strokeWidth={2} />
              <span>{competencyProfile?.hasTakenAssessment ? 'LỘ TRÌNH CÁ NHÂN' : 'KHẢO THÍ ĐẦU VÀO'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
              {competencyProfile?.hasTakenAssessment
                ? 'Tiếp tục Lộ trình Bồi dưỡng Năng lực Số'
                : 'Thiết lập Hồ sơ Năng lực Số Ban Đầu'}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed font-normal">
              {competencyProfile?.hasTakenAssessment
                ? 'Hồ sơ năng lực số của bạn đã sẵn sàng. Hãy tiếp tục chặng học tiếp theo để bồi dưỡng kỹ năng và chinh phục chứng chỉ.'
                : 'Làm bài khảo thí chuẩn hóa để chẩn đoán chính xác hồ sơ năng lực số và tự động mở khóa lộ trình bồi dưỡng cá nhân hóa.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1.5">
              {competencyProfile?.hasTakenAssessment ? (
                <Link
                  href="/personal/learning-path"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-md shadow-blue-600/30 active:scale-[0.98] cursor-pointer"
                >
                  <span>Học tiếp</span>
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                </Link>
              ) : baselineTestId ? (
                <button
                  type="button"
                  onClick={() => setIsBaselineModalOpen(true)}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-md shadow-blue-600/30 active:scale-[0.98] cursor-pointer"
                >
                  <span>Bắt đầu khảo sát</span>
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              ) : (
                <button
                  disabled
                  className="px-6 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold inline-flex items-center gap-2 cursor-not-allowed border border-slate-700/50"
                >
                  <span>Chưa mở đợt thi</span>
                </button>
              )}

              {/* Tag thông tin nhanh sang trọng */}
              <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-slate-300/90 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" strokeWidth={1.75} />
                <span>Chuẩn hóa • Miễn phí • Cấp chứng nhận</span>
              </div>
            </div>
          </div>

          {/* Right Side: Dải lụa phát triển năng lực số (Silk Ribbon 3D Artwork) */}
          <div className="hidden md:flex md:col-span-5 lg:col-span-4 justify-center items-center">
            <SilkRibbonHeroIllustration />
          </div>
        </div>
      </div>

      {/* 3. Four Key Metric Cards — Executive Tinted Bento Design, Tránh AI Slop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Completed Assessments */}
        <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-gradient-to-br from-blue-50/40 via-slate-50/60 to-white dark:from-[#111114] dark:to-zinc-900 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-blue-300 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 mb-1">
            <span className="font-semibold text-neutral-800 dark:text-zinc-200">Bài đã hoàn thành</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100/70 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-2xs">
              <CheckSquare className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums my-1">
            {competencyProfile?.totalAssessmentsCompleted ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium">Đạt chuẩn đánh giá (≥ 70%)</div>
        </div>

        {/* Card 2: Domains Passed */}
        <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-gradient-to-br from-emerald-50/40 via-slate-50/60 to-white dark:from-[#111114] dark:to-zinc-900 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-emerald-300 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 mb-1">
            <span className="font-semibold text-neutral-800 dark:text-zinc-200">Miền đạt chuẩn</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
              <Target className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div className={`font-extrabold text-neutral-900 dark:text-neutral-100 my-1 ${
            competencyProfile?.hasTakenAssessment ? 'text-3xl font-mono tabular-nums' : 'text-xl'
          }`}>
            {competencyProfile?.hasTakenAssessment ? `${passedDomainsCount} / 5` : 'Chưa đánh giá'}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium">
            {competencyProfile?.hasTakenAssessment ? 'Đạt mức ≥ 70%' : 'Cần làm bài khảo thí ban đầu'}
          </div>
        </div>

        {/* Card 3: Activity Points */}
        <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-gradient-to-br from-amber-50/40 via-slate-50/60 to-white dark:from-[#111114] dark:to-zinc-900 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-amber-300 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 mb-1">
            <span className="font-semibold text-neutral-800 dark:text-zinc-200">Điểm tích lũy</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100/70 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-2xs">
              <Trophy className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums my-1">
            {stats.points}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium">Tổng điểm hoạt động</div>
        </div>

        {/* Card 4: Certification Status (Interactive CTA — Thẻ Hành Động Tinh Tế) */}
        <Link
          href="/personal/credentials"
          className="p-5 rounded-2xl border border-blue-200/90 dark:border-blue-900/60 bg-gradient-to-br from-blue-50/80 via-sky-50/50 to-indigo-50/40 dark:from-blue-950/40 dark:to-zinc-900 shadow-[0_2px_8px_rgba(37,99,235,0.06)] flex flex-col justify-between group hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 mb-1">
            <span className="font-semibold text-blue-950 dark:text-blue-200 group-hover:text-blue-700 dark:group-hover:text-blue-100 transition-colors">
              Chứng chỉ Năng lực số
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center group-hover:scale-105 shadow-sm shadow-blue-500/25 transition-transform">
              <Award className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-neutral-100 my-1 truncate flex items-center justify-between">
            <span>{stats.isCertUnlocked ? 'Đã hoàn thành' : 'Chưa hoàn thành'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 transition-colors">
            Xem điều kiện cấp chứng chỉ &rarr;
          </div>
        </Link>
      </div>

      {/* 4. Middle Section: Competency Profile (Borderless Radar & Domains with a single vertical dividing line) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-0">
        {/* Left: Radar Chart (Hòa vào nền, không viền ngoài, vạch chia đôi bên phải) */}
        <div className="lg:col-span-6 p-2 sm:p-5 lg:pr-8 bg-transparent flex flex-col justify-between lg:border-r lg:border-slate-200/80 dark:lg:border-zinc-800">
          <div>
            <div className="flex items-center justify-between pb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                  <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
                    HỒ SƠ NĂNG LỰC SỐ
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  {competencyProfile?.hasTakenAssessment ? 'Năng lực số của bạn' : 'Khung năng lực số'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  {competencyProfile?.hasTakenAssessment
                    ? 'Kết quả từ các bài đánh giá và hoạt động học tập.'
                    : 'Chưa có dữ liệu đánh giá • Hiển thị khung đối chuẩn các miền mục tiêu.'}
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

            <div className="py-4 flex flex-col items-center justify-center relative">
              <CompetencyRadarChart
                data={currentRadarData}
                baselineData={competencyProfile?.baselineRadarData}
                size={310}
              />

              {!competencyProfile?.hasTakenAssessment && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-850 text-slate-600 dark:text-neutral-300 text-xs font-medium border border-slate-200/80 dark:border-zinc-700 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Trạng thái: Chưa có dữ liệu khảo thí</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-center gap-4 sm:gap-6 text-[11px] text-slate-600 dark:text-neutral-400 font-medium flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 dark:bg-blue-400" />
              <span>Năng lực tích lũy</span>
            </div>
            {competencyProfile?.baselineRadarData && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t border-dashed border-slate-400" />
                <span>Vạch xuất phát</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-slate-400 dark:border-zinc-500" />
              <span>Chuẩn mục tiêu (70%)</span>
            </div>
          </div>
        </div>

        {/* Right: Tiến độ theo các miền năng lực (Hòa vào nền, không viền, căn đều với radar) */}
        <div className="lg:col-span-6 p-2 sm:p-5 lg:pl-8 bg-transparent flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                  <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
                    ĐỐI CHUẨN NĂNG LỰC
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  Tiến độ theo các miền năng lực
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Theo dõi khoảng cách điểm số so với chuẩn mục tiêu 70%.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md self-start mt-1">
                Chuẩn mục tiêu ≥ 70%
              </span>
            </div>

            {/* 5 Thanh tiến độ — Đã dời xuống cân xứng hoàn hảo với biểu đồ Radar bên trái */}
            <div className="space-y-4 pt-5 pb-3">
              {currentRadarData.map((d) => {
                const hasAssessed = Boolean(d.score !== null);
                const scoreVal = d.score ?? 0;

                let statusBadge = {
                  label: 'Chưa đánh giá',
                  className: 'bg-slate-100 dark:bg-zinc-850 text-slate-500 dark:text-neutral-400 border-slate-200 dark:border-zinc-800',
                  barColor: 'bg-transparent',
                };

                if (hasAssessed && scoreVal >= 85) {
                  statusBadge = {
                    label: 'Thành thạo',
                    className: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                    barColor: 'bg-emerald-600 dark:bg-emerald-500',
                  };
                } else if (hasAssessed && scoreVal >= 70) {
                  statusBadge = {
                    label: 'Đạt chuẩn',
                    className: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                    barColor: 'bg-blue-600 dark:bg-blue-400',
                  };
                } else if (hasAssessed && scoreVal > 0) {
                  statusBadge = {
                    label: 'Đang bồi dưỡng',
                    className: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900',
                    barColor: 'bg-blue-600 dark:bg-blue-500',
                  };
                }

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
                          {hasAssessed ? `${scoreVal}%` : 'Chưa đánh giá'}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar with 70% threshold tick */}
                    <div className="relative w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-slate-300 dark:bg-zinc-600 z-10"
                        style={{ left: '70%' }}
                        title="Chuẩn mục tiêu 70%"
                      />
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${
                          !hasAssessed ? 'bg-transparent' : statusBadge.barColor
                        }`}
                        style={{ width: `${hasAssessed ? Math.min(100, scoreVal) : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Banner nhắc khảo thí khi chưa có bài làm */}
            {!competencyProfile?.hasTakenAssessment && (
              <div className="mt-4 p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5 min-w-0">
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                    Khảo sát để kích hoạt hồ sơ năng lực
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-neutral-400 leading-tight">
                    Làm bài khảo sát nhanh để chẩn đoán điểm các miền và mở khóa lộ trình học tập.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBaselineModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                >
                  <span>Khảo sát</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="pt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400">
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

      {/* 5. Row 1 of Bottom: Lộ Trình Học Tập (Stepper) & Bảng Xếp Hạng (Không viền ngang) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Lộ trình học tập dành cho bạn (S-Curve Winding Pathway) */}
        <div className="lg:col-span-8 p-6 sm:p-7 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                  <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
                    LỘ TRÌNH PHÁT TRIỂN NĂNG LỰC SỐ
                  </span>
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Lộ trình học tập dành cho bạn
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  {competencyProfile?.hasTakenAssessment
                    ? 'Gợi ý bồi dưỡng theo khoảng trống năng lực • Tự động điều chỉnh theo kết quả'
                    : 'Khung năng lực số chuẩn hóa • Khảo sát chẩn đoán để kích hoạt gợi ý'}
                </p>
              </div>
              <Link
                href="/personal/learning-path"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1 shrink-0"
              >
                <span>Xem lộ trình</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Spotlight Chặng Trọng Tâm — Tự động gợi ý miền yếu nhất (không mặc định D1) */}
            {suggestedWeakestDomain ? (
              <div className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-r from-blue-50/70 via-slate-50/40 to-white dark:from-blue-950/25 dark:via-zinc-900/30 dark:to-[#111114] border border-blue-200/80 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                    {(() => {
                      const SpotlightIcon = domainIcons[suggestedWeakestDomain.code] || Database;
                      return <SpotlightIcon className="w-5 h-5" strokeWidth={1.75} />;
                    })()}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold">
                        Gợi ý bồi dưỡng • {suggestedWeakestDomain.code}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                        Điểm: {suggestedWeakestDomain.score ?? 0}% • Mục tiêu ≥ 70%
                      </span>
                    </div>
                    <h4 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 truncate">
                      {suggestedWeakestDomain.name}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-neutral-400 line-clamp-1">
                      Miền năng lực có điểm số thấp nhất cần ưu tiên bồi dưỡng chuyên đề để bù đắp khoảng trống.
                    </p>
                  </div>
                </div>

                <Link
                  href={`/personal/learning-path?domain=${suggestedWeakestDomain.code}`}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center justify-center gap-2 transition-all shadow-sm shadow-blue-500/20 shrink-0 cursor-pointer"
                >
                  <span>Vào chặng này</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-r from-blue-50/70 via-slate-50/40 to-white dark:from-blue-950/25 dark:via-zinc-900/30 dark:to-[#111114] border border-blue-200/80 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                    <Compass className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold">
                        Định tuyến cá nhân hóa
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                        Chờ chẩn đoán
                      </span>
                    </div>
                    <h4 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 truncate">
                      Khám phá khoảng trống để mở khóa chặng học
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-neutral-400 line-clamp-1">
                      Làm bài khảo sát nhanh để hệ thống gợi ý chính xác miền năng lực cần bồi dưỡng trước.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBaselineModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center justify-center gap-2 transition-all shadow-sm shadow-blue-500/20 shrink-0 cursor-pointer"
                >
                  <span>Bắt đầu khảo sát</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Dải Lộ Trình S-Curve Winding Pathway (Khúc cua uốn lượn nối 5 trạm) */}
            <div className="relative py-6 sm:py-9 my-1">
              {/* Serpentine S-Curve Ambient Stream Line */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none select-none hidden sm:block"
                viewBox="0 0 1000 180"
                fill="none"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="scurveRoadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.4" />
                    <stop offset="25%" stopColor="#3B82F6" stopOpacity="0.6" />
                    <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.5" />
                    <stop offset="75%" stopColor="#38BDF8" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0.4" />
                  </linearGradient>
                </defs>
                {/* Ambient glow band */}
                <path
                  d="M 100 85 C 180 35, 220 135, 300 85 C 380 35, 420 135, 500 85 C 580 35, 620 135, 700 85 C 780 35, 820 135, 900 85"
                  stroke="url(#scurveRoadGradient)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  className="opacity-25"
                />
                {/* Winding dashed road track */}
                <path
                  d="M 100 85 C 180 35, 220 135, 300 85 C 380 35, 420 135, 500 85 C 580 35, 620 135, 700 85 C 780 35, 820 135, 900 85"
                  stroke="#CBD5E1"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                  className="stroke-slate-300 dark:stroke-zinc-700"
                />
              </svg>

              {/* 5 Trạm Năng Lực Chuẩn Hóa trên các khúc cua */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-2 relative z-10">
                {dynamicStepperItems.map((item, index) => {
                  const Icon = item.icon;
                  const isCrest = index % 2 === 0;

                  return (
                    <Link
                      key={item.step}
                      href={`/personal/learning-path?domain=${item.code}`}
                      className={`flex flex-col items-center text-center group cursor-pointer transition-transform duration-200 hover:-translate-y-1 ${
                        isCrest ? 'sm:-translate-y-2' : 'sm:translate-y-3'
                      }`}
                    >
                      {/* Checkpoint Node */}
                      <div
                        className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                          item.isSuggested
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/20'
                            : item.done
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                            : 'bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 shadow-2xs group-hover:border-blue-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" strokeWidth={1.75} />

                        {/* Station Order Badge */}
                        <span
                          className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full font-mono text-[9px] font-bold flex items-center justify-center border ${
                            item.isSuggested
                              ? 'bg-blue-800 text-white border-blue-400'
                              : item.done
                              ? 'bg-emerald-700 text-white border-emerald-400'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
                          }`}
                        >
                          0{item.step}
                        </span>
                      </div>

                      {/* Tên Miền Đầy Đủ — Tuyệt Đối Không Rút Gọn */}
                      <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 mt-2.5 leading-snug px-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.name}
                      </div>

                      {/* SEO Microcopy Status Tag — Bỏ chữ 'Chưa đánh giá' */}
                      {item.isSuggested ? (
                        <span className="mt-1.5 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-900">
                          Ưu tiên học
                        </span>
                      ) : item.done ? (
                        <span className="mt-1.5 px-2 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-200 dark:border-emerald-900 inline-flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>{item.score}% Đạt chuẩn</span>
                        </span>
                      ) : item.score !== null ? (
                        <span className="mt-1.5 text-[10px] font-mono text-slate-500 dark:text-neutral-400">
                          {item.score}% • Cần luyện
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 flex items-center justify-between text-[11px] text-slate-400 dark:text-neutral-500">
            <span>Tiến trình mở khóa chuyên đề bồi dưỡng theo khoảng trống năng lực số thực tế.</span>
            <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
              Đạt chuẩn: {passedDomainsCount} miền năng lực
            </span>
          </div>
        </div>

        {/* Card 2: Bảng xếp hạng hệ thống toàn nền tảng */}
        <div className="lg:col-span-4 p-6 sm:p-7 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" strokeWidth={1.75} />
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Bảng xếp hạng hệ thống
                </h3>
              </div>
              <Link
                href="/personal/leaderboard"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Xem tất cả &rarr;
              </Link>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 mb-3">
              Top học viên có điểm PTS tích lũy cao nhất toàn nền tảng.
            </p>

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
                            <img src={avatarSrc} alt={user.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
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

      {/* 6. Row 2 of Bottom: Hoạt động gần đây, Gợi ý cho bạn & Mục tiêu nhanh */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${recommendedModules.length > 0 ? 'lg:grid-cols-3' : ''} gap-6`}>
        {/* Card 1: Hoạt động gần đây */}
        <div className="p-6 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2">
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
                        +1 điểm
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
                      {stats.points} điểm
                    </span>
                  </div>
                </>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 dark:text-neutral-500">
                  Chưa có hoạt động ghi nhận điểm. Làm bài khảo thí hoặc học bài để nhận điểm.
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 mt-2 text-right">
            <Link
              href="/personal/leaderboard"
              className="text-[11px] text-slate-400 hover:text-blue-600 transition-colors"
            >
              Lịch sử ghi nhận điểm &rarr;
            </Link>
          </div>
        </div>

        {/* Card 2: Gợi ý bồi dưỡng theo khoảng trống năng lực (Chỉ hiện khi có bài trong thư viện chuẩn) */}
        {recommendedModules.length > 0 && (
          <div className="p-6 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Gợi ý cho bạn
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60 text-[10px] font-mono font-bold">
                  Bồi dưỡng khoảng trống
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mb-3">
                Chuyên đề đề xuất nhằm bồi dưỡng <strong className="text-neutral-800 dark:text-neutral-200">{weakestDomainName}</strong>.
              </p>

              <div className="space-y-2.5">
                {recommendedModules.map((mod) => (
                  <Link
                    key={mod.id}
                    href={`/personal/learning-path#module-${mod.id}`}
                    className="p-3 rounded-xl border border-slate-200/70 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-700 flex items-center justify-between gap-3 text-xs transition-all group bg-slate-50/50 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-900 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-100/70 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4" strokeWidth={1.75} />
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                          {mod.title}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono mt-0.5">
                          {mod.duration_minutes || 15} phút &bull; +{mod.point_reward || 20} PTS
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-3 text-right">
              <Link
                href="/personal/learning-path"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Vào lộ trình bồi dưỡng</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        )}

        {/* Card 3: Mục tiêu nhanh — Phong cách Next Steps / Minimalist Borderless */}
        <div className="p-1 sm:p-2 bg-transparent flex flex-col justify-between">
          <div>
            <div className="pb-3 mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-neutral-800 dark:text-neutral-200" strokeWidth={2} />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Mục tiêu nhanh
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                Nhiệm vụ cần làm &bull; Tự động đồng bộ
              </p>
            </div>

            <div className="space-y-3.5">
              {masterMilestones.map((m) => {
                const IconComponent = m.icon;
                return (
                  <div
                    key={m.id}
                    className="flex items-start justify-between gap-3 text-xs group"
                  >
                    {/* Left Circular Icon */}
                    <div
                      className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        m.done
                          ? 'border-slate-200 dark:border-zinc-800 bg-slate-100/80 dark:bg-zinc-800/60 text-slate-400 dark:text-neutral-500'
                          : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-700 dark:text-zinc-200 shadow-2xs'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" strokeWidth={1.75} />
                    </div>

                    {/* Middle Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`font-semibold text-xs leading-snug ${
                            m.done
                              ? 'line-through text-slate-400 dark:text-neutral-500'
                              : 'text-neutral-900 dark:text-neutral-100'
                          }`}
                        >
                          {m.title}
                        </span>
                        {m.progressInfo && !m.done && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-medium">
                            {m.progressInfo}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                        {m.description}
                        {!m.done && m.actionHref && (
                          <>
                            {' '}
                            <Link
                              href={m.actionHref}
                              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
                            >
                              <span>{m.actionLabel}</span>
                              <ArrowRight className="w-3 h-3 inline" />
                            </Link>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Right Checkbox */}
                    <div className="shrink-0 pt-0.5">
                      {m.done ? (
                        <div
                          className="w-5 h-5 rounded border border-slate-400/90 bg-slate-400/90 dark:border-zinc-600 dark:bg-zinc-600 text-white flex items-center justify-center shadow-2xs"
                          title="Đã hoàn thành"
                        >
                          <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </div>
                      ) : (
                        <div
                          className="w-5 h-5 rounded border-2 border-slate-300 dark:border-zinc-700 bg-transparent"
                          title="Chưa hoàn thành"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 mt-3 flex items-center justify-between text-[11px] text-slate-400 dark:text-neutral-500">
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
            <div className="flex items-center justify-between pb-2">
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
      {/* Modal Khảo Thí Chẩn Đoán Đầu Vào (Lựa chọn 2: Tự động mở khi mới vào, có thể bỏ qua để làm sau) */}
      <BaselineDiagnosticModal
        isOpen={isBaselineModalOpen}
        onClose={handleCloseBaselineModal}
        onCompleted={() => {
          handleCloseBaselineModal();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('profile-updated'));
          }
        }}
      />
    </div>
  );
}
