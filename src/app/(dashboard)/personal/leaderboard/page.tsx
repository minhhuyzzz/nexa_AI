'use client';

import { useState, useEffect, useCallback, Suspense, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Crown,
  Search,
  RefreshCw,
  Trophy,
  User,
  ArrowRight,
  Medal,
  Sparkles,
  Calendar,
  Clock,
  Flame,
  ShieldCheck,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  LeaderboardHeroIllustration,
  LaurelWreathGold,
  LaurelWreathSilver,
  LaurelWreathBronze,
  TableMedalBadge,
  PodiumPedestalBase,
  EmptyLeaderboardIllustration,
} from '@/components/dashboard/personal/LeaderboardGraphics';

type Period = 'today' | 'week' | 'month' | 'all';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  points: number;
  role: string;
  specialization: string | null;
}

interface CurrentUserRank {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  points: number;
}

const PERIOD_TABS: { id: Period; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; desc: string }[] = [
  { id: 'today', label: 'Hôm nay', icon: Zap, desc: '24 giờ qua' },
  { id: 'week', label: 'Tuần này', icon: Flame, desc: '7 ngày qua' },
  { id: 'month', label: 'Tháng này', icon: Clock, desc: '30 ngày qua' },
  { id: 'all', label: 'Tất cả', icon: Trophy, desc: 'Toàn thời gian' },
];

function LeaderboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPeriod = (searchParams.get('period') as Period) || 'all';

  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<CurrentUserRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [hasError, setHasError] = useState(false);
  const [, startTransition] = useTransition();

  const fetchLeaderboard = useCallback(async (activePeriod: Period = period) => {
    setLoading(true);
    setHasError(false);
    try {
      const res = await fetch(`/api/leaderboard?period=${activePeriod}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.leaderboard || data.leaderboard.length === 0) {
        setLeaderboard([]);
        setMyRank(data.currentUserRank || null);
      } else {
        const sorted = (data.leaderboard as LeaderboardEntry[]).sort(
          (a, b) => b.points - a.points
        );
        setLeaderboard(sorted);
        setMyRank(data.currentUserRank || null);
      }
    } catch {
      setHasError(true);
      setLeaderboard([]);
      setMyRank(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  const handlePeriodChange = (newPeriod: Period) => {
    if (newPeriod === period) return;
    setPeriod(newPeriod);
    setCurrentPage(1);
    startTransition(() => {
      router.replace(`/personal/leaderboard?period=${newPeriod}`, { scroll: false });
    });
    fetchLeaderboard(newPeriod);
  };

  useEffect(() => {
    fetchLeaderboard(initialPeriod);
  }, [fetchLeaderboard, initialPeriod]);

  // Reset về trang 1 khi người dùng lọc tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  const filteredList = searchQuery.trim()
    ? leaderboard.filter((entry) =>
        entry.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : leaderboard;

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedList = filteredList.slice(
    (validCurrentPage - 1) * pageSize,
    validCurrentPage * pageSize
  );

  const currentPeriodConfig = PERIOD_TABS.find((t) => t.id === period) || PERIOD_TABS[0];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* 1. Page Header & Hero Showcase */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] p-6 sm:p-7 shadow-xs relative overflow-hidden transition-colors">
        {/* Subtle Background Radial Aura */}
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-amber-500/5 via-blue-500/5 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800 text-[11px] font-bold text-amber-800 dark:text-amber-300 font-mono tracking-wide shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>VINH DANH NĂNG LỰC SỐ • BẢNG VÀNG TOÀN NỀN TẢNG</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Bảng Xếp Hạng Thành Tích
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Vinh danh những cá nhân xuất sắc nhất trong quá trình bồi dưỡng và thực hành 5 miền năng lực số. Tích lũy điểm PTS từ bài thi, thực hành và hoạt động đóng góp.
            </p>

            {/* Timeframe Filter Tabs: Tuần này / Tháng này / Tất cả */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
                {PERIOD_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = period === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handlePeriodChange(tab.id)}
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                        isActive
                          ? 'bg-white dark:bg-black text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/60 dark:border-zinc-800'
                          : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-slate-200/50 dark:hover:bg-zinc-800/60'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} strokeWidth={2} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => fetchLeaderboard(period)}
                disabled={loading}
                title="Làm mới dữ liệu"
                aria-label="Làm mới bảng xếp hạng"
                className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-slate-50 dark:hover:bg-zinc-850 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`}
                  strokeWidth={1.75}
                />
              </button>
            </div>
          </div>

          {/* Right Vector Illustration */}
          <div className="hidden md:flex justify-center items-center shrink-0">
            <LeaderboardHeroIllustration />
          </div>
        </div>
      </div>

      {/* 2. Top 3 Distinction Spotlight Podium (Hạng 2 - Hạng 1 - Hạng 3) */}
      {!loading && top1 ? (
        <section aria-label="Top 3 học viên dẫn đầu" className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
                  Bảng Vàng Danh Dự &bull; {currentPeriodConfig.label}
                </h2>
              </div>
            </div>

            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-850 text-slate-600 dark:text-neutral-400 text-[11px] font-mono font-medium border border-slate-200/60 dark:border-zinc-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Thời gian thực &bull; {currentPeriodConfig.desc}</span>
            </div>
          </div>

          {/* 3 Distinction Spotlight Cards with Architectural Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 items-end pt-4">

            {/* CARD 2: Á QUÂN (HẠNG #2 - BẠC) */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 sm:p-6 shadow-xs flex flex-col items-center text-center relative hover:border-slate-300 dark:hover:border-zinc-700 transition-all order-2 md:order-1">
              {/* Badge Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-850 border border-slate-300/80 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-[11px] font-extrabold font-mono tracking-wide shadow-2xs">
                <Medal className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" strokeWidth={2} />
                <span>HẠNG #2 &bull; Á QUÂN</span>
              </div>

              {/* Avatar Frame with Silver Laurel Wreath */}
              <div className="relative mt-5 mb-2 w-20 h-20 sm:w-22 sm:h-22 flex items-center justify-center">
                <LaurelWreathSilver />
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 border-slate-300 dark:border-zinc-600 ring-4 ring-slate-100 dark:ring-zinc-800 overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-zinc-800 font-mono font-bold text-lg text-slate-700 dark:text-zinc-200 shadow-sm relative z-0">
                  {top2?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={top2.avatarUrl}
                      alt={top2.displayName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{top2?.displayName?.[0] || '2'}</span>
                  )}
                </div>
              </div>

              {/* Identity */}
              <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 mt-2 truncate max-w-full">
                {top2?.displayName || 'Chưa cập nhật'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 truncate max-w-full font-medium">
                {top2?.specialization || 'Thành viên xuất sắc'}
              </p>

              {/* Points Inset Box */}
              <div className="w-full mt-4 pt-3 pb-2.5 px-3 rounded-xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-400 uppercase tracking-wider font-mono">
                  TỔNG PTS TÍCH LŨY
                </span>
                <div className="text-xl sm:text-2xl font-black font-mono text-neutral-800 dark:text-zinc-200 tabular-nums mt-0.5">
                  {top2?.points?.toLocaleString('vi-VN') || 0}{' '}
                  <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">PTS</span>
                </div>
              </div>

              {/* Architectural Step Pedestal */}
              <PodiumPedestalBase rank={2} />
            </div>

            {/* CARD 1: QUÁN QUÂN (HẠNG #1 - VÀNG KIM, HERO CENTERPIECE) */}
            <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-600/70 bg-gradient-to-b from-amber-50/50 to-amber-50/10 dark:from-amber-950/30 dark:to-[#111114] p-6 sm:p-7 shadow-md flex flex-col items-center text-center relative order-1 md:order-2 md:-translate-y-4 transition-all">
              {/* Badge Pill */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-600 text-amber-900 dark:text-amber-200 text-xs font-black font-mono tracking-wide shadow-xs">
                <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300 fill-amber-500" strokeWidth={2} />
                <span>HẠNG #1 &bull; QUÁN QUÂN</span>
              </div>

              {/* Avatar Frame with Gold Crown & Laurel Wreath */}
              <div className="relative mt-6 mb-2 w-24 h-24 sm:w-26 sm:h-26 flex items-center justify-center">
                <LaurelWreathGold />
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border-2 border-amber-400 ring-4 ring-amber-200/90 dark:ring-amber-900/60 overflow-hidden flex items-center justify-center bg-white dark:bg-zinc-900 font-mono font-black text-2xl text-amber-900 dark:text-amber-200 shadow-md relative z-0">
                  {top1?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={top1.avatarUrl}
                      alt={top1.displayName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{top1?.displayName?.[0] || '1'}</span>
                  )}
                </div>
              </div>

              {/* Identity */}
              <h3 className="font-black text-base sm:text-lg text-neutral-900 dark:text-neutral-100 mt-2 truncate max-w-full">
                {top1?.displayName || 'Quán quân'}
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold mt-0.5 truncate max-w-full">
                {top1?.specialization || 'Dẫn đầu bảng vàng toàn nền tảng'}
              </p>

              {/* Points Inset Box */}
              <div className="w-full mt-4 pt-3.5 pb-2.5 px-4 rounded-xl bg-amber-100/70 dark:bg-amber-950/80 border border-amber-300/80 dark:border-amber-700/80 flex flex-col items-center shadow-2xs">
                <span className="text-[10px] font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider font-mono">
                  TỔNG PTS TÍCH LŨY
                </span>
                <div className="text-2xl sm:text-3xl font-black font-mono text-amber-950 dark:text-amber-100 tabular-nums mt-0.5">
                  {top1?.points?.toLocaleString('vi-VN') || 0}{' '}
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">PTS</span>
                </div>
              </div>

              {/* Architectural Step Pedestal */}
              <PodiumPedestalBase rank={1} />
            </div>

            {/* CARD 3: QUÝ QUÂN (HẠNG #3 - ĐỒNG) */}
            <div className="rounded-2xl border border-amber-200/70 dark:border-amber-900/60 bg-white dark:bg-[#111114] p-5 sm:p-6 shadow-xs flex flex-col items-center text-center relative hover:border-amber-300 dark:hover:border-amber-800 transition-all order-3 md:order-3">
              {/* Badge Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50/80 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-[11px] font-extrabold font-mono tracking-wide shadow-2xs">
                <Medal className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" strokeWidth={2} />
                <span>HẠNG #3 &bull; QUÝ QUÂN</span>
              </div>

              {/* Avatar Frame with Bronze Laurel Wreath */}
              <div className="relative mt-5 mb-2 w-20 h-20 sm:w-22 sm:h-22 flex items-center justify-center">
                <LaurelWreathBronze />
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 border-amber-400/80 dark:border-amber-700 ring-4 ring-amber-100 dark:ring-amber-950/80 overflow-hidden flex items-center justify-center bg-amber-50/40 dark:bg-zinc-800 font-mono font-bold text-lg text-amber-900 dark:text-amber-200 shadow-sm relative z-0">
                  {top3?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={top3.avatarUrl}
                      alt={top3.displayName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{top3?.displayName?.[0] || '3'}</span>
                  )}
                </div>
              </div>

              {/* Identity */}
              <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 mt-2 truncate max-w-full">
                {top3?.displayName || 'Chưa cập nhật'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 truncate max-w-full font-medium">
                {top3?.specialization || 'Thành viên xuất sắc'}
              </p>

              {/* Points Inset Box */}
              <div className="w-full mt-4 pt-3 pb-2.5 px-3 rounded-xl bg-amber-50/50 dark:bg-zinc-900/90 border border-amber-200/60 dark:border-zinc-800 flex flex-col items-center">
                <span className="text-[10px] font-bold text-amber-800/80 dark:text-amber-400 uppercase tracking-wider font-mono">
                  TỔNG PTS TÍCH LŨY
                </span>
                <div className="text-xl sm:text-2xl font-black font-mono text-amber-950 dark:text-zinc-200 tabular-nums mt-0.5">
                  {top3?.points?.toLocaleString('vi-VN') || 0}{' '}
                  <span className="text-xs font-semibold text-amber-800 dark:text-amber-400">PTS</span>
                </div>
              </div>

              {/* Architectural Step Pedestal */}
              <PodiumPedestalBase rank={3} />
            </div>

          </div>
        </section>
      ) : null}

      {/* 3. Full Ranking Table */}
      <section aria-label="Bảng thành tích toàn hệ thống" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-2">
              <span>Bảng thành tích toàn hệ thống</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-400 border border-slate-200/80 dark:border-zinc-800">
                {filteredList.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Xếp hạng minh bạch dựa trên tổng số điểm PTS ghi nhận trong {currentPeriodConfig.desc.toLowerCase()}.
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              strokeWidth={1.75}
            />
            <input
              type="text"
              placeholder="Tìm theo tên học viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors shadow-2xs"
            />
          </div>
        </div>

        {hasError ? (
          <div className="py-16 text-center text-xs text-slate-500 dark:text-neutral-400 bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800 rounded-2xl space-y-3">
            <p className="text-neutral-700 dark:text-zinc-300 font-medium">Không thể tải dữ liệu bảng xếp hạng vào lúc này.</p>
            <button
              type="button"
              onClick={() => fetchLeaderboard(period)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Thử lại</span>
            </button>
          </div>
        ) : loading ? (
          <div className="py-16 text-center text-xs text-slate-500 dark:text-neutral-400 bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800 rounded-2xl">
            <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-2.5" strokeWidth={2} />
            Đang tổng hợp thành tích {currentPeriodConfig.desc.toLowerCase()}...
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="border border-slate-200/80 dark:border-zinc-800 rounded-2xl bg-white dark:bg-[#111114] shadow-xs">
            <EmptyLeaderboardIllustration periodText={currentPeriodConfig.label.toLowerCase()} />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 dark:text-neutral-500 border border-slate-200/80 dark:border-zinc-800 rounded-2xl bg-white dark:bg-[#111114]">
            Không tìm thấy học viên nào phù hợp với từ khóa &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : (
          <div className="border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-[#111114] shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 dark:text-neutral-400 text-[11px] font-semibold">
                  <th className="py-3 px-4 w-24 text-center">THỨ HẠNG</th>
                  <th className="py-3 px-4">HỌC VIÊN</th>
                  <th className="py-3 px-4 text-right">TỔNG PTS</th>
                </tr>
              </thead>
              <tbody className="">
                {paginatedList.map((entry) => {
                  const isCurrentUser = myRank && entry.userId === myRank.userId;
                  const rank = entry.rank;

                  return (
                    <tr
                      key={entry.userId}
                      className={`hover:bg-slate-50/80 dark:hover:bg-zinc-900/40 transition-colors ${
                        isCurrentUser
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 border-l-2 border-l-blue-600 dark:border-l-blue-400'
                          : rank === 1
                          ? 'bg-amber-50/30 dark:bg-amber-950/10'
                          : ''
                      }`}
                    >
                      {/* Rank Cell with Official Metal Coin Badges */}
                      <td className="py-3.5 px-4 text-center">
                        <TableMedalBadge rank={rank} />
                      </td>

                      {/* User Cell */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full border overflow-hidden flex items-center justify-center text-xs font-bold uppercase shrink-0 font-mono ${
                              rank === 1
                                ? 'bg-[#FEF3C7] dark:bg-amber-950 text-[#92400E] dark:text-amber-200 border-amber-300 dark:border-amber-700'
                                : rank === 2
                                ? 'bg-slate-100 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 border-slate-300 dark:border-zinc-600'
                                : rank === 3
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-zinc-700'
                            }`}
                          >
                            {entry.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={entry.avatarUrl}
                                alt={entry.displayName}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{entry.displayName[0] || 'U'}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                              <span>{entry.displayName}</span>
                              {rank === 1 && (
                                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                              )}
                              {isCurrentUser && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                   Bạn
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Points Cell */}
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`text-sm font-bold font-mono tabular-nums ${
                            rank === 1
                              ? 'text-amber-800 dark:text-amber-300 font-extrabold'
                              : rank === 2
                              ? 'text-neutral-800 dark:text-zinc-200'
                              : rank === 3
                              ? 'text-amber-900 dark:text-amber-400'
                              : 'text-neutral-900 dark:text-neutral-100'
                          }`}
                        >
                          {entry.points.toLocaleString('vi-VN')}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-neutral-500 font-normal ml-1">
                          PTS
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls (10 người / trang) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:p-4 bg-slate-50/70 dark:bg-zinc-900/40 text-xs text-slate-500 dark:text-neutral-400">
              <div>
                Hiển thị{' '}
                <span className="font-semibold text-neutral-900 dark:text-neutral-200 font-mono tabular-nums">
                  {(validCurrentPage - 1) * pageSize + 1} – {Math.min(validCurrentPage * pageSize, filteredList.length)}
                </span>{' '}
                trong{' '}
                <span className="font-semibold text-neutral-900 dark:text-neutral-200 font-mono tabular-nums">
                  {filteredList.length}
                </span>{' '}
                học viên
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={validCurrentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    aria-label="Trang trước"
                    className="p-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] text-neutral-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => {
                      if (
                        totalPages > 7 &&
                        pageNum !== 1 &&
                        pageNum !== totalPages &&
                        Math.abs(pageNum - validCurrentPage) > 1
                      ) {
                        if (pageNum === 2 || pageNum === totalPages - 1) {
                          return (
                            <span key={pageNum} className="px-1 text-slate-400 dark:text-neutral-600 font-mono">
                              ...
                            </span>
                          );
                        }
                        return null;
                      }

                      const isActive = validCurrentPage === pageNum;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          aria-current={isActive ? 'page' : undefined}
                          className={`min-w-8 h-8 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] text-neutral-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={validCurrentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Trang tiếp theo"
                    className="p-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] text-neutral-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 4. Sticky / Bottom: Current User Status Card */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <User className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
                THỨ HẠNG CỦA BẠN &bull; {currentPeriodConfig.label.toUpperCase()}
              </span>
              {myRank && myRank.points > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Hạng #{myRank.rank}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-zinc-700 text-[10px] font-mono font-semibold">
                  Chưa xếp hạng
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-700 dark:text-zinc-300 mt-0.5 font-medium">
              {myRank && myRank.points > 0 ? (
                <>
                  Bạn đang có <strong className="font-bold font-mono text-neutral-900 dark:text-neutral-100">{myRank.points} PTS</strong> tích lũy trong {currentPeriodConfig.desc.toLowerCase()}.
                </>
              ) : (
                `Trong ${currentPeriodConfig.desc.toLowerCase()} bạn chưa có điểm PTS tích lũy. Hãy làm bài khảo thí để ghi danh lên bảng vàng!`
              )}
            </p>
          </div>
        </div>

        <Link
          href="/personal/assessments"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <span>Làm bài tích lũy PTS</span>
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
        </Link>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-xs text-slate-500 dark:text-neutral-400 flex flex-col items-center justify-center">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mb-3" strokeWidth={2} />
          <span>Đang tải bảng xếp hạng...</span>
        </div>
      }
    >
      <LeaderboardContent />
    </Suspense>
  );
}
