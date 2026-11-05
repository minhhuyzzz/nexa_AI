'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Radio,
  Plus,
  Copy,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Users,
  Search,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
  Edit,
  Trash2,
  Play,
  BarChart2,
  FileText,
  Lightbulb,
  Layers,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface LiveRoomItem {
  id: string;
  roomCode: string;
  title: string;
  assessmentTitle: string;
  durationMinutes: number;
  passingScore: number;
  status: 'SCHEDULED' | 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'RESULTS_PUBLISHED';
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  participantCount: number;
  maxParticipants: number;
  roomMode: 'OPEN' | 'GROUP_ONLY';
  createdAt: string;
}

export function PersonalLiveRoomDashboardView() {
  const router = useRouter();

  const [rooms, setRooms] = useState<LiveRoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'SCHEDULED' | 'COMPLETED'>('ALL');
  const [modeFilter, setModeFilter] = useState<'ALL' | 'OPEN' | 'GROUP_ONLY'>('ALL');
  const [copiedPin, setCopiedPin] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Fetch rooms for current evaluator
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/evaluator/rooms');
      if (res.ok) {
        const data = await res.json();
        const list: LiveRoomItem[] = (data.rooms || []).map((r: any) => {
          const rawStatus = String(r.status || (r.isActive !== undefined ? (r.isActive ? 'IN_PROGRESS' : 'COMPLETED') : 'WAITING')).toUpperCase();
          let normalizedStatus: 'SCHEDULED' | 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'RESULTS_PUBLISHED' = 'WAITING';
          if (rawStatus === 'IN_PROGRESS') {
            normalizedStatus = 'IN_PROGRESS';
          } else if (rawStatus === 'SCHEDULED') {
            normalizedStatus = 'SCHEDULED';
          } else if (rawStatus === 'WAITING' || rawStatus === 'PENDING') {
            normalizedStatus = 'WAITING';
          } else if (rawStatus === 'RESULTS_PUBLISHED') {
            normalizedStatus = 'RESULTS_PUBLISHED';
          } else {
            // 'ENDED', 'CLOSED', 'COMPLETED', etc.
            normalizedStatus = 'COMPLETED';
          }

          return {
            id: r.id,
            roomCode: r.roomCode || r.room_code || '',
            title: r.title || 'Phòng thi trực tiếp',
            assessmentTitle: r.assessments?.title || r.assessmentTitle || 'Khảo thí năng lực số',
            durationMinutes: r.assessments?.duration_minutes || r.durationMinutes || 45,
            passingScore: r.assessments?.passing_score || 70,
            status: normalizedStatus,
            scheduledStart: r.scheduledStart || r.scheduled_start,
            scheduledEnd: r.scheduledEnd || r.scheduled_end,
            startedAt: r.startedAt || r.started_at,
            endedAt: r.endedAt || r.ended_at,
            participantCount: Array.isArray(r.room_participants)
              ? r.room_participants.length
              : Array.isArray(r.roomParticipants)
              ? r.roomParticipants.length
              : (r.participantCount || 0),
            maxParticipants: r.maxParticipants || r.max_participants || 40,
            roomMode: r.roomMode || r.room_mode || 'OPEN',
            createdAt: r.createdAt || r.created_at || new Date().toISOString(),
          };
        });
        setRooms(list);
      }
    } catch (err) {
      console.error('Failed to fetch personal live rooms:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Copy PIN helper
  const handleCopyPIN = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(pin);
    setTimeout(() => setCopiedPin(null), 2000);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const scheduled = rooms.filter((r) => r.status === 'SCHEDULED' || r.status === 'WAITING').length;
    const inProgress = rooms.filter((r) => r.status === 'IN_PROGRESS').length;
    const completed = rooms.filter((r) => r.status === 'COMPLETED' || r.status === 'RESULTS_PUBLISHED').length;
    return { scheduled, inProgress, completed, total: rooms.length };
  }, [rooms]);

  // Filtered List
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchAsm = r.assessmentTitle.toLowerCase().includes(q);
        const matchCode = r.roomCode.toLowerCase().includes(q);
        if (!matchTitle && !matchAsm && !matchCode) return false;
      }
      // Status Filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'IN_PROGRESS' && r.status !== 'IN_PROGRESS') return false;
        if (statusFilter === 'SCHEDULED' && r.status !== 'SCHEDULED' && r.status !== 'WAITING') return false;
        if (statusFilter === 'COMPLETED' && r.status !== 'COMPLETED' && r.status !== 'RESULTS_PUBLISHED') return false;
      }
      // Mode Filter
      if (modeFilter !== 'ALL' && r.roomMode !== modeFilter) return false;
      return true;
    });
  }, [rooms, searchQuery, statusFilter, modeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredRooms.length / pageSize) || 1;
  const paginatedRooms = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRooms.slice(start, start + pageSize);
  }, [filteredRooms, currentPage]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header (Screen 01) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Phòng trực tiếp
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Tổ chức bài thi, kiểm tra hoặc hoạt động học tập trực tuyến và quản lý tất cả các phòng của bạn tại đây.
          </p>
        </div>

        <button
          onClick={fetchRooms}
          className="p-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 text-slate-500 dark:text-neutral-400 self-start sm:self-auto transition-colors"
          title="Làm mới danh sách"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* 2. Three Metric KPI Cards (Screen 01) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Sắp diễn ra */}
        <div
          onClick={() => {
            setStatusFilter(statusFilter === 'SCHEDULED' ? 'ALL' : 'SCHEDULED');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'SCHEDULED'
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20'
              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-black hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">Sắp diễn ra</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-2">
            {stats.scheduled}
          </div>
        </div>

        {/* Đang diễn ra */}
        <div
          onClick={() => {
            setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'IN_PROGRESS'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20'
              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-black hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">Đang diễn ra</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-2">
            {stats.inProgress}
          </div>
        </div>

        {/* Đã kết thúc */}
        <div
          onClick={() => {
            setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'COMPLETED'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20'
              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-black hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">Đã kết thúc</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-300 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-2">
            {stats.completed}
          </div>
        </div>
      </div>

      {/* 3. Action Buttons Row (Screen 01) */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/personal/live-room/new"
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Mở phòng mới</span>
        </Link>

        <button
          type="button"
          onClick={() => {
            router.push('/personal/live-room/new?template=quick_15');
          }}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-neutral-200 font-semibold text-xs inline-flex items-center gap-2 transition-colors shadow-2xs"
        >
          <Layers className="w-4 h-4 text-slate-500" />
          <span>Nhân bản từ mẫu</span>
        </button>

        <button
          type="button"
          onClick={() => {
            alert('Xem hướng dẫn tổ chức phòng thi trực tiếp chuẩn 5 miền năng lực số.');
          }}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-neutral-200 font-semibold text-xs inline-flex items-center gap-2 transition-colors shadow-2xs"
        >
          <BookOpen className="w-4 h-4 text-slate-500" />
          <span>Xem hướng dẫn</span>
        </button>
      </div>

      {/* 4. Main Content: Table (Left) + Side Cards (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Table & Filter (8/12 lg, 9/12 xl) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4 min-w-0">
          {/* Filter Bar */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo tên phòng, đề khảo thí, PIN..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="IN_PROGRESS">Đang diễn ra</option>
                <option value="SCHEDULED">Sắp diễn ra / Sảnh chờ</option>
                <option value="COMPLETED">Đã kết thúc</option>
              </select>

              <select
                value={modeFilter}
                onChange={(e) => {
                  setModeFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="ALL">Tất cả hình thức</option>
                <option value="OPEN">Tự do bằng PIN</option>
                <option value="GROUP_ONLY">Theo danh sách lớp/nhóm</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mx-auto" />
                <span>Đang tải danh sách phòng thi...</span>
              </div>
            ) : paginatedRooms.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Radio className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                    Chưa có phòng thi nào
                  </div>
                  <p className="text-slate-500 dark:text-neutral-400 max-w-sm mx-auto">
                    {searchQuery || statusFilter !== 'ALL'
                      ? 'Không tìm thấy phòng thi phù hợp với bộ lọc hiện tại.'
                      : 'Bạn chưa tạo phòng thi trực tiếp nào. Hãy bấm "Mở phòng mới" để bắt đầu phiên khảo thí.'}
                  </p>
                </div>
                {!searchQuery && statusFilter === 'ALL' && (
                  <Link
                    href="/personal/live-room/new"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Mở phòng thi đầu tiên</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[840px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 text-[11px] font-semibold text-slate-500 dark:text-neutral-400">
                      <th className="py-3 px-4 min-w-[210px]">Tên phòng</th>
                      <th className="py-3 px-4 min-w-[200px]">Đề khảo thí</th>
                      <th className="py-3 px-4 whitespace-nowrap min-w-[110px]">Thời gian</th>
                      <th className="py-3 px-3 text-center whitespace-nowrap min-w-[90px]">Người tham gia</th>
                      <th className="py-3 px-4 whitespace-nowrap min-w-[130px]">Trạng thái</th>
                      <th className="py-3 px-3 text-center whitespace-nowrap min-w-[110px]">PIN</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap min-w-[140px]">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {paginatedRooms.map((room) => {
                      const isInProgress = room.status === 'IN_PROGRESS';
                      const isWaiting = room.status === 'WAITING';
                      const isScheduled = room.status === 'SCHEDULED';
                      const isCompleted = room.status === 'COMPLETED' || room.status === 'RESULTS_PUBLISHED';

                      return (
                        <tr
                          key={room.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-zinc-900/50 transition-colors"
                        >
                          {/* Tên phòng */}
                          <td className="py-3 px-4 min-w-[210px] max-w-[260px]">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-neutral-900 dark:text-neutral-100 truncate" title={room.title}>
                                  {room.title}
                                </div>
                                <div className="text-[10px] text-slate-400 dark:text-neutral-500 whitespace-nowrap">
                                  {room.roomMode === 'OPEN' ? 'Tự do bằng PIN' : 'Theo danh sách'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Đề khảo thí */}
                          <td className="py-3 px-4 min-w-[200px] max-w-[240px]">
                            <div className="flex items-center gap-1.5 min-w-0" title={room.assessmentTitle}>
                              <span className="text-slate-700 dark:text-neutral-300 font-medium truncate">
                                {room.assessmentTitle}
                              </span>
                              <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                            </div>
                          </td>

                          {/* Thời gian */}
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-neutral-300 whitespace-nowrap min-w-[110px]">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{room.durationMinutes} phút</span>
                            </div>
                          </td>

                          {/* Người tham gia */}
                          <td className="py-3 px-3 text-center whitespace-nowrap min-w-[90px]">
                            <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              {room.participantCount}
                            </span>
                          </td>

                          {/* Trạng thái */}
                          <td className="py-3 px-4 whitespace-nowrap min-w-[130px]">
                            {isInProgress ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Đang diễn ra
                              </span>
                            ) : isWaiting ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                Sảnh chờ đang mở
                              </span>
                            ) : isScheduled ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                Sắp diễn ra
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-neutral-400">
                                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                                Đã kết thúc
                              </span>
                            )}
                          </td>

                          {/* PIN */}
                          <td className="py-3 px-3 text-center whitespace-nowrap min-w-[110px]">
                            <div className="inline-flex items-center gap-1.5 font-mono font-bold text-xs text-neutral-800 dark:text-neutral-200 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                              <span>{room.roomCode}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyPIN(room.roomCode)}
                                className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                title="Sao chép PIN"
                              >
                                {copiedPin === room.roomCode ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            {copiedPin === room.roomCode && (
                              <div className="text-[9px] text-emerald-600 font-sans">Đã chép</div>
                            )}
                          </td>

                          {/* Thao tác */}
                          <td className="py-3 px-4 text-right whitespace-nowrap min-w-[140px]">
                            <div className="flex items-center justify-end gap-1.5">
                              {isWaiting ? (
                                <Link
                                  href={`/live/control?roomId=${room.id}`}
                                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center gap-1 shadow-2xs transition-colors"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>Vào sảnh chờ</span>
                                </Link>
                              ) : isInProgress ? (
                                <Link
                                  href={`/live/control?roomId=${room.id}`}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs inline-flex items-center gap-1 shadow-2xs transition-colors"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>Vào điều khiển</span>
                                </Link>
                              ) : isScheduled ? (
                                <Link
                                  href={`/live/control?roomId=${room.id}`}
                                  className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-semibold text-xs inline-flex items-center gap-1"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>Vào phòng</span>
                                </Link>
                              ) : (
                                <Link
                                  href={`/personal/live-room/${room.id}/results`}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-200 hover:bg-slate-200 font-semibold text-xs inline-flex items-center gap-1"
                                >
                                  <BarChart2 className="w-3 h-3" />
                                  <span>Xem kết quả</span>
                                </Link>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Bạn có muốn xóa phòng thi này?')) {
                                    fetch(`/api/evaluator/rooms?roomId=${room.id}`, { method: 'DELETE' }).then(() => fetchRooms());
                                  }
                                }}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                                title="Xóa phòng thi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Hiển thị {(currentPage - 1) * pageSize + 1} &ndash;{' '}
                  {Math.min(currentPage * pageSize, filteredRooms.length)} trên {filteredRooms.length} phòng
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono px-2">{currentPage} / {totalPages}</span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side Cards (Screen 01: Mẫu Gần Đây & Mẹo Tạo Phòng) (4/12 lg, 3/12 xl) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          {/* Card 1: Mẫu gần đây */}
          <div className="p-5 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h2 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                  Mẫu gần đây
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Tạo phòng nhanh hơn với các mẫu bạn đã dùng.
              </p>
            </div>

            <div className="space-y-2">
              {/* Item 1 */}
              <Link
                href="/personal/live-room/new"
                className="p-3 rounded-lg border border-slate-100 dark:border-zinc-800/80 bg-slate-50/60 dark:bg-zinc-900/40 hover:bg-blue-50/50 hover:border-blue-200 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                  <div>
                    <div className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600">
                      Kiểm tra 15 phút
                    </div>
                    <div className="text-[10px] text-slate-400">Đã dùng 3 lần</div>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              {/* Item 2 */}
              <Link
                href="/personal/live-room/new"
                className="p-3 rounded-lg border border-slate-100 dark:border-zinc-800/80 bg-slate-50/60 dark:bg-zinc-900/40 hover:bg-blue-50/50 hover:border-blue-200 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                  <div>
                    <div className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600">
                      Ôn tập chương
                    </div>
                    <div className="text-[10px] text-slate-400">Đã dùng 2 lần</div>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              {/* Item 3 */}
              <Link
                href="/personal/live-room/new"
                className="p-3 rounded-lg border border-slate-100 dark:border-zinc-800/80 bg-slate-50/60 dark:bg-zinc-900/40 hover:bg-blue-50/50 hover:border-blue-200 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                  <div>
                    <div className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600">
                      Khảo sát đầu năm
                    </div>
                    <div className="text-[10px] text-slate-400">Đã dùng 1 lần</div>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>

            <Link
              href="/personal/live-room/new"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 pt-1"
            >
              <span>Xem tất cả mẫu</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: Mẹo tạo phòng hiệu quả */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50/50 via-white to-slate-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900/80 border border-blue-100 dark:border-zinc-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Mẹo tạo phòng hiệu quả
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              Sử dụng mẫu, nhân bản phòng cũ và thiết lập PIN để tổ chức nhanh chóng và an toàn hơn.
            </p>
            <button
              type="button"
              onClick={() => alert('Hướng dẫn tạo phòng: Bạn có thể sao chép nhanh cấu hình từ phiên trước hoặc cấp mã PIN ngẫu nhiên để thí sinh vào ngay.')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 pt-1"
            >
              <span>Xem hướng dẫn</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
