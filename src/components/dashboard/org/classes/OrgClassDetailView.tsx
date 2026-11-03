'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  UserPlus,
  FileSpreadsheet,
  MoreHorizontal,
  Copy,
  Check,
  GraduationCap,
  Building,
  Layers,
  Users,
  BookOpen,
  Activity,
  FolderKanban,
  Settings,
  Calendar,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { ClassMemberRosterTable } from './ClassMemberRosterTable';
import { ClassInstructorCard } from './ClassInstructorCard';
import { ClassOperationalNotes } from './ClassOperationalNotes';
import { UpcomingScheduleCard } from './UpcomingScheduleCard';
import { AddClassMembersDrawer } from './AddClassMembersDrawer';
import { AssignAssessmentModal } from './AssignAssessmentModal';
import type { OrgClassItem, ClassMemberItem, ClassAssignmentItem, GroupType } from './types';

interface OrgClassDetailViewProps {
  slug: string;
  organizationId: string;
  organizationName: string;
  classData: OrgClassItem;
  members: ClassMemberItem[];
  assignments: ClassAssignmentItem[];
  orgCandidates?: Array<{
    userId: string;
    fullName: string;
    email: string;
    suggestedRole: any;
  }>;
  availableAssessments?: Array<{
    id: string;
    title: string;
    durationMinutes: number;
    questionCount: number;
    rubricTitle?: string;
  }>;
  isManager: boolean;
}

