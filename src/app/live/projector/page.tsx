'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Radio,
  Play,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { RoomThemeId, ROOM_THEMES } from '@/types/live-room';

interface Participant {
  id: string;
  fullName: string;
  initials: string;
  studentCode: string;
}

interface RoomInfo {
  id: string;
  title: string;
  assessmentTitle: string;
  roomCode: string;
  durationMinutes: number;
  themeId: RoomThemeId;
  status: string;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
}

function ProjectorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = searchParams.get('roomId') || '';
  const pinFromQuery = searchParams.get('pin') || '';

  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Poll room & participant state
  const fetchData = useCallback(async () => {
    if (!roomId && !pinFromQuery) return;
    try {
      const url = roomId ? `/api/rooms/status?roomId=${roomId}` : `/api/rooms/status?pin=${pinFromQuery}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.room) {
          setRoom({
            id: data.room.id,
            title: data.room.title,
            assessmentTitle: data.room.assessmentTitle,
            roomCode: data.room.roomCode,
            durationMinutes: data.room.durationMinutes,
            themeId: data.room.themeId || 'minimal_white',
            status: data.room.status,
          });
        }
        if (Array.isArray(data.participants)) {
          setParticipants(
            data.participants.map((p: any, idx: number) => {
              const name = p.fullName || `Học viên ${idx + 1}`;
              const initials = name
                .split(' ')
                .filter(Boolean)
                .map((w: string) => w[0])
                .slice(-2)
                .join('')
                .toUpperCase() || 'HV';
              return {
                id: p.id || `p-${idx}`,
                fullName: name,
                initials,
                studentCode: p.studentCode || `HV-${String(idx + 1).padStart(3, '0')}`,
              };
            })
          );
        }
      }
    } catch (err) {
      console.error('Projector load error:', err);
    }
  }, [roomId, pinFromQuery]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Realtime Supabase broadcast channel
  useEffect(() => {
    const targetRoomId = roomId || room?.id;
    if (!targetRoomId) return;

    const supabase = createClient();
    const channel = supabase.channel(`room:${targetRoomId}`);

    channel
      .on('broadcast', { event: 'PARTICIPANT_JOIN' }, () => {
        fetchData();
      })
      .on('broadcast', { event: 'ROOM_STATE_CHANGE' }, (payload) => {
        if (payload.payload?.action === 'THEME_UPDATE' && payload.payload?.payload?.themeId) {
          setRoom((prev) => (prev ? { ...prev, themeId: payload.payload.payload.themeId } : prev));
        } else {
          fetchData();
        }
      })
      .on('broadcast', { event: 'START_EXAM' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, room?.id, fetchData]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleCopyPin = () => {
    const p = room?.roomCode || pinFromQuery;
    if (!p) return;
    navigator.clipboard.writeText(p);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartExam = async () => {
    const targetId = roomId || room?.id;
    if (!targetId) return;
    setStarting(true);
    try {
      const res = await fetch('/api/evaluator/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: targetId,
          action: 'START',
          payload: { durationMinutes: room?.durationMinutes || 45 },
        }),
      });
      if (res.ok) {
        router.push(`/live/control?roomId=${targetId}`);
      }
    } finally {
      setStarting(false);
    }
  };

  const displayPin = room?.roomCode || pinFromQuery || '------';
  const joinUrl = mounted && typeof window !== 'undefined'
    ? `${window.location.origin}/live?pin=${displayPin}`
    : `https://nexa.ai/live?pin=${displayPin}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(joinUrl)}&margin=10`;

  const currentTheme = room?.themeId || 'minimal_white';
  const themeBgClass = {
    minimal_white: 'bg-white text-neutral-900',
    space_blue: 'bg-[#0a0f1d] text-sky-100',
    aurora: 'bg-[#090b16] text-purple-100',
    dark_professional: 'bg-[#09090b] text-neutral-100',
  }[currentTheme] || 'bg-white text-neutral-900';

  return (
    <div
      className={`min-h-screen flex flex-col justify-between p-6 sm:p-10 transition-colors select-none ${themeBgClass}`}
    >
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between pb-6">
        <div className="flex items-center gap-4">
          <Link
            href={roomId ? `/live/control?roomId=${roomId}` : '/personal/live-room'}
            className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="Quay lại bàn điều khiển"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {room?.title || 'Phòng Khảo Thí Trực Tiếp'}
              </h1>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {room?.assessmentTitle || 'Đánh Giá Năng Lực Số Chuẩn 5 Miền'} &bull; {room?.durationMinutes || 45} phút
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="Bật/Tắt toàn màn hình máy chiếu"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {room?.status !== 'IN_PROGRESS' && (
            <button
              type="button"
              onClick={handleStartExam}
              disabled={starting}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm inline-flex items-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Bắt đầu phát đề thi</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Arena Stage for Classroom Projector: QR Code Chính Diện To Rõ */}
      <div className="my-auto py-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs sm:text-sm font-semibold">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Sảnh chờ máy chiếu &ndash; Sẵn sàng nhận thí sinh</span>
          </div>

          {/* QR Code Container Chính Diện */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <img
              src={qrUrl}
              alt={`Mã QR PIN ${displayPin}`}
              suppressHydrationWarning
              className="w-64 h-64 sm:w-80 sm:h-80 object-contain rounded-2xl mx-auto"
            />
            <div className="font-mono font-bold text-xs text-slate-800 uppercase tracking-widest">
              Quét mã bằng điện thoại để vào phòng thi
            </div>
          </div>

          {/* Thông tin Mã PIN & Đường link song song */}
          <div className="space-y-3">
            <div className="text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Hoặc mở trình duyệt truy cập <strong className="font-mono text-neutral-900 dark:text-white">nexa.ai/live</strong> và nhập mã PIN:
            </div>

            <div
              onClick={handleCopyPin}
              className="inline-block px-8 py-3.5 rounded-2xl bg-white dark:bg-black/60 border-2 border-blue-500/40 hover:border-blue-500 shadow-xl cursor-pointer transition-all"
              title="Bấm để sao chép PIN"
            >
              <div className="font-mono font-black text-5xl sm:text-6xl tracking-widest text-blue-600 dark:text-blue-400 tabular-nums">
                {displayPin.slice(0, 3)} {displayPin.slice(3)}
              </div>
            </div>

            <div className="text-[11px] text-neutral-400 font-mono">
              {copied ? '✓ Đã sao chép mã PIN' : 'Nhấp vào mã PIN để sao chép'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Candidate Stage (Bay vào theo thời gian thực) */}
      <div className="pt-6 space-y-4">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2 font-bold">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Thí sinh đã vào sảnh chờ ({participants.length})</span>
          </div>
          <span className="text-neutral-400 font-mono">Đang cập nhật thời gian thực</span>
        </div>

        {participants.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400 border border-dashed border-black/10 dark:border-white/10 rounded-2xl">
            Đang chờ thí sinh kết nối... Mã PIN và QR hiển thị trên máy chiếu để lớp quét mã.
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 max-h-40 overflow-y-auto no-scrollbar">
            {participants.map((p) => (
              <div
                key={p.id}
                className="px-3.5 py-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-black/10 dark:border-white/10 flex items-center gap-2 shadow-xs animate-in zoom-in-95 duration-200"
              >
                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                  {p.initials}
                </div>
                <div className="font-semibold text-xs truncate max-w-[140px]">
                  {p.fullName}
                </div>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-8 text-xs text-slate-500">
          Đang nạp màn hình máy chiếu...
        </div>
      }
    >
      <ProjectorContent />
    </Suspense>
  );
}
