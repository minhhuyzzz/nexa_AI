'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Radio,
  Users,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Play,
  Pause,
  Square,
  QrCode,
  ArrowLeft,
  Search,
  ExternalLink,
  Settings,
  Lock,
  Unlock,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Send,
  Download,
  Share2,
  Monitor,
} from 'lucide-react';
import { RoomThemeId, ROOM_THEMES } from '@/types/live-room';

interface Participant {
  id: string;
  userId: string;
  fullName: string;
  initials: string;
  avatarUrl?: string | null;
  status: string;
  isReady: boolean;
  connectionStatus: string;
  score?: number | null;
  submittedAt?: string | null;
  joinedAt?: string;
  studentCode?: string;
}

interface RoomData {
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
  maxParticipants: number;
  hasStarted: boolean;
  startedAt?: string | null;
  elapsedSeconds?: number;
  remainingSeconds?: number;
}

interface LiveLogEvent {
  id: string;
  time: string;
  text: string;
  type: 'EVENT' | 'WARN' | 'ANNOUNCE';
}

function LiveControlContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId') || '';

  const [room, setRoom] = useState<RoomData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Host Toolbar
  const [isLocked, setIsLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Quick Announcements
  const [announcementText, setAnnouncementText] = useState('');
  const [sendingAnnounce, setSendingAnnounce] = useState(false);
  const [announceSentMessage, setAnnounceSentMessage] = useState(false);

  // Event Log
  const [eventLogs, setEventLogs] = useState<LiveLogEvent[]>([]);

  // Sound chime
  const playJoinChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  }, []);

  // Poll room & participant state every 3 seconds
  const fetchRoomState = useCallback(
    async (silent = false) => {
      if (!roomId) {
        setError('Thiếu mã định danh phòng thi (roomId).');
        setLoading(false);
        return;
      }

      if (!silent) setLoading(true);
      try {
        const res = await fetch(`/api/rooms/status?roomId=${roomId}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          setError(errData.error || 'Không tìm thấy phòng thi hoặc phòng thi đã đóng.');
          return;
        }

        const data = await res.json();
        if (data.success && data.room) {
          setRoom(data.room);
          setIsLocked(data.room.isLocked ?? false);

          const rawList = data.participants || [];
          const formatted: Participant[] = rawList.map((p: any, idx: number) => ({
            ...p,
            studentCode: `K48-${String(idx + 1).padStart(3, '0')}`,
          }));
          setParticipants(formatted);
          setError(null);
        }
      } catch {
        if (!silent) setError('Lỗi kết nối khi đồng bộ dữ liệu phòng thi.');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [roomId]
  );

  useEffect(() => {
    fetchRoomState();
    const interval = setInterval(() => fetchRoomState(true), 3000);
    return () => clearInterval(interval);
  }, [fetchRoomState]);

  // Audio trigger on participant increase
  const prevCountRef = useRef(participants.length);
  useEffect(() => {
    if (soundEnabled && participants.length > prevCountRef.current && prevCountRef.current > 0) {
      playJoinChime();
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setEventLogs((prev) => [
        {
          id: Math.random().toString(),
          time: timeStr,
          text: 'Thí sinh mới vừa tham gia phòng.',
          type: 'EVENT',
        },
        ...prev.slice(0, 29),
      ]);
    }
    prevCountRef.current = participants.length;
  }, [participants.length, soundEnabled, playJoinChime]);

  // Actions
  const handleStartExam = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/evaluator/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, action: 'START' }),
      });
      if (res.ok) {
        await fetchRoomState(true);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Không thể bắt đầu bài thi.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handlePauseExam = async () => {
    setActionLoading(true);
    try {
      await fetch('/api/evaluator/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, action: 'PAUSE' }),
      });
      await fetchRoomState(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeExam = async () => {
    setActionLoading(true);
    try {
      await fetch('/api/evaluator/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, action: 'RESUME' }),
      });
      await fetchRoomState(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndExam = async () => {
    if (!confirm('Bạn có chắc chắn muốn kết thúc phiên thi này và tổng kết kết quả?')) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/evaluator/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, action: 'END' }),
      });
      if (res.ok) {
        router.push(`/personal/live-room/${roomId}/results`);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Không thể kết thúc phiên thi.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleLock = async () => {
    const nextLocked = !isLocked;
    try {
      await fetch('/api/evaluator/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, action: nextLocked ? 'LOCK' : 'UNLOCK' }),
      });
      setIsLocked(nextLocked);
    } catch {
      alert('Không thể đổi trạng thái khóa phòng.');
    }
  };

  const handleCopyCode = () => {
    if (!room?.roomCode) return;
    navigator.clipboard.writeText(room.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSendAnnouncement = async (text: string) => {
    if (!text.trim()) return;
    setSendingAnnounce(true);
    try {
      const res = await fetch('/api/rooms/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, content: text.trim() }),
      });
      if (res.ok) {
        setAnnouncementText('');
        setAnnounceSentMessage(true);
        setTimeout(() => setAnnounceSentMessage(false), 2000);
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        setEventLogs((prev) => [
          {
            id: Math.random().toString(),
            time: timeStr,
            text: `Đã phát thông báo: "${text.trim()}"`,
            type: 'ANNOUNCE',
          },
          ...prev,
        ]);
      }
    } finally {
      setSendingAnnounce(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  // Export CSV
  const handleExportRoster = () => {
    if (participants.length === 0) return;
    const rows = [
      ['STT', 'Mã Thí Sinh', 'Họ Và Tên', 'Trạng Thái', 'Điểm Số'],
      ...participants.map((p, idx) => [
        idx + 1,
        p.studentCode || '',
        p.fullName,
        p.status,
        p.score ?? '--',
      ]),
    ];
    const csvContent = '\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Danh_sach_phong_${room?.roomCode || 'live'}.csv`;
    link.click();
  };

  // KPI calculations
  const totalJoined = participants.length;
  const readyCount = participants.filter((p) => p.isReady).length;
  const takingCount = participants.filter((p) => p.status === 'TAKING').length;
  const submittedCount = participants.filter((p) => p.status === 'SUBMITTED').length;

  // Time format helper
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
  };

  // Filtered Participants
  const filteredParticipants = participants.filter((p) => {
    if (statusFilter === 'TAKING' && p.status !== 'TAKING') return false;
    if (statusFilter === 'SUBMITTED' && p.status !== 'SUBMITTED') return false;
    if (statusFilter === 'READY' && !p.isReady) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      return (
        p.fullName.toLowerCase().includes(q) ||
        (p.studentCode && p.studentCode.toLowerCase().includes(q))
      );
    }
    return true;
  });

  if (loading && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="p-8 rounded-md bg-white border border-slate-200 text-center space-y-3 shadow-xs">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
          <div className="text-sm font-semibold text-neutral-900">
            Đang nạp màn hình điều phối phòng thi...
          </div>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full p-8 rounded-md bg-white border border-slate-200 text-center space-y-4 shadow-xs">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <div className="text-base font-bold text-neutral-900">{error || 'Không tìm thấy phòng thi'}</div>
          <Link
            href="/personal/live-room"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-blue-600 text-white text-xs font-semibold"
          >
            Quay về danh sách phòng thi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-8 bg-slate-50/70 space-y-5">
      {/* 1. Header & Title Block (Screen 07) */}
      <div className="p-5 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              PHÒNG ĐIỀU KHIỂN PHIÊN THI
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            {room.title}
          </h1>
          <p className="text-xs text-slate-500">
            Quản lý và điều khiển phiên thi trực tiếp: theo dõi, điều phối và đảm bảo kỳ thi diễn ra an toàn, minh bạch, đúng quy chế.
          </p>
        </div>

        {/* Quick Stats Pill Row */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* PIN */}
          <div className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center gap-2">
            <span className="text-slate-500 font-medium">PIN:</span>
            <span className="font-mono font-bold text-blue-600 text-sm">
              {room.roomCode.slice(0, 3)} {room.roomCode.slice(3)}
            </span>
            <button
              onClick={handleCopyCode}
              className="text-slate-400 hover:text-blue-600 transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Status */}
          <div className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Trạng thái:</span>
            {room.status === 'IN_PROGRESS' ? (
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Đang diễn ra
              </span>
            ) : room.status === 'PAUSED' ? (
              <span className="font-semibold text-amber-700">Tạm dừng</span>
            ) : (
              <span className="font-semibold text-blue-700">Phòng chờ</span>
            )}
          </div>

          {/* Theme */}
          <div className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Giao diện:</span>
            <span className="font-semibold text-neutral-800">
              {ROOM_THEMES[room.themeId]?.name || 'Trắng tối giản'}
            </span>
          </div>

          {/* Participants */}
          <div className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-neutral-900">
              {totalJoined} / {room.maxParticipants}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Control Action Bar (Screen 07) */}
      <div className="p-3 rounded-md bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Start / Pause / Resume / End */}
          {!room.hasStarted && room.status !== 'IN_PROGRESS' ? (
            <button
              onClick={handleStartExam}
              disabled={actionLoading}
              className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Bắt đầu bài thi</span>
            </button>
          ) : room.status === 'PAUSED' ? (
            <button
              onClick={handleResumeExam}
              disabled={actionLoading}
              className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Tiếp tục</span>
            </button>
          ) : (
            <button
              onClick={handlePauseExam}
              disabled={actionLoading}
              className="px-3.5 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Tạm dừng</span>
            </button>
          )}

          <button
            onClick={handleEndExam}
            disabled={actionLoading}
            className="px-3.5 py-2 rounded-md border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Kết thúc phiên</span>
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* Lock Room */}
          <button
            onClick={handleToggleLock}
            className={`px-3 py-2 rounded-md border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
              isLocked
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{isLocked ? 'Đã khóa phòng' : 'Khóa phòng'}</span>
          </button>

          <button
            onClick={handleCopyCode}
            className="px-3 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Sao chép mã PIN</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="px-3 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            <span>Toàn màn hình</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportRoster}
            className="px-3 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất danh sách</span>
          </button>

          <Link
            href={`/personal/live-pin?pin=${room.roomCode}`}
            target="_blank"
            className="px-3 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Màn hình chờ</span>
          </Link>
        </div>
      </div>

      {/* 3. Timer & Stepper & 4 Live Metric Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Countdown Block (4 Cols) */}
        <div className="lg:col-span-4 p-5 rounded-md bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 text-white shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-blue-200 uppercase tracking-widest block">
              {room.status === 'IN_PROGRESS' ? 'THỜI GIAN LÀM BÀI CÒN LẠI' : 'ĐẾM NGƯỢC THỜI GIAN'}
            </span>
            <div className="font-mono font-extrabold text-4xl sm:text-5xl tracking-widest text-white py-2">
              {formatTime(room.remainingSeconds ?? room.durationMinutes * 60)}
            </div>
          </div>

          <div className="text-[11px] text-blue-200 border-t border-white/10 pt-2 flex items-center justify-between">
            <span>Thời lượng ca: {room.durationMinutes} phút</span>
            <span>Đã trôi: {Math.floor((room.elapsedSeconds || 0) / 60)} phút</span>
          </div>
        </div>

        {/* 4 Metric Cards (8 Cols) */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Card 1: Đã vào phòng */}
          <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="text-xs font-medium text-slate-500">Đã vào phòng</div>
            <div className="my-2">
              <span className="text-2xl font-bold text-neutral-900">{totalJoined}</span>
              <span className="text-xs text-slate-400"> / {room.maxParticipants}</span>
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded w-fit">
              +100% online
            </div>
          </div>

          {/* Card 2: Sẵn sàng */}
          <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="text-xs font-medium text-slate-500">Đã sẵn sàng</div>
            <div className="my-2 text-2xl font-bold text-emerald-700">{readyCount}</div>
            <div className="text-[10px] text-slate-400">Đã xác nhận quy chế</div>
          </div>

          {/* Card 3: Đang làm bài */}
          <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="text-xs font-medium text-slate-500">Đang làm bài</div>
            <div className="my-2 text-2xl font-bold text-blue-600">
              {room.status === 'IN_PROGRESS' ? takingCount || totalJoined : 0}
            </div>
            <div className="text-[10px] text-slate-400">Đang tương tác đề</div>
          </div>

          {/* Card 4: Đã nộp */}
          <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="text-xs font-medium text-slate-500">Đã nộp bài</div>
            <div className="my-2 text-2xl font-bold text-neutral-900">{submittedCount}</div>
            <div className="text-[10px] text-slate-400">Đã chốt bài thi</div>
          </div>
        </div>
      </div>

      {/* 4. Main Body: Table & Right Broadcast Sidebars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Participants Table (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-md border border-slate-200 shadow-xs p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-neutral-900">
                Danh sách người tham gia ({filteredParticipants.length})
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, mã..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="TAKING">Đang làm bài</option>
                <option value="SUBMITTED">Đã nộp</option>
                <option value="READY">Sẵn sàng</option>
              </select>
            </div>
          </div>

          {filteredParticipants.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Không tìm thấy thí sinh nào.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Người tham gia</th>
                    <th className="py-2.5 px-3">Mã định danh</th>
                    <th className="py-2.5 px-3">Trạng thái</th>
                    <th className="py-2.5 px-3">Điểm số</th>
                    <th className="py-2.5 px-3 text-right">Nhắn tin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredParticipants.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {p.initials}
                          </div>
                          <span className="font-semibold text-neutral-900">{p.fullName}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {p.studentCode}
                      </td>
                      <td className="py-2.5 px-3">
                        {p.status === 'SUBMITTED' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ Đã nộp
                          </span>
                        ) : room.status === 'IN_PROGRESS' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                            Đang làm bài
                          </span>
                        ) : p.isReady ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ Sẵn sàng
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            ⏱ Chưa sẵn sàng
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-neutral-900">
                        {p.score !== null && p.score !== undefined ? `${p.score}đ` : '--'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            const msg = prompt(`Nhắn tin riêng đến thí sinh ${p.fullName}:`);
                            if (msg) handleSendAnnouncement(`[Riêng tới ${p.fullName}]: ${msg}`);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                          title="Gửi thông báo riêng"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Broadcast Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Announcement Composer with Preset Chips (Screen 07) */}
          <div className="bg-white rounded-md border border-slate-200 shadow-xs p-4 space-y-3 text-xs">
            <h2 className="font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-blue-600" />
              <span>Gửi thông báo đến thí sinh</span>
            </h2>

            <textarea
              rows={3}
              placeholder="Nhập nội dung thông báo (VD: Chuẩn bị bắt đầu bài thi...)"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
            />

            {/* Quick Preset Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Mẫu nhanh:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Chuẩn bị bắt đầu',
                  'Còn 5 phút kết thúc',
                  'Hướng dẫn làm bài',
                  'Nhắc quy chế không thoát màn hình',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setAnnouncementText(chip)}
                    className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400">
                {announcementText.length}/500
              </span>

              <button
                type="button"
                disabled={sendingAnnounce || !announcementText.trim()}
                onClick={() => handleSendAnnouncement(announcementText)}
                className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold inline-flex items-center gap-1 transition-colors disabled:opacity-50 shadow-xs"
              >
                <Send className="w-3 h-3" />
                <span>{sendingAnnounce ? 'Đang gửi...' : 'Gửi thông báo'}</span>
              </button>
            </div>

            {announceSentMessage && (
              <div className="text-[11px] text-emerald-600 font-semibold">
                ✓ Đã phát thông báo tức thì!
              </div>
            )}
          </div>

          {/* Realtime Event Log (Screen 07) */}
          <div className="bg-white rounded-md border border-slate-200 shadow-xs p-4 space-y-3 text-xs">
            <h2 className="font-bold text-neutral-900 uppercase tracking-wider flex items-center justify-between">
              <span>Nhật ký sự kiện trực tiếp</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h2>

            {eventLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Chưa có sự kiện nào trong phiên thi.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {eventLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 text-[11px]">
                    <span className="font-mono text-slate-400 shrink-0">
                      {log.time}
                    </span>
                    <span className="text-slate-700 leading-snug">
                      {log.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LiveControlPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Đang tải phòng điều khiển...</div>}>
      <LiveControlContent />
    </Suspense>
  );
}
