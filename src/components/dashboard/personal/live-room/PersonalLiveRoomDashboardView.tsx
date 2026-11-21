'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  AlertCircle,
  RefreshCw,
  Link2,
  ChevronDown,
  Download,
  HelpCircle,
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
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [isPinDropdownOpen, setIsPinDropdownOpen] = useState(false);
  const [headerPinInput, setHeaderPinInput] = useState('');
  const [headerPinError, setHeaderPinError] = useState('');
  const [isJoiningWithPin, setIsJoiningWithPin] = useState(false);
  const pinDropdownRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Handle clicking outside the PIN dropdown popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pinDropdownRef.current && !pinDropdownRef.current.contains(event.target as Node)) {
        setIsPinDropdownOpen(false);
      }
    }
    if (isPinDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPinDropdownOpen]);

  const handleJoinByPin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = headerPinInput.trim().replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      setHeaderPinError('Mã PIN gồm đúng 6 chữ số');
      return;
    }
    setHeaderPinError('');
    setIsJoiningWithPin(true);
    router.push(`/live/waiting-room?pin=${cleanPin}`);
  };

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadExcel = async (roomId: string, roomCode: string) => {
    try {
      setDownloadingId(roomId);
      const res = await fetch(`/api/rooms/${roomId}/results`);
      if (!res.ok) {
        alert('Không thể tải dữ liệu kết quả phòng thi.');
        return;
      }
      const data = await res.json();
      const results = data.results || [];
      const room = data.room || {};
      const stats = data.stats || {};

      const rows = [
        ['BÁO CÁO KẾT QUẢ KHẢO THÍ TRỰC TIẾP (CÁ NHÂN)'],
        ['Tên ca thi:', room.title || 'Ca thi trực tiếp'],
        ['Mã PIN:', room.roomCode || roomCode],
        ['Bài đánh giá:', room.assessmentTitle || '--'],
        ['Thời lượng:', `${room.durationMinutes || 45} phút`],
        ['Ngày xuất file:', new Date().toLocaleString('vi-VN')],
        [''],
        ['--- TỔNG QUAN CHỈ SỐ ---'],
        ['Tổng thí sinh:', stats.totalJoined || results.length],
        ['Đã nộp bài:', stats.totalSubmitted || results.filter((r: any) => r.status === 'SUBMITTED' || r.submittedAt).length],
        ['Tỉ lệ nộp bài:', `${stats.submitPercent || 0}%`],
        ['Điểm trung bình:', stats.averageScore ?? '--'],
        ['Điểm cao nhất:', stats.highestScore ?? '--'],
        ['Chuẩn đạt:', `${room.passingScore || 70}% chuẩn đạt`],
        [''],
        ['--- BẢNG ĐIỂM CHI TIẾT ---'],
        ['Hạng', 'Mã Thí Sinh', 'Họ Và Tên', 'Điểm Số', 'Chuẩn Đạt', 'Thời Gian Hoàn Thành', 'Trạng Thái Nộp', 'Cảnh Báo Đổi Tab'],
        ...results.map((r: any) => [
          r.rank ?? '--',
          r.studentCode ?? '--',
          r.fullName ?? 'Thí sinh',
          r.score !== null && r.score !== undefined ? r.score : '--',
          r.score !== null && r.score >= (room.passingScore || 70) ? 'Đạt' : 'Chưa đạt',
          r.timeTakenDisplay ?? '--',
          r.isOnTime ? 'Đúng hạn' : 'Quá giờ',
          r.proctoringSummary?.tab_switches ?? 0,
        ]),
      ];

      const csvContent = '\uFEFF' + rows.map((row) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Ket_qua_ca_thi_${roomCode}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download excel error:', err);
      alert('Lỗi xuất báo cáo kết quả.');
    } finally {
      setDownloadingId(null);
    }
  };

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

  // Copy Direct Link helper
  const handleCopyLink = (pin: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nexa.edu.vn';
    const link = `${origin}/live/waiting-room?pin=${pin}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(pin);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const scheduled = rooms.filter((r) => r.status === 'SCHEDULED' || r.status === 'WAITING').length;
    const inProgress = rooms.filter((r) => r.status === 'IN_PROGRESS').length;
    const completed = rooms.filter((r) => r.status === 'COMPLETED' || r.status === 'RESULTS_PUBLISHED').length;
    return { scheduled, inProgress, completed, total: rooms.length };
  }, [rooms]);

  // Real recent templates from user's live rooms (0 mock data)
  const recentTemplates = useMemo(() => {
    const seen = new Set<string>();
    const list: LiveRoomItem[] = [];
    for (const r of rooms) {
      if (!seen.has(r.assessmentTitle)) {
        seen.add(r.assessmentTitle);
        list.push(r);
        if (list.length >= 3) break;
      }
    }
    return list;
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
      {/* 1. Header with Title & Direct PIN Action */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
            </div>
            <h1 className="text-base sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight truncate">
              Phòng thi trực tiếp
            </h1>
            <button
              type="button"
              onClick={() => {
                alert(
                  'Quy trình tổ chức phòng đánh giá trực tiếp:\n1. Bấm "Mở phòng mới" và chọn bài đánh giá năng lực số.\n2. Chia sẻ mã PIN 6 số hoặc liên kết cho học viên.\n3. Nhấn "Bắt đầu làm bài" khi học viên đã có mặt đầy đủ trong sảnh chờ.\n4. Theo dõi tiến độ nộp bài và kết quả theo thời gian thực.'
                );
              }}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center transition-colors cursor-pointer shadow-2xs shrink-0"
              title="Hướng dẫn tổ chức phòng thi"
              aria-label="Hướng dẫn tổ chức phòng thi"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Header Controls: Vào phòng bằng PIN & Làm mới */}
        <div className="flex items-center gap-1.5 sm:gap-2 relative shrink-0" ref={pinDropdownRef}>
          {/* Nút Tham gia đặt ngang hàng tiêu đề */}
          <button
            type="button"
            onClick={() => {
              setIsPinDropdownOpen((prev) => !prev);
              setHeaderPinError('');
            }}
            className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shadow-2xs ${
              isPinDropdownOpen
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-neutral-800 dark:text-neutral-200'
            }`}
            title="Tham gia phòng thi bằng mã PIN"
          >
            <Radio className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Tham gia</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                isPinDropdownOpen ? 'rotate-180 text-blue-600' : ''
              }`}
            />
          </button>

          {/* Menu popover xổ ra ngay khi nhấn để nhập mã */}
          {isPinDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 w-[calc(100vw-2rem)] sm:w-80 max-w-xs sm:max-w-sm p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xl animate-in fade-in slide-in-from-top-2 duration-150 space-y-3">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-zinc-900">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Radio className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Nhập mã PIN tham gia
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                  6 SỐ
                </span>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                Nhập mã PIN 6 số do người điều hành phòng chia sẻ để vào sảnh chờ ngay lập tức:
              </p>

              <form onSubmit={handleJoinByPin} className="space-y-2.5">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoFocus
                  value={headerPinInput}
                  onChange={(e) => {
                    const nextVal = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setHeaderPinInput(nextVal);
                    if (headerPinError) setHeaderPinError('');
                  }}
                  placeholder="Nhập 6 số PIN (VD: 849201)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-center font-mono text-base font-bold tracking-widest text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 placeholder:tracking-normal placeholder:font-sans placeholder:text-xs focus:outline-none focus:border-blue-600 transition shadow-2xs"
                />

                {headerPinError && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium text-center">
                    {headerPinError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={headerPinInput.length !== 6 || isJoiningWithPin}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <span>{isJoiningWithPin ? 'Đang chuyển vào phòng...' : 'Vào phòng ngay'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* Nút làm mới */}
          <button
            onClick={fetchRooms}
            className="p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-500 dark:text-neutral-400 transition-colors cursor-pointer shadow-2xs shrink-0"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Three Metric KPI Cards (Screen 01) - 3 cards in 1 row on mobile */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* Sắp diễn ra */}
        <div
          onClick={() => {
            setStatusFilter(statusFilter === 'SCHEDULED' ? 'ALL' : 'SCHEDULED');
            setCurrentPage(1);
          }}
          className={`p-2.5 sm:p-4 rounded-xl border cursor-pointer transition-all min-w-0 ${
            statusFilter === 'SCHEDULED'
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20'
              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-black hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-neutral-400 truncate">
              Sắp diễn ra
            </span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1 sm:mt-2">
            {stats.scheduled}
          </div>
        </div>

        {/* Đang diễn ra */}
        <div
          onClick={() => {
            setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS');
            setCurrentPage(1);
          }}
          className={`p-2.5 sm:p-4 rounded-xl border cursor-pointer transition-all min-w-0 ${
            statusFilter === 'IN_PROGRESS'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20'
              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-black hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-neutral-400 truncate">
              Đang diễn ra
            </span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1 sm:mt-2">
            {stats.inProgress}
          </div>
        </div>

        {/* Đã hoàn thành */}
        <div
          onClick={() => {
            setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED');
            setCurrentPage(1);
          }}
          className={`p-2.5 sm:p-4 rounded-xl border cursor-pointer transition-all min-w-0 ${
            statusFilter === 'COMPLETED'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20'
              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-black hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-neutral-400 truncate">
              Đã hoàn thành
            </span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1 sm:mt-2">
            {stats.completed}
          </div>
        </div>
      </div>

      {/* 3. Action Buttons Row */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <Link
          href="/personal/live-room/new"
          className="px-3.5 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Mở phòng mới</span>
        </Link>

        {recentTemplates.length > 0 ? (
          <Link
            href={`/personal/live-room/new?cloneFrom=${recentTemplates[0].id}`}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-neutral-200 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer truncate max-w-[200px] sm:max-w-none"
          >
            <Layers className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="truncate">Nhân bản gần đây</span>
          </Link>
        ) : (
          <Link
            href="/personal/live-room/new"
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-neutral-200 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Layers className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Tạo từ bài đánh giá</span>
          </Link>
        )}

        <button
          type="button"
          onClick={() => {
            alert(
              'Quy trình tổ chức phòng đánh giá trực tiếp:\n1. Bấm "Mở phòng mới" và chọn bài đánh giá năng lực số.\n2. Chia sẻ mã PIN 6 số hoặc liên kết cho học viên.\n3. Nhấn "Bắt đầu làm bài" khi học viên đã có mặt đầy đủ trong sảnh chờ.\n4. Theo dõi tiến độ nộp bài và kết quả theo thời gian thực.'
            );
          }}
          className="w-8 h-8 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center justify-center transition-colors shadow-2xs cursor-pointer shrink-0"
          title="Hướng dẫn tổ chức phòng thi"
          aria-label="Hướng dẫn tổ chức phòng thi"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* 4. Main Content: Filter & Table List (Full Width) */}
      <div className="space-y-4 min-w-0">
          {/* Filter Bar */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo tên phòng, bài đánh giá, mã PIN..."
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
                <option value="COMPLETED">Đã hoàn thành</option>
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
                <span>Đang tải danh sách phòng...</span>
              </div>
            ) : paginatedRooms.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Radio className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                    Chưa có phòng đánh giá nào
                  </div>
                  <p className="text-slate-500 dark:text-neutral-400 max-w-sm mx-auto">
                    {searchQuery || statusFilter !== 'ALL'
                      ? 'Không tìm thấy phòng phù hợp với bộ lọc hiện tại.'
                      : 'Bạn chưa tạo phòng đánh giá trực tiếp nào. Hãy bấm "Mở phòng mới" để bắt đầu phiên đánh giá.'}
                  </p>
                </div>
                {!searchQuery && statusFilter === 'ALL' && (
                  <Link
                    href="/personal/live-room/new"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Mở phòng đầu tiên</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[840px]">
                  <thead>
                    <tr className="bg-slate-50/60 dark:bg-zinc-900/40 text-[11px] font-semibold text-slate-500 dark:text-neutral-400">
                      <th className="py-3 px-4 min-w-[210px]">Tên phòng</th>
                      <th className="py-3 px-4 min-w-[200px]">Bài đánh giá</th>
                      <th className="py-3 px-4 whitespace-nowrap min-w-[110px]">Thời lượng</th>
                      <th className="py-3 px-3 text-center whitespace-nowrap min-w-[90px]">Người tham gia</th>
                      <th className="py-3 px-4 whitespace-nowrap min-w-[130px]">Trạng thái</th>
                      <th className="py-3 px-3 text-center whitespace-nowrap min-w-[110px]">PIN</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap min-w-[140px]">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="">
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
                                {isCompleted ? (
                                  <Link
                                    href={`/personal/live-room/${room.id}/results`}
                                    className="font-semibold text-neutral-900 dark:text-neutral-100 truncate hover:text-blue-600 dark:hover:text-blue-400 block transition-colors"
                                    title={`${room.title} (Nhấp để xem bảng kết quả trực tuyến)`}
                                  >
                                    {room.title}
                                  </Link>
                                ) : (
                                  <div className="font-semibold text-neutral-900 dark:text-neutral-100 truncate" title={room.title}>
                                    {room.title}
                                  </div>
                                )}
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

                          {/* PIN & Link */}
                          <td className="py-3 px-3 text-center whitespace-nowrap min-w-[120px]">
                            <div className="flex flex-col items-center gap-1">
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
                                <button
                                  type="button"
                                  onClick={() => handleCopyLink(room.roomCode)}
                                  className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                  title="Sao chép link mời thi trực tiếp"
                                >
                                  {copiedLink === room.roomCode ? (
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Link2 className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                              {copiedPin === room.roomCode && (
                                <div className="text-[9px] text-emerald-600 font-sans">Đã chép mã PIN</div>
                              )}
                              {copiedLink === room.roomCode && (
                                <div className="text-[9px] text-blue-600 font-sans">Đã chép link mời</div>
                              )}
                            </div>
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
                                <button
                                  type="button"
                                  onClick={() => handleDownloadExcel(room.id, room.roomCode)}
                                  disabled={downloadingId === room.id}
                                  className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 font-semibold text-xs inline-flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                                  title="Tải bảng điểm và phân tích Excel"
                                >
                                  {downloadingId === room.id ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Download className="w-3.5 h-3.5" />
                                  )}
                                </button>
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
              <div className="p-3 flex items-center justify-between text-xs text-slate-500">
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
      </div>
  );
}
