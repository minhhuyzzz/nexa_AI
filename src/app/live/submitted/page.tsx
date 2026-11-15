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
  RefreshCw,
  Sparkles,
  ArrowRight,
  Shield,
  Check,
  Trophy,
  Crown,
  Medal,
  Award,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { RoomThemeId } from '@/types/live-room';

interface SubmittedPeer {
  id: string;
  fullName: string;
  initials: string;
  avatarUrl?: string | null;
  status: string;
  studentCode?: string;
}

interface PodiumCandidate {
  id: string;
  userId: string;
  fullName: string;
  initials: string;
  studentCode: string;
  score: number | null;
  rank: number;
  timeTakenDisplay?: string;
  isOnTime?: boolean;
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
  const [answeredCount, setAnsweredCount] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [myScore, setMyScore] = useState<number | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);

  // Host published status & Podium
  const [isPublished, setIsPublished] = useState(false);
  const [podiumResults, setPodiumResults] = useState<PodiumCandidate[]>([]);

  // Profile
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('Thí sinh');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // 1. Fetch current profile
  useEffect(() => {
    // Read fallback stats from searchParams immediately
    const queryAns = Number(searchParams.get('answered'));
    const queryTot = Number(searchParams.get('total'));
    if (!isNaN(queryAns) && queryAns > 0) {
      setAnsweredCount(queryAns);
    }
    if (!isNaN(queryTot) && queryTot > 0) {
      setTotalQuestions(queryTot);
    }
    const now = new Date();
    setSubmitTimeStr(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}, ${now.toLocaleDateString('vi-VN')}`);

    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();
        if (profile?.full_name) setUserName(profile.full_name);
        if (profile?.avatar_url) setUserAvatar(profile.avatar_url);

        if (roomId) {
          const { data: myParticipant } = await supabase
            .from('room_participants')
            .select('answers_count, total_questions, score, submitted_at')
            .eq('room_id', roomId)
            .eq('user_id', user.id)
            .maybeSingle();

          if (myParticipant) {
            if (typeof myParticipant.answers_count === 'number' && myParticipant.answers_count > 0) {
              setAnsweredCount(myParticipant.answers_count);
            }
            if (typeof myParticipant.total_questions === 'number' && myParticipant.total_questions > 0) {
              setTotalQuestions(myParticipant.total_questions);
            }
            if (myParticipant.score !== null && myParticipant.score !== undefined) {
              setMyScore(Number(myParticipant.score));
            }
            if (myParticipant.submitted_at) {
              const dt = new Date(myParticipant.submitted_at);
              const timeStr = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}, ${dt.toLocaleDateString('vi-VN')}`;
              setSubmitTimeStr(timeStr);
            }
          }
        }
      }
    }
    loadUser();
  }, [roomId, searchParams]);

  // 2. Fetch room status, peers & podium data
  const fetchStatus = useCallback(async () => {
    if (!roomId && !pin) return;
    try {
      const res = await fetch(`/api/rooms/status?roomId=${roomId}&pin=${pin}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.room) {
          setRoom(data.room);
          const published = Boolean(data.room.resultsPublished);
          setIsPublished(published);

          const list: SubmittedPeer[] = (data.participants || [])
            .filter((p: any) => p.status === 'SUBMITTED' || p.submittedAt)
            .map((p: any, idx: number) => ({
              id: p.id,
              fullName: p.fullName,
              initials: p.initials,
              avatarUrl: p.avatarUrl,
              status: p.status,
              studentCode: `HV-${String(idx + 1).padStart(3, '0')}`,
            }));
          setPeers(list);

          // If results are published or room is ended, fetch full rankings for Podium
          if (published || data.room.status === 'ENDED') {
            try {
              const resultsRes = await fetch(`/api/rooms/${roomId || data.room.id}/results`);
              if (resultsRes.ok) {
                const resultsData = await resultsRes.json();
                if (resultsData.results && Array.isArray(resultsData.results)) {
                  setPodiumResults(resultsData.results);
                  if (currentUserId) {
                    const found = resultsData.results.find((r: any) => r.userId === currentUserId);
                    if (found && found.rank) {
                      setMyRank(found.rank);
                    }
                    if (found && found.score !== null && found.score !== undefined) {
                      setMyScore(Number(found.score));
                    }
                  }
                }
              }
            } catch {}
          }
        }
      }
    } catch {
      // silent retry
    } finally {
      setLoading(false);
    }
  }, [roomId, pin, currentUserId]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Realtime Supabase Channel
  useEffect(() => {
    if (!roomId) return;
    const supabase = createClient();
    const channel = supabase.channel(`room:${roomId}`);

    channel
      .on('broadcast', { event: 'RESULTS_PUBLISHED' }, () => {
        setIsPublished(true);
        fetchStatus();
      })
      .on('broadcast', { event: 'ROOM_STATE_CHANGE' }, (payload) => {
        if (payload.payload?.action === 'END' || payload.payload?.action === 'EXAM_ENDED') {
          setIsPublished(true);
          fetchStatus();
        } else if (payload.payload?.action === 'THEME_UPDATE' && payload.payload?.payload?.themeId) {
          setRoom((prev) => (prev ? { ...prev, themeId: payload.payload.payload.themeId } : prev));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, fetchStatus]);

  const accuracyPercent =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 100;

  const currentTheme = (searchParams.get('theme') as RoomThemeId) || room?.themeId || 'minimal_white';
  const themeClasses: Record<string, string> = {
    space_blue: 'bg-[#0a0f1d] text-sky-100',
    aurora: 'bg-[#090b16] text-purple-100',
    dark_professional: 'bg-[#09090b] text-neutral-100',
    minimal_white: 'bg-white dark:bg-black text-neutral-900 dark:text-neutral-100',
  };
  const activeThemeClass = themeClasses[currentTheme] || 'bg-white dark:bg-black text-neutral-900 dark:text-neutral-100';

  return (
    <div className={`min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none transition-colors ${activeThemeClass}`}>
      {/* 1. Header Ca Thi */}
      <header className="flex items-center justify-between pb-4 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-lg tracking-wider text-blue-600 dark:text-blue-400 font-sans">
            NEXA.
          </span>
          <span className="text-slate-400 text-xs">&bull;</span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
            Khảo thí trực tiếp
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
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">{userName}</span>
        </div>
      </header>

      {/* 2. Main Content: Thẻ Thành Tích Cá Nhân & Bục Vinh Danh */}
      <main className="my-6 flex-1 max-w-3xl mx-auto w-full flex flex-col items-center text-center space-y-6">
        {/* Giant Glowing Emerald Checkmark */}
        <div className="relative">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-[0_0_40px_rgba(5,150,105,0.4)] ring-8 ring-emerald-500/20 animate-in zoom-in-75 duration-300">
            <Check className="w-10 h-10 sm:w-12 sm:h-12 stroke-[3]" />
          </div>
        </div>

        {/* Success Title & Message */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
            Bạn đã nộp bài thành công!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
            Hệ thống đã ghi nhận toàn bộ câu trả lời của bạn. Cảm ơn bạn đã hoàn thành bài thi một cách nghiêm túc.
          </p>
        </div>

        {/* 2.1. Thẻ Thành Tích Cá Nhân (Personal Score Card) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950 text-left text-xs shadow-xs">
          {/* Thứ hạng tạm thời */}
          <div className="space-y-1 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">
              THỨ HẠNG
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
              #{myRank || (peers.length > 0 ? peers.length : 1)}
            </div>
            <div className="text-[10px] text-slate-400">
              {isPublished ? 'Chung cuộc' : 'Tạm thời'}
            </div>
          </div>

          {/* Điểm số */}
          <div className="space-y-1 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">
              ĐIỂM SỐ
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {myScore !== null && myScore !== undefined ? myScore.toFixed(1) : '--'}
            </div>
            <div className="text-[10px] text-slate-400">Điểm đạt được</div>
          </div>

          {/* Số câu đã làm */}
          <div className="space-y-1 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">
              SỐ CÂU ĐÃ LÀM
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-neutral-900 dark:text-neutral-100">
              {answeredCount} / {totalQuestions} câu
            </div>
            <div className="text-[10px] text-slate-400">Đã lưu trữ</div>
          </div>

          {/* Tỉ lệ hoàn thành */}
          <div className="space-y-1 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">
              TỈ LỆ
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-neutral-900 dark:text-neutral-100">
              {accuracyPercent}%
            </div>
            <div className="text-[10px] text-slate-400">Khối lượng đề</div>
          </div>
        </div>

        {/* 2.2. BỤC VINH DANH CHUNG CUỘC (PODIUM TOP 1, 2, 3) KHI HOST CÔNG BỐ */}
        {isPublished && podiumResults.length > 0 ? (
          <div className="w-full p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 shadow-xs space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Bục Vinh Danh Ca Thi (Podium)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
                Vinh Danh Top Đầu Xuất Sắc
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Người tổ chức đã chính thức công bố kết quả toàn phòng thi.
              </p>
            </div>

            {/* 3-Step Podium Bars */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-xl mx-auto pt-4 pb-2">
              {/* Step 2: Hạng 2 (Bên trái) */}
              <div className="flex flex-col items-center">
                {podiumResults[1] ? (
                  <div className="flex flex-col items-center text-center space-y-1 mb-2 animate-in fade-in">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-neutral-200 font-bold text-xs flex items-center justify-center border-2 border-slate-300 dark:border-zinc-700 shadow-xs">
                      {podiumResults[1].initials}
                    </div>
                    <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 truncate max-w-[90px] sm:max-w-[120px]">
                      {podiumResults[1].fullName}
                    </div>
                    <div className="font-mono font-bold text-xs text-slate-600 dark:text-zinc-300">
                      {podiumResults[1].score !== null ? `${podiumResults[1].score} đ` : '--'}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 mb-2 font-mono">--</div>
                )}
                <div className="w-full h-24 sm:h-28 rounded-t-2xl bg-slate-200 dark:bg-zinc-800 flex flex-col items-center justify-center p-2 shadow-xs">
                  <Medal className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500 dark:text-slate-400 mb-1" />
                  <span className="font-black text-lg sm:text-xl font-mono text-slate-700 dark:text-neutral-200">
                    #2
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Á quân</span>
                </div>
              </div>

              {/* Step 1: Hạng 1 (Ở giữa, cao nhất) */}
              <div className="flex flex-col items-center">
                {podiumResults[0] ? (
                  <div className="flex flex-col items-center text-center space-y-1 mb-2 animate-in fade-in">
                    <div className="relative">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-sm flex items-center justify-center border-2 border-amber-400 dark:border-amber-500 shadow-md ring-4 ring-amber-400/20">
                        {podiumResults[0].initials}
                      </div>
                      <Crown className="w-5 h-5 text-amber-500 fill-amber-500 absolute -top-3 left-1/2 -translate-x-1/2" />
                    </div>
                    <div className="font-extrabold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 truncate max-w-[100px] sm:max-w-[140px]">
                      {podiumResults[0].fullName}
                    </div>
                    <div className="font-mono font-black text-sm text-amber-600 dark:text-amber-400">
                      {podiumResults[0].score !== null ? `${podiumResults[0].score} đ` : '--'}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 mb-2 font-mono">--</div>
                )}
                <div className="w-full h-32 sm:h-36 rounded-t-2xl bg-amber-200 dark:bg-amber-950/80 flex flex-col items-center justify-center p-2 shadow-md">
                  <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600 dark:text-amber-400 mb-1" />
                  <span className="font-black text-2xl font-mono text-amber-800 dark:text-amber-300">
                    #1
                  </span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase">Thủ khoa</span>
                </div>
              </div>

              {/* Step 3: Hạng 3 (Bên phải) */}
              <div className="flex flex-col items-center">
                {podiumResults[2] ? (
                  <div className="flex flex-col items-center text-center space-y-1 mb-2 animate-in fade-in">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 font-bold text-xs flex items-center justify-center border-2 border-amber-300 dark:border-amber-700 shadow-xs">
                      {podiumResults[2].initials}
                    </div>
                    <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 truncate max-w-[90px] sm:max-w-[120px]">
                      {podiumResults[2].fullName}
                    </div>
                    <div className="font-mono font-bold text-xs text-amber-700 dark:text-amber-500">
                      {podiumResults[2].score !== null ? `${podiumResults[2].score} đ` : '--'}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 mb-2 font-mono">--</div>
                )}
                <div className="w-full h-20 sm:h-22 rounded-t-2xl bg-amber-100 dark:bg-zinc-900 flex flex-col items-center justify-center p-2 shadow-xs">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700 dark:text-amber-500 mb-1" />
                  <span className="font-black text-lg sm:text-xl font-mono text-amber-800 dark:text-neutral-200">
                    #3
                  </span>
                  <span className="text-[10px] text-amber-700 dark:text-neutral-400 font-semibold uppercase">Hạng 3</span>
                </div>
              </div>
            </div>

            {/* Thứ hạng cá nhân trong phòng */}
            {myRank !== null && (
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200 max-w-xl mx-auto shadow-2xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Vị trí chung cuộc của bạn trong phòng thi:</span>
                </div>
                <span className="font-mono font-black text-base text-blue-600 dark:text-blue-400">
                  Hạng #{myRank} / {podiumResults.length}
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Trạng Thái Chờ Công Bố Kết Quả */
          <div className="w-full p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950 text-left space-y-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Đang chờ Người tổ chức công bố kết quả chung cuộc
                </h2>
                <p className="text-xs mt-0.5 text-slate-500 dark:text-neutral-400">
                  Sau khi ca thi kết thúc hoặc Giám thị bấm &quot;Công bố kết quả&quot;, Bục vinh danh và bảng điểm chi tiết sẽ tự động mở tại đây.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 text-xs text-slate-500 dark:text-neutral-400 flex items-center justify-between">
              <span>Thí sinh đã nộp bài trong phòng:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {peers.length} thí sinh
              </span>
            </div>
          </div>
        )}

        {/* 3. Bottom Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2 w-full max-w-md">
          <Link
            href="/personal/dashboard"
            className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Về Dashboard</span>
          </Link>

          {isPublished ? (
            <Link
              href={`/personal/live-room/${room?.id || roomId}/results`}
              className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Xem bảng điểm</span>
            </Link>
          ) : (
            <button
              disabled
              className="w-1/2 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-neutral-500 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-200/60 dark:border-zinc-800"
              title="Chờ người tổ chức công bố kết quả để mở khóa"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Bảng điểm (Đang khóa)</span>
            </button>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-slate-400 dark:text-neutral-500 font-mono py-2">
        NEXA Live Assessment System • Khảo thí chuẩn hóa 5 miền năng lực số
      </footer>
    </div>
  );
}

export default function LiveSubmittedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-slate-400">Đang tải kết quả nộp bài...</div>}>
      <LiveSubmittedContent />
    </Suspense>
  );
}
