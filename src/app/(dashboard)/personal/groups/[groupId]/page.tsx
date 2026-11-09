'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loader2, FolderX, Radio, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ClassHeader } from '@/components/dashboard/classes/ClassHeader';
import { ClassStreamTab } from '@/components/dashboard/classes/ClassStreamTab';
import { ClassAssignmentsTab } from '@/components/dashboard/classes/ClassAssignmentsTab';
import { ClassMaterialsTab } from '@/components/dashboard/classes/ClassMaterialsTab';
import { ClassMembersTab, ClassMemberItem } from '@/components/dashboard/classes/ClassMembersTab';
import { ClassSettingsTab } from '@/components/dashboard/classes/ClassSettingsTab';
import { ClassMemberDashboardView } from '@/components/dashboard/classes/ClassMemberDashboardView';

type TabType = 'stream' | 'assignments' | 'materials' | 'members' | 'settings';

interface GroupData {
  id: string;
  evaluatorId: string;
  evaluatorName?: string;
  name: string;
  code: string;
  description: string;
  createdAt: string;
  memberCount: number;
  assignmentCount: number;
  settings?: { allow_member_posts?: boolean };
  members: ClassMemberItem[];
  assignments?: any[];
  submissions?: any[];
  activeLiveRoom?: {
    id: string;
    roomCode: string;
    title: string;
    status: string;
    durationMinutes?: number;
  } | null;
}

export default function LearnerGroupDetailPage() {
  const params = useParams();
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<GroupData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('stream');
  const [loading, setLoading] = useState(true);

  const fetchGroup = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/classes/${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setGroup(data.group);
      }
    } catch (err: unknown) {
      console.error('Error fetching learner group detail:', err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroup();

    // Get current auth user ID
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) {
        setCurrentUserId(user.id);
      }
    });
  }, [fetchGroup]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 flex items-center justify-center gap-2 text-xs font-sans">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
        <span>Đang nạp không gian nhóm học tập...</span>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-12 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-[#111114] space-y-2 font-sans">
        <FolderX className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto" strokeWidth={1.75} />
        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Không tìm thấy nhóm</h3>
        <p className="text-xs text-slate-500 dark:text-neutral-400">
          Nhóm học tập không tồn tại hoặc bạn chưa tham gia nhóm này.
        </p>
      </div>
    );
  }

  const isOwner = group.evaluatorId === currentUserId;
  const userClassRole: 'EVALUATOR' | 'LEARNER' = isOwner ? 'EVALUATOR' : 'LEARNER';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Header */}
      <ClassHeader
        id={group.id}
        name={group.name}
        code={group.code}
        createdAt={group.createdAt}
        memberCount={group.memberCount}
        evaluatorName={group.evaluatorName || 'Quản trị viên'}
        role={userClassRole}
        isSettingsOpen={activeTab === 'settings'}
        onOpenSettings={() => setActiveTab((prev) => (prev === 'settings' ? 'stream' : 'settings'))}
      />

      {/* Live Exam Active Alert Banner for Class Members */}
      {group.activeLiveRoom && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-900/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-3 min-w-0">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md font-mono">
                  {group.activeLiveRoom.status === 'IN_PROGRESS' ? 'Đang thi trực tiếp' : 'Phòng chờ đang mở'}
                </span>
                <span className="text-xs text-slate-500 dark:text-neutral-400 font-mono">
                  Mã PIN: <b className="text-neutral-900 dark:text-neutral-100 tracking-wider">{group.activeLiveRoom.roomCode}</b>
                </span>
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate mt-1">
                {group.activeLiveRoom.title}
              </h3>
            </div>
          </div>

          <Link
            href={isOwner ? `/live/control?roomId=${group.activeLiveRoom.id}` : `/live/waiting-room?pin=${group.activeLiveRoom.roomCode}`}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>{isOwner ? 'Vào phòng giám sát live' : 'Vào phòng thi ngay'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Horizontal Tabs (Modern Pill Tabs, không gạch chân) */}
      <div>
        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-zinc-900/80 rounded-xl text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('stream')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'stream'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            {isOwner ? 'Bảng tin & Thông báo' : 'Tổng quan & Thông báo'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assignments')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'assignments'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            Bài khảo thí ({group.assignmentCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('materials')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'materials'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            Tài liệu & Học liệu
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'members'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            {isOwner ? `Thành viên (${group.memberCount})` : `Bạn cùng lớp (${group.memberCount})`}
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'stream' && (
          isOwner ? (
            <ClassStreamTab
              classId={group.id}
              role={userClassRole}
              currentUserId={currentUserId}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          ) : (
            <div className="space-y-6">
              {/* Screen 9 Member View with Assigned Tasks Priority */}
              <ClassMemberDashboardView
                classId={group.id}
                className={group.name}
                assignments={group.assignments || []}
                submissions={group.submissions || []}
                postsCount={0}
                filesCount={0}
                memberCount={group.memberCount}
                evaluatorName="Người quản lý"
              />

              {/* Feed posts and discussions below */}
              <div className="pt-4">
                <ClassStreamTab
                  classId={group.id}
                  role={userClassRole}
                  currentUserId={currentUserId}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              </div>
            </div>
          )
        )}

        {activeTab === 'assignments' && (
          <ClassAssignmentsTab
            classId={group.id}
            classNameStr={group.name}
            classCode={group.code}
            role={userClassRole}
            currentUserId={currentUserId}
          />
        )}

        {activeTab === 'materials' && (
          <ClassMaterialsTab
            classId={group.id}
            role={userClassRole}
            currentUserId={currentUserId}
          />
        )}

        {activeTab === 'members' && (
          <ClassMembersTab
            classId={group.id}
            members={group.members}
            role={userClassRole}
            currentUserId={currentUserId}
            onRefresh={fetchGroup}
          />
        )}

        {activeTab === 'settings' && isOwner && (
          <ClassSettingsTab
            classId={group.id}
            onClose={() => setActiveTab('stream')}
            initialName={group.name}
            initialDescription={group.description}
            initialCode={group.code}
            initialAllowMemberPosts={group.settings?.allow_member_posts !== false}
            onUpdated={(updated) => {
              setGroup((prev) =>
                prev
                  ? {
                      ...prev,
                      name: updated.name,
                      description: updated.description,
                      code: updated.code || prev.code,
                      settings: {
                        ...prev.settings,
                        allow_member_posts: updated.allowMemberPosts !== undefined
                          ? updated.allowMemberPosts
                          : prev.settings?.allow_member_posts,
                      },
                    }
                  : null
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
