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
} from 'lucide-react';

interface Participant {
  id: string;
  userId: string;
  fullName: string;
  initials: string;
  avatarUrl?: string | null;
  status: string;
}

interface RoomData {
  id: string;
  roomCode: string;
  title: string;
  assessmentId: string;
  assessmentTitle: string;
  durationMinutes: number;
  hasStarted: boolean;
  startedAt?: string | null;
}

// Coordinate anchors for floating bubbles distributed radially around center
const RADIAL_ANCHORS = [
  { x: -160, y: -90, anim: 'animate-float-drift-1', delay: '0s' },
  { x: 150, y: -100, anim: 'animate-float-drift-2', delay: '0.4s' },
  { x: -180, y: 90, anim: 'animate-float-drift-3', delay: '0.8s' },
  { x: 170, y: 80, anim: 'animate-float-drift-1', delay: '1.2s' },
  { x: -70, y: -180, anim: 'animate-float-drift-2', delay: '0.2s' },
  { x: 80, y: -170, anim: 'animate-float-drift-3', delay: '0.6s' },
  { x: -80, y: 180, anim: 'animate-float-drift-1', delay: '1.0s' },
  { x: 70, y: 170, anim: 'animate-float-drift-2', delay: '1.4s' },
  { x: -260, y: -20, anim: 'animate-float-drift-3', delay: '0.3s' },
  { x: 260, y: -10, anim: 'animate-float-drift-1', delay: '0.7s' },
  { x: -240, y: -140, anim: 'animate-float-drift-2', delay: '1.1s' },
  { x: 230, y: -150, anim: 'animate-float-drift-3', delay: '0.5s' },
  { x: -230, y: 140, anim: 'animate-float-drift-1', delay: '0.9s' },
  { x: 240, y: 150, anim: 'animate-float-drift-2', delay: '1.3s' },
  { x: -140, y: -240, anim: 'animate-float-drift-3', delay: '0.1s' },
  { x: 130, y: -240, anim: 'animate-float-drift-1', delay: '0.7s' },
  { x: -130, y: 240, anim: 'animate-float-drift-2', delay: '1.1s' },
  { x: 140, y: 240, anim: 'animate-float-drift-3', delay: '1.5s' },
  { x: 0, y: -270, anim: 'animate-float-drift-1', delay: '0.4s' },
  { x: 0, y: 270, anim: 'animate-float-drift-2', delay: '1.2s' },
  { x: -320, y: -80, anim: 'animate-float-drift-3', delay: '0.8s' },
  { x: 320, y: -90, anim: 'animate-float-drift-1', delay: '0.2s' },
  { x: -310, y: 80, anim: 'animate-float-drift-2', delay: '1.0s' },
  { x: 310, y: 90, anim: 'animate-float-drift-3', delay: '0.6s' },
  { x: -210, y: -210, anim: 'animate-float-drift-1', delay: '1.4s' },
  { x: 210, y: -210, anim: 'animate-float-drift-2', delay: '0.3s' },
  { x: -210, y: 210, anim: 'animate-float-drift-3', delay: '0.9s' },
  { x: 210, y: 210, anim: 'animate-float-drift-1', delay: '0.5s' },
  { x: -360, y: 0, anim: 'animate-float-drift-2', delay: '1.2s' },
  { x: 360, y: 0, anim: 'animate-float-drift-3', delay: '0.4s' },
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

  // Poll room status every 2 seconds - strictly real data
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
        // Pure real participants from database - absolutely no mock data
        setParticipants(data.participants || []);

        // Trigger auto-redirect when Evaluator starts exam
        if (data.room.hasStarted) {
          setStartingNotice(true);
          const targetAsmId = data.room.assessmentId || assessmentId || 'asm-01';
          setTimeout(() => {
            router.push(`/personal/take/${targetAsmId}?roomId=${data.room.id}&pin=${data.room.roomCode}`);
          }, 800);
        }
      }
    } catch {
      // keep retrying silently on connection jitter
    } finally {
      setLoading(false);
    }
  }, [roomId, pin, assessmentId, router, room]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full p-8 rounded-md bg-white border border-slate-200 text-center space-y-4 shadow-xs">
          <RefreshCw className="w-6 h-6 text-sky-600 animate-spin mx-auto" strokeWidth={1.75} />
          <div className="text-sm font-semibold text-slate-800">Đang kết nối phòng chờ thi trực tiếp...</div>
          <div className="text-xs text-slate-500 font-mono">Mã PIN: {pin}</div>
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
          <p className="text-xs text-slate-500">
            Vui lòng kiểm tra lại mã PIN do chuyên gia khảo thí cung cấp hoặc liên hệ người tổ chức.
          </p>
          <div className="pt-2">
            <Link
              href="/personal/live-pin"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors"
            >
              Nhập mã PIN khác
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-8 bg-slate-50/70 select-none">
      {/* Top Header Bar */}
      <header className="p-4 sm:p-5 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
              PHÒNG CHỜ TRỰC TUYẾN TOÀN MÀN HÌNH • SẴN SÀNG
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {room?.title || 'Phòng Khảo Thí Năng Lực Số'}
          </h1>
          <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
            <span>{room?.assessmentTitle || 'Đề Khảo Thí Chuẩn Hóa'}</span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
              {room?.durationMinutes || 45} phút
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 font-mono text-slate-700">
              <Users className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
              {participants.length} thí sinh trong phòng
            </span>
          </div>
        </div>

        {/* PIN Badge & Exit Action */}
        <div className="flex items-center gap-3">
          <div className="px-5 py-2 rounded-md bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-medium">
              MÃ PIN
            </span>
            <span className="text-2xl font-extrabold text-sky-600 font-mono tabular-nums tracking-widest">
              {room?.roomCode ? `${room.roomCode.slice(0, 3)} ${room.roomCode.slice(3)}` : pin}
            </span>
          </div>

          <Link
            href="/personal/live-pin"
            className="px-4 py-2.5 rounded-md border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-700 hover:text-rose-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
            title="Thoát khỏi phòng thi"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.75} />
            <span>Rời phòng</span>
          </Link>
        </div>
      </header>

      {/* Starting Notification Banner */}
      {startingNotice && (
        <div className="my-4 p-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 motion-reduce:animate-none">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.75} />
          <span>Chuyên gia đã phát lệnh bắt đầu! Đang chuyển hướng bạn vào màn hình làm bài...</span>
        </div>
      )}

      {/* Full Canvas Waiting Arena */}
      <main className="my-4 flex-1 min-h-[520px] relative rounded-md bg-white border border-slate-200 overflow-hidden flex items-center justify-center shadow-xs">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Top Status Capsule */}
        <div className="absolute top-4 z-20 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-xs border border-slate-200 shadow-xs flex items-center gap-2 text-xs font-medium text-slate-600">
          <Radio className="w-3.5 h-3.5 text-sky-600 animate-pulse" strokeWidth={1.75} />
          <span>Đang đợi chuyên gia khảo thí bấm &ldquo;BẮT ĐẦU BÀI THI CHO CẢ LỚP&rdquo;...</span>
          <span className="text-slate-300">|</span>
          <span className="font-mono tabular-nums font-bold text-slate-900">
            {participants.length} thí sinh
          </span>
        </div>

        {/* Central Anchor: The Current Learner (YOU) */}
        <div className="relative z-20 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-sky-50 border-3 border-sky-600 flex items-center justify-center text-sky-700 font-extrabold text-2xl shadow-xs ring-8 ring-sky-100/70 transition-all">
            BẠN
          </div>
          <div className="mt-3 text-center">
            <span className="px-3 py-1 rounded-full bg-sky-600 text-white text-[11px] font-bold uppercase tracking-wider shadow-xs">
              Vị trí của bạn
            </span>
            <div className="text-xs text-slate-500 mt-1 font-medium">Đã kết nối &bull; Sẵn sàng thi</div>
          </div>
        </div>

        {/* Surrounding Floating Bubbles - 100% Real participants from database */}
        {participants.length === 0 ? (
          <div className="absolute bottom-16 z-10 px-4 py-2 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-500 font-medium">
            Chưa có thí sinh khác tham gia. Vị trí của bạn đã được ghi nhận vào phòng.
          </div>
        ) : (
          participants.slice(0, 30).map((p, idx) => {
            const anchor = RADIAL_ANCHORS[idx % RADIAL_ANCHORS.length];
            return (
              <div
                key={p.id || idx}
                className={`absolute z-10 flex flex-col items-center pointer-events-none ${anchor.anim}`}
                style={{
                  transform: `translate(${anchor.x}px, ${anchor.y}px)`,
                  animationDelay: anchor.delay,
                }}
              >
                <div className="w-12 h-12 rounded-full bg-white border border-slate-300 shadow-xs flex items-center justify-center text-xs font-bold text-slate-800 transition-transform">
                  {p.initials}
                </div>
                <div className="text-[11px] text-slate-600 font-medium truncate max-w-[90px] text-center mt-1 bg-white/80 px-1.5 py-0.5 rounded border border-slate-100">
                  {p.fullName.split(' ').slice(-1)[0]}
                </div>
              </div>
            );
          })
        )}

        {/* Bottom Helper Capsule */}
        <div className="absolute bottom-4 z-20 px-4 py-2 rounded-md bg-white/95 backdrop-blur-xs border border-slate-200 shadow-xs flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.75} />
          <span>Hệ thống tự động đồng bộ thời gian thực. Không cần tải lại trang.</span>
        </div>
      </main>

      {/* Bottom Footer Note */}
      <footer className="text-center text-[11px] text-slate-400">
        NEXA Live Assessment System &bull; Khảo thí năng lực số chuẩn hóa DigComp
      </footer>
    </div>
  );
}

export default function WaitingRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="p-8 rounded-md bg-white border border-slate-200 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-sky-600 animate-spin mx-auto" strokeWidth={1.75} />
            <div className="text-xs text-slate-500">Đang tải phòng chờ...</div>
          </div>
        </div>
      }
    >
      <WaitingRoomContent />
    </Suspense>
  );
}
