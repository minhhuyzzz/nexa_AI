'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Radio,
  Users,
  Copy,
  Check,
  Play,
  Lock,
  Unlock,
  Settings,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Grid,
  List,
  Shield,
  FileText,
  Volume2,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { RoomThemeId, ROOM_THEMES } from '@/types/live-room';

interface Participant {
  id: string;
  userId: string;
  fullName: string;
  initials: string;
  avatarUrl?: string | null;
  status: string;
  isReady: boolean;
  readyAt?: string | null;
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
  scheduledStart?: string | null;
}

interface ActivityEvent {
  id: string;
  time: string;
  text: string;
  iconType: 'JOIN' | 'READY' | 'ANNOUNCE' | 'SYS';
}

export default function HostWaitingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = (params.id as string) || '';

  const [room, setRoom] = useState<RoomData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'READY' | 'NOT_READY'>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

  // Fast Announcement Form
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementAudience, setAnnouncementAudience] = useState('ALL');
  const [sendingAnnounce, setSendingAnnounce] = useState(false);
  const [announceSuccess, setAnnounceSuccess] = useState(false);

  // Lock status & starting
  const [isLocked, setIsLocked] = useState(false);
  const [startingExam, setStartingExam] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Activity Log
  const [activityLogs, setActivityLogs] = useState<ActivityEvent[]>([]);

  // Fetch Room & Participants
  const fetchRoomDetails = useCallback(async (silent = false) => {
    if (!roomId) return;
    if (!silent) setLoading(true);

    try {
      const res = await fetch(`/api/rooms/status?roomId=${roomId}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'Không tìm thấy phòng thi');
        return;
      }

      const data = await res.json();
      if (data.success && data.room) {
        setRoom(data.room);
        setIsLocked(data.room.isLocked || false);

        const list: Participant[] = (data.participants || []).map((p: any, idx: number) => ({
          ...p,
          studentCode: p.studentCode || `K48-${String(idx + 1).padStart(3, '0')}`,
        }));
        setParticipants(list);

        // If exam has already started, redirect host to full control
        if (data.room.status === 'IN_PROGRESS' || data.room.hasStarted) {
          router.push(`/live/control?roomId=${roomId}`);
        }
      }
    } catch {
      if (!silent) setError('Lỗi kết nối khi tải dữ liệu phòng thi.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [roomId, router]);

  useEffect(() => {
    fetchRoomDetails();
    const interval = setInterval(() => fetchRoomDetails(true), 3000);
    return () => clearInterval(interval);
  }, [fetchRoomDetails]);

  // Realtime Supabase Channel
  useEffect(() => {
    if (!roomId) return;
    const supabase = createClient();

    const channel = supabase.channel(`room:${roomId}:host`);

    channel
      .on('broadcast', { event: 'PARTICIPANT_JOIN' }, (payload) => {
        const pName = payload.payload?.fullName || 'Thí sinh mới';
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        setActivityLogs((prev) => [
          {
            id: Math.random().toString(),
            time: timeStr,
            text: `${pName} đã vào phòng thi.`,
            iconType: 'JOIN',
          },
          ...prev.slice(0, 19),
        ]);
        fetchRoomDetails(true);
      })
      .on('broadcast', { event: 'PARTICIPANT_READY' }, (payload) => {
        const pName = payload.payload?.fullName || 'Thí sinh';
        const isR = payload.payload?.isReady;
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        setActivityLogs((prev) => [
          {
            id: Math.random().toString(),
            time: timeStr,
            text: `${pName} đã ${isR ? 'sẵn sàng' : 'chuyển sang chưa sẵn sàng'}.`,
            iconType: 'READY',
          },
          ...prev.slice(0, 19),
        ]);
        fetchRoomDetails(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, fetchRoomDetails]);

  // Counters
  const totalInvited = room?.maxParticipants || 40;
  const joinedCount = participants.length;
  const readyCount = participants.filter((p) => p.isReady).length;
  const notReadyCount = joinedCount - readyCount;

  const joinedPercent = totalInvited > 0 ? Math.round((joinedCount / totalInvited) * 100) : 0;
  const readyPercent = joinedCount > 0 ? Math.round((readyCount / joinedCount) * 100) : 0;
  const notReadyPercent = joinedCount > 0 ? Math.round((notReadyCount / joinedCount) * 100) : 0;

  // Filtered Participants
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      if (statusFilter === 'READY' && !p.isReady) return false;
      if (statusFilter === 'NOT_READY' && p.isReady) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          p.fullName.toLowerCase().includes(q) ||
          (p.studentCode && p.studentCode.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [participants, statusFilter, searchQuery]);

  // Handle Start Exam
  const handleStartExam = async () => {
    if (joinedCount === 0) {
      if (!confirm('Phòng chưa có thí sinh nào vào. Bạn có chắc chắn muốn bắt đầu bài thi không?')) {
        return;
      }
    } else if (notReadyCount > 0) {
      if (!confirm(`Hiện có ${notReadyCount} thí sinh chưa sẵn sàng. Bạn có chắc chắn muốn bắt đầu ngay?`)) {
        return;
      }
    }

    setStartingExam(true);
    try {
      const res = await fetch('/api/evaluator/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          action: 'START',
        }),
      });

      if (res.ok) {
        router.push(`/live/control?roomId=${roomId}`);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Không thể bắt đầu bài thi.');
      }
    } catch {
      alert('Lỗi kết nối khi bắt đầu thi.');
    } finally {
      setStartingExam(false);
    }
  };

  // Handle Toggle Lock
  const handleToggleLock = async () => {
    const nextLocked = !isLocked;
    try {
      const res = await fetch('/api/evaluator/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          action: nextLocked ? 'LOCK' : 'UNLOCK',
        }),
      });

      if (res.ok) {
        setIsLocked(nextLocked);
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        setActivityLogs((prev) => [
          {
            id: Math.random().toString(),
            time: timeStr,
            text: nextLocked ? 'Đã khóa phòng thi không nhận thêm người.' : 'Đã mở khóa phòng thi.',
            iconType: 'SYS',
          },
          ...prev,
        ]);
      }
    } catch {
      alert('Không thể đổi trạng thái khóa phòng.');
    }
  };

  // Handle Send Announcement
  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;

    setSendingAnnounce(true);
    try {
      const res = await fetch('/api/rooms/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          content: announcementText.trim(),
          targetAudience: announcementAudience,
        }),
      });

      if (res.ok) {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        setActivityLogs((prev) => [
          {
            id: Math.random().toString(),
            time: timeStr,
            text: `Bạn đã phát thông báo: "${announcementText.trim()}"`,
            iconType: 'ANNOUNCE',
          },
          ...prev,
        ]);
        setAnnouncementText('');
        setAnnounceSuccess(true);
        setTimeout(() => setAnnounceSuccess(false), 2500);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Không thể gửi thông báo.');
      }
    } catch {
      alert('Lỗi kết nối khi gửi thông báo.');
    } finally {
      setSendingAnnounce(false);
    }
  };

  const handleCopyPIN = () => {
    if (!room?.roomCode) return;
    navigator.clipboard.writeText(room.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (loading && !room) {
    return (
      <div className="p-16 text-center text-xs text-slate-500">
        <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
        Đang đồng bộ dữ liệu phòng thi...
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="p-12 text-center bg-white rounded-md border border-slate-200 max-w-md mx-auto space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <div className="font-bold text-sm text-neutral-900">{error || 'Không tìm thấy phòng thi'}</div>
        <Link
          href="/personal/live-room"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-blue-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về danh sách phòng thi</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Category & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              KHẢO THÍ TRỰC TIẾP
            </span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Chuẩn Bị Phiên Thi Trực Tiếp
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý phòng thi, theo dõi người tham gia, gửi thông báo và bắt đầu phiên thi khi đã sẵn sàng.
          </p>
        </div>

        <Link
          href="/personal/live-room"
          className="text-xs font-semibold text-slate-500 hover:text-blue-600 inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Danh sách phòng</span>
        </Link>
      </div>

      {/* 2. Main Hero Room Banner */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 text-white shadow-md relative overflow-hidden space-y-4">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Đang chờ bắt đầu
              </span>
              <span className="text-xs text-slate-300 font-mono">
                Mã: {room.id.slice(0, 8).toUpperCase()}
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
              Phòng thi: {room.title}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                {room.assessmentTitle}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                {room.durationMinutes} phút
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                {room.roomMode === 'OPEN' ? 'Mở tự do bằng PIN' : 'Theo nhóm chỉ định'}
              </span>
            </div>
          </div>

          {/* Big PIN Highlight Card */}
          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[200px] shrink-0 space-y-1 relative z-10">
            <span className="text-[10px] text-blue-200 uppercase tracking-widest font-semibold block">
              MÃ PIN LIVE
            </span>
            <div className="font-mono font-extrabold text-3xl tracking-widest text-white">
              {room.roomCode.slice(0, 3)} {room.roomCode.slice(3)}
            </div>
            <button
              onClick={handleCopyPIN}
              className="mt-1 w-full py-1.5 rounded bg-white/20 hover:bg-white/30 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Đã sao chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép PIN</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Four Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng số mời */}
        <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Tổng chỗ phòng</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{totalInvited}</div>
          <div className="text-[11px] text-slate-400">Chỉ tiêu tối đa</div>
        </div>

        {/* Card 2: Đã vào phòng */}
        <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Đã vào phòng</span>
            <Radio className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900">{joinedCount}</span>
            <span className="text-xs font-semibold text-emerald-600">({joinedPercent}%)</span>
          </div>
          <div className="text-[11px] text-slate-400">Thí sinh đang kết nối</div>
        </div>

        {/* Card 3: Đã sẵn sàng */}
        <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Đã sẵn sàng</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{readyCount}</span>
            <span className="text-xs font-semibold text-emerald-600">({readyPercent}%)</span>
          </div>
          <div className="text-[11px] text-slate-400">Đã bấm sẵn sàng</div>
        </div>

        {/* Card 4: Chưa sẵn sàng */}
        <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Chưa sẵn sàng</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700">{notReadyCount}</span>
            <span className="text-xs font-semibold text-amber-600">({notReadyPercent}%)</span>
          </div>
          <div className="text-[11px] text-slate-400">Đang chuẩn bị</div>
        </div>
      </div>

      {/* 4. Action Toolbar */}
      <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleToggleLock}
            className={`px-3.5 py-2 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors border shadow-xs ${
              isLocked
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{isLocked ? 'Đã khóa nhận thí sinh' : 'Khóa vào phòng'}</span>
          </button>

          <Link
            href={`/personal/live-pin?pin=${room.roomCode}`}
            target="_blank"
            className="px-3.5 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Màn hình chờ thí sinh</span>
          </Link>
        </div>

        {/* Primary CTA: Start Exam */}
        <button
          onClick={handleStartExam}
          disabled={startingExam}
          className="px-6 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{startingExam ? 'Đang phát đề...' : 'Bắt đầu bài thi ngay'}</span>
        </button>
      </div>

      {/* 5. Main Center & Right Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Participant Roster (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-md border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <span>Danh sách người tham gia</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                  {participants.length}
                </span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, mã..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="ALL">Tất cả</option>
                <option value="READY">Đã sẵn sàng</option>
                <option value="NOT_READY">Chưa sẵn sàng</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center border border-slate-200 rounded overflow-hidden">
                <button
                  onClick={() => setViewMode('GRID')}
                  className={`p-1.5 ${viewMode === 'GRID' ? 'bg-slate-200 text-slate-800' : 'bg-white text-slate-500'}`}
                  title="Lưới"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('LIST')}
                  className={`p-1.5 ${viewMode === 'LIST' ? 'bg-slate-200 text-slate-800' : 'bg-white text-slate-500'}`}
                  title="Danh sách"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {filteredParticipants.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <div>Chưa có thí sinh nào vào phòng thi này.</div>
              <p className="text-[11px] text-slate-400">
                Hãy gửi mã PIN <strong>{room.roomCode}</strong> hoặc đường link để thí sinh tham gia.
              </p>
            </div>
          ) : viewMode === 'GRID' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredParticipants.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col items-center text-center space-y-2 shadow-2xs"
                >
                  <div className="relative">
                    {p.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.avatarUrl}
                        alt={p.fullName}
                        className="w-11 h-11 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center border border-blue-200">
                        {p.initials}
                      </div>
                    )}
                    <span
                      className={`w-3 h-3 rounded-full absolute bottom-0 right-0 border-2 border-white ${
                        p.isReady ? 'bg-emerald-500' : 'bg-amber-400'
                      }`}
                    />
                  </div>

                  <div className="w-full">
                    <div className="font-semibold text-xs text-neutral-900 truncate">
                      {p.fullName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {p.studentCode}
                    </div>
                  </div>

                  {p.isReady ? (
                    <span className="w-full py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Sẵn sàng
                    </span>
                  ) : (
                    <span className="w-full py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      ⏱ Chưa sẵn sàng
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {filteredParticipants.map((p, idx) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-slate-400 text-center text-[11px]">{idx + 1}</span>
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                      {p.initials}
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900">{p.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.studentCode}</div>
                    </div>
                  </div>

                  <div>
                    {p.isReady ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ✓ Sẵn sàng
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        ⏱ Chưa sẵn sàng
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Quick Announcement & Activity Log (1 Col) */}
        <div className="space-y-4">
          {/* Quick Announcement Box */}
          <div className="bg-white rounded-md border border-slate-200 shadow-xs p-4 space-y-3">
            <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-blue-600" />
              <span>Gửi thông báo nhanh</span>
            </h2>

            <form onSubmit={handleSendAnnouncement} className="space-y-3 text-xs">
              <textarea
                rows={3}
                required
                maxLength={500}
                placeholder="Nhập nội dung thông báo đến thí sinh... (VD: Hãy kiểm tra kết nối mạng, chuẩn bị giấy nháp)"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
              />

              <div className="flex items-center justify-between text-[11px]">
                <select
                  value={announcementAudience}
                  onChange={(e) => setAnnouncementAudience(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs"
                >
                  <option value="ALL">Tất cả người tham gia</option>
                  <option value="NOT_READY">Chỉ người chưa sẵn sàng</option>
                </select>

                <button
                  type="submit"
                  disabled={sendingAnnounce || !announcementText.trim()}
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold inline-flex items-center gap-1 shadow-xs transition-colors disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  <span>{sendingAnnounce ? 'Đang gửi...' : 'Gửi ngay'}</span>
                </button>
              </div>

              {announceSuccess && (
                <div className="text-[11px] text-emerald-600 font-medium">
                  ✓ Đã phát thanh thông báo thành công!
                </div>
              )}
            </form>
          </div>

          {/* Activity Log (Realtime Timeline) */}
          <div className="bg-white rounded-md border border-slate-200 shadow-xs p-4 space-y-3">
            <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center justify-between">
              <span>Hoạt động gần đây</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h2>

            {activityLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Chưa có hoạt động mới.
              </div>
            ) : (
              <div className="space-y-3 text-xs max-h-80 overflow-y-auto pr-1">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2.5 text-[11px]">
                    <span className="font-mono text-slate-400 shrink-0 mt-0.5">
                      {log.time}
                    </span>
                    <div className="flex-1 text-slate-700 leading-snug">
                      {log.text}
                    </div>
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
