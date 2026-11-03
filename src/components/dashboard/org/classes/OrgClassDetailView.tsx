'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  UserPlus,
  FileSpreadsheet,
  Copy,
  Check,
  GraduationCap,
  Building,
  Layers,
  Users,
  BookOpen,
  Settings,
  ArrowRight,
  ShieldAlert,
  FileCheck,
  ChevronLeft,
} from 'lucide-react';
import { ClassMemberRosterTable } from './ClassMemberRosterTable';
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
  const [activeTab, setActiveTab] = useState<'members' | 'assignments' | 'settings'>('members');
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

  const monogram = (classData.name ? classData.name[0] : 'K').toUpperCase();

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

  const getGroupTypeLabel = (type: GroupType) => {
    switch (type) {
      case 'DEPARTMENT':
        return 'Phòng ban';
      case 'PROJECT_GROUP':
        return 'Nhóm dự án';
      default:
        return 'Lớp học';
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
      <div>
        <Link
          href={`/org/${slug}/classes`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-neutral-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại danh sách Lớp & Nhóm</span>
        </Link>
      </div>

      {/* Unified Hero Banner */}
      <div className="p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          {/* Monogram Box */}
          <div className="w-13 h-13 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-xl shadow-xs shrink-0">
            {monogram}
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 dark:text-neutral-100 truncate">
                {classData.name}
              </h1>
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200/80 dark:border-blue-900 tracking-wider">
                {classData.classCode}
              </span>
              {getGroupTypeBadge(classData.groupType)}
            </div>

            <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
              {classData.description ||
                `Không gian quản lý thành viên và tổ chức khảo thí thuộc tổ chức ${organizationName}.`}
            </p>
          </div>
        </div>

        {/* Action Buttons for Managers */}
        {isManager && (
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setIsAddMembersOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Thêm thành viên</span>
            </button>
            <Link
              href={`/org/${slug}/campaigns/new?classId=${classData.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Giao đề đánh giá</span>
            </Link>
          </div>
        )}
      </div>

      {/* Metadata Strip */}
      <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-3.5 flex items-center justify-between gap-4 flex-wrap text-xs shadow-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-slate-700 dark:text-neutral-300">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <strong className="font-mono tabular-nums">{members.length}</strong> thành viên
          </span>
          <span className="text-slate-300 dark:text-zinc-700">|</span>
          <span className="flex items-center gap-1.5 text-slate-700 dark:text-neutral-300">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <strong className="font-mono tabular-nums">{assignments.length}</strong> đề đã giao
          </span>
          {classData.term && (
            <>
              <span className="text-slate-300 dark:text-zinc-700">|</span>
              <span className="text-slate-600 dark:text-neutral-400">
                Đợt: <strong>{classData.term}</strong>
              </span>
            </>
          )}
          <span className="text-slate-300 dark:text-zinc-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-neutral-400">Mã lớp:</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{classData.classCode}</span>
            <button
              type="button"
              onClick={copyJoinCode}
              title="Sao chép mã lớp"
              className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-400 hover:text-blue-600 transition cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
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

      {/* 3 Core Tabs Navigation */}
      <div className="border-b border-slate-200 dark:border-zinc-800">
        <nav className="flex space-x-2 sm:space-x-6 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`inline-flex items-center gap-2 py-3 px-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'members'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-neutral-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Thành viên</span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-zinc-800 tabular-nums">
              {members.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assignments')}
            className={`inline-flex items-center gap-2 py-3 px-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'assignments'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-neutral-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Đề đánh giá đã giao</span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-zinc-800 tabular-nums">
              {assignments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`inline-flex items-center gap-2 py-3 px-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-neutral-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Cài đặt lớp</span>
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (8 cols): Tab Content */}
        <div className="lg:col-span-8 space-y-4">
          {activeTab === 'members' && (
            <ClassMemberRosterTable
              members={members}
              onOpenAddMembers={() => setIsAddMembersOpen(true)}
              onRemoveMember={handleMemberRemoved}
            />
          )}

          {activeTab === 'assignments' && (
            <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                    Đề khảo thí giao cho lớp ({assignments.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    Các bài khảo thí được giao cho toàn bộ thành viên trong lớp thực hiện.
                  </p>
                </div>
                {isManager && (
                  <Link
                    href={`/org/${slug}/campaigns/new?classId=${classData.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Giao đề mới</span>
                  </Link>
                )}
              </div>

              {assignments.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-lg text-slate-400 dark:text-neutral-500 space-y-2">
                  <BookOpen className="w-8 h-8 mx-auto opacity-40 text-blue-600" />
                  <p className="text-xs font-medium">Chưa có đề đánh giá nào được giao cho lớp này.</p>
                  {isManager && (
                    <Link
                      href={`/org/${slug}/campaigns/new?classId=${classData.id}`}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                    >
                      <span>Tạo đợt giao đề ngay</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {assignments.map((a) => (
                    <div
                      key={a.id}
                      className="p-4 bg-slate-50/50 dark:bg-zinc-900/40 rounded-lg border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900 dark:text-neutral-100">
                          {a.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                          Thời lượng: {a.durationMinutes} phút • Điểm đạt: {a.passingScore}% • Hạn nộp:{' '}
                          {a.deadline ? new Date(a.deadline).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800">
                          Đang mở
                        </span>
                        <Link
                          href={`/org/${slug}/grading`}
                          className="px-2.5 py-1 rounded text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition"
                        >
                          Chấm bài
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl p-5 space-y-4 text-xs shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100 pb-2 border-b border-slate-100 dark:border-zinc-800">
                Cài đặt & Quản trị Lớp học
              </h3>

              <div className="space-y-3 max-w-lg">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-neutral-300 mb-1">
                    Tên không gian
                  </label>
                  <input
                    type="text"
                    disabled
                    value={classData.name}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-600 dark:text-neutral-400 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-neutral-300 mb-1">
                    Mã lớp tham gia
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      disabled
                      value={classData.classCode}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-lg font-mono text-slate-600 dark:text-neutral-400 text-xs"
                    />
                    <button
                      type="button"
                      onClick={copyJoinCode}
                      className="px-3 py-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg font-semibold hover:bg-blue-100 transition cursor-pointer shrink-0"
                    >
                      {copiedCode ? 'Đã sao chép' : 'Sao chép'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-neutral-300 mb-1">
                    Đợt / Học kỳ
                  </label>
                  <input
                    type="text"
                    disabled
                    value={classData.term || 'Chung'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-600 dark:text-neutral-400 text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Real Operational Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Mã tham gia & Hướng dẫn */}
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
                Mã tham gia lớp
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Tự ghi danh
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-zinc-900/60 rounded-lg border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">MÃ THAM GIA</span>
                <span className="text-base font-mono font-extrabold text-blue-600 dark:text-blue-400 tracking-wider">
                  {classData.classCode}
                </span>
              </div>
              <button
                type="button"
                onClick={copyJoinCode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer shadow-2xs"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
              Thành viên trong tổ chức có thể nhập mã này tại mục <strong>Lớp & Nhóm</strong> trong Không gian Cá nhân để tự ghi danh vào lớp.
            </p>
          </div>

          {/* Card 2: Thống kê nhanh lớp */}
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs space-y-3">
            <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono block pb-2 border-b border-slate-100 dark:border-zinc-800">
              Thông tin vận hành
            </span>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-zinc-800/80">
                <span className="text-slate-500 dark:text-neutral-400">Loại không gian:</span>
                <span className="font-semibold text-slate-800 dark:text-neutral-200">
                  {getGroupTypeLabel(classData.groupType)}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-zinc-800/80">
                <span className="text-slate-500 dark:text-neutral-400">Tổng thành viên:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-neutral-100 tabular-nums">
                  {members.length} người
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-zinc-800/80">
                <span className="text-slate-500 dark:text-neutral-400">Đề thi đã giao:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-neutral-100 tabular-nums">
                  {assignments.length} đề
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 dark:text-neutral-400">Đợt / Học kỳ:</span>
                <span className="font-medium text-slate-800 dark:text-neutral-200">
                  {classData.term || 'Chung'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Bàn chấm bài tổ chức */}
          <div className="bg-gradient-to-br from-blue-50/60 to-slate-50/60 dark:from-blue-950/30 dark:to-zinc-900/30 border border-blue-200/80 dark:border-blue-900/60 rounded-xl p-4 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-xs">
              <FileCheck className="w-4 h-4" />
              <span>Bàn Chấm Bài Khảo Thí</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-neutral-400 leading-relaxed">
              Các bài thi được nộp bởi thành viên lớp sẽ tập trung tại Bàn chấm bài để giảng viên thẩm định theo Rubric chuẩn.
            </p>
            <Link
              href={`/org/${slug}/grading`}
              className="inline-flex items-center gap-1.5 pt-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>Mở Bàn chấm bài</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Drawer: Add Class Members */}
      <AddClassMembersDrawer
        isOpen={isAddMembersOpen}
        onClose={() => setIsAddMembersOpen(false)}
        organizationId={organizationId}
        classId={classData.id}
        className={classData.name}
        currentMemberCount={members.length}
        maxCapacity={classData.maxCapacity || 1000}
        candidates={orgCandidates}
        onSuccess={() => {
          setIsAddMembersOpen(false);
        }}
      />

      {/* Modal: Assign Assessment */}
      <AssignAssessmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        organizationId={organizationId}
        organizationSlug={slug}
        classId={classData.id}
        className={classData.name}
        memberCount={members.length}
        availableAssessments={availableAssessments}
        onSuccess={() => {
          setIsAssignModalOpen(false);
        }}
      />
    </div>
  );
}
