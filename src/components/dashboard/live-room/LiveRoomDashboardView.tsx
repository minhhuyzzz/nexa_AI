'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Radio,
  Copy,
  Check,
  Plus,
  RefreshCw,
  Clock,
  Play,
  QrCode,
  ExternalLink,
  X,
  Trash2,
  Calendar,
  CheckCircle2,
  Search,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Shield,
  Video,
  FileCheck,
  Sparkles,
  Layers,
  ArrowRight,
  MoreVertical,
} from 'lucide-react';
import { RoomThemeId, ROOM_THEMES } from '@/types/live-room';

interface ExamRoomItem {
  id: string;
  roomCode: string;
  title: string;
  assessmentId: string;
  assessmentTitle: string;
  durationMinutes: number;
  passingScore: number;
  roomMode: string;
  isActive: boolean;
  isLocked: boolean;
  themeId: RoomThemeId;
  status: string;
  allowLateJoin: boolean;
  autoSubmitOnTimeout: boolean;
  showPin: boolean;
  systemNotificationsEnabled: boolean;
  resultsPublished: boolean;
  maxParticipants: number;
  roomDescription: string;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt: string;
  participantCount: number;
  readyCount: number;
  submittedCount: number;
}

type TabType = 'ALL' | 'WAITING' | 'IN_PROGRESS' | 'ENDED';

export interface LiveRoomDashboardViewProps {
  organizationId?: string;
  orgSlug?: string;
  classId?: string;
  title?: string;
  description?: string;
}

