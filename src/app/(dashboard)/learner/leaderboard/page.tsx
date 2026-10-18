'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Trophy,
  Search,
  RefreshCw,
  Award,
  ShieldCheck,
  User,
  Sparkles,
} from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  points: number;
  rankTier: 'ELITE' | 'SPECIALIST' | 'PRACTITIONER' | 'NOVICE';
  role: string;
  specialization: string | null;
}

const TIER_CONFIG: Record<
  LeaderboardEntry['rankTier'],
  { label: string; badgeClass: string }
> = {
  ELITE: {
    label: 'Xuất sắc',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  SPECIALIST: {
    label: 'Chuyên gia',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  PRACTITIONER: {
    label: 'Thành thạo',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  NOVICE: {
    label: 'Khởi đầu',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');

  const fallbackLeaderboard: LeaderboardEntry[] = [
    { rank: 1, userId: 'usr-1', displayName: 'Nguyễn Văn An', avatarUrl: null, points: 1420, rankTier: 'ELITE', role: 'LEARNER', specialization: 'Khoa học máy tính - ĐHQG' },
    { rank: 2, userId: 'usr-2', displayName: 'Trần Thị Mai', avatarUrl: null, points: 1280, rankTier: 'ELITE', role: 'LEARNER', specialization: 'Sư phạm Tin học' },
    { rank: 3, userId: 'usr-3', displayName: 'Lê Hoàng Nam', avatarUrl: null, points: 1150, rankTier: 'SPECIALIST', role: 'LEARNER', specialization: 'Kinh tế số & TMĐT' },
    { rank: 4, userId: 'usr-4', displayName: 'Đỗ Quang Bảo', avatarUrl: null, points: 980, rankTier: 'SPECIALIST', role: 'LEARNER', specialization: 'Hệ thống thông tin quản lý' },
    { rank: 5, userId: 'usr-5', displayName: 'Phạm Minh Thư', avatarUrl: null, points: 920, rankTier: 'SPECIALIST', role: 'LEARNER', specialization: 'Truyền thông đa phương tiện' },
    { rank: 6, userId: 'usr-6', displayName: 'Hoàng Văn Đức', avatarUrl: null, points: 840, rankTier: 'PRACTITIONER', role: 'LEARNER', specialization: 'Công nghệ thông tin' },
    { rank: 7, userId: 'usr-7', displayName: 'Vũ Thùy Lan', avatarUrl: null, points: 760, rankTier: 'PRACTITIONER', role: 'LEARNER', specialization: 'Quản trị kinh doanh' },
    { rank: 8, userId: 'usr-8', displayName: 'Đặng Tiến Hùng', avatarUrl: null, points: 690, rankTier: 'PRACTITIONER', role: 'LEARNER', specialization: 'Khoa học dữ liệu' },
    { rank: 9, userId: 'usr-9', displayName: 'Bùi Ngọc Ánh', avatarUrl: null, points: 580, rankTier: 'NOVICE', role: 'LEARNER', specialization: 'Ngoại ngữ & Kỹ năng số' },
    { rank: 10, userId: 'usr-10', displayName: 'Ngô Việt Khang', avatarUrl: null, points: 510, rankTier: 'NOVICE', role: 'LEARNER', specialization: 'Kỹ thuật phần mềm' },
  ];

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      if (!res.ok || !data.leaderboard || data.leaderboard.length === 0) {
        setLeaderboard(fallbackLeaderboard);
      } else {
        // Map and sort solely by points
        const sorted = (data.leaderboard as LeaderboardEntry[]).sort(
          (a, b) => b.points - a.points
        );
        setLeaderboard(sorted);
      }
    } catch {
      setLeaderboard(fallbackLeaderboard);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const filteredLeaderboard = leaderboard.filter((entry) => {
    const matchesSearch = entry.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = selectedTier === 'ALL' || entry.rankTier === selectedTier;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              XẾP HẠNG HỌC TẬP
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Bảng Xếp Hạng
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Xếp hạng thi đua học tập theo tổng điểm tích lũy khi hoàn thành bài khảo thí và học liệu bồi dưỡng.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`}
              strokeWidth={1.75}
            />
            <span>Cập nhật bảng</span>
          </button>
        </div>
      </div>

      {/* Filter and Table Container - seamless on white background */}
      <div className="space-y-4">
        {/* Search & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'ELITE', label: 'Xuất sắc' },
              { id: 'SPECIALIST', label: 'Chuyên gia' },
              { id: 'PRACTITIONER', label: 'Thành thạo' },
              { id: 'NOVICE', label: 'Khởi đầu' },
            ].map((tier) => (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedTier === tier.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 text-sky-600 animate-spin mx-auto mb-2" strokeWidth={1.75} />
            Đang tải dữ liệu bảng xếp hạng...
          </div>
        ) : filteredLeaderboard.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Không tìm thấy học viên trong danh mục này.
          </div>
        ) : (
          <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/50 text-slate-500 text-[11px] font-semibold">
                  <th className="py-3 px-4 w-20">THỨ HẠNG</th>
                  <th className="py-3 px-4">HỌC VIÊN</th>
                  <th className="py-3 px-4">CẤP BẬC</th>
                  <th className="py-3 px-4 text-right">TỔNG ĐIỂM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeaderboard.map((entry, index) => {
                  const rank = index + 1;
                  const tierInfo = TIER_CONFIG[entry.rankTier] || TIER_CONFIG.NOVICE;

                  return (
                    <tr
                      key={entry.userId}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        rank === 1 ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold">
                        {rank === 1 ? (
                          <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center justify-center text-xs font-bold shadow-xs">
                            1
                          </span>
                        ) : rank === 2 ? (
                          <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 border border-slate-300 inline-flex items-center justify-center text-xs font-bold shadow-xs">
                            2
                          </span>
                        ) : rank === 3 ? (
                          <span className="w-7 h-7 rounded-full bg-amber-50 text-amber-900 border border-amber-200 inline-flex items-center justify-center text-xs font-bold shadow-xs">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-500 pl-2 text-xs font-medium">{rank}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 uppercase shrink-0">
                            {entry.displayName[0] || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {entry.displayName}
                            </div>
                            {entry.specialization && (
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {entry.specialization}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${tierInfo.badgeClass}`}
                        >
                          {tierInfo.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="text-sm font-bold text-sky-600">
                          {entry.points}
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
      </div>
    </div>
  );
}
