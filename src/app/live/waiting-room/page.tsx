'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Radio,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Clock,
  CheckCircle2,
  AlertCircle,
  Check,
  Copy,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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
  const roomId = searchParams.get('roomId') || '';
  const assessmentId = searchParams.get('assessmentId') || '';

  const [room, setRoom] = useState<RoomData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingNotice, setStartingNotice] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  // Current User & Ready Toggle
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('Thí sinh');
  const [currentUserInitials, setCurrentUserInitials] = useState<string>('TS');
  const [isReady, setIsReady] = useState(false);
  const [togglingReady, setTogglingReady] = useState(false);

  // Countdown timer state (seconds until start)
  const [countdownSeconds, setCountdownSeconds] = useState<number>(300);

  // Fetch Current User
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

  // Poll room status
  const fetchStatus = useCallback(async () => {
    if (!pin && !roomId) return;
    try {
      const res = await fetch(`/api/rooms/status?roomId=${roomId}&pin=${pin}`);
      if (!res.ok) {
        if (!room) {
          const errData = await res.json().catch(() => ({}));
          setError(errData.error || 'Không tìm thấy thông tin phòng thi hoặc phòng thi đã kết thúc.');
        }
        return;
      }

      const data = await res.json();
      if (data.success && data.room) {
        setRoom(data.room);

        const list: Participant[] = data.participants || [];
        setParticipants(list);

        // Check if current user is ready
        if (currentUserId) {
          const myRecord = list.find((p) => p.userId === currentUserId);
          if (myRecord) {
            setIsReady(myRecord.isReady || false);
          }
        }

        // Calculate countdown to start if scheduled
        if (data.room.scheduledStart) {
          const diff = Math.max(
            0,
            Math.floor((new Date(data.room.scheduledStart).getTime() - Date.now()) / 1000)
          );
          setCountdownSeconds(diff);
        }

        // Trigger auto-redirect when Evaluator starts exam
        if (data.room.hasStarted || data.room.status === 'IN_PROGRESS') {
          setStartingNotice(true);
          const targetAsmId = data.room.assessmentId || assessmentId || 'baseline';
          setTimeout(() => {
            router.push(
              `/personal/take/${targetAsmId}?roomId=${data.room.id}&pin=${data.room.roomCode || pin}`
            );
          }, 400);
        }
      }
    } catch {
      // Keep offline resilient
    } finally {
      setLoading(false);
    }
  }, [pin, roomId, currentUserId, assessmentId, router, room]);

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 3000);
    return () => clearInterval(timer);
  }, [fetchStatus]);

  // Unified Realtime Supabase Channel
  useEffect(() => {
    const activeRoomId = room?.id || roomId;
    if (!activeRoomId) return;

    const supabase = createClient();
    const channel = supabase.channel(`room:${activeRoomId}`);

    channel
      .on('broadcast', { event: 'ROOM_STATE_CHANGE' }, (payload) => {
        const action = payload.payload?.action;
        if (action === 'START') {
          setStartingNotice(true);
          const targetAsmId = room?.assessmentId || assessmentId || 'baseline';
          const roomCode = room?.roomCode || pin;
          setTimeout(() => {
            router.push(
              `/personal/take/${targetAsmId}?roomId=${activeRoomId}&pin=${roomCode}`
            );
          }, 300);
        } else {
          fetchStatus();
        }
      })
      .on('broadcast', { event: 'PARTICIPANT_STATUS_CHANGE' }, () => {
        fetchStatus();
      })
      .on('broadcast', { event: 'PARTICIPANT_JOIN' }, () => {
        fetchStatus();
      })
      .on('broadcast', { event: 'PARTICIPANT_READY' }, () => {
        fetchStatus();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room?.id, roomId, room?.assessmentId, room?.roomCode, assessmentId, pin, router, fetchStatus]);

  // Handle Ready Toggle
  const handleToggleReady = async () => {
    if (!room?.id) return;
    setTogglingReady(true);
    const nextState = !isReady;
    setIsReady(nextState);

    try {
      const res = await fetch('/api/rooms/ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.id,
          isReady: nextState,
        }),
      });

      if (!res.ok) {
        setIsReady(!nextState);
      } else {
        try {
          const supabase = createClient();
          await supabase.channel(`room:${room.id}`).send({
            type: 'broadcast',
            event: 'PARTICIPANT_READY',
            payload: {
              userId: currentUserId,
              fullName: currentUserName,
              isReady: nextState,
            },
          });
        } catch {}
      }
    } catch {
      setIsReady(!nextState);
    } finally {
      setTogglingReady(false);
    }
  };

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
    return `${String(h).padStart(2, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
  };

  if (loading && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black p-6">
        <div className="max-w-md w-full p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-center space-y-3 shadow-xs">
          <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin mx-auto" />
          <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Đang kết nối phòng chờ thi trực tiếp...
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
            Vui lòng kiểm tra lại mã PIN do Giám thị cung cấp hoặc xác nhận bạn đã tham gia đúng lớp học của ca thi.
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
  const readyParticipants = participants.filter((p) => p.isReady);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 p-4 sm:p-6 lg:p-8 transition-colors">
      {/* 1. Header Ca Thi Chuẩn Tinh Gọn */}
      <header className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              PHÒNG CHỜ KHẢO THÍ TRỰC TIẾP
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {room?.title || 'Phòng Khảo Thí Trực Tiếp'}
          </h1>
          <div className="text-xs flex items-center gap-2 flex-wrap text-slate-500 dark:text-neutral-400">
            <span>{room?.assessmentTitle}</span>
            <span>&bull;</span>
            <span>Thời lượng: {room?.durationMinutes || 45} phút</span>
            <span>&bull;</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {participants.length} thí sinh trực tuyến
            </span>
          </div>
        </div>

        {/* PIN Badge & Exit Action */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyPin}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-center hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer group"
            title="Nhấn để sao chép mã PIN"
          >
            <span className="text-[10px] uppercase font-bold tracking-wider block text-slate-400 dark:text-neutral-500">
              MÃ PIN
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100 tracking-wider">
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
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-700 dark:text-neutral-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Rời phòng</span>
          </Link>
        </div>
      </header>

      {/* Starting Exam Trigger Banner */}
      {startingNotice && (
        <div className="my-3 p-4 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 animate-pulse shadow-xs">
          <CheckCircle2 className="w-4 h-4" />
          <span>Giám thị đã phát đề! Đang chuyển hướng bạn vào màn hình làm bài ngay...</span>
        </div>
      )}

      {/* 2. Main Body: 2 Cột Đối Xứng */}
      <main className="my-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cột Trái: Đồng hồ đếm ngược, Thí sinh cá nhân & Danh sách phòng (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Card Đồng Hồ Đếm Ngược */}
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-center space-y-3 shadow-xs">
            <span className="text-xs uppercase tracking-widest font-semibold block text-slate-500 dark:text-neutral-400 font-mono">
              Thời gian còn lại đến khi bắt đầu ca thi
            </span>

            <div className="text-5xl sm:text-6xl font-mono font-bold tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
              {formatCountdown(countdownSeconds)}
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-zinc-850 text-slate-700 dark:text-neutral-300">
              <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{participants.length} người đã vào phòng ({readyParticipants.length} đã sẵn sàng)</span>
            </div>
          </div>

          {/* Card Trạng Thái Cá Nhân & Nút Sẵn Sàng */}
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
                  <div className="text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isReady ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                    <span>{isReady ? 'Trạng thái: Đã sẵn sàng nhận đề' : 'Trạng thái: Chưa sẵn sàng'}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleReady}
                disabled={togglingReady}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-xs inline-flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                  isReady
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{isReady ? 'Đã xác nhận sẵn sàng' : 'Tôi đã sẵn sàng'}</span>
              </button>
            </div>

            {/* Danh sách các thí sinh khác */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 font-semibold">
                <span>Thí sinh cùng phòng thi ({participants.length})</span>
                <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400">
                  {readyParticipants.length}/{participants.length} sẵn sàng
                </span>
              </div>

              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                {participants.map((p) => {
                  const isMe = p.userId === currentUserId;
                  return (
                    <div
                      key={p.id}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        p.isReady
                          ? 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-neutral-300'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.isReady ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <span className="truncate max-w-[130px]">
                        {p.fullName} {isMe ? '(Bạn)' : ''}
                      </span>
                    </div>
                  );
                })}
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
              <span>Bài thi tự động thu và chấm điểm khi hết giờ hoặc khi giám thị kết thúc ca thi.</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 space-y-2 text-[11px] text-slate-500 dark:text-neutral-400 font-medium">
            <div className="flex justify-between">
              <span>Thời lượng làm bài:</span>
              <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">{room?.durationMinutes || 45} phút</span>
            </div>
            <div className="flex justify-between">
              <span>Ngưỡng đạt tiêu chuẩn:</span>
              <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">70% (Chuẩn 5 miền)</span>
            </div>
            <div className="flex justify-between">
              <span>Chế độ giám sát:</span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">Ghi nhận rời tab &amp; thời gian thực</span>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Footer Chuẩn Tinh Gọn */}
      <footer className="text-center text-[11px] text-slate-400 dark:text-neutral-500 font-mono py-2">
        Hệ thống Khảo thí Thời gian thực NEXA &bull; Khảo thí chuẩn hóa 5 miền năng lực số
      </footer>
    </div>
  );
}

export default function WaitingRoomPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải phòng chờ...</div>}>
      <WaitingRoomContent />
    </Suspense>
  );
}
