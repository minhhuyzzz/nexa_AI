'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Radio,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Clock,
  CheckCircle2,
  AlertCircle,
  Check,
  Copy,
  Volume2,
  VolumeX,
  Wifi,
  Monitor,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { examSound } from '@/lib/sound/exam-sound';

interface Participant {
  id: string;
  userId: string;
  fullName: string;
  initials: string;
  avatarUrl?: string | null;
  status: string;
  isReady: boolean;
}

interface RoomData {
  id: string;
  roomCode: string;
  title: string;
  assessmentId: string;
  assessmentTitle: string;
  durationMinutes: number;
  passingScore: number;
  hasStarted: boolean;
  startedAt?: string | null;
  scheduledStart?: string | null;
  assessmentItemCount?: number;
}

function WaitingRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pin = searchParams.get('pin') || '';
  const roomIdFromUrl = searchParams.get('roomId') || '';
  const assessmentIdFromUrl = searchParams.get('assessmentId') || '';

  const [room, setRoom] = useState<RoomData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingNotice, setStartingNotice] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  // Sound settings (persisted in localStorage)
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Current User
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('Thí sinh');
  const [currentUserInitials, setCurrentUserInitials] = useState<string>('TS');

  // Countdown timer state (seconds until start if scheduled in future)
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  const channelRef = useRef<any>(null);

  // Load sound preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nexa_exam_sound');
      if (saved !== null) setSoundEnabled(saved === 'true');
    } catch {}
  }, []);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('nexa_exam_sound', String(next));
      } catch {}
      return next;
    });
  };

  // 1. Fetch Current User Profile
  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (profile?.full_name) {
          setCurrentUserName(profile.full_name);
          const initials = profile.full_name
            .split(' ')
            .filter(Boolean)
            .slice(-2)
            .map((w: string) => w[0].toUpperCase())
            .join('');
          setCurrentUserInitials(initials || 'TS');
        }
      }
    }
    loadUser();
  }, []);

  // 2. Auto Join Room (Calls POST /api/rooms/join to officially register candidate in room_participants)
  useEffect(() => {
    let isCancelled = false;

    async function joinRoom() {
      if (!pin && !roomIdFromUrl) {
        setError('Thiếu mã PIN hoặc mã định danh phòng thi');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // If we have PIN, call official join API
        if (pin) {
          const res = await fetch('/api/rooms/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            if (!isCancelled) {
              setError(errData.error || 'Không thể tham gia phòng thi.');
              setLoading(false);
            }
            return;
          }

          const data = await res.json();
          if (!isCancelled && data.success) {
            const roomData: RoomData = {
              id: data.roomId,
              roomCode: data.roomCode || pin,
              title: data.roomTitle || 'Phòng Khảo Thí Trực Tiếp',
              assessmentId: data.assessmentId,
              assessmentTitle: data.assessmentTitle || 'Bài thi khảo thí',
              durationMinutes: data.durationMinutes || 45,
              passingScore: 70,
              hasStarted: data.hasStarted || false,
              startedAt: data.startedAt,
            };
            setRoom(roomData);

            // If exam has already started when candidate joins, redirect immediately
            if (data.hasStarted) {
              setStartingNotice(true);
              router.push(
                `/personal/take/${data.assessmentId}?roomId=${data.roomId}&pin=${data.roomCode || pin}`
              );
              return;
            }
          }
        } else if (roomIdFromUrl) {
          // Fallback if entering with roomId
          const res = await fetch(`/api/rooms/status?roomId=${roomIdFromUrl}`);
          const data = await res.json();
          if (!isCancelled && data.success && data.room) {
            setRoom(data.room);
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err?.message || 'Lỗi kết nối máy chủ');
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    joinRoom();

    return () => {
      isCancelled = true;
    };
  }, [pin, roomIdFromUrl, router]);

  // 3. Status Polling (Fallback for participant roster & room status changes)
  const fetchStatus = useCallback(async () => {
    const activeRoomId = room?.id || roomIdFromUrl;
    const activePin = room?.roomCode || pin;
    if (!activeRoomId && !activePin) return;

    try {
      const res = await fetch(`/api/rooms/status?roomId=${activeRoomId}&pin=${activePin}`);
      if (!res.ok) return;

      const data = await res.json();
      if (data.success && data.room) {
        setRoom((prev) => ({
          ...prev,
          ...data.room,
        }));

        const list: Participant[] = data.participants || [];
        setParticipants(list);

        // Check future scheduled start
        if (data.room.scheduledStart) {
          const diff = Math.max(
            0,
            Math.floor((new Date(data.room.scheduledStart).getTime() - Date.now()) / 1000)
          );
          setCountdownSeconds(diff > 0 ? diff : null);
        } else {
          setCountdownSeconds(null);
        }

        // Auto-redirect if host starts exam
        if (data.room.hasStarted || data.room.status === 'IN_PROGRESS') {
          setStartingNotice(true);
          const targetAsmId = data.room.assessmentId || assessmentIdFromUrl || 'baseline';
          setTimeout(() => {
            router.push(
              `/personal/take/${targetAsmId}?roomId=${data.room.id}&pin=${data.room.roomCode || pin}`
            );
          }, 300);
        }
      }
    } catch {}
  }, [room?.id, room?.roomCode, roomIdFromUrl, pin, assessmentIdFromUrl, router]);

  // Run status polling every 3 seconds as a resilient backup
  useEffect(() => {
    if (!room?.id) return;
    fetchStatus();
    const timer = setInterval(fetchStatus, 3000);
    return () => clearInterval(timer);
  }, [room?.id, fetchStatus]);

  // 4. Realtime Supabase Channel (Instant <100ms reactions)
  useEffect(() => {
    const activeRoomId = room?.id || roomIdFromUrl;
    if (!activeRoomId) return;

    const supabase = createClient();
    const channel = supabase.channel(`room:${activeRoomId}`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'ROOM_STATE_CHANGE' }, (payload) => {
        const action = payload.payload?.action;
        if (action === 'START') {
          examSound.play('START', soundEnabled);
          setStartingNotice(true);
          const targetAsmId = room?.assessmentId || assessmentIdFromUrl || 'baseline';
          const roomCode = room?.roomCode || pin;
          setTimeout(() => {
            router.push(
              `/personal/take/${targetAsmId}?roomId=${activeRoomId}&pin=${roomCode}`
            );
          }, 250);
        } else {
          fetchStatus();
        }
      })
      .on('broadcast', { event: 'PARTICIPANT_JOIN' }, (payload) => {
        const newP = payload.payload;
        if (newP && newP.userId !== currentUserId) {
          examSound.play('JOIN', soundEnabled);
          fetchStatus();
        }
      })
      .on('broadcast', { event: 'PARTICIPANT_STATUS_CHANGE' }, () => {
        fetchStatus();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && currentUserId) {
          // Broadcast presence immediately to host
          channel.send({
            type: 'broadcast',
            event: 'PARTICIPANT_JOIN',
            payload: {
              userId: currentUserId,
              fullName: currentUserName,
              initials: currentUserInitials,
            },
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [
    room?.id,
    roomIdFromUrl,
    room?.assessmentId,
    room?.roomCode,
    assessmentIdFromUrl,
    pin,
    currentUserId,
    currentUserName,
    currentUserInitials,
    soundEnabled,
    router,
    fetchStatus,
  ]);

  const handleCopyPin = () => {
    const rawPin = room?.roomCode || pin;
    if (!rawPin) return;
    navigator.clipboard.writeText(rawPin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const formatCountdown = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (loading && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black p-6">
        <div className="max-w-md w-full p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-center space-y-3 shadow-xs">
          <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin mx-auto" />
          <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Đang xác thực mã PIN và kết nối phòng chờ...
          </div>
          <div className="text-xs text-slate-400 font-mono">Mã PIN: {pin}</div>
        </div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black p-6">
        <div className="max-w-md w-full p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-center space-y-4 shadow-xs">
          <AlertCircle className="w-9 h-9 text-rose-500 mx-auto" />
          <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">{error}</div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
            Vui lòng kiểm tra lại mã PIN do Giám thị cung cấp hoặc xác nhận ca thi còn đang mở.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Link
              href="/personal/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Về bảng điều khiển
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const rawPin = room?.roomCode || pin;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 p-4 sm:p-6 lg:p-8 transition-colors">
      {/* 1. Header Ca Thi Chuẩn Tinh Gọn */}
      <header className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-mono">
              PHÒNG CHỜ KHẢO THÍ TRỰC TIẾP
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {room?.title || 'Phòng Khảo Thí Trực Tiếp'}
          </h1>
          <div className="text-xs flex items-center gap-2 flex-wrap text-slate-500 dark:text-neutral-400">
            <span className="font-medium text-neutral-800 dark:text-neutral-200">{room?.assessmentTitle}</span>
            <span>&bull;</span>
            <span>Thời lượng: {room?.durationMinutes || 45} phút</span>
            <span>&bull;</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {participants.length} thí sinh đang trực tuyến
            </span>
          </div>
        </div>

        {/* PIN Badge, Sound Toggle & Exit Action */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className={`p-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              soundEnabled
                ? 'border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                : 'border-slate-200 dark:border-zinc-800 text-slate-400 hover:text-slate-600'
            }`}
            title={soundEnabled ? 'Tắt âm thanh thông báo' : 'Bật âm thanh thông báo'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* PIN Copy Button */}
          <button
            type="button"
            onClick={handleCopyPin}
            className="px-3 sm:px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-center hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer group"
            title="Nhấn để sao chép mã PIN"
          >
            <span className="text-[10px] uppercase font-bold tracking-wider block text-slate-400 dark:text-neutral-500 font-mono">
              MÃ PIN
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100 tracking-wider">
                {rawPin.length === 6 ? `${rawPin.slice(0, 3)} ${rawPin.slice(3)}` : rawPin}
              </span>
              {copiedPin ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
              )}
            </div>
          </button>

          <Link
            href="/personal/dashboard"
            className="px-3 sm:px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-700 dark:text-neutral-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rời phòng</span>
          </Link>
        </div>
      </header>

      {/* Starting Exam Trigger Banner */}
      {startingNotice && (
        <div className="my-3 p-4 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 animate-pulse shadow-md">
          <CheckCircle2 className="w-4 h-4" />
          <span>Giám thị đã phát đề! Đang chuyển hướng bạn vào màn hình làm bài...</span>
        </div>
      )}

      {/* 2. Main Body: 2 Cột Đối Xứng */}
      <main className="my-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cột Trái: Trạng thái chờ, Thí sinh cá nhân & Danh sách phòng (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Card Trạng Thái Sảnh Chờ (Academic Deep Lobby Card) */}
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-center space-y-4 shadow-xs">
            {countdownSeconds !== null ? (
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-widest font-semibold block text-slate-500 dark:text-neutral-400 font-mono">
                  Thời gian còn lại đến khi mở đề ca thi
                </span>
                <div className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {formatCountdown(countdownSeconds)}
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    Đang chờ Giám thị phát đề thi
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
                    Bạn đã kết nối thành công vào phòng thi. Màn hình làm bài sẽ tự động bắt đầu ngay khi Giám thị phát đề cho cả phòng.
                  </p>
                </div>
              </div>
            )}

            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full text-xs font-medium bg-slate-100 dark:bg-zinc-850 text-slate-700 dark:text-neutral-300">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-emerald-700 dark:text-emerald-300">Đã sẵn sàng nhận đề</span>
              </div>
              <span className="text-slate-300 dark:text-zinc-600">&bull;</span>
              <div className="flex items-center gap-1 text-slate-500 dark:text-neutral-400">
                <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{participants.length} thí sinh trong sảnh</span>
              </div>
            </div>
          </div>

          {/* Card Trạng Thái Cá Nhân (Device & Connection Check) */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm font-mono shadow-xs shrink-0">
                  {currentUserInitials}
                </div>
                <div className="space-y-0.5">
                  <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    {currentUserName}
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Đã tham gia phòng thi &amp; Sẵn sàng nhận đề</span>
                  </div>
                </div>
              </div>

              {/* Verified badges */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50">
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Mạng ổn định</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50">
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Thiết bị hợp lệ</span>
                </span>
              </div>
            </div>

            {/* Danh sách các bạn cùng phòng thi */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 font-semibold">
                <span>Thí sinh cùng phòng thi ({participants.length})</span>
                <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                  {participants.length} đã kết nối
                </span>
              </div>

              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                {participants.length === 0 ? (
                  <div className="text-xs text-slate-400 py-2">
                    Bạn là thí sinh đầu tiên có mặt trong sảnh chờ.
                  </div>
                ) : (
                  participants.map((p) => {
                    const isMe = p.userId === currentUserId;
                    return (
                      <div
                        key={p.id}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                          isMe
                            ? 'border-blue-600/40 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold'
                            : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-neutral-300'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate max-w-[140px]">
                          {p.fullName} {isMe ? '(Bạn)' : ''}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cột Phải: Quy chế & Hướng Dẫn Phòng Thi (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] space-y-4 shadow-xs text-xs">
          <div className="flex items-center gap-2 font-bold text-sm text-neutral-900 dark:text-neutral-100">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Quy Chế &amp; Hướng Dẫn Làm Bài</span>
          </div>

          <div className="space-y-3 text-slate-600 dark:text-neutral-300 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
              <span>Không chuyển tab hoặc thoát toàn màn hình trong suốt thời gian làm bài.</span>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
              <span>Đáp án được hệ thống lưu tự động theo thời gian thực (Auto-save) sau mỗi lựa chọn.</span>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
              <span>Khi Giám thị bấm phát đề thi, màn hình làm bài sẽ tự động mở tức thì.</span>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
              <span>Bài thi tự động thu và chấm điểm khi hết giờ hoặc khi Giám thị kết thúc ca thi.</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 space-y-2 text-[11px] text-slate-500 dark:text-neutral-400 font-medium">
            <div className="flex justify-between">
              <span>Thời lượng làm bài:</span>
              <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">{room?.durationMinutes || 45} phút</span>
            </div>
            <div className="flex justify-between">
              <span>Ngưỡng đạt tiêu chuẩn:</span>
              <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{room?.passingScore || 70}%</span>
            </div>
            <div className="flex justify-between">
              <span>Chế độ giám sát:</span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">Ghi nhận rời tab &amp; toàn màn hình</span>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Footer Chuẩn Tinh Gọn */}
      <footer className="text-center text-[11px] text-slate-400 dark:text-neutral-500 font-mono py-2">
        Hệ thống Khảo thí Thời gian thực NEXA • Khảo thí chuẩn hóa 5 miền năng lực số
      </footer>
    </div>
  );
}

export default function WaitingRoomPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-slate-400">Đang tải phòng chờ...</div>}>
      <WaitingRoomContent />
    </Suspense>
  );
}
