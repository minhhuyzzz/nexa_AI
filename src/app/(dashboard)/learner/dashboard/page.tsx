'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckSquare,
  Award,
  Trophy,
  Flame,
  KeyRound,
  ChevronRight,
  Compass,
  Check,
  X,
} from 'lucide-react';
import { CompetencyRadarChart, DomainScore } from '@/components/dashboard/learner/CompetencyRadarChart';

interface RealAssessment {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  passing_score: number;
  point_reward?: number;
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
    certPointsNeeded: number;
    newLoginToday: boolean;
  }>({
    nickname: 'Học Viên Nexa',
    fullName: 'Học Viên Nexa',
    avatarUrl: null,
    points: 0,
    totalLoginDays: 0,
    loginStreak: 0,
    levelCode: 'Level 1: Basic',
    levelNextTarget: 150,
    isCertUnlocked: false,
    certPointsNeeded: 450,
    newLoginToday: false,
  });

  const [competencyProfile, setCompetencyProfile] = useState<{
    hasTakenAssessment?: boolean;
    totalAssessmentsCompleted?: number;
    overallScore: number;
    radarData: DomainScore[];
    insights: {
      strongest: { code: string; name: string; score: number; level: string } | null;
      weakest: { code: string; name: string; score: number; level: string; isGap: boolean } | null;
    } | null;
  } | null>(null);

  const [assessments, setAssessments] = useState<RealAssessment[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);

  useEffect(() => {
    async function loadStats() {
      setLoadingStats(true);
      try {
        const res = await fetch('/api/learner/profile-stats', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setStats({
              nickname: json.user?.nickname || 'Học Viên Nexa',
              fullName: json.user?.fullName || json.user?.nickname || 'Học Viên Nexa',
              avatarUrl: json.user?.avatarUrl || null,
              points: json.stats?.points ?? 0,
              totalLoginDays: json.stats?.totalLoginDays ?? 0,
              loginStreak: json.stats?.loginStreak ?? 0,
              levelCode: json.stats?.level?.code ?? 'Level 1: Basic',
              levelNextTarget: json.stats?.level?.nextTarget ?? 150,
              isCertUnlocked: json.stats?.certificate?.isUnlocked ?? false,
              certPointsNeeded: json.stats?.certificate?.pointsNeeded ?? 450,
              newLoginToday: json.stats?.newLoginToday ?? false,
            });
            if (json.user?.id) {
              loadLeaderboard(json.user.id, json.user?.avatarUrl);
            }
          }
        }
      } catch {
        // Fallback to default state
      } finally {
        setLoadingStats(false);
      }
    }

    async function loadCompetencyProfile() {
      try {
        const res = await fetch('/api/learner/competency-profile', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setCompetencyProfile(json);
          }
        }
      } catch {
        // Fallback to default state
      }
    }

    async function loadAssessments() {
      setLoadingAssessments(true);
      try {
        const res = await fetch('/api/assessments', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.assessments && Array.isArray(json.assessments)) {
            setAssessments(json.assessments.slice(0, 3));
          }
        }
      } catch {
        // Fallback to empty
      } finally {
        setLoadingAssessments(false);
      }
    }

    async function loadLeaderboard(myUserId?: string, myAvatarUrl?: string | null) {
      setLoadingLeaderboard(true);
      try {
        const res = await fetch('/api/leaderboard', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.leaderboard && Array.isArray(json.leaderboard)) {
            const currentMyId = myUserId || json.currentUserRank?.userId;
            const top3 = json.leaderboard.slice(0, 3).map((u: any) => {
              const name = u.displayName || 'Học viên Nexa';
              const inits = name
                .split(' ')
                .filter(Boolean)
                .slice(-2)
                .map((w: string) => w[0]?.toUpperCase())
                .join('') || 'NX';

              const isMe = Boolean(currentMyId && u.userId === currentMyId);
              const avatarUrl = isMe ? (myAvatarUrl || u.avatarUrl || null) : (u.avatarUrl || null);

              return {
                rank: u.rank,
                name: isMe ? `${name} (Bạn)` : name,
                points: `${u.points ?? 0} pts`,
                avatar: inits,
                avatarUrl,
                isMe,
              };
            });
            setLeaderboard(top3);
          }
        }
      } catch {
        // Fallback to empty
      } finally {
        setLoadingLeaderboard(false);
      }
    }

    loadStats();
    loadCompetencyProfile();
    loadAssessments();
    loadLeaderboard();
  }, []);

  // Calculate Level progress circle
  const progressRatio = Math.min(100, Math.round((stats.points / (stats.levelNextTarget || 450)) * 100));

  return (
    <div className="space-y-8">
      {/* 1. Header & Quick Widgets */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {loadingStats ? (
                <span className="inline-block w-48 h-8 bg-slate-200/80 rounded animate-pulse align-middle" />
              ) : (
                `Xin chào, ${stats.fullName}!`
              )}
            </h1>
            {!loadingStats && stats.newLoginToday && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1 shadow-xs animate-in fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                +1đ đăng nhập hôm nay
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Chào mừng bạn trở lại. Hãy cùng theo dõi tiến độ và tiếp tục hoàn thiện năng lực số.
          </p>
        </div>

        {/* Quick Indicators */}
        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600">
          {/* Level Progress - Calculated Tier System */}
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {progressRatio > 0 && (
                  <path
                    className="text-emerald-600 transition-all duration-500"
                    strokeDasharray={`${progressRatio}, 100`}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                )}
              </svg>
              <span className="absolute font-bold text-xs text-emerald-900 font-mono">{stats.points}</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-900 font-mono">
                  {stats.levelCode}
                </span>
                <button
                  type="button"
                  onClick={() => setShowLevelModal(true)}
                  className="text-[10px] text-slate-400 hover:text-slate-700 underline cursor-pointer"
                  title="Xem chi tiết các mốc cấp bậc"
                >
                  (Quy định cấp)
                </button>
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                <strong className="font-semibold text-slate-900 font-mono">{stats.points}</strong> / {stats.levelNextTarget} điểm
              </div>
            </div>
          </div>

          {/* Activity Days - Streak & Total Login Days */}
          <div>
            <div className="flex items-center justify-between gap-3 text-[11px] mb-1.5">
              <div className="flex items-center gap-1 text-slate-700 font-semibold">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Chuỗi {stats.loginStreak} ngày</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium font-mono">
                (Tổng {stats.totalLoginDays} ngày đã vào)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {(() => {
                const now = new Date();
                const dayOfWeek = now.getDay();
                const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0=T2, 1=T3, 2=T4, 3=T5, 4=T6, 5=T7, 6=CN
                const monday = new Date(now);
                monday.setDate(now.getDate() - dayIndex);

                const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

                return dayLabels.map((dayLabel, idx) => {
                  const d = new Date(monday);
                  d.setDate(monday.getDate() + idx);
                  const dateNum = d.getDate();

                  let status: 'done' | 'today' | 'upcoming' = 'upcoming';
                  if (idx === dayIndex) {
                    status = 'today';
                  } else if (idx < dayIndex) {
                    const daysAgo = dayIndex - idx;
                    if (stats.loginStreak > daysAgo) {
                      status = 'done';
                    }
                  }

                  return (
                    <div key={dayLabel} className="flex flex-col items-center gap-1">
                      <span className="text-[9px] text-slate-400 font-medium">{dayLabel}</span>
                      <span
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-semibold transition-colors font-mono tabular-nums ${status === 'done'
                            ? 'bg-amber-500 text-white shadow-xs font-bold'
                            : status === 'today'
                              ? 'bg-amber-50 text-amber-800 border-2 border-amber-500 font-bold'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                      >
                        {status === 'done' ? (
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        ) : (
                          dateNum
                        )}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Clean Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-1">
        <div className="py-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <CheckSquare className="w-4 h-4 text-slate-400" />
            <span>Bài đã làm</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {competencyProfile?.totalAssessmentsCompleted ?? 0}
          </div>
        </div>

        <div className="py-1 sm:pl-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Compass className="w-4 h-4 text-slate-400" />
            <span>Miền đạt chuẩn</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {competencyProfile?.hasTakenAssessment
              ? `${competencyProfile.radarData.filter((d) => d.score >= 70).length}/5`
              : '0/5'}
          </div>
        </div>

        <div className="py-1 sm:pl-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Điểm tích luỹ</span>
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono tabular-nums">{stats.points}</div>
        </div>

        <Link
          href="/learner/credentials"
          className="py-1 sm:pl-2 block group hover:opacity-90 transition-opacity"
        >
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Award className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
            <span className="group-hover:text-sky-600 transition-colors">Chứng chỉ Level 4</span>
          </div>
          <div className="flex items-center gap-1.5 h-8">
            <span
              className={`w-1.5 h-1.5 rounded-full ${stats.isCertUnlocked ? 'bg-emerald-600' : 'bg-slate-400'
                }`}
            />
            <span
              className={`text-sm font-semibold ${stats.isCertUnlocked ? 'text-emerald-700' : 'text-slate-600'
                }`}
            >
              {stats.isCertUnlocked ? 'Hoàn thành' : 'Chưa hoàn thành'}
            </span>
          </div>
        </Link>
      </div>

      {/* 3. Spider / Radar Chart Section with Clean AI Diagnostic Insights */}
      <div className="p-6 rounded-md border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-6 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Sơ đồ năng lực 5 miền chính
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Phân tích trực quan mức độ phát triển năng lực số theo 5 miền cốt lõi.
            </p>
          </div>
          <Link
            href="/learner/learning-path"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            <span>Chi tiết phân tích &amp; đề xuất AI</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Radar Chart (6 cols) */}
          <div className="lg:col-span-6 flex justify-center py-2">
            <CompetencyRadarChart data={competencyProfile?.radarData} size={320} />
          </div>

          {/* Compact 5-Domain Metrics & Milestone Action (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-4 rounded-md bg-slate-50 border border-slate-200/80 space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Chỉ số năng Lực Số
                </span>
              </div>

              {/* 5 Compact Progress Bars */}
              <div className="space-y-2.5">
                {(competencyProfile?.radarData || [
                  { code: 'D1', name: 'Thông tin & Dữ liệu', score: 0, target: 70 },
                  { code: 'D2', name: 'Giao tiếp & Hợp tác', score: 0, target: 70 },
                  { code: 'D3', name: 'Sáng tạo Nội dung số', score: 0, target: 70 },
                  { code: 'D4', name: 'An toàn & Bảo mật', score: 0, target: 70 },
                  { code: 'D5', name: 'Giải quyết Vấn đề', score: 0, target: 70 },
                ]).map((d) => {
                  const hasAssessed = competencyProfile?.hasTakenAssessment ?? false;
                  const isGap = hasAssessed && d.score < 70;
                  return (
                    <div key={d.code} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-mono font-bold text-slate-800 w-5 shrink-0">
                            {d.code}
                          </span>
                          <span className="text-slate-700 truncate font-medium">
                            {d.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {hasAssessed && (
                            isGap ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                Cần rèn luyện
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Đạt chuẩn
                              </span>
                            )
                          )}
                          <span
                            className={`font-mono font-bold tabular-nums ${!hasAssessed
                                ? 'text-slate-400'
                                : isGap
                                  ? 'text-amber-700'
                                  : 'text-slate-900'
                              }`}
                          >
                            {d.score}%
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar with 70% threshold tick */}
                      <div className="relative w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${!hasAssessed
                              ? 'bg-slate-300'
                              : isGap
                                ? 'bg-amber-500'
                                : d.score >= 85
                                  ? 'bg-sky-600'
                                  : 'bg-sky-500'
                            }`}
                          style={{ width: `${Math.min(100, d.score)}%` }}
                        />
                        {/* 70% threshold marker */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-slate-400/60 z-10"
                          style={{ left: '70%' }}
                          title="Vạch chuẩn mục tiêu (70%)"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Quick Milestone & Action */}
              {!competencyProfile?.hasTakenAssessment ? (
                <div className="pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                    <span>Chưa có dữ liệu khảo thí. Làm bài thi đầu tiên để kích hoạt chỉ số năng lực số!</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href="/learner/assessments"
                      className="px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors inline-flex items-center gap-1 shadow-xs"
                    >
                      <span>Bắt đầu khảo thí</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${competencyProfile.insights?.weakest?.isGap ? 'bg-amber-500' : 'bg-emerald-600'
                        } shrink-0`}
                    />
                    <span>
                      {competencyProfile.insights?.weakest?.isGap ? (
                        <>
                          Ưu tiên: <strong>Miền {competencyProfile.insights.weakest.code}</strong> (
                          {competencyProfile.insights.weakest.score}%) đang dưới chuẩn 70%
                        </>
                      ) : (
                        <>Xuất sắc: Tất cả 5 miền đều đạt chuẩn năng lực số &ge; 70%</>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href="/learner/learning-path"
                      className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition-colors"
                    >
                      Lộ trình AI
                    </Link>
                    <Link
                      href="/learner/assessments"
                      className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors inline-flex items-center gap-1 shadow-xs"
                    >
                      <span>Luyện tập</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Choose a focus today - Dynamically fetched from real database */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Bài đánh giá đề xuất cho bạn
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Lựa chọn bài kiểm tra phù hợp với mục tiêu phát triển của bạn.
            </p>
          </div>
          <Link
            href="/learner/assessments"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            <span>Xem tất cả</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingAssessments ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-5 rounded-md border border-slate-200 bg-white animate-pulse space-y-3">
              <div className="flex justify-between">
                <div className="w-16 h-3 bg-slate-200 rounded" />
                <div className="w-20 h-3 bg-slate-200 rounded" />
              </div>
              <div className="w-3/4 h-4 bg-slate-200 rounded" />
              <div className="w-full h-10 bg-slate-100 rounded" />
              <div className="pt-4 border-t border-slate-100 flex justify-between">
                <div className="w-16 h-4 bg-slate-200 rounded" />
                <div className="w-20 h-4 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        ) : assessments.length > 0 ? (
          <div className={`grid grid-cols-1 ${assessments.length === 1 ? 'max-w-xl' : assessments.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4`}>
            {assessments.map((test) => (
              <div
                key={test.id}
                className="p-5 rounded-md border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span className="font-mono text-slate-600 font-medium">{test.duration_minutes || 30} phút</span>
                    <span className="font-mono text-slate-600">Chuẩn đạt: {test.passing_score || 70}%</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2 leading-snug">{test.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{test.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                    +{test.point_reward ?? 50} điểm
                  </span>
                  <Link
                    href={`/learner/take/${test.id}`}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1 group"
                  >
                    <span>Bắt đầu làm bài</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-md border border-slate-200 bg-white shadow-xs">
            <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" strokeWidth={1.75} />
            <p className="text-xs text-slate-500">Đang chuẩn bị các bài khảo thí năng lực số.</p>
            <Link href="/learner/assessments" className="text-xs text-sky-600 font-medium hover:underline mt-2 inline-block">
              Xem danh mục bài khảo thí &rarr;
            </Link>
          </div>
        )}
      </div>

      {/* 5. Two-Column Content: Dynamic Learning Pathway & Real Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Learning Pathway Card - DYNAMICALLY DEPENDENT ON ASSESSMENT DATA */}
        <div className="lg:col-span-2 p-6 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between pb-2 mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Lộ trình học tập tiếp theo
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Các chuyên đề bồi dưỡng định hướng theo chuẩn DigComp 3.0.
              </p>
            </div>
            <Link
              href="/learner/learning-path"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700"
            >
              Xem lộ trình →
            </Link>
          </div>

          {!competencyProfile?.hasTakenAssessment ? (
            <div className="p-8 text-center rounded-md bg-slate-50 border border-slate-200/80">
              <Compass className="w-8 h-8 text-slate-300 mx-auto mb-2" strokeWidth={1.75} />
              <h4 className="text-xs font-semibold text-slate-800 mb-1">
                Chưa kích hoạt lộ trình học tập cá nhân hóa
              </h4>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto mb-4 leading-relaxed">
                Hoàn thành bài khảo thí đầu tiên để hệ thống AI phát hiện khoảng trống năng lực và thiết kế lộ trình bồi dưỡng riêng cho bạn.
              </p>
              <Link
                href="/learner/assessments"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors shadow-xs"
              >
                <span>Bắt đầu khảo thí ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="p-4 rounded-md bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-md bg-sky-600 text-white flex items-center justify-center font-bold text-xs shrink-0 font-mono shadow-xs">
                  {competencyProfile.insights?.weakest?.code || '01'}
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-amber-700 font-mono uppercase">
                    Khoảng trống cần ưu tiên
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-0.5">
                    {competencyProfile.insights?.weakest?.name || 'Hoàn thiện năng lực số'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mức độ hiện tại: {competencyProfile.insights?.weakest?.score ?? 0}% • Chuẩn mục tiêu: ≥ 70%
                  </p>
                </div>
              </div>
              <Link
                href="/learner/learning-path"
                className="px-3.5 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors shrink-0 text-center shadow-xs inline-flex items-center gap-1"
              >
                <span>Vào lộ trình AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Leaderboard Preview - REAL DATA FROM DATABASE */}
        <div className="p-6 rounded-md border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" strokeWidth={1.75} />
                <h3 className="text-sm font-bold text-slate-900">Bảng xếp hạng</h3>
              </div>
              <Link
                href="/learner/leaderboard"
                className="text-xs font-semibold text-sky-600 hover:text-sky-700"
              >
                Xem tất cả →
              </Link>
            </div>

            <div className="space-y-2">
              {loadingLeaderboard ? (
                <div className="space-y-2.5 py-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-md animate-pulse bg-slate-50 border border-transparent">
                      <div className="flex items-center gap-2.5">
                        <div className="w-4 h-3 bg-slate-200 rounded" />
                        <div className="w-7 h-7 bg-slate-200 rounded-full" />
                        <div className="w-24 h-3 bg-slate-200 rounded" />
                      </div>
                      <div className="w-10 h-3 bg-slate-200 rounded" />
                    </div>
                  ))}
                </div>
              ) : leaderboard.length > 0 ? (
                leaderboard.map((user) => (
                  <div
                    key={`${user.rank}-${user.name}`}
                    className={`flex items-center justify-between p-2.5 rounded-md text-xs border transition-colors ${user.isMe
                        ? 'bg-sky-50/70 border-sky-200'
                        : 'hover:bg-slate-50 border-transparent hover:border-slate-100'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`font-bold w-4 font-mono ${user.isMe ? 'text-sky-700' : 'text-slate-500'}`}>
                        {user.rank}
                      </span>
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold font-mono shrink-0 ${user.isMe ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                        >
                          {user.avatar}
                        </div>
                      )}
                      <span className={`truncate max-w-[130px] font-medium ${user.isMe ? 'text-sky-900 font-semibold' : 'text-slate-800'}`}>
                        {user.name}
                      </span>
                    </div>
                    <span className={`font-mono font-semibold ${user.isMe ? 'text-sky-700' : 'text-slate-900'}`}>
                      {user.points}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Chưa có dữ liệu xếp hạng
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-slate-100 text-center">
            <Link
              href="/learner/live-pin"
              className="text-xs text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
              <span>Có mã phòng thi từ giáo viên?</span>
              <span className="text-sky-600 font-semibold">Nhập PIN →</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Level Tier Explanation Modal */}
      {showLevelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-md border border-slate-200 p-6 max-w-lg w-full shadow-sm space-y-4 text-xs text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Hệ Thống 4 Cấp Độ Năng Lực Số Chuẩn Hóa
                </h3>
              </div>
              <button
                onClick={() => setShowLevelModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            <p className="text-slate-500 leading-relaxed text-[11px]">
              Cấp độ phản ánh mức độ thành thạo thực tế của người học qua các bài khảo thí chuẩn hóa, thực hành nộp minh chứng và đánh giá năng lực số theo khung tham chiếu chuẩn.
            </p>

            {/* 4 Standardized DigComp Levels */}
            <div className="space-y-2.5">
              {[
                {
                  code: 'Level 1: Basic',
                  range: '0 – 149 điểm',
                  desc: 'Thao tác cơ bản có hướng dẫn, giải quyết các tác vụ số đơn giản thường nhật.',
                },
                {
                  code: 'Level 2: Intermediate',
                  range: '150 – 299 điểm',
                  desc: 'Tự chủ độc lập, hiểu rõ công cụ số và tự giải quyết các vấn đề thường gặp.',
                },
                {
                  code: 'Level 3: Advanced',
                  range: '300 – 449 điểm',
                  desc: 'Thành thạo chuyên sâu, làm việc cùng AI và tối ưu hóa giải pháp số.',
                },
                {
                  code: 'Level 4: Highly Advanced',
                  range: 'Từ 450 điểm trở lên',
                  desc: 'Chuyên gia chiến lược, đề xuất giải pháp số sáng tạo và phát triển hệ sinh thái.',
                },
              ].map((tier) => (
                <div
                  key={tier.code}
                  className="p-3 rounded-md border border-slate-200 bg-slate-50 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900 text-xs font-mono">
                      {tier.code}
                    </div>
                    <div className="text-[11px] text-slate-600 leading-relaxed">
                      {tier.desc}
                    </div>
                  </div>
                  <span className="font-medium text-slate-600 text-[11px] font-mono shrink-0 whitespace-nowrap pt-0.5">
                    {tier.range}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowLevelModal(false)}
                className="px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
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
