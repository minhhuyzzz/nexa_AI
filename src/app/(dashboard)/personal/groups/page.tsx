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
  Plus,
  Copy,
  Check,
  FolderOpen,
  Mail,
  ShieldCheck,
  Settings,
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
  isOwner: boolean;
}

export default function LearnerGroupsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [groups, setGroups] = useState<ClassGroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'JOINED' | 'MANAGED' | 'INVITATIONS'>('JOINED');

  // Popover State (Join)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Create Group Modal State (Manage)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

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

      let classList: ClassGroupItem[] = [];

      if (user) {
        // 1. Groups joined by user as learner
        const { data: memberRows } = await supabase
          .from('class_members')
          .select(`
            id,
            joined_at,
            evaluator_classes (
              id,
              name,
              class_code,
              description,
              created_at,
              evaluator_id,
              organization_id,
              class_members ( id ),
              class_assignments ( id, assessment_id )
            )
          `)
          .eq('user_id', user.id);

        // 2. Personal groups created by user (evaluator_id = user.id AND organization_id IS NULL)
        const { data: createdRows } = await supabase
          .from('evaluator_classes')
          .select(`
            id,
            name,
            class_code,
            description,
            created_at,
            evaluator_id,
            organization_id,
            class_members ( id ),
            class_assignments ( id, assessment_id )
          `)
          .eq('evaluator_id', user.id)
          .is('organization_id', null);

        // 3. User submissions to compute pending count
        const { data: mySubs } = await supabase
          .from('assessment_submissions')
          .select('class_assignment_id, assessment_id')
          .eq('user_id', user.id)
          .in('status', ['SUBMITTED', 'EVALUATED']);

        const submittedAssignmentIds = new Set(
          (mySubs || []).map((s) => s.class_assignment_id).filter(Boolean)
        );
        const submittedAssessmentIds = new Set(
          (mySubs || []).map((s) => s.assessment_id).filter(Boolean)
        );

        const combinedMap = new Map<string, any>();

        (createdRows || []).forEach((c: any) => {
          if (c?.id) combinedMap.set(c.id, { ...c, isOwner: true });
        });

        (memberRows || []).forEach((m: any) => {
          const c = m?.evaluator_classes;
          if (c?.id && !combinedMap.has(c.id)) {
            combinedMap.set(c.id, { ...c, isOwner: false });
          }
        });

        classList = Array.from(combinedMap.values()).map((c) => {
          const pendingCount = (c.class_assignments || []).filter(
            (asg: { id: string; assessment_id: string }) =>
              !submittedAssignmentIds.has(asg.id) && !submittedAssessmentIds.has(asg.assessment_id)
          ).length;

          return {
            id: c.id,
            name: c.name,
            code: c.class_code,
            shortCode: (c.name || 'CL').slice(0, 2).toUpperCase(),
            memberCount: c.class_members?.length || 1,
            evaluatorName: c.isOwner ? 'Bạn (Quản trị nhóm)' : 'Giảng viên phụ trách',
            institution: 'Nhóm học tập cá nhân',
            unreadPostsCount: 0,
            pendingAssignmentsCount: pendingCount,
            filesCount: 0,
            isOwner: Boolean(c.isOwner),
          };
        });
      }

      setGroups(classList);
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
      const res = await fetch('/api/classes/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode: clean }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Mã nhóm không hợp lệ hoặc không tồn tại');
      }

      setJoinSuccess(`Đã tham gia nhóm: ${data.className || clean}`);
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

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setCreatingGroup(true);
    setCreateError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Vui lòng đăng nhập để tạo nhóm');

      const uniqueCode = `NX-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const { data, error } = await supabase
        .from('evaluator_classes')
        .insert({
          evaluator_id: user.id,
          name: newGroupName.trim(),
          description: newGroupDesc.trim() || 'Nhóm học tập & ôn luyện cá nhân',
          class_code: uniqueCode,
          organization_id: null,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Add creator as member
        await supabase.from('class_members').insert({
          class_id: data.id,
          user_id: user.id,
        });
      }

      setIsCreateOpen(false);
      setNewGroupName('');
      setNewGroupDesc('');
      await fetchGroups();
    } catch (err: any) {
      setCreateError(err.message || 'Không thể tạo nhóm mới');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleCopyCode = (id: string, code: string) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(code);
      setCopiedCodeId(id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    }
  };

  const joinedGroups = groups.filter((g) => !g.isOwner);
  const managedGroups = groups.filter((g) => g.isOwner);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono">
              KHÔNG GIAN LỚP &amp; NHÓM CÁ NHÂN
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            Lớp &amp; Nhóm Của Tôi
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Quản lý không gian học tập cá nhân, tham gia lớp bằng mã hoặc tạo nhóm riêng để giao bài khảo thí.
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2">
          {activeTab === 'MANAGED' ? (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Tạo nhóm mới</span>
            </button>
          ) : (
            <div className="relative" ref={popoverRef}>
              <button
                onClick={() => {
                  setIsPopoverOpen(!isPopoverOpen);
                  setJoinError(null);
                  setJoinSuccess(null);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Tham gia bằng mã</span>
              </button>

              {/* Popover */}
              {isPopoverOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-md shadow-md p-4 z-40 animate-in fade-in zoom-in-95 duration-100 text-xs">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-zinc-850">
                    <span className="font-bold text-slate-900 dark:text-zinc-100">Nhập mã tham gia</span>
                    <span className="font-mono text-[10px] text-slate-400">NX-XXXX</span>
                  </div>

                  <form onSubmit={handleJoin} className="space-y-3">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => {
                        setJoinCode(e.target.value.toUpperCase().replace(/\s+/g, ''));
                        setJoinError(null);
                      }}
                      placeholder="VD: NX-ABCDE"
                      autoFocus
                      maxLength={12}
                      className="w-full text-center text-sm font-bold tracking-widest font-mono text-slate-900 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-900 rounded-md border border-slate-200 dark:border-zinc-800 py-2 focus:bg-white dark:focus:bg-zinc-950 focus:border-blue-600 focus:outline-hidden transition-colors"
                    />

                    {joinError && (
                      <div className="text-[11px] text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{joinError}</span>
                      </div>
                    )}
                    {joinSuccess && (
                      <div className="text-[11px] text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{joinSuccess}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={joining || !joinCode.trim()}
                      className="w-full py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50"
                    >
                      {joining ? 'Đang xác thực...' : 'Tham gia ngay'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3 Tabs Navigation */}
      <div className="border-b border-slate-200 dark:border-zinc-800 flex items-center gap-1 overflow-x-auto text-xs">
        {[
          { id: 'JOINED', label: 'Tôi tham gia', count: joinedGroups.length },
          { id: 'MANAGED', label: 'Tôi quản lý', count: managedGroups.length },
          { id: 'INVITATIONS', label: 'Lời mời tham gia', count: 0 },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2.5 px-4 font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" strokeWidth={1.75} />
          <p className="text-xs">Đang tải danh sách nhóm...</p>
        </div>
      ) : activeTab === 'JOINED' ? (
        /* TAB 1: TÔI THAM GIA */
        joinedGroups.length === 0 ? (
          <div className="p-10 text-center rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black shadow-2xs">
            <Users className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" strokeWidth={1.75} />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mb-1">
              Bạn chưa tham gia nhóm nào
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mb-4 leading-relaxed">
              Bấm &ldquo;Tham gia bằng mã&rdquo; và nhập mã do giáo viên hoặc bạn bè cung cấp để vào nhóm học tập.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {joinedGroups.map((grp) => (
              <div
                key={grp.id}
                className="rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-2xs transition-all flex flex-col justify-between overflow-hidden group p-5 text-xs space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800">
                      {grp.code}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                      {grp.memberCount} thành viên
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {grp.name}
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block mt-0.5">
                    {grp.evaluatorName}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-zinc-850 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">
                    Bài còn nợ: <strong className="text-slate-800 dark:text-zinc-200 font-mono">{grp.pendingAssignmentsCount}</strong>
                  </span>
                  <Link
                    href={`/personal/groups/${grp.id}`}
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>Vào lớp</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'MANAGED' ? (
        /* TAB 2: TÔI QUẢN LÝ */
        managedGroups.length === 0 ? (
          <div className="p-10 text-center rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black shadow-2xs">
            <FolderOpen className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" strokeWidth={1.75} />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mb-1">
              Bạn chưa tạo nhóm cá nhân nào
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mb-4 leading-relaxed">
              Tạo nhóm học tập để giao bài khảo thí tự thiết kế cho học viên, bạn bè hoặc đồng nghiệp cùng luyện tập.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo nhóm ngay</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {managedGroups.map((grp) => (
              <div
                key={grp.id}
                className="rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-2xs transition-all flex flex-col justify-between overflow-hidden group p-5 text-xs space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 flex items-center gap-1">
                      <span>Mã: {grp.code}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(grp.id, grp.code)}
                        className="hover:text-blue-900 dark:hover:text-white"
                        title="Sao chép mã nhóm"
                      >
                        {copiedCodeId === grp.id ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                      </button>
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                      {grp.memberCount} thành viên
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {grp.name}
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block mt-0.5">
                    Chủ sở hữu: Bạn
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-zinc-850 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">
                    Bài thi đã giao: <strong className="text-slate-800 dark:text-zinc-200 font-mono">1</strong>
                  </span>
                  <Link
                    href={`/personal/groups/${grp.id}`}
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>Quản lý nhóm</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* TAB 3: LỜI MỜI THAM GIA */
        <div className="p-10 text-center rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black shadow-2xs">
          <Mail className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" strokeWidth={1.75} />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mb-1">
            Hộp thư lời mời đang trống
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Khi có giảng viên hoặc người hướng dẫn gửi lời mời tham gia nhóm học tập trực tiếp tới email của bạn, lời mời sẽ xuất hiện tại đây.
          </p>
        </div>
      )}

      {/* CREATE GROUP MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-md p-6 max-w-md w-full space-y-4 shadow-lg text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-850">
              <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Tạo Nhóm Học Tập Cá Nhân
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-zinc-200 mb-1">
                  Tên nhóm / Lớp học:
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Ví dụ: Ôn thi Năng lực số K24"
                  className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-zinc-200 mb-1">
                  Mô tả mục tiêu nhóm (tùy chọn):
                </label>
                <textarea
                  rows={2}
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Mục tiêu ôn luyện, bài tập chuẩn bị thi..."
                  className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              {createError && (
                <div className="text-[11px] text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-zinc-850 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3.5 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingGroup || !newGroupName.trim()}
                  className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  {creatingGroup ? 'Đang tạo...' : 'Tạo nhóm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
