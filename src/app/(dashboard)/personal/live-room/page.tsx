'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Radio,
  Users,
  Copy,
  Check,
  Plus,
  RefreshCw,
  Clock,
  Play,
  QrCode,
  ExternalLink,
  ChevronDown,
  X,
  Trash2,
  Calendar,
  CheckCircle2,
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BarChart3,
  Edit,
  Eye,
  SlidersHorizontal,
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

function LiveRoomContent() {
  const router = useRouter();

  const [rooms, setRooms] = useState<ExamRoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrModalRoom, setQrModalRoom] = useState<ExamRoomItem | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('ALL');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [themeFilter, setThemeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Fetch Rooms
  const fetchRooms = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/evaluator/rooms');
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
  }, []);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(() => fetchRooms(true), 5000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  // Aggregate KPI Counts
  const totalCount = rooms.length;
  const waitingCount = rooms.filter((r) => r.status === 'WAITING' || (!r.startedAt && r.isActive)).length;
  const inProgressCount = rooms.filter((r) => r.status === 'IN_PROGRESS' || (r.isActive && !!r.startedAt)).length;
  const endedCount = rooms.filter((r) => r.status === 'ENDED' || r.status === 'RESULTS_PUBLISHED' || !r.isActive).length;

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
        const matchAsm = r.assessmentTitle.toLowerCase().includes(q);
        const matchPin = r.roomCode.includes(q);
        const matchId = r.id.toLowerCase().includes(q);
        if (!matchTitle && !matchAsm && !matchPin && !matchId) return false;
      }

      // 3. Mode filter
      if (modeFilter !== 'ALL' && r.roomMode !== modeFilter) return false;

      // 4. Theme filter
      if (themeFilter !== 'ALL' && r.themeId !== themeFilter) return false;

      // 5. Status dropdown filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'IN_PROGRESS' && r.status !== 'IN_PROGRESS') return false;
        if (statusFilter === 'WAITING' && r.status !== 'WAITING') return false;
        if (statusFilter === 'ENDED' && r.status !== 'ENDED' && r.status !== 'RESULTS_PUBLISHED') return false;
      }

      return true;
    });
  }, [rooms, activeTab, searchQuery, modeFilter, themeFilter, statusFilter]);

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

  // Status Badge Helper
  const renderStatusBadge = (room: ExamRoomItem) => {
    if (room.status === 'IN_PROGRESS' || (room.isActive && room.startedAt)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          Đang diễn ra
        </span>
      );
    }
    if (room.status === 'ENDED' || room.status === 'RESULTS_PUBLISHED' || !room.isActive) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <CheckCircle2 className="w-3 h-3 text-slate-500" />
          Đã kết thúc
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <Clock className="w-3 h-3 text-blue-600" />
        Sắp diễn ra
      </span>
    );
  };

  // Theme Thumbnail Badge Helper
  const renderThemeBadge = (themeId: RoomThemeId) => {
    const theme = ROOM_THEMES[themeId] || ROOM_THEMES.minimal_white;
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
        <span
          className={`w-2 h-2 rounded-full ${
            themeId === 'space_blue'
              ? 'bg-sky-600'
              : themeId === 'aurora'
              ? 'bg-purple-600'
              : themeId === 'dark_professional'
              ? 'bg-zinc-800'
              : 'bg-slate-300'
          }`}
        />
        <span>{theme.name}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Action Header & Title Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
              PHÒNG THI REALTIME
            </span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Quản lý Phòng thi trực tiếp
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 max-w-2xl leading-relaxed">
            Tạo, điều hành và giám sát các phiên thi trực tuyến thời gian thực với mã PIN và bảng xếp hạng tức thì.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => fetchRooms()}
            disabled={loading}
            className="p-2 rounded-lg border border-slate-200 dark:border-zinc-750 bg-white dark:bg-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
          </button>

          <Link
            href="/personal/live-pin"
            className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-750 bg-white dark:bg-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-800 text-neutral-800 dark:text-zinc-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <span>Vào bằng mã PIN</span>
          </Link>

          <Link
            href="/personal/live-room/new"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Mở phòng thi mới</span>
          </Link>
        </div>
      </div>

      {/* 2. Filter Tabs (Đã tích hợp số lượng trực tiếp vào từng tab, loại bỏ hàng thẻ KPI trùng lặp) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => {
            setActiveTab('ALL');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850 hover:text-neutral-900 dark:hover:text-zinc-200'
          }`}
        >
          <span>Tất cả</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'ALL' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
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
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'WAITING'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850 hover:text-neutral-900 dark:hover:text-zinc-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Sắp diễn ra</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'WAITING' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
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
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'IN_PROGRESS'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850 hover:text-neutral-900 dark:hover:text-zinc-200'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>Đang diễn ra</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'IN_PROGRESS' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
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
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'ENDED'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850 hover:text-neutral-900 dark:hover:text-zinc-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Đã kết thúc</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'ENDED' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
            }`}
          >
            {endedCount}
          </span>
        </button>
      </div>

      {/* 4. Search and Dropdown Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên phòng thi, đề thi, mã PIN..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-md text-xs text-neutral-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-xs"
          />
        </div>

        {/* 4 Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter: Theme */}
          <select
            value={themeFilter}
            onChange={(e) => {
              setThemeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-xs"
          >
            <option value="ALL">Tất cả chủ đề giao diện</option>
            <option value="minimal_white">Trắng tối giản</option>
            <option value="space_blue">Space Blue</option>
            <option value="aurora">Aurora</option>
            <option value="dark_professional">Dark Professional</option>
          </select>

          {/* Filter: Mode */}
          <select
            value={modeFilter}
            onChange={(e) => {
              setModeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-xs"
          >
            <option value="ALL">Tất cả hình thức tham gia</option>
            <option value="OPEN">Mở tự do bằng PIN</option>
            <option value="GROUP_ONLY">Theo nhóm/lớp</option>
          </select>

          {/* Filter: Status */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-xs"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="WAITING">Sắp diễn ra / Chờ mở</option>
            <option value="IN_PROGRESS">Đang diễn ra</option>
            <option value="ENDED">Đã kết thúc</option>
          </select>
        </div>
      </div>

      {/* 5. Table of Exam Rooms */}
      <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900">
            Danh sách phòng thi ({filteredRooms.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mx-auto mb-2" strokeWidth={1.75} />
            Đang tải dữ liệu phòng thi...
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Radio className="w-10 h-10 text-slate-300 mx-auto" strokeWidth={1.5} />
            <div>
              <h3 className="text-sm font-bold text-slate-800">Không tìm thấy phòng thi nào</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Không có phiên thi nào phù hợp với bộ lọc hiện tại. Bấm nút &ldquo;Mở phòng thi mới&rdquo; để khởi tạo.
              </p>
            </div>
            <Link
              href="/personal/live-room/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Khởi tạo phòng mới ngay</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4 w-10 text-center">#</th>
                  <th className="py-3 px-4">Tên phòng thi</th>
                  <th className="py-3 px-4">Đề thi</th>
                  <th className="py-3 px-4">PIN</th>
                  <th className="py-3 px-4">Người tham gia</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedRooms.map((room, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const participantPercent = Math.min(
                    100,
                    Math.round((room.participantCount / (room.maxParticipants || 40)) * 100)
                  );

                  // Date format display
                  const dateStr = room.scheduledStart
                    ? new Date(room.scheduledStart).toLocaleDateString('vi-VN')
                    : new Date(room.createdAt).toLocaleDateString('vi-VN');
                  const timeStr = `${room.durationMinutes} phút`;

                  return (
                    <tr key={room.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* # Index */}
                      <td className="py-3 px-4 text-center font-medium text-slate-400">
                        {globalIdx}
                      </td>

                      {/* Tên phòng thi */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Radio className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-neutral-900 leading-snug">
                              {room.title}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                              <span>Mã: {room.id.slice(0, 8).toUpperCase()}</span>
                              <button
                                onClick={() => handleCopyCode(room.id)}
                                className="hover:text-blue-600"
                                title="Sao chép ID phòng"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Đề thi & Theme */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="font-medium text-neutral-900">
                            {room.assessmentTitle}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500 font-mono">
                              {room.durationMinutes} phút
                            </span>
                            {renderThemeBadge(room.themeId)}
                          </div>
                        </div>
                      </td>

                      {/* Mã PIN 6 số */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                          <span className="font-mono font-bold text-blue-600 tracking-wider">
                            {room.roomCode.slice(0, 3)} {room.roomCode.slice(3)}
                          </span>
                          <button
                            onClick={() => handleCopyCode(room.roomCode)}
                            className="text-slate-400 hover:text-blue-600 transition-colors"
                            title="Sao chép mã PIN"
                          >
                            {copiedCode === room.roomCode ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Người tham gia */}
                      <td className="py-3 px-4">
                        <div className="space-y-1 min-w-[110px]">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-neutral-800">
                              {room.participantCount} / {room.maxParticipants}
                            </span>
                            <span className="text-slate-400">{participantPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all duration-300"
                              style={{ width: `${participantPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Thời gian */}
                      <td className="py-3 px-4 text-slate-600">
                        <div className="space-y-0.5">
                          <div className="font-medium">{dateStr}</div>
                          <div className="text-[11px] text-slate-400">{timeStr}</div>
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3 px-4">
                        {renderStatusBadge(room)}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {room.status === 'IN_PROGRESS' || (room.isActive && room.startedAt) ? (
                            <Link
                              href={`/live/control?roomId=${room.id}`}
                              className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold inline-flex items-center gap-1 shadow-xs transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Vào phòng</span>
                            </Link>
                          ) : room.status === 'ENDED' || room.status === 'RESULTS_PUBLISHED' || !room.isActive ? (
                            <Link
                              href={`/personal/live-room/${room.id}/results`}
                              className="px-3 py-1.5 rounded border border-blue-200 text-blue-600 hover:bg-blue-50 font-semibold inline-flex items-center gap-1 transition-colors"
                            >
                              <BarChart3 className="w-3.5 h-3.5" />
                              <span>Xem kết quả</span>
                            </Link>
                          ) : (
                            <Link
                              href={`/personal/live-room/${room.id}/host`}
                              className="px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold inline-flex items-center gap-1 transition-colors shadow-xs"
                            >
                              <Play className="w-3.5 h-3.5 text-blue-600" />
                              <span>Điều phối</span>
                            </Link>
                          )}

                          {/* Quick QR button */}
                          <button
                            onClick={() => setQrModalRoom(room)}
                            className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors shadow-xs"
                            title="Chiếu mã QR tham gia"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteRoom(room.id, room.title)}
                            className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Xóa phòng thi này"
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

        {/* 6. Pagination Footer */}
        {filteredRooms.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Hiển thị {(currentPage - 1) * pageSize + 1} &ndash;{' '}
              {Math.min(currentPage * pageSize, filteredRooms.length)} trên {filteredRooms.length} phòng thi
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span>Số phòng mỗi trang:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value={5}>5 / trang</option>
                  <option value={10}>10 / trang</option>
                  <option value={20}>20 / trang</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded text-xs font-semibold transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 7. Modal chiếu mã QR */}
      {qrModalRoom && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-sm w-full text-center space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Mã QR Tham Gia Phòng Thi
              </span>
              <button
                onClick={() => setQrModalRoom(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="font-bold text-sm text-neutral-900">
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
              className="rounded-lg mx-auto border border-slate-200 p-2 shadow-xs"
            />

            <div className="space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-medium">
                MÃ PIN 6 SỐ
              </div>
              <div className="font-mono font-extrabold text-2xl text-blue-600 tracking-widest">
                {qrModalRoom.roomCode.slice(0, 3)} {qrModalRoom.roomCode.slice(3)}
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Thí sinh mở camera quét mã QR hoặc truy cập <strong>/personal/live-pin</strong> và nhập 6 số trên.
            </p>

            <button
              onClick={() => setQrModalRoom(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-semibold transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EvaluatorLiveRoomPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Đang tải phòng thi...</div>}>
      <LiveRoomContent />
    </Suspense>
  );
}