export function LiveRoomDashboardView({
  organizationId,
  orgSlug,
  classId,
  title = 'Phòng thi trực tiếp',
  description = 'Tổ chức và giám sát các phiên thi, phòng thi hoặc đánh giá trực tuyến theo thời gian thực.',
}: LiveRoomDashboardViewProps) {
  const [rooms, setRooms] = useState<ExamRoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrModalRoom, setQrModalRoom] = useState<ExamRoomItem | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [timeFilter, setTimeFilter] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Build query URL
  const buildFetchUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (organizationId) params.set('organizationId', organizationId);
    if (classId) params.set('classId', classId);
    const qs = params.toString();
    return `/api/evaluator/rooms${qs ? `?${qs}` : ''}`;
  }, [organizationId, classId]);

  // Fetch Rooms
  const fetchRooms = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const url = buildFetchUrl();
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setRooms(data.rooms || []);
        } else {
          if (!silent) setRooms([]);
        }
      } catch {
        if (!silent) setRooms([]);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [buildFetchUrl]
  );

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(() => fetchRooms(true), 5000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  // Aggregate KPI Counts
  const totalCount = rooms.length;
  const inProgressCount = rooms.filter(
    (r) => r.status === 'IN_PROGRESS' || (r.isActive && !!r.startedAt)
  ).length;
  const waitingCount = rooms.filter(
    (r) => r.status === 'WAITING' || (!r.startedAt && r.isActive)
  ).length;
  const endedCount = rooms.filter(
    (r) => r.status === 'ENDED' || r.status === 'RESULTS_PUBLISHED' || !r.isActive
  ).length;

  // Filtered Rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      // 1. Tab filter
      if (activeTab === 'WAITING') {
        const isWaiting = r.status === 'WAITING' || (!r.startedAt && r.isActive);
        if (!isWaiting) return false;
      } else if (activeTab === 'IN_PROGRESS') {
        const isInProgress = r.status === 'IN_PROGRESS' || (r.isActive && !!r.startedAt);
        if (!isInProgress) return false;
      } else if (activeTab === 'ENDED') {
        const isEnded = r.status === 'ENDED' || r.status === 'RESULTS_PUBLISHED' || !r.isActive;
        if (!isEnded) return false;
      }

      // 2. Search query (Title, Assessment, PIN, Room Code)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchAsm = (r.assessmentTitle || '').toLowerCase().includes(q);
        const matchPin = (r.roomCode || '').includes(q);
        const matchId = r.id.toLowerCase().includes(q);
        if (!matchTitle && !matchAsm && !matchPin && !matchId) return false;
      }

      // 3. Type filter
      if (typeFilter !== 'ALL') {
        if (typeFilter === 'ASSESSMENT' && r.roomMode !== 'GROUP_ONLY') return true;
      }

      return true;
    });
  }, [rooms, activeTab, searchQuery, typeFilter]);

  // Paginated List
  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / pageSize));
  const paginatedRooms = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRooms.slice(start, start + pageSize);
  }, [filteredRooms, currentPage, pageSize]);

  // Handlers
  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteRoom = async (roomId: string, roomTitle: string) => {
    if (!confirm(`Bạn có chắc chắn muốn đóng và xóa phòng thi "${roomTitle}" không?`)) return;

    try {
      const res = await fetch(`/api/evaluator/rooms?roomId=${roomId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setRooms((prev) => prev.filter((r) => r.id !== roomId));
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || 'Không thể xóa phòng thi.');
      }
    } catch {
      alert('Lỗi kết nối khi xóa phòng thi.');
    }
  };

  // Creation URL preserves Workspace context
  const createRoomUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (organizationId) p.set('orgId', organizationId);
    if (orgSlug) p.set('orgSlug', orgSlug);
    if (classId) p.set('classId', classId);
    const qs = p.toString();
    if (orgSlug) {
      return `/org/${orgSlug}/live-room/new${qs ? `?${qs}` : ''}`;
    }
    return `/personal/live-room/new${qs ? `?${qs}` : ''}`;
  }, [organizationId, orgSlug, classId]);

  // Status Badge Helper
  const renderStatusBadge = (room: ExamRoomItem) => {
    if (room.status === 'IN_PROGRESS' || (room.isActive && room.startedAt)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          Đang diễn ra
        </span>
      );
    }
    if (room.status === 'ENDED' || room.status === 'RESULTS_PUBLISHED' || !room.isActive) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
          <CheckCircle2 className="w-3 h-3 text-slate-400" />
          Đã kết thúc
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
        <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
        Sắp diễn ra
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ============================================================ */}
      {/* 1. TOP BREADCRUMB & HEADER BLOCK                            */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-neutral-500 mb-1">
            <span>{orgSlug ? 'Tổ chức' : 'Cá nhân'}</span>
            <span>/</span>
            <span className="text-neutral-800 dark:text-neutral-300 font-medium">Phòng thi trực tiếp</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                {title}
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-2xl">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => fetchRooms()}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
          </button>

          <Link
            href={createRoomUrl}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span>Tạo phòng thi</span>
          </Link>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. 4 EXECUTIVE KPI CARDS (Matching Image 5)                 */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng phòng thi */}
        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
              Tổng phòng thi
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-neutral-300">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
              {totalCount}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-normal mt-1">
              <span>{totalCount > 0 ? `${totalCount} phòng đã tạo` : 'Chưa có phòng thi'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Đang diễn ra (Live pulse) */}
        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
              Đang diễn ra
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Play className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
              {inProgressCount}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{inProgressCount > 0 ? `${inProgressCount} phiên thi realtime` : 'Không có ca thi live'}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Sắp diễn ra */}
        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
              Sắp diễn ra
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
              {waitingCount}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
              {waitingCount > 0 ? `${waitingCount} phòng trong lịch thi` : 'Chưa có lịch sắp tới'}
            </div>
          </div>
        </div>

        {/* Card 4: Đã kết thúc */}
        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
              Đã kết thúc
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
              {endedCount}
            </div>
            <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-1">
              Đã lưu dữ liệu phổ điểm
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. DYNAMIC STATUS TABS & TOOLBAR                             */}
      {/* ============================================================ */}
      <div className="space-y-3">
        {/* Filter Pills with Counts */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              setActiveTab('ALL');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
            }`}
          >
            <span>Tất cả</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'ALL'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
              }`}
            >
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('WAITING');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'WAITING'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Sắp diễn ra</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'WAITING'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
              }`}
            >
              {waitingCount}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('IN_PROGRESS');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'IN_PROGRESS'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Đang diễn ra</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'IN_PROGRESS'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
              }`}
            >
              {inProgressCount}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ENDED');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'ENDED'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã kết thúc</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'ENDED'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
              }`}
            >
              {endedCount}
            </span>
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên phòng, mã PIN hoặc đề khảo thí..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8.5 pr-4 py-2 bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg text-xs text-neutral-800 dark:text-neutral-200 focus:outline-hidden focus:border-blue-600 shadow-2xs cursor-pointer"
            >
              <option value="ALL">Hình thức: Tất cả</option>
              <option value="ASSESSMENT">Đánh giá 5 miền năng lực số</option>
            </select>

            <select
              value={timeFilter}
              onChange={(e) => {
                setTimeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg text-xs text-neutral-800 dark:text-neutral-200 focus:outline-hidden focus:border-blue-600 shadow-2xs cursor-pointer"
            >
              <option value="ALL">Thời gian: Tất cả</option>
              <option value="TODAY">Hôm nay</option>
              <option value="WEEK">Tuần này</option>
            </select>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. MAIN 2-COLUMN OPERATIONAL LAYOUT (Matching Image 5)      */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: TABLE OF ROOMS (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-[#111114] rounded-xl border border-slate-200/90 dark:border-zinc-800 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500 dark:text-zinc-400">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mx-auto mb-2" strokeWidth={1.75} />
                Đang tải dữ liệu phòng thi trực tiếp...
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Radio className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" strokeWidth={1.5} />
                <div>
                  <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    Chưa có phòng thi nào phù hợp
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
                    Không tìm thấy phiên thi trực tiếp theo bộ lọc hiện tại. Bấm nút bên dưới để khởi tạo ngay.
                  </p>
                </div>
                <Link
                  href={createRoomUrl}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo phòng thi mới</span>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/60 text-[11px] font-semibold text-slate-500 dark:text-neutral-400">
                      <th className="py-3 px-4">Tên phòng thi</th>
                      <th className="py-3 px-3">Loại</th>
                      <th className="py-3 px-3">Trạng thái</th>
                      <th className="py-3 px-3">Thời gian</th>
                      <th className="py-3 px-3">Người tham gia</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-slate-700 dark:text-zinc-300">
                    {paginatedRooms.map((room) => {
                      const participantPercent = Math.min(
                        100,
                        Math.round((room.participantCount / (room.maxParticipants || 40)) * 100)
                      );

                      const dateStr = room.scheduledStart
                        ? new Date(room.scheduledStart).toLocaleDateString('vi-VN')
                        : new Date(room.createdAt).toLocaleDateString('vi-VN');

                      return (
                        <tr
                          key={room.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/40 transition-colors"
                        >
                          {/* Tên phòng thi & Mã PIN */}
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-bold text-neutral-900 dark:text-neutral-100 text-xs line-clamp-1">
                                {room.title}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
                                  PIN: {room.roomCode}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyCode(room.roomCode)}
                                  className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                                  title="Sao chép mã PIN"
                                >
                                  {copiedCode === room.roomCode ? (
                                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                                {room.assessmentTitle && (
                                  <span className="text-[11px] text-slate-400 dark:text-neutral-500 truncate max-w-[140px]">
                                    &bull; {room.assessmentTitle}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Loại bài thi */}
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
                              Bài thi
                            </span>
                          </td>

                          {/* Trạng thái */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {renderStatusBadge(room)}
                          </td>

                          {/* Thời gian */}
                          <td className="py-3 px-3 whitespace-nowrap text-slate-600 dark:text-neutral-300">
                            <div className="space-y-0.5">
                              <div className="font-medium text-[11px]">{dateStr}</div>
                              <div className="text-[10px] text-slate-400 dark:text-neutral-500">
                                {room.durationMinutes} phút
                              </div>
                            </div>
                          </td>

                          {/* Người tham gia */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="space-y-1 min-w-[90px]">
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="font-bold text-neutral-800 dark:text-neutral-200 tabular-nums">
                                  {room.participantCount || 0} / {room.maxParticipants || 40}
                                </span>
                                <span className="text-slate-400 text-[10px]">{participantPercent}%</span>
                              </div>
                              <div className="w-full h-1 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                                  style={{ width: `${participantPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Thao tác */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              {room.status === 'IN_PROGRESS' || (room.isActive && room.startedAt) ? (
                                <Link
                                  href={`/live/control?roomId=${room.id}`}
                                  className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center gap-1 shadow-2xs transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Giám sát</span>
                                </Link>
                              ) : room.status === 'ENDED' || room.status === 'RESULTS_PUBLISHED' || !room.isActive ? (
                                <Link
                                  href={`/personal/live-room/${room.id}/results`}
                                  className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-zinc-800 font-semibold text-xs inline-flex items-center gap-1 transition-colors"
                                >
                                  <BarChart3 className="w-3 h-3" />
                                  <span>Kết quả</span>
                                </Link>
                              ) : (
                                <Link
                                  href={`/personal/live-room/${room.id}/host`}
                                  className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-zinc-800 font-semibold text-xs inline-flex items-center gap-1 transition-colors"
                                >
                                  <Play className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                  <span>Chi tiết</span>
                                </Link>
                              )}

                              {/* QR Code button */}
                              <button
                                type="button"
                                onClick={() => setQrModalRoom(room)}
                                className="p-1 rounded-md border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                                title="Chiếu mã QR tham gia"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteRoom(room.id, room.title)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
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
            {filteredRooms.length > 0 && (
              <div className="p-3.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
                <div>
                  Hiển thị {(currentPage - 1) * pageSize + 1} &ndash;{' '}
                  {Math.min(currentPage * pageSize, filteredRooms.length)} trên {filteredRooms.length} phòng thi
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-1 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`w-6 h-6 rounded-md text-xs font-semibold transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-1 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTION DOCK & FEATURES (Matching Image 5) (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Hướng dẫn tạo phòng thi 3 bước */}
          <div className="p-5 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              Tạo phòng thi trực tiếp
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mb-4 leading-relaxed">
              Thi, kiểm tra hoặc đánh giá năng lực số trực tuyến chỉ với 3 bước đơn giản:
            </p>

            <div className="space-y-3.5 mb-5 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                    Chọn loại phòng
                  </div>
                  <div className="text-slate-400 dark:text-neutral-500 text-[11px] mt-0.5">
                    Bài thi chuẩn hóa, kiểm tra lớp hoặc khảo sát.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                    Cấu hình phiên
                  </div>
                  <div className="text-slate-400 dark:text-neutral-500 text-[11px] mt-0.5">
                    Thời gian, đề thi, giám sát và quy tắc thi.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                    Mở phòng &amp; chia sẻ
                  </div>
                  <div className="text-slate-400 dark:text-neutral-500 text-[11px] mt-0.5">
                    Tạo mã PIN 6 số và mời học viên tham gia.
                  </div>
                </div>
              </div>
            </div>

            <Link
              href={createRoomUrl}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Bắt đầu tạo phòng</span>
            </Link>
          </div>

          {/* Card 2: Tính năng nổi bật (Matching Image 5) */}
          <div className="p-5 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-900 dark:text-neutral-100">
                Tính năng nổi bật
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Video className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                    Giám sát trực tiếp
                  </div>
                  <div className="text-slate-400 dark:text-neutral-500 text-[11px] mt-0.5">
                    Theo dõi thí sinh theo thời gian thực và điều hành phiên thi.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                    Giám sát quy chế thi
                  </div>
                  <div className="text-slate-400 dark:text-neutral-500 text-[11px] mt-0.5">
                    Cảnh báo rời tab làm bài, giám sát kết nối mạng và tự động thu bài đúng giờ.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                    Tích hợp đề thi &amp; chấm tự động
                  </div>
                  <div className="text-slate-400 dark:text-neutral-500 text-[11px] mt-0.5">
                    Đồng bộ trực tiếp với ngân hàng câu hỏi chuẩn hóa 5 miền.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <FileCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                    Báo cáo &amp; kết quả ngay sau phiên
                  </div>
                  <div className="text-slate-400 dark:text-neutral-500 text-[11px] mt-0.5">
                    Thống kê tỷ lệ hoàn thành, điểm trung bình và xuất kết quả.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. MODAL CHIẾU MÃ QR THAM GIA PHÒNG THI                     */}
      {/* ============================================================ */}
      {qrModalRoom && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111114] rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 max-w-sm w-full text-center space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
                Mã QR Tham Gia Phòng Thi
              </span>
              <button
                type="button"
                onClick={() => setQrModalRoom(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100 line-clamp-1">
              {qrModalRoom.title}
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                typeof window !== 'undefined'
                  ? `${window.location.origin}/personal/live-pin?pin=${qrModalRoom.roomCode}`
                  : `https://nexa.edu.vn/personal/live-pin?pin=${qrModalRoom.roomCode}`
              )}`}
              alt="QR Code Phòng Thi"
              width={200}
              height={200}
              className="rounded-xl mx-auto border border-slate-200 dark:border-zinc-800 p-2 shadow-xs bg-white"
            />

            <div className="space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-mono font-medium">
                MÃ PIN 6 SỐ
              </div>
              <div className="font-mono font-extrabold text-2xl text-blue-600 dark:text-blue-400 tracking-widest tabular-nums">
                {qrModalRoom.roomCode}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Thí sinh mở camera quét mã QR hoặc truy cập <strong>/personal/live-pin</strong> và nhập 6 số trên.
            </p>

            <button
              type="button"
              onClick={() => setQrModalRoom(null)}
              className="w-full py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
