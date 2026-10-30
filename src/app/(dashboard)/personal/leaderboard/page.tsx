'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Crown,
  Search,
  RefreshCw,
  Trophy,
  User,
  ArrowRight,
  Medal,
  Sparkles,
} from 'lucide-react';

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

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<CurrentUserRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [hasError, setHasError] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setHasError(false);
    try {
      const res = await fetch('/api/leaderboard', { cache: 'no-store' });
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
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  // The main table ALWAYS retains ranks 1, 2, 3 and beyond
  const filteredList = searchQuery.trim()
    ? leaderboard.filter((entry) =>
        entry.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : leaderboard;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
              DANH HIỆU &amp; VINH DANH HOẠT ĐỘNG
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Bảng Xếp Hạng Điểm Rèn Luyện (XP)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Thi đua tích lũy điểm hoạt động (XP) qua các bài khảo thí và học phần. Điểm XP dùng để theo dõi sự chuyên cần và độc lập với hồ sơ 5 miền năng lực.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="px-3.5 py-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`}
              strokeWidth={1.75}
            />
            <span>Làm mới bảng</span>
          </button>
        </div>
      </div>

      {/* 2. Top Leaders Distinction Showcase (Bảng Top Đầu Sang Trọng, Đẳng Cấp, Không Clipart) */}
      {!loading && top1 && (
        <section aria-label="Top 3 học viên dẫn đầu" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-[#FEF3C7] text-[#92400E]">
                <Trophy className="w-4 h-4 text-amber-500" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Bảng Vàng Danh Dự
                </h2>
                <p className="text-xs text-slate-500">
                  Top 3 cá nhân có điểm tích lũy năng lực số cao nhất hệ thống
                </p>
              </div>
            </div>
            <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-mono font-medium">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Cập nhật liên tục</span>
            </div>
          </div>

          {/* 3 Distinction Spotlight Cards (Rank 2 - Rank 1 - Rank 3) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 items-end">
            
            {/* Card 2: Á Quân (Hạng #2 - Bạc) */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col items-center text-center relative hover:border-slate-300 transition-all order-2 md:order-1">
              {/* Badge Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold font-mono tracking-wide shadow-2xs">
                <Medal className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                <span>HẠNG #2 · Á QUÂN</span>
              </div>

              {/* Avatar Frame */}
              <div className="relative mt-4 mb-2">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 border-slate-300 ring-4 ring-slate-100 overflow-hidden flex items-center justify-center bg-slate-50 font-mono font-bold text-lg text-slate-700 shadow-2xs">
                  {top2?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={top2.avatarUrl}
                      alt={top2.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{top2?.displayName?.[0] || '2'}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-600 text-white font-mono font-bold text-[11px] flex items-center justify-center border-2 border-white shadow-2xs">
                  2
                </div>
              </div>

              {/* Identity */}
              <h3 className="font-bold text-sm sm:text-base text-slate-900 mt-1 truncate max-w-full">
                {top2?.displayName || 'Chưa cập nhật'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-full">
                {top2?.specialization || 'Thành viên xuất sắc'}
              </p>

              {/* Points Inset Box */}
              <div className="w-full mt-4 pt-3 pb-2 px-3 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  TỔNG ĐIỂM TÍCH LŨY
                </span>
                <div className="text-xl sm:text-2xl font-bold font-mono text-slate-800 tabular-nums mt-0.5">
                  {top2?.points?.toLocaleString('vi-VN') || 0}{' '}
                  <span className="text-xs font-normal text-slate-500">điểm</span>
                </div>
              </div>
            </div>

            {/* Card 1: Quán Quân (Hạng #1 - Vàng Kim, Hero Centerpiece Tôn Vinh Cao Nhất) */}
            <div className="rounded-md border-2 border-amber-300 bg-amber-50/30 p-6 sm:p-7 shadow-xs flex flex-col items-center text-center relative order-1 md:order-2 md:-translate-y-2">
              {/* Crown Pin */}
              <div className="mb-1">
                <Crown className="w-6 h-6 text-amber-500 fill-amber-500" strokeWidth={1.75} />
              </div>

              {/* Badge Pill */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs font-bold font-mono tracking-wide shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>HẠNG #1 · QUÁN QUÂN</span>
              </div>

              {/* Avatar Frame */}
              <div className="relative mt-4 mb-2">
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border-2 border-amber-400 ring-4 ring-amber-200/90 overflow-hidden flex items-center justify-center bg-white font-mono font-extrabold text-2xl text-[#92400E] shadow-sm">
                  {top1?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={top1.avatarUrl}
                      alt={top1.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{top1?.displayName?.[0] || '1'}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 text-white font-mono font-bold text-xs flex items-center justify-center border-2 border-white shadow-xs">
                  1
                </div>
              </div>

              {/* Identity */}
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 mt-1 truncate max-w-full">
                {top1?.displayName || 'Quán quân'}
              </h3>
              <p className="text-xs text-[#92400E] font-medium mt-0.5 truncate max-w-full">
                {top1?.specialization || 'Dẫn đầu bảng vàng toàn nền tảng'}
              </p>

              {/* Points Inset Box */}
              <div className="w-full mt-4 pt-3.5 pb-2.5 px-4 rounded-lg bg-[#FEF3C7]/70 border border-[#FDE68A] flex flex-col items-center">
                <span className="text-[10px] font-bold text-[#92400E] uppercase tracking-wider font-mono">
                  TỔNG ĐIỂM TÍCH LŨY
                </span>
                <div className="text-2xl sm:text-3xl font-black font-mono text-[#92400E] tabular-nums mt-0.5">
                  {top1?.points?.toLocaleString('vi-VN') || 0}{' '}
                  <span className="text-xs font-semibold text-amber-800">điểm</span>
                </div>
              </div>
            </div>

            {/* Card 3: Quý Quân (Hạng #3 - Đồng) */}
            <div className="rounded-xl border border-amber-200/70 bg-white p-5 sm:p-6 shadow-xs flex flex-col items-center text-center relative hover:border-amber-300 transition-all order-3 md:order-3">
              {/* Badge Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50/70 border border-amber-200/70 text-amber-800 text-[11px] font-bold font-mono tracking-wide shadow-2xs">
                <Medal className="w-3.5 h-3.5 text-amber-700" strokeWidth={1.75} />
                <span>HẠNG #3 · QUÝ QUÂN</span>
              </div>

              {/* Avatar Frame */}
              <div className="relative mt-4 mb-2">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 border-amber-300 ring-4 ring-amber-100 overflow-hidden flex items-center justify-center bg-amber-50/40 font-mono font-bold text-lg text-amber-800 shadow-2xs">
                  {top3?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={top3.avatarUrl}
                      alt={top3.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{top3?.displayName?.[0] || '3'}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#B45309] text-white font-mono font-bold text-[11px] flex items-center justify-center border-2 border-white shadow-2xs">
                  3
                </div>
              </div>

              {/* Identity */}
              <h3 className="font-bold text-sm sm:text-base text-slate-900 mt-1 truncate max-w-full">
                {top3?.displayName || 'Chưa cập nhật'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-full">
                {top3?.specialization || 'Thành viên xuất sắc'}
              </p>

              {/* Points Inset Box */}
              <div className="w-full mt-4 pt-3 pb-2 px-3 rounded-lg bg-amber-50/40 border border-amber-100 flex flex-col items-center">
                <span className="text-[10px] font-semibold text-amber-800/80 uppercase tracking-wider font-mono">
                  TỔNG ĐIỂM TÍCH LŨY
                </span>
                <div className="text-xl sm:text-2xl font-bold font-mono text-amber-900 tabular-nums mt-0.5">
                  {top3?.points?.toLocaleString('vi-VN') || 0}{' '}
                  <span className="text-xs font-normal text-slate-500">điểm</span>
                </div>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* 3. Bảng Thành Tích Đầy Đủ (Giữ Nguyên Rank 1, 2, 3 và Toàn Bộ Học Viên) */}
      <section aria-label="Bảng thành tích toàn hệ thống" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Danh Sách Xếp Hạng Toàn Hệ Thống</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                {filteredList.length} học viên
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Thứ tự được sắp xếp theo tổng điểm tích lũy năng lực số
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
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors shadow-2xs"
            />
          </div>
        </div>

        {/* Table: Full ranking, NO Level column, 1 2 3 are cleanly kept */}
        {hasError ? (
          <div className="py-16 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-md space-y-3">
            <p className="text-slate-700 font-medium">Không thể tải dữ liệu bảng xếp hạng vào lúc này.</p>
            <button
              type="button"
              onClick={fetchLeaderboard}
              className="px-3.5 py-1.5 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Thử lại</span>
            </button>
          </div>
        ) : loading ? (
          <div className="py-16 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-md">
            <RefreshCw className="w-5 h-5 text-sky-600 animate-spin mx-auto mb-2" strokeWidth={1.75} />
            Đang tải dữ liệu bảng xếp hạng...
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 border border-slate-200 rounded-md bg-white space-y-1.5">
            <p className="font-semibold text-slate-800 text-sm">Chưa có dữ liệu bảng xếp hạng</p>
            <p className="text-slate-500">Hãy là người đầu tiên hoàn thành bài đánh giá để ghi danh vào bảng vinh danh!</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 border border-slate-200 rounded-md bg-white">
            Không tìm thấy học viên nào phù hợp với từ khóa &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[11px] font-semibold">
                  <th className="py-3 px-4 w-24 text-center">THỨ HẠNG</th>
                  <th className="py-3 px-4">HỌC VIÊN</th>
                  <th className="py-3 px-4 hidden sm:table-cell">CHUYÊN MÔN / ĐỊNH HƯỚNG</th>
                  <th className="py-3 px-4 text-right">TỔNG ĐIỂM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((entry) => {
                  const isCurrentUser = myRank && entry.userId === myRank.userId;
                  const rank = entry.rank;

                  return (
                    <tr
                      key={entry.userId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCurrentUser
                          ? 'bg-sky-50/70 border-l-2 border-l-sky-500'
                          : rank === 1
                          ? 'bg-[#FEF3C7]/20'
                          : ''
                      }`}
                    >
                      {/* Rank Cell with refined badges */}
                      <td className="py-3.5 px-4 text-center">
                        {rank === 1 ? (
                          <span className="w-7 h-7 mx-auto rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] flex items-center justify-center text-xs font-bold font-mono shadow-2xs">
                            1
                          </span>
                        ) : rank === 2 ? (
                          <span className="w-7 h-7 mx-auto rounded-full bg-slate-100 text-slate-700 border border-slate-300 flex items-center justify-center text-xs font-bold font-mono shadow-2xs">
                            2
                          </span>
                        ) : rank === 3 ? (
                          <span className="w-7 h-7 mx-auto rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center text-xs font-bold font-mono shadow-2xs">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs font-medium font-mono tabular-nums">
                            #{rank}
                          </span>
                        )}
                      </td>

                      {/* User Cell */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full border overflow-hidden flex items-center justify-center text-xs font-bold uppercase shrink-0 font-mono ${
                              rank === 1
                                ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                                : rank === 2
                                ? 'bg-slate-100 text-slate-700 border-slate-300'
                                : rank === 3
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {entry.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={entry.avatarUrl}
                                alt={entry.displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{entry.displayName[0] || 'U'}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                              <span>{entry.displayName}</span>
                              {rank === 1 && (
                                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              )}
                              {isCurrentUser && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-700 border border-sky-200">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5 sm:hidden">
                              {entry.specialization || 'Thành viên'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Specialization Column */}
                      <td className="py-3.5 px-4 hidden sm:table-cell">
                        <span className="text-xs text-slate-600 font-medium">
                          {entry.specialization || 'Chưa cập nhật'}
                        </span>
                      </td>

                      {/* Points Cell */}
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`text-sm font-bold font-mono tabular-nums ${
                            rank === 1
                              ? 'text-[#92400E]'
                              : rank === 2
                              ? 'text-slate-800'
                              : rank === 3
                              ? 'text-amber-900'
                              : 'text-slate-900'
                          }`}
                        >
                          {entry.points.toLocaleString('vi-VN')}
                        </span>
                        <span className="text-xs text-slate-400 font-normal ml-1">
                          điểm
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 4. Ô Thứ Hạng Của Bạn (Your Rank Sticky/Persistent Card) */}
      <div className="p-4 sm:p-5 rounded-lg border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 shrink-0">
            <User className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                THỨ HẠNG CỦA BẠN
              </span>
              {myRank && myRank.points > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-[10px] font-mono font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Hạng #{myRank.rank}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-mono font-semibold">
                  Chưa xếp hạng
                </span>
              )}
            </div>
            <p className="text-xs text-slate-700 mt-0.5 font-medium">
              {myRank && myRank.points > 0 ? (
                <>
                  Bạn đang có <strong className="font-bold font-mono text-slate-900">{myRank.points} điểm</strong> tích lũy trên toàn hệ thống.
                </>
              ) : (
                'Kỳ này bạn chưa có điểm tích lũy. Hãy làm bài khảo thí để ghi tên lên bảng vàng!'
              )}
            </p>
          </div>
        </div>

        <Link
          href="/personal/assessments"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-xs shrink-0"
        >
          <span>Làm bài tích điểm</span>
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
        </Link>
      </div>
    </div>
  );
}
