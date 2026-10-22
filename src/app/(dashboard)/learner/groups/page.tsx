'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  KeyRound,
  CheckSquare,
  FileText,
  ChevronDown,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ClassGroupItem {
  id: string;
  name: string;
  code: string;
  shortCode: string;
  memberCount: number;
  evaluatorName: string;
  institution: string;
  unreadPostsCount: number;
  pendingAssignmentsCount: number;
  filesCount: number;
}

export default function LearnerGroupsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [groups, setGroups] = useState<ClassGroupItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Popover State
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
        setJoinError(null);
      }
    }
    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopoverOpen]);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let enrolledRooms: Array<{
        id: string;
        room_code: string;
        title: string;
        created_at: string;
      }> = [];

      if (user) {
        const { data: participants } = await supabase
          .from('room_participants')
          .select(`
            id,
            joined_at,
            exam_rooms (
              id,
              room_code,
              title,
              created_at
            )
          `)
          .eq('user_id', user.id);

        enrolledRooms = (participants || [])
          .map((p: any) => p.exam_rooms)
          .filter(Boolean);
      }

      // If learner has no enrolled rooms, show active public exam rooms
      if (enrolledRooms.length === 0) {
        const { data: publicRooms } = await supabase
          .from('exam_rooms')
          .select('id, room_code, title, created_at')
          .eq('is_active', true)
          .limit(6);

        enrolledRooms = publicRooms || [];
      }

      const mapped: ClassGroupItem[] = enrolledRooms.map((r) => ({
        id: r.id,
        name: r.title,
        code: r.room_code,
        shortCode: r.title.slice(0, 2).toUpperCase(),
        memberCount: 1,
        evaluatorName: 'Chuyên gia Khảo thí NEXA',
        institution: 'Học viện Số NEXA',
        unreadPostsCount: 0,
        pendingAssignmentsCount: 1,
        filesCount: 2,
      }));

      setGroups(mapped);
    } catch (err) {
      console.error('Error fetching learner groups:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinCode.trim();
    if (!clean) {
      setJoinError('Vui lòng nhập mã nhóm');
      return;
    }

    setJoining(true);
    setJoinError(null);
    setJoinSuccess(null);

    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: clean }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Mã nhóm không hợp lệ hoặc đã hết hạn');
      }

      setJoinSuccess(`Đã ghi danh vào nhóm: ${data.roomTitle || data.roomCode}`);
      setJoinCode('');
      await fetchGroups();
      setTimeout(() => {
        setIsPopoverOpen(false);
        setJoinSuccess(null);
      }, 1500);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Lỗi khi tham gia nhóm');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
              KHÔNG GIAN NHÓM
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Nhóm của tôi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Không gian học tập, trao đổi tài liệu và làm việc cộng tác theo nhóm.
          </p>
        </div>

        {/* Action: Popover Dropdown for Joining Group (NO screen-blocking modal) */}
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => {
              setIsPopoverOpen(!isPopoverOpen);
              setJoinError(null);
              setJoinSuccess(null);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors shadow-xs"
          >
            <KeyRound className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Tham gia nhóm bằng mã</span>
          </button>

          {/* Sleek Dropdown Popover */}
          {isPopoverOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-md shadow-md p-4 z-40 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
                  <span className="text-xs font-bold text-slate-900">Tham gia nhóm bằng mã</span>
                </div>
              </div>

              <form onSubmit={handleJoin} className="space-y-3">
                <div>

                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => {
                      setJoinCode(e.target.value.toUpperCase().replace(/\s+/g, ''));
                      setJoinError(null);
                    }}
                    placeholder="VD: 849201"
                    autoFocus
                    maxLength={10}
                    className="w-full text-center text-sm font-bold tracking-widest font-mono text-slate-900 bg-slate-50 rounded-md border border-slate-200 py-2 focus:bg-white focus:border-sky-600 focus:outline-none transition-colors"
                  />
                  {joinError && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-rose-600 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" strokeWidth={1.75} />
                      <span>{joinError}</span>
                    </div>
                  )}
                  {joinSuccess && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3 h-3 shrink-0" strokeWidth={1.75} />
                      <span>{joinSuccess}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={joining || !joinCode.trim()}
                  className="w-full py-2 rounded-md bg-sky-600 hover:bg-sky-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {joining ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />
                      <span>Đang xác thực...</span>
                    </>
                  ) : (
                    <>
                      <span>Vào nhóm ngay</span>
                      <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </>
                  )}
                </button>
              </form>

              {/* Sub link for Live PIN exam rooms */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 text-center">
                <Link
                  href="/learner/live-pin"
                  onClick={() => setIsPopoverOpen(false)}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-sky-600 transition-colors"
                >
                  <Radio className="w-3 h-3 text-emerald-600" strokeWidth={1.75} />
                  <span>Có mã PIN phòng thi trực tiếp? Vào thi &rarr;</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Section Label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
          <span>Nhóm của tôi ({loading ? '...' : groups.length})</span>
        </div>
      </div>

      {/* Grid of Class Cards */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-sky-600 mb-2" strokeWidth={1.75} />
          <p className="text-xs">Đang tải danh sách nhóm...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="p-10 text-center rounded-md border border-slate-200 bg-white shadow-xs">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" strokeWidth={1.75} />
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Bạn chưa tham gia nhóm nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 leading-relaxed">
            Nhập mã nhóm do người tạo nhóm cung cấp để tham gia không gian làm việc cộng tác.
          </p>



          {joinError && (
            <p className="text-[11px] text-rose-600 mt-2 font-medium">{joinError}</p>
          )}
          {joinSuccess && (
            <p className="text-[11px] text-emerald-600 mt-2 font-medium">{joinSuccess}</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((grp) => (
            <div
              key={grp.id}
              className="rounded-md border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between overflow-hidden group"
            >
              <Link
                href={`/learner/groups/${grp.id}`}
                className="p-4 flex items-start gap-3.5 flex-1"
              >
                <div className="w-12 h-12 rounded-md bg-sky-600 text-white flex items-center justify-center text-sm font-bold shrink-0 tracking-wider shadow-xs font-mono">
                  {grp.shortCode}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                      {grp.code}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium font-mono">
                      {grp.memberCount} thành viên
                    </span>
                  </div>

                  <h2 className="text-xs font-bold text-slate-900 group-hover:text-sky-600 transition-colors leading-snug line-clamp-2">
                    {grp.name}
                  </h2>

                  <p className="text-[11px] text-slate-500 mt-1 truncate">
                    {grp.evaluatorName} &bull; {grp.institution}
                  </p>
                </div>
              </Link>

              {/* Bottom Shortcut Bar */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-slate-500 text-xs">
                <div className="flex items-center gap-4">
                  <Link
                    href={`/learner/groups/${grp.id}?tab=assignments`}
                    title={`${grp.pendingAssignmentsCount} bài tập cần nộp`}
                    className="flex items-center gap-1 hover:text-sky-600 transition-colors"
                  >
                    <CheckSquare className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span className="text-[10px] text-slate-600 font-mono">{grp.pendingAssignmentsCount} bài</span>
                  </Link>

                  <Link
                    href={`/learner/groups/${grp.id}?tab=files`}
                    title={`${grp.filesCount} tài liệu chia sẻ`}
                    className="flex items-center gap-1 hover:text-sky-600 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span className="text-[10px] font-mono">{grp.filesCount} tệp</span>
                  </Link>
                </div>

                <Link
                  href={`/learner/groups/${grp.id}`}
                  className="text-[11px] font-medium text-slate-500 hover:text-sky-600 inline-flex items-center gap-0.5"
                >
                  <span>Vào nhóm</span>
                  <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
