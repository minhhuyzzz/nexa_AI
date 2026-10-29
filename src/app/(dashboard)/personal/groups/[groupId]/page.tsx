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

type TabType = 'stream' | 'assignments' | 'materials' | 'members';

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
}

export default function LearnerGroupDetailPage() {
  const params = useParams();
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<GroupData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('11111111-1111-1111-1111-111111111111');
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
        <Loader2 className="w-5 h-5 animate-spin text-sky-600" strokeWidth={1.75} />
        <span>Đang nạp không gian nhóm học tập...</span>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-12 text-center border border-dashed border-slate-200 rounded-md bg-white space-y-2">
        <FolderX className="w-8 h-8 text-slate-300 mx-auto" strokeWidth={1.75} />
        <h3 className="text-sm font-bold text-slate-800">Không tìm thấy nhóm</h3>
        <p className="text-xs text-slate-500">Nhóm học tập không tồn tại hoặc bạn chưa tham gia nhóm này.</p>
      </div>
    );
  }

  const isOwner = group.evaluatorId === currentUserId;
  const userClassRole: 'EVALUATOR' | 'LEARNER' = isOwner ? 'EVALUATOR' : 'LEARNER';

  return (
    <div className="space-y-6">
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
      />

      {/* Horizontal Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('stream')}
          className={`px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'stream'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Bảng tin
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'assignments'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Bài khảo thí ({group.assignmentCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'materials'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tài liệu
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'members'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {isOwner ? `Thành viên (${group.memberCount})` : `Bạn cùng lớp (${group.memberCount})`}
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'stream' && (
          <ClassStreamTab
            classId={group.id}
            role={userClassRole}
            currentUserId={currentUserId}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
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
