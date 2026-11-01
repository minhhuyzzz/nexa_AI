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
  Sparkles,
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
}

interface RoomData {
  id: string;
  roomCode: string;
  title: string;
  assessmentId: string;
  assessmentTitle: string;
  durationMinutes: number;
  passingScore: number;
  themeId: RoomThemeId;
  hasStarted: boolean;
  startedAt?: string | null;
  scheduledStart?: string | null;
}

// Coordinate anchors for radial participant orbit around center
const RADIAL_ANCHORS = [
  { x: -180, y: -80 },
  { x: 170, y: -90 },
  { x: -210, y: 70 },
  { x: 200, y: 60 },
  { x: -80, y: -160 },
  { x: 90, y: -150 },
  { x: -90, y: 150 },
  { x: 80, y: 140 },
  { x: -290, y: -20 },
  { x: 280, y: -10 },
  { x: -260, y: -130 },
  { x: 250, y: -140 },
  { x: -250, y: 130 },
  { x: 260, y: 140 },
  { x: 0, y: -220 },
  { x: 0, y: 220 },
];

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

  // Poll room status every 2.5s
  const fetchStatus = useCallback(async () => {
    if (!pin && !roomId) return;
    try {
      const res = await fetch(`/api/rooms/status?roomId=${roomId}&pin=${pin}`);
      if (!res.ok) {
        if (!room) {
          setError('Không tìm thấy thông tin phòng thi hoặc phòng thi đã kết thúc.');
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
          const targetAsmId = data.room.assessmentId || assessmentId || 'asm-01';
          setTimeout(() => {
            router.push(
              `/personal/take/${targetAsmId}?roomId=${data.room.id}&pin=${data.room.roomCode}`
            );
          }, 800);
        }
      }
    } catch {
      // keep retrying silently on connection jitter
    } finally {
      setLoading(false);
    }
  }, [roomId, pin, assessmentId, router, room, currentUserId]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2500);
    return () => clearInterval(interval);
  }, [fetchStatus]);

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
        setIsReady(!nextState); // rollback on error
      }
    } catch {
      setIsReady(!nextState);
    } finally {
      setTogglingReady(false);
    }
  };

  const formatCountdown = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
  };

  if (loading && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full p-8 rounded-md bg-white border border-slate-200 text-center space-y-4 shadow-xs">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
          <div className="text-sm font-semibold text-neutral-900">
            Đang kết nối phòng chờ thi trực tiếp...
          </div>
          <div className="text-xs text-slate-500 font-mono">Mã PIN: {pin}</div>
        </div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full p-8 rounded-md bg-white border border-slate-200 text-center space-y-4 shadow-xs">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <div className="text-base font-bold text-neutral-900">{error}</div>
          <p className="text-xs text-slate-500">
            Vui lòng kiểm tra lại mã PIN do người tổ chức cung cấp.
          </p>
          <Link
            href="/personal/live-pin"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-blue-600 text-white text-xs font-semibold"
          >
            Nhập mã PIN khác
          </Link>
        </div>
      </div>
    );
  }

  const isSpaceTheme = room?.themeId === 'space_blue' || room?.themeId === 'aurora' || room?.themeId === 'dark_professional';

  return (
    <div
      className={`min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none transition-colors duration-500 ${
        isSpaceTheme
          ? 'bg-gradient-to-b from-slate-950 via-blue-950 to-black text-white'
          : 'bg-white text-neutral-900'
      }`}
    >
      {/* 1. Top Metadata Banner (Screen 11) */}
      <header
        className={`p-4 rounded-xl border backdrop-blur-md shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isSpaceTheme
            ? 'bg-white/10 border-white/15 text-white'
            : 'bg-slate-50 border-slate-200 text-neutral-900'
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                isSpaceTheme ? 'text-blue-300' : 'text-blue-700'
              }`}
            >
              PHÒNG CHỜ KHẢO THÍ TRỰC TIẾP
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">
            {room?.title || 'Phòng Khảo Thí Trực Tiếp'}
          </h1>
          <div
            className={`text-xs flex items-center gap-3 flex-wrap ${
              isSpaceTheme ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            <span>{room?.assessmentTitle}</span>
            <span>&bull;</span>
            <span>Thời lượng: {room?.durationMinutes || 45} phút</span>
            <span>&bull;</span>
            <span className="font-semibold text-emerald-500">
              {participants.length} người trong phòng
            </span>
          </div>
        </div>

        {/* PIN Badge & Exit Action */}
        <div className="flex items-center gap-3">
          <div
            className={`px-4 py-2 rounded-lg border text-center ${
              isSpaceTheme
                ? 'bg-white/10 border-white/20'
                : 'bg-white border-slate-200'
            }`}
          >
            <span
              className={`text-[10px] uppercase font-bold tracking-wider block ${
                isSpaceTheme ? 'text-blue-300' : 'text-slate-400'
              }`}
            >
              MÃ PIN
            </span>
            <span className="text-xl font-extrabold font-mono text-blue-500 tracking-widest">
              {room?.roomCode ? `${room.roomCode.slice(0, 3)} ${room.roomCode.slice(3)}` : pin}
            </span>
          </div>

          <Link
            href="/personal/live-pin"
            className={`px-3 py-2 rounded-md border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
              isSpaceTheme
                ? 'border-white/20 hover:bg-white/10 text-slate-200'
                : 'border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Rời phòng</span>
          </Link>
        </div>
      </header>

      {/* Starting Exam Trigger Banner */}
      {startingNotice && (
        <div className="my-3 p-4 rounded-lg bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>Giám thị đã phát đề! Đang chuyển hướng bạn vào màn hình làm bài ngay...</span>
        </div>
      )}

      {/* 2. Main Center Arena: Countdown & Radial Orbit Cluster (Screen 11) */}
      <main className="my-4 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left 8 Cols: Countdown Timer & Planetary Orbit Arena */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center relative min-h-[460px] p-6 rounded-2xl overflow-hidden">
          {/* Central Countdown Box */}
          <div className="text-center space-y-2 z-20 mb-6">
            <span
              className={`text-xs uppercase tracking-widest font-semibold block ${
                isSpaceTheme ? 'text-blue-200' : 'text-slate-500'
              }`}
            >
              Thời gian còn lại đến khi bắt đầu
            </span>

            <div
              className={`text-4xl sm:text-5xl font-mono font-extrabold tracking-widest ${
                isSpaceTheme ? 'text-white drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]' : 'text-neutral-900'
              }`}
            >
              {formatCountdown(countdownSeconds)}
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Users className="w-3.5 h-3.5" />
              <span>{participants.length} người đã vào phòng</span>
            </div>
          </div>

          {/* Central Radial Participant Arena */}
          <div className="relative w-full max-w-xl h-72 flex items-center justify-center">
            {/* Concentric Orbit Rings */}
            <div
              className={`absolute w-72 h-44 rounded-full border border-dashed pointer-events-none ${
                isSpaceTheme ? 'border-blue-500/30' : 'border-slate-300'
              }`}
            />
            <div
              className={`absolute w-96 h-60 rounded-full border border-dashed pointer-events-none ${
                isSpaceTheme ? 'border-blue-500/20' : 'border-slate-200'
              }`}
            />

            {/* Central Learner (YOU) */}
            <div className="relative z-30 flex flex-col items-center">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center font-extrabold text-lg border-2 shadow-lg transition-transform ${
                  isReady
                    ? 'bg-blue-600 border-white text-white ring-4 ring-emerald-500/50 scale-105'
                    : 'bg-blue-500 border-white text-white'
                }`}
              >
                {currentUserInitials}
              </div>
              <div
                className={`mt-2 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-xs flex items-center gap-1.5 ${
                  isReady ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isReady ? 'bg-white' : 'bg-amber-400'
                  }`}
                />
                <span>{currentUserName} ({isReady ? 'Đã sẵn sàng' : 'Chưa sẵn sàng'})</span>
              </div>
            </div>

            {/* Surrounding Other Participants (Real data from DB) */}
            {participants
              .filter((p) => p.userId !== currentUserId)
              .slice(0, 16)
              .map((p, idx) => {
                const anchor = RADIAL_ANCHORS[idx % RADIAL_ANCHORS.length];
                return (
                  <div
                    key={p.id}
                    className="absolute z-20 flex flex-col items-center pointer-events-none transition-all duration-500"
                    style={{
                      transform: `translate(${anchor.x}px, ${anchor.y}px)`,
                    }}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border shadow-xs ${
                        isSpaceTheme
                          ? 'bg-slate-900 border-blue-400/40 text-blue-200'
                          : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    >
                      {p.initials}
                    </div>
                    <div
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 border truncate max-w-[80px] ${
                        p.isReady
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : isSpaceTheme
                          ? 'bg-slate-900/80 text-slate-400 border-slate-700'
                          : 'bg-white/90 text-slate-600 border-slate-200'
                      }`}
                    >
                      {p.fullName.split(' ').slice(-1)[0]}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right 4 Cols: Pre-Exam Readiness Checklist Panel (Screen 11) */}
        <div
          className={`lg:col-span-4 p-6 rounded-2xl border shadow-sm space-y-4 text-xs ${
            isSpaceTheme
              ? 'bg-white/10 backdrop-blur-md border-white/15 text-white'
              : 'bg-slate-50 border-slate-200 text-neutral-900'
          }`}
        >
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Trước khi bắt đầu, hãy đảm bảo:</span>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className="leading-relaxed">Kết nối Internet ổn định suốt thời gian làm bài.</span>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className="leading-relaxed">
                Đã đọc và hiểu hướng dẫn, quy chế của kỳ thi trực tiếp.
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className="leading-relaxed">
                Thiết bị hoạt động tốt (chuột, bàn phím, màn hình hiển thị).
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className="leading-relaxed">
                Bạn đã sẵn sàng và ở trong không gian yên tĩnh, không bị phân tâm.
              </span>
            </div>
          </div>

          {/* Toggle Ready Button */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            <button
              onClick={handleToggleReady}
              disabled={togglingReady}
              className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-md transition-all ${
                isReady
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-4 ring-emerald-500/30'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isReady ? '✓ Tôi đã sẵn sàng (Đã xác nhận)' : 'Tôi đã sẵn sàng'}</span>
            </button>

            <p className="text-[11px] text-center opacity-70">
              Bấm nút trên để giám thị biết bạn đã sẵn sàng nhận đề thi.
            </p>
          </div>
        </div>
      </main>

      {/* 3. Bottom Footer Note */}
      <footer className="text-center text-[11px] opacity-60">
        NEXA Live Assessment System &bull; Khảo thí năng lực số thời gian thực chuẩn hóa DigComp
      </footer>
    </div>
  );
}

export default function WaitingRoomPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <WaitingRoomContent />
    </Suspense>
  );
}
