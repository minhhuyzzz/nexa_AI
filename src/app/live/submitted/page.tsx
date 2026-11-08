'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Radio,
  Users,
  LogOut,
  BarChart3,
  Lock,
  Unlock,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Shield,
  Check,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { RoomThemeId, ROOM_THEMES } from '@/types/live-room';

interface SubmittedPeer {
  id: string;
  fullName: string;
  initials: string;
  avatarUrl?: string | null;
  status: string;
  studentCode?: string;
}

interface RoomInfo {
  id: string;
  roomCode: string;
  title: string;
  assessmentTitle: string;
  themeId: RoomThemeId;
  resultsPublished: boolean;
  resultsPublishSettings?: {
    show_score: boolean;
    show_ranking: boolean;
    show_answers: boolean;
  };
}

function LiveSubmittedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId') || '';
  const pin = searchParams.get('pin') || '';

  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [peers, setPeers] = useState<SubmittedPeer[]>([]);
  const [loading, setLoading] = useState(true);

  // Current user submission stats
  const [submitTimeStr, setSubmitTimeStr] = useState<string>('');
  const [answeredCount, setAnsweredCount] = useState<number>(30);
  const [totalQuestions, setTotalQuestions] = useState<number>(32);
  const [myScore, setMyScore] = useState<number | null>(null);

  // Host published status
  const [isPublished, setIsPublished] = useState(false);

  // Profile
  const [userName, setUserName] = useState<string>('Thí sinh');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // 1. Fetch current profile
  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();
        if (profile?.full_name) setUserName(profile.full_name);
        if (profile?.avatar_url) setUserAvatar(profile.avatar_url);
      }
    }
    loadUser();
  }, []);

  // 2. Fetch room status & peers
  const fetchStatus = useCallback(async () => {
    if (!roomId && !pin) return;
    try {
      const res = await fetch(`/api/rooms/status?roomId=${roomId}&pin=${pin}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.room) {
          setRoom(data.room);
          setIsPublished(data.room.resultsPublished || false);

          const list: SubmittedPeer[] = (data.participants || [])
            .filter((p: any) => p.status === 'SUBMITTED' || p.submittedAt)
            .map((p: any, idx: number) => ({
              id: p.id,
              fullName: p.fullName,
              initials: p.initials,
              avatarUrl: p.avatarUrl,
              status: p.status,
              studentCode: `K48-${String(idx + 1).padStart(3, '0')}`,
            }));
          setPeers(list);
        }
      }
    } catch {
      // silent retry
    } finally {
      setLoading(false);
    }
  }, [roomId, pin]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Set submission time on mount
  useEffect(() => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}, ${now.toLocaleDateString('vi-VN')}`;
    setSubmitTimeStr(timeStr);
  }, []);

  // Realtime Supabase Channel
  useEffect(() => {
    if (!roomId) return;
    const supabase = createClient();

    const channel = supabase.channel(`room:${roomId}:candidate`);

    channel
      .on('broadcast', { event: 'RESULTS_PUBLISHED' }, () => {
        setIsPublished(true);
        fetchStatus();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, fetchStatus]);

  const isSpaceTheme =
    room?.themeId === 'space_blue' ||
    room?.themeId === 'aurora' ||
    room?.themeId === 'dark_professional';

  return (
    <div
      className={`min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none transition-colors duration-500 ${
        isSpaceTheme
          ? 'bg-gradient-to-b from-slate-950 via-blue-950 to-black text-white'
          : 'bg-white text-neutral-900'
      }`}
    >
      {/* 1. Top Header Banner (Screen 14) */}
      <header className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-lg tracking-wider text-blue-500 font-sans">
            NEXA.
          </span>
          <span className="text-slate-400 text-xs">&bull;</span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Phòng thi trực tiếp
          </span>
        </div>

        {/* User Chip */}
        <div className="flex items-center gap-2 text-xs">
          {userAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userAvatar} alt={userName} className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
              {userName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <span className="font-semibold">{userName}</span>
        </div>
      </header>

      {/* 2. Main Success Content Box (Screen 14) */}
      <main className="my-6 flex-1 max-w-3xl mx-auto w-full flex flex-col items-center text-center space-y-6">
        {/* Giant Glowing Green Checkmark */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-[0_0_50px_rgba(16,185,129,0.5)] ring-8 ring-emerald-500/20 animate-in zoom-in-75 duration-500">
            <Check className="w-12 h-12 stroke-[3]" />
          </div>
        </div>

        {/* Success Title & Message */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Bạn đã nộp bài thành công
          </h1>
          <p className={`text-xs sm:text-sm max-w-md mx-auto ${isSpaceTheme ? 'text-slate-300' : 'text-slate-500'}`}>
            Bài làm của bạn đã được hệ thống ghi nhận. Cảm ơn bạn đã hoàn thành bài thi nghiêm túc.
          </p>
        </div>

        {/* Submission Details Bar (3 Pills) */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-3 gap-3 w-full p-4 rounded-xl border text-left text-xs ${
            isSpaceTheme
              ? 'bg-white/10 backdrop-blur-md border-white/15'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="space-y-0.5">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Thời gian nộp bài</div>
            <div className="font-semibold">{submitTimeStr}</div>
          </div>

          <div className="space-y-0.5">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Số câu đã trả lời</div>
            <div className="font-semibold font-mono text-emerald-500">
              {answeredCount} / {totalQuestions} câu
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Phòng thi</div>
            <div className="font-semibold font-mono text-blue-400">
              {room?.title || 'Phòng Khảo Thí'}
            </div>
          </div>
        </div>

        {/* 3. Waiting For Publish Box (Screen 14) */}
        <div
          className={`w-full p-5 sm:p-6 rounded-2xl border text-left space-y-4 shadow-sm ${
            isPublished
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : isSpaceTheme
              ? 'bg-white/10 backdrop-blur-md border-white/15'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isPublished
                  ? 'bg-emerald-500 text-white'
                  : 'bg-blue-600/20 text-blue-400 animate-pulse'
              }`}
            >
              {isPublished ? <CheckCircle2 className="w-5 h-5" /> : <RefreshCw className="w-5 h-5 animate-spin" />}
            </div>

            <div>
              <h2 className="text-sm font-bold">
                {isPublished
                  ? 'Người tổ chức đã công bố kết quả!'
                  : 'Đang chờ người tổ chức công bố kết quả'}
              </h2>
              <p className={`text-xs mt-0.5 ${isSpaceTheme ? 'text-slate-300' : 'text-slate-500'}`}>
                {isPublished
                  ? 'Bấm nút "Xem kết quả" bên dưới để xem điểm số và xếp hạng của bạn.'
                  : 'Kết quả bài thi sẽ được người tổ chức công bố trong phòng thi này.'}
              </p>
            </div>
          </div>

          {/* Stepper Status (Screen 14) */}
          <div className="pt-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>1. Đã nộp bài</span>
            </div>

            <div className="w-12 h-0.5 bg-emerald-500/50" />

            <div
              className={`flex items-center gap-1.5 font-semibold ${
                isPublished ? 'text-emerald-400' : 'text-blue-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>2. Chờ công bố</span>
            </div>

            <div className="w-12 h-0.5 bg-white/20" />

            <div
              className={`flex items-center gap-1.5 font-semibold ${
                isPublished ? 'text-blue-400' : 'opacity-40'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>3. Xem kết quả</span>
            </div>
          </div>
        </div>

        {/* 4. Submitted Peers Roster (Screen 14) */}
        <div
          className={`w-full p-4 rounded-xl border text-left space-y-3 ${
            isSpaceTheme ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Những người đã nộp bài ({peers.length})</span>
            </span>
            <span className="text-[11px] opacity-60 font-mono">Đồng bộ trực tiếp</span>
          </div>

          {peers.length === 0 ? (
            <div className="py-4 text-center text-xs opacity-50">
              Bạn là người đầu tiên hoàn thành và nộp bài trong phòng thi này!
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {peers.slice(0, 12).map((peer) => (
                <div
                  key={peer.id}
                  className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 flex items-center gap-2 text-xs"
                >
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                    {peer.initials}
                  </div>
                  <span className="font-medium text-[11px]">{peer.fullName}</span>
                  <span className="text-[10px] text-emerald-400">✓ Đã nộp</span>
                </div>
              ))}
              {peers.length > 12 && (
                <span className="px-2.5 py-1 rounded-full bg-white/10 text-xs font-semibold">
                  +{peers.length - 12} người khác
                </span>
              )}
            </div>
          )}
        </div>

        {/* 5. Bottom Action Buttons (Screen 14) */}
        <div className="flex items-center justify-center gap-4 pt-2 w-full max-w-md">
          <Link
            href="/personal/live-pin"
            className="w-1/2 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Rời phòng</span>
          </Link>

          {isPublished ? (
            <Link
              href={`/personal/live-room/${room?.id || roomId}/results`}
              className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-md transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Xem kết quả ngay</span>
            </Link>
          ) : (
            <button
              disabled
              className="w-1/2 py-2.5 rounded-xl bg-white/10 text-white/40 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-not-allowed border border-white/5"
              title="Chờ người tổ chức công bố kết quả để mở khóa"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Xem kết quả (Đang khóa)</span>
            </button>
          )}
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="text-center text-[11px] opacity-50">
        NEXA Live Assessment System &bull; Khảo thí chuẩn hóa DigComp
      </footer>
    </div>
  );
}

export default function LiveSubmittedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <LiveSubmittedContent />
    </Suspense>
  );
}
