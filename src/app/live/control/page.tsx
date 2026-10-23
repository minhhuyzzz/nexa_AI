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
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Play,
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
} from 'lucide-react';

interface Participant {
  id: string;
  userId: string;
  fullName: string;
  initials: string;
  avatarUrl?: string | null;
  status: string;
  joinedAt?: string;
}

interface RoomData {
  id: string;
  roomCode: string;
  title: string;
  assessmentId: string;
  assessmentTitle: string;
  durationMinutes: number;
  roomMode: string;
  isActive: boolean;
  hasStarted: boolean;
  startedAt?: string | null;
  elapsedSeconds?: number;
  remainingSeconds?: number;
}

function LiveControlContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId') || '';

  const [room, setRoom] = useState<RoomData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Host Control Toolbar states
  const [isLocked, setIsLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Poll room & participant state every 2 seconds
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
          setParticipants(data.participants || []);
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

  const prevCountRef = useRef(participants.length);
  useEffect(() => {
    if (soundEnabled && participants.length > prevCountRef.current && prevCountRef.current > 0) {
      playJoinChime();
    }
    prevCountRef.current = participants.length;
  }, [participants.length, soundEnabled, playJoinChime]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  useEffect(() => {
    fetchRoomState();
    const interval = setInterval(() => fetchRoomState(true), 2000);
    return () => clearInterval(interval);
  }, [fetchRoomState]);

  // Handle Start Room
  const handleStartRoom = async () => {
    if (!room) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/evaluator/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, action: 'START' }),
      });

      if (res.ok) {
        await fetchRoomState(true);
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Không thể bắt đầu phiên thi.');
      }
    } catch {
      setError('Lỗi khi phát lệnh bắt đầu phiên thi.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle End Room
  const handleEndRoom = async () => {
    if (!room) return;
    if (!confirm('Bạn có chắc chắn muốn kết thúc phiên khảo thí này cho toàn bộ thí sinh?')) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/evaluator/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, action: 'END' }),
      });

      if (res.ok) {
        await fetchRoomState(true);
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Không thể kết thúc phiên thi.');
      }
    } catch {
      setError('Lỗi khi kết thúc phiên thi.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!room) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/learner/live-pin?pin=${room.roomCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredParticipants = participants.filter((p) =>
    p.fullName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  if (loading && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="p-8 rounded-md bg-white border border-slate-200 text-center space-y-3 shadow-xs">
          <RefreshCw className="w-6 h-6 text-sky-600 animate-spin mx-auto" strokeWidth={1.75} />
          <div className="text-sm font-semibold text-slate-800">Đang nạp màn hình điều phối phòng thi...</div>
        </div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full p-8 rounded-md bg-white border border-slate-200 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <div className="text-base font-bold text-slate-900">{error}</div>
          <div className="pt-2">
            <Link
              href="/evaluator/live-room"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors"
            >
              Quay về Bảng điều khiển
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-8 bg-slate-50/70">
      {/* Top Bar: Room Title, Status & Navigation */}
      <header className="p-4 sm:p-5 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/evaluator/live-room"
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 font-medium mr-2"
              title="Quay về danh sách phòng"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
              Bảng điều khiển
            </Link>
            <span className="text-slate-300">|</span>
            {room?.hasStarted ? (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse" />
                PHIÊN THI ĐANG DIỄN RA (LIVE)
              </span>
            ) : (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                PHÒNG CHỜ THI TRỰC TIẾP (SẴN SÀNG)
              </span>
            )}
            <span className="text-xs text-slate-400">Chế độ: {room?.roomMode}</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {room?.title}
          </h1>
          <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
            <span>{room?.assessmentTitle}</span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
              {room?.durationMinutes} phút
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchRoomState()}
            className="p-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs shadow-xs transition-colors"
            title="Đồng bộ ngay"
          >
            <RefreshCw className="w-4 h-4" strokeWidth={1.75} />
          </button>

          <Link
            href="/evaluator/live-room"
            className="px-4 py-2.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Rời màn hình live</span>
          </Link>

          <Link
            href="/evaluator/grading"
            className="px-4 py-2.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            Bàn chấm bài
          </Link>
        </div>
      </header>

      {/* Host Control Toolbar */}
      <div className="p-3 my-3 rounded-md bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
            <Settings className="w-3.5 h-3.5" strokeWidth={1.75} />
          </div>
          <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
            Cài Đặt Phòng Thi (Host Control)
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* 1. Lock room toggle */}
          <button
            type="button"
            onClick={() => setIsLocked(!isLocked)}
            className={`px-3 py-1.5 rounded-md border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
              isLocked
                ? 'bg-rose-50 border-rose-300 text-rose-700'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
            title={isLocked ? 'Phòng đang khóa, không nhận thêm thí sinh' : 'Khóa phòng thi để không cho thêm thí sinh vào'}
          >
            {isLocked ? (
              <>
                <Lock className="w-3.5 h-3.5 text-rose-600" strokeWidth={1.75} />
                <span>Đã khóa cửa phòng</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                <span>Khóa cửa phòng</span>
              </>
            )}
          </button>

          {/* 2. Fullscreen mode */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
            title="Chiếu toàn màn hình lên máy chiếu lớp học"
          >
            {isFullscreen ? (
              <>
                <Minimize className="w-3.5 h-3.5 text-slate-600" strokeWidth={1.75} />
                <span>Thu nhỏ màn hình</span>
              </>
            ) : (
              <>
                <Maximize className="w-3.5 h-3.5 text-slate-600" strokeWidth={1.75} />
                <span>Toàn màn hình máy chiếu</span>
              </>
            )}
          </button>

          {/* 3. Audio chime toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playJoinChime();
            }}
            className={`px-3 py-1.5 rounded-md border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
              soundEnabled
                ? 'bg-sky-50 border-sky-200 text-sky-800'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            title="Âm báo khi có thí sinh mới vào phòng"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
                <span>Âm báo vào phòng: Bật</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                <span>Âm báo: Tắt</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Command Center Workspace */}
      <main className="my-2 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Giant Projector & Master Controls */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs space-y-6 text-center">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block">
                MÃ PIN 6 SỐ CHIẾU LÊN BẢNG / MÀN HÌNH
              </span>
              <div className="text-5xl sm:text-6xl font-extrabold tracking-widest text-sky-600 font-mono tabular-nums py-2 select-all">
                {room?.roomCode ? `${room.roomCode.slice(0, 3)} ${room.roomCode.slice(3)}` : '------'}
              </div>
              <p className="text-xs text-slate-500">
                Thí sinh dùng điện thoại hoặc máy tính truy cập{' '}
                <strong className="text-slate-800">/learner/live-pin</strong> và nhập 6 số trên.
              </p>
            </div>

            {/* Live QR Code Box */}
            <div className="inline-block p-4 rounded-md bg-slate-50 border border-slate-200 shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  typeof window !== 'undefined'
                    ? `${window.location.origin}/learner/live-pin?pin=${room?.roomCode || ''}`
                    : `https://nexa.edu.vn/learner/live-pin?pin=${room?.roomCode || ''}`
                )}`}
                alt="QR Code Phòng thi"
                width={200}
                height={200}
                className="rounded mx-auto"
              />
              <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <QrCode className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Quét mã camera tham gia trực tiếp</span>
              </div>
            </div>

            {/* Quick Copy Action Bar */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handleCopyCode}
                className="px-4 py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
                    <span className="text-emerald-700">Đã chép mã PIN</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                    <span>Sao chép mã PIN</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
                    <span className="text-emerald-700">Đã chép liên kết</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                    <span>Sao chép đường dẫn</span>
                  </>
                )}
              </button>
            </div>

            {/* Direct Link Preview & 1-Click Test Button */}
            <div className="p-3 rounded bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2 text-left">
              <div className="flex items-center gap-1.5 overflow-hidden truncate">
                <span className="font-semibold text-slate-700 shrink-0">Link trực tiếp:</span>
                <span className="font-mono text-sky-700 truncate select-all">
                  {typeof window !== 'undefined'
                    ? `${window.location.origin}/learner/live-pin?pin=${room?.roomCode || ''}`
                    : `/learner/live-pin?pin=${room?.roomCode || ''}`}
                </span>
              </div>
              <a
                href={
                  typeof window !== 'undefined'
                    ? `${window.location.origin}/learner/live-pin?pin=${room?.roomCode || ''}`
                    : `/learner/live-pin?pin=${room?.roomCode || ''}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-sky-700 text-[11px] font-semibold inline-flex items-center gap-1 shrink-0 transition-colors shadow-xs"
                title="Mở thử trang thí sinh nhập PIN trong tab mới"
              >
                <ExternalLink className="w-3 h-3" strokeWidth={1.75} />
                <span>Mở thử trong tab mới</span>
              </a>
            </div>
          </div>

          {/* Master Trigger: Start / End Exam */}
          <div className="p-5 rounded-md bg-white border border-slate-200 shadow-xs space-y-3">
            {!room?.hasStarted ? (
              <div className="space-y-2">
                <button
                  onClick={handleStartRoom}
                  disabled={actionLoading || participants.length === 0}
                  className="w-full py-4 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm sm:text-base inline-flex items-center justify-center gap-2.5 transition-colors shadow-xs disabled:opacity-50 tracking-wide disabled:cursor-not-allowed"
                >
                  <Play className="w-5 h-5 fill-current" strokeWidth={1.75} />
                  {actionLoading
                    ? 'ĐANG PHÁT LỆNH BẮT ĐẦU...'
                    : participants.length === 0
                    ? 'CHỜ THÍ SINH VÀO PHÒNG ĐỂ BẮT ĐẦU (0 THÍ SINH)'
                    : 'BẮT ĐẦU BÀI THI CHO CẢ LỚP'}
                </button>
                <p className="text-[11px] text-center text-slate-500">
                  {participants.length === 0
                    ? 'Phòng thi chưa có thí sinh nào tham gia. Yêu cầu ít nhất 1 thí sinh nhập mã PIN để bắt đầu.'
                    : 'Khi bấm bắt đầu, toàn bộ thí sinh trong phòng chờ sẽ tự động chuyển vào màn hình thi ngay lập tức.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded bg-sky-50 border border-sky-200">
                <div className="space-y-0.5 text-center sm:text-left">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-900">
                    <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
                    <span>Phiên thi đang được tiến hành giám sát trực tiếp</span>
                  </div>
                  <div className="text-xs text-sky-700 font-mono">
                    Đã trôi qua: {Math.floor((room.elapsedSeconds || 0) / 60)} phút{' '}
                    {(room.elapsedSeconds || 0) % 60} giây
                  </div>
                </div>

                <button
                  onClick={handleEndRoom}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-md bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 hover:text-rose-800 text-xs font-bold inline-flex items-center gap-2 transition-colors shadow-xs disabled:opacity-50 shrink-0"
                >
                  <Square className="w-4 h-4 fill-current" strokeWidth={1.75} />
                  {actionLoading ? 'Đang kết thúc...' : 'KẾT THÚC PHIÊN THI'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Columns: Real-Time Candidate Roster */}
        <div className="lg:col-span-5 p-5 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
                  <span>Danh Sách Thí Sinh Vào Phòng ({participants.length})</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cập nhật thời gian thực từ cơ sở dữ liệu
                </p>
              </div>

              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                {participants.length} Thí sinh
              </span>
            </div>

            {/* Filter Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" strokeWidth={1.75} />
              <input
                type="text"
                placeholder="Tìm thí sinh theo họ tên..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Participants Roster List */}
            <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-1">
              {participants.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <Radio className="w-8 h-8 text-slate-300 mx-auto animate-pulse" strokeWidth={1.75} />
                  <div className="text-xs font-semibold text-slate-700">Chưa có thí sinh nào vào phòng</div>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Mã PIN đã sẵn sàng. Khi thí sinh nhập mã, tên thí sinh sẽ hiển thị tức thì tại đây.
                  </p>
                </div>
              ) : filteredParticipants.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Không tìm thấy thí sinh nào khớp với từ khóa tìm kiếm.
                </div>
              ) : (
                filteredParticipants.map((p, idx) => (
                  <div key={p.id || idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 font-bold text-slate-700 flex items-center justify-center shrink-0 text-xs">
                        {p.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{p.fullName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {p.userId.slice(0, 8)}...</div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {room?.hasStarted ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse" />
                          Đang thi
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Chờ thi
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5 justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
            <span>Dữ liệu phòng thi được lưu trữ tự động trên cơ sở dữ liệu NEXA</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-slate-400">
        NEXA Live Command Center &bull; Giám sát và điều phối kỳ thi trực tuyến
      </footer>
    </div>
  );
}

export default function LiveControlPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="p-8 rounded-md bg-white border border-slate-200 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-sky-600 animate-spin mx-auto" strokeWidth={1.75} />
            <div className="text-xs text-slate-500">Đang khởi tạo phòng điều phối...</div>
          </div>
        </div>
      }
    >
      <LiveControlContent />
    </Suspense>
  );
}
