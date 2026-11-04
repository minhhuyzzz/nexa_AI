'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  GraduationCap,
  KeyRound,
  Plus,
  Search,
  BookOpen,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  FolderOpen,
  Sparkles,
  ChevronDown,
  X,
  Loader2,
  Building2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ClassGroupItem {
  id: string;
  name: string;
  code: string;
  memberCount: number;
  evaluatorName: string;
  unreadPostsCount: number;
  pendingAssignmentsCount: number;
  filesCount: number;
  isOwner: boolean;
  createdAt: string;
  organizationId?: string | null;
  organizationName?: string | null;
}

export default function LearnerGroupsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [groups, setGroups] = useState<ClassGroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'MANAGED' | 'JOINED' | 'INVITATIONS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Quick Join Dropdown State
  const [isJoinDropdownOpen, setIsJoinDropdownOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const joinDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (joinDropdownRef.current && !joinDropdownRef.current.contains(event.target as Node)) {
        setIsJoinDropdownOpen(false);
        setJoinError(null);
      }
    }
    if (isJoinDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isJoinDropdownOpen]);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setGroups([]);
        return;
      }

      // 1. Groups joined by user as learner (includes both personal and organizational classes)
      const { data: memberRows, error: memberErr } = await supabase
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
            owner_user_id,
            organization_id,
            organizations ( id, name, code, slug ),
            class_members ( id ),
            class_assignments ( id, assessment_id ),
            class_files ( id )
          )
        `)
        .eq('user_id', user.id);

      if (memberErr) {
        console.warn('Error fetching member classes:', memberErr.message);
      }

      // 2. Personal groups created by user (evaluator_id = user.id OR owner_user_id = user.id AND organization_id IS NULL)
      const { data: createdRows, error: createdErr } = await supabase
        .from('evaluator_classes')
        .select(`
          id,
          name,
          class_code,
          description,
          created_at,
          evaluator_id,
          owner_user_id,
          organization_id,
          class_members ( id ),
          class_assignments ( id, assessment_id ),
          class_files ( id )
        `)
        .or(`evaluator_id.eq.${user.id},owner_user_id.eq.${user.id}`)
        .is('organization_id', null);

      if (createdErr) {
        console.warn('Error fetching created classes:', createdErr.message);
      }

      // 3. User submissions to compute pending count
      const { data: mySubs } = await supabase
        .from('assessment_submissions')
        .select('class_assignment_id, assessment_id')
        .eq('user_id', user.id)
        .in('status', ['SUBMITTED', 'EVALUATED']);

      const submittedAssignmentIds = new Set(
        (mySubs || []).map((s) => s.class_assignment_id).filter(Boolean)
      );

      const combinedMap = new Map<string, any>();

      (createdRows || []).forEach((c: any) => {
        if (c?.id) combinedMap.set(c.id, { ...c, isOwner: true });
      });

      (memberRows || []).forEach((m: any) => {
        const c = m?.evaluator_classes;
        // Personal groups include both personal classes and classes assigned by organizations
        if (c?.id && !combinedMap.has(c.id)) {
          combinedMap.set(c.id, { ...c, isOwner: false });
        }
      });

      // 4. Fetch evaluator/owner profile names in batch
      const allClassItems = Array.from(combinedMap.values());
      const distinctOwnerIds = Array.from(
        new Set(
          allClassItems
            .map((c) => c.evaluator_id || c.owner_user_id)
            .filter((id): id is string => Boolean(id) && id !== user.id)
        )
      );

      const profileNameMap = new Map<string, string>();
      if (distinctOwnerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, nickname')
          .in('id', distinctOwnerIds);

        (profiles || []).forEach((p) => {
          profileNameMap.set(p.id, p.full_name || p.nickname || 'Quản trị viên');
        });
      }

      const formatted: ClassGroupItem[] = allClassItems.map((c) => {
        const allAssignments = c.class_assignments || [];
        const pendingCount = allAssignments.filter(
          (a: any) => !submittedAssignmentIds.has(a.id)
        ).length;

        const orgInfo = Array.isArray(c.organizations) ? c.organizations[0] : c.organizations;
        const ownerId = c.evaluator_id || c.owner_user_id;
        const managerName = c.isOwner
          ? 'Bạn (Quản trị viên)'
          : (ownerId ? profileNameMap.get(ownerId) : null) || 'Quản trị viên';

        return {
          id: c.id,
          name: c.name || 'Lớp học không tên',
          code: c.class_code || '---',
          memberCount: (c.class_members || []).length,
          evaluatorName: managerName,
          unreadPostsCount: 0,
          pendingAssignmentsCount: pendingCount,
          filesCount: (c.class_files || []).length,
          isOwner: Boolean(c.isOwner),
          createdAt: c.created_at,
          organizationId: c.organization_id || null,
          organizationName: orgInfo?.name || null,
        };
      });

      setGroups(formatted);
    } catch (err) {
      console.error('Error fetching personal groups:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleCopyCode = (code: string, id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleQuickJoin = async () => {
    const cleanCode = joinCode.trim().toUpperCase();
    if (!cleanCode) {
      setJoinError('Vui lòng nhập mã lớp học');
      return;
    }

    setJoining(true);
    setJoinError(null);
    setJoinSuccess(null);

    try {
      const res = await fetch('/api/classes/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode: cleanCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Tham gia lớp thất bại');
      }

      setJoinSuccess('Gia nhập thành công!');
      setTimeout(() => {
        setIsJoinDropdownOpen(false);
        router.push(`/personal/groups/${data.classId}`);
      }, 500);
    } catch (err: unknown) {
      setJoinError(err instanceof Error ? err.message : 'Lỗi khi tham gia');
    } finally {
      setJoining(false);
    }
  };

  // Filter groups
  const filteredGroups = groups.filter((g) => {
    if (activeTab === 'MANAGED' && !g.isOwner) return false;
    if (activeTab === 'JOINED' && g.isOwner) return false;
    if (activeTab === 'INVITATIONS') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return g.name.toLowerCase().includes(q) || g.code.toLowerCase().includes(q);
    }
    return true;
  });

  const managedCount = groups.filter((g) => g.isOwner).length;
  const joinedCount = groups.filter((g) => !g.isOwner).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-850">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Lớp &amp; Nhóm của tôi
          </h1>
        </div>

        {/* Action Buttons: Dropdown Join + Create Link */}
        <div className="flex items-center gap-2.5 shrink-0 relative">
          {/* Dropdown Join Button */}
          <div className="relative" ref={joinDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsJoinDropdownOpen((prev) => !prev);
                setJoinCode('');
                setJoinError(null);
                setJoinSuccess(null);
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200/90 dark:border-zinc-750 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-zinc-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" strokeWidth={1.75} />
              <span>Tham gia bằng mã</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  isJoinDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Quick Join Popover */}
            {isJoinDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 p-4 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-850">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      Tham gia lớp bằng mã
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsJoinDropdownOpen(false)}
                    className="text-slate-400 hover:text-neutral-700 dark:hover:text-zinc-200 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                  Nhập mã tham gia được cung cấp bởi giảng viên hoặc trưởng nhóm.
                </p>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickJoin();
                      }}
                      placeholder="VD: CLS-4821"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-xs font-mono font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      disabled={joining || !joinCode.trim()}
                      onClick={handleQuickJoin}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-sm shadow-blue-500/20"
                    >
                      {joining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Vào lớp</span>}
                    </button>
                  </div>

                  {joinError && (
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{joinError}</span>
                    </div>
                  )}

                  {joinSuccess && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{joinSuccess}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Link
            href="/personal/groups/create"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>Tạo lớp/nhóm</span>
          </Link>
        </div>
      </div>

      {/* 2. Tabs Stand & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-zinc-850">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ALL'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <span>Tất cả</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-md bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700">
              {groups.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MANAGED')}
            className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'MANAGED'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <span>Tôi quản trị</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-md bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700">
              {managedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('JOINED')}
            className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'JOINED'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <span>Tôi tham gia</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-md bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700">
              {joinedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('INVITATIONS')}
            className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'INVITATIONS'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <span>Lời mời</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-md bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700">
              0
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên lớp hoặc nhóm..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-750 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 3. Group Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 animate-pulse"
            />
          ))}
        </div>
      ) : filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
          {filteredGroups.map((group) => {
            const monogram = (group.name ? group.name[0] : 'N').toUpperCase();

            return (
              <Link
                key={group.id}
                href={`/personal/groups/${group.id}`}
                className="group rounded-2xl border border-slate-200/80 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-700 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden transition-all flex flex-col justify-between"
              >
                {/* Card Cover Banner */}
                <div>
                  <div className="p-4 flex items-center justify-between border-b border-slate-100/80 dark:border-zinc-850 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-transparent dark:from-blue-950/30 dark:via-indigo-950/20">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-base shadow-2xs bg-blue-600 text-white">
                        {monogram}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-neutral-500 font-mono">
                          {group.organizationName ? 'LỚP THUỘC TỔ CHỨC' : 'LỚP / NHÓM HỌC TẬP'}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-medium">
                            Đang hoạt động
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {group.isOwner ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                          Quản trị viên
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-300 border border-slate-200 dark:border-zinc-700">
                          Thành viên
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleCopyCode(group.code, group.id, e)}
                        title="Sao chép mã tham gia"
                        className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 text-slate-600 dark:text-neutral-300 text-[10px] font-mono hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        {copiedCodeId === group.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>{group.code}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {group.name}
                      </h3>
                      {group.organizationName && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
                          <Building2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                          <span className="truncate">{group.organizationName}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-neutral-400 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                        <span className="font-mono">{group.memberCount} thành viên</span>
                      </span>

                      <span className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-700" />
                        <span>Quản trị viên: <strong>{group.evaluatorName}</strong></span>
                      </span>
                    </div>

                    {/* Pending tasks or files info */}
                    <div className="flex items-center gap-3 pt-2 text-[11px]">
                      {group.pendingAssignmentsCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{group.pendingAssignmentsCount} bài kiểm tra cần làm</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-neutral-500 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Không có bài đọng</span>
                        </span>
                      )}

                      {group.filesCount > 0 && (
                        <span className="text-slate-400 dark:text-neutral-500 flex items-center gap-1 font-mono">
                          <FileText className="w-3 h-3" />
                          <span>{group.filesCount} tài liệu</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer Link */}
                <div className="p-4 pt-3 border-t border-slate-100 dark:border-zinc-850 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <span className="group-hover:underline">Vào không gian lớp</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 sm:p-16 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <GraduationCap className="w-7 h-7" strokeWidth={1.75} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Chưa có không gian lớp học hoặc nhóm
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
              Bạn có thể tạo không gian riêng để quản lý học viên hoặc nhập mã được chia sẻ để tham gia nhóm học tập.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsJoinDropdownOpen(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-zinc-200 text-xs font-semibold cursor-pointer"
            >
              Tham gia bằng mã
            </button>
            <Link
              href="/personal/groups/create"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo lớp/nhóm mới</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
