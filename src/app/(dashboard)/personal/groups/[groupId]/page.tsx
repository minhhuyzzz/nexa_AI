'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, FolderX } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ClassHeader } from '@/components/dashboard/classes/ClassHeader';
import { ClassStreamTab } from '@/components/dashboard/classes/ClassStreamTab';
import { ClassAssignmentsTab } from '@/components/dashboard/classes/ClassAssignmentsTab';
import { ClassMaterialsTab } from '@/components/dashboard/classes/ClassMaterialsTab';
import { ClassMembersTab, ClassMemberItem } from '@/components/dashboard/classes/ClassMembersTab';
import { ClassChatDrawer } from '@/components/dashboard/classes/ClassChatDrawer';
import { ClassSettingsTab } from '@/components/dashboard/classes/ClassSettingsTab';
import { ClassMemberDashboardView } from '@/components/dashboard/classes/ClassMemberDashboardView';

type TabType = 'stream' | 'assignments' | 'materials' | 'members' | 'settings';

interface GroupData {
  id: string;
  evaluatorId: string;
  name: string;
  code: string;
  description: string;
  createdAt: string;
  memberCount: number;
  assignmentCount: number;
  members: ClassMemberItem[];
  assignments?: any[];
  submissions?: any[];
}

export default function LearnerGroupDetailPage() {
  const params = useParams();
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<GroupData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('stream');
  const [isChatOpen, setIsChatOpen] = useState(false);
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
      <div className="py-24 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
        <span>Đang nạp không gian nhóm học tập...</span>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-12 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-[#111114] space-y-2">
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
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <ClassHeader
        id={group.id}
        name={group.name}
        code={group.code}
        createdAt={group.createdAt}
        memberCount={group.memberCount}
        role={userClassRole}
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen((prev) => !prev)}
        onOpenSettings={() => setActiveTab('settings')}
      />

      {/* Horizontal Tabs (Cobalt blue active indicator #2563EB) */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-zinc-800 text-xs font-semibold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('stream')}
          className={`px-4 py-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'stream'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          {isOwner ? 'Bảng tin & Thông báo' : 'Tổng quan & Thông báo'}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'assignments'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          Bài khảo thí ({group.assignmentCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'materials'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          Tài liệu & Học liệu
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`px-4 py-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'members'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          {isOwner ? `Thành viên (${group.memberCount})` : `Bạn cùng lớp (${group.memberCount})`}
        </button>

        {isOwner && (
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            Cài đặt lớp
          </button>
        )}
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
              <div className="pt-4 border-t border-slate-100 dark:border-zinc-850">
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
            initialName={group.name}
            initialDescription={group.description}
            initialCode={group.code}
            onUpdated={(updated) => {
              setGroup((prev) =>
                prev
                  ? {
                      ...prev,
                      name: updated.name,
                      description: updated.description,
                      code: updated.code || prev.code,
                    }
                  : null
              );
            }}
          />
        )}
      </div>

      {/* Collapsible Chat Drawer */}
      <ClassChatDrawer
        classId={group.id}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentUserId={currentUserId}
      />
    </div>
  );
}