export function OrgClassDetailView({
  slug,
  organizationId,
  organizationName,
  classData,
  members: initialMembers,
  assignments: initialAssignments,
  orgCandidates = [],
  availableAssessments = [],
  isManager,
}: OrgClassDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'assignments' | 'activity' | 'resources' | 'settings'>('members');
  const [members, setMembers] = useState<ClassMemberItem[]>(initialMembers);
  const [assignments, setAssignments] = useState<ClassAssignmentItem[]>(initialAssignments);
  const [copiedCode, setCopiedCode] = useState(false);

  // Modals & Drawers
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const copyJoinCode = () => {
    navigator.clipboard.writeText(classData.classCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getGroupTypeBadge = (type: GroupType) => {
    switch (type) {
      case 'DEPARTMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Building className="w-3.5 h-3.5" /> Phòng ban
          </span>
        );
      case 'PROJECT_GROUP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Layers className="w-3.5 h-3.5" /> Nhóm dự án
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <GraduationCap className="w-3.5 h-3.5" /> Lớp học
          </span>
        );
    }
  };

  const handleMemberRemoved = async (userId: string) => {
    try {
      const res = await fetch(
        `/api/organizations/${organizationId}/classes/${classData.id}/members?userId=${userId}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.userId !== userId));
      }
    } catch {
      // Keep existing state
    }
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400">
        <Link href={`/org/${slug}`} className="hover:text-blue-600 transition-colors">
          Điều hành
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <Link href={`/org/${slug}/classes`} className="hover:text-blue-600 transition-colors">
          Lớp & nhóm
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
          {classData.name}
        </span>
      </nav>

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {classData.name}
            </h1>
            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900 tracking-wider">
              {classData.classCode}
            </span>
            {getGroupTypeBadge(classData.groupType)}
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-2xl">
            {classData.description ||
              `Lớp học thuộc tổ chức ${organizationName}, vận hành theo chương trình đào tạo chuẩn.`}
          </p>
        </div>

        {isManager && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddMembersOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Thêm thành viên
            </button>
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Giao đề đánh giá
            </button>
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-neutral-900 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Metadata Strip */}
      <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-3.5 flex items-center justify-between gap-4 flex-wrap text-xs font-mono shadow-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <strong className="tabular-nums">{members.length}</strong> thành viên
          </span>
          <span className="text-slate-300 dark:text-zinc-700">|</span>
          <span className="font-sans text-neutral-800 dark:text-neutral-200">
            Giảng viên: <strong>{classData.instructorName || 'TS. Trần Thị Mai'}</strong>
          </span>
          <span className="text-slate-300 dark:text-zinc-700">|</span>
          <span className="font-sans text-slate-600 dark:text-neutral-400">
            {classData.term || 'Học kỳ Fall 2026'}
          </span>
          <span className="text-slate-300 dark:text-zinc-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="font-sans text-slate-600 dark:text-neutral-400">Mã gia nhập:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{classData.classCode}</span>
            <button
              type="button"
              onClick={copyJoinCode}
              title="Sao chép mã gia nhập"
              className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-400 hover:text-blue-600 transition"
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-sans">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
            Đang hoạt động
          </span>
        </div>
      </div>

      {/* 5 Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-zinc-800">
        <nav className="flex space-x-2 sm:space-x-6 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('members')}
            className={`inline-flex items-center gap-2 py-3 px-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'members'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-neutral-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Thành viên</span>
            <span className="font-mono text-[11px] px-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 tabular-nums">
              {members.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className={`inline-flex items-center gap-2 py-3 px-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'assignments'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-neutral-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Đề đánh giá</span>
            <span className="font-mono text-[11px] px-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 tabular-nums">
              {assignments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`inline-flex items-center gap-2 py-3 px-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'activity'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-neutral-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Hoạt động</span>
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className={`inline-flex items-center gap-2 py-3 px-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'resources'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-neutral-900'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>Tài nguyên</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`inline-flex items-center gap-2 py-3 px-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-neutral-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Cài đặt</span>
          </button>
        </nav>
      </div>

      {/* Main Workspace 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {activeTab === 'members' && (
            <ClassMemberRosterTable
              members={members}
              onOpenAddMembers={() => setIsAddMembersOpen(true)}
              onRemoveMember={handleMemberRemoved}
            />
          )}

          {activeTab === 'assignments' && (
            <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Đề khảo thí đã giao cho lớp ({assignments.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition"
                >
                  + Giao đề mới
                </button>
              </div>

              {assignments.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  Chưa có đề đánh giá nào được giao cho lớp này.
                </div>
              ) : (
                <div className="space-y-2">
                  {assignments.map((a) => (
                    <div
                      key={a.id}
                      className="p-3 bg-slate-50/50 dark:bg-zinc-900/50 rounded border border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {a.title}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Thời lượng: {a.durationMinutes} phút • Hạn nộp:{' '}
                          {a.deadline ? new Date(a.deadline).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200">
                        Đang mở
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-6 text-center text-xs text-slate-500">
              Nhật ký hoạt động lớp học đang được tổng hợp tự động.
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-6 text-center text-xs text-slate-500">
              Thư mục tài nguyên bài giảng và tài liệu lab môn học.
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-6 text-center text-xs text-slate-500">
              Cấu hình bảo mật, mã tham gia và quyền hạn riêng của lớp học.
            </div>
          )}
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <UpcomingScheduleCard />
          <ClassInstructorCard name={classData.instructorName} />
          <ClassOperationalNotes />
        </div>
      </div>

      {/* Drawer: Add Class Members (Screen 04) */}
      <AddClassMembersDrawer
        isOpen={isAddMembersOpen}
        onClose={() => setIsAddMembersOpen(false)}
        organizationId={organizationId}
        classId={classData.id}
        className={classData.name}
        currentMemberCount={members.length}
        maxCapacity={classData.maxCapacity || 50}
        candidates={orgCandidates}
        onSuccess={() => {
          setIsAddMembersOpen(false);
          // Refresh list
        }}
      />

      {/* Modal: Assign Assessment (Screen 05) */}
      <AssignAssessmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        organizationId={organizationId}
        classId={classData.id}
        className={classData.name}
        memberCount={members.length}
        availableAssessments={availableAssessments}
        onSuccess={() => {
          setIsAssignModalOpen(false);
          // Refresh list
        }}
      />
    </div>
  );
}
