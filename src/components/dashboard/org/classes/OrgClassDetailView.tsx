'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
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
  MessageSquare,
  FileText,
  ChevronLeft,
  Radio,
  AlertTriangle,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  Maximize2,
  X,
} from 'lucide-react';
import { ClassMemberRosterTable } from './ClassMemberRosterTable';
import { AddClassMembersDrawer } from './AddClassMembersDrawer';
import { AssignAssessmentModal } from './AssignAssessmentModal';
import { ClassStreamTab } from '@/components/dashboard/classes/ClassStreamTab';
import { ClassMaterialsTab } from '@/components/dashboard/classes/ClassMaterialsTab';
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
  currentUserId?: string;
  isManager: boolean;
}

type TabType = 'stream' | 'assignments' | 'materials' | 'members' | 'settings';

export function OrgClassDetailView({
  slug,
  organizationId,
  organizationName,
  classData,
  members: initialMembers,
  assignments: initialAssignments,
  orgCandidates = [],
  availableAssessments = [],
  currentUserId = '',
  isManager,
}: OrgClassDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('stream');
  const [members, setMembers] = useState<ClassMemberItem[]>(initialMembers);
  const [assignments, setAssignments] = useState<ClassAssignmentItem[]>(initialAssignments);
  const [copiedCode, setCopiedCode] = useState(false);

  // Modals & Drawers
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const router = useRouter();

  // Settings form states
  const [settingsName, setSettingsName] = useState(classData.name || '');
  const [settingsTerm, setSettingsTerm] = useState(classData.term || '');
  const [settingsGroupType, setSettingsGroupType] = useState<GroupType>(classData.groupType || 'CLASS');
  const [settingsDescription, setSettingsDescription] = useState(classData.description || '');
  const [allowMemberPost, setAllowMemberPost] = useState(
    classData.settings?.allowMemberPost !== false
  );
  const [allowMemberUpload, setAllowMemberUpload] = useState(
    classData.settings?.allowMemberUpload !== false
  );
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Join Code actions
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFullscreenCode, setIsFullscreenCode] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreenCode) {
        setIsFullscreenCode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenCode]);

  const copyJoinLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/join?code=${classData.classCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Danger zone / Delete states
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsName.trim()) {
      setSaveErrorMsg('Vui lòng nhập tên không gian / lớp học');
      return;
    }

    setSavingSettings(true);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    try {
      const res = await fetch(`/api/organizations/${organizationId}/classes/${classData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: settingsName.trim(),
          term: settingsTerm.trim() || null,
          groupType: settingsGroupType,
          description: settingsDescription.trim() || null,
          settings: {
            ...(classData.settings || {}),
            allowMemberPost,
            allowMemberUpload,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cập nhật cài đặt thất bại');
      }

      setSaveSuccessMsg('Đã lưu thay đổi cài đặt lớp thành công');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      setSaveErrorMsg(err instanceof Error ? err.message : 'Lỗi khi lưu cài đặt');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteClass = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/organizations/${organizationId}/classes/${classData.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể xóa lớp học');
      }
      router.push(`/org/${slug}/classes`);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Lỗi khi xóa lớp');
      setDeleting(false);
    }
  };

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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
            <Building className="w-3.5 h-3.5" /> Phòng ban
          </span>
        );
      case 'PROJECT_GROUP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <Layers className="w-3.5 h-3.5" /> Nhóm dự án
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
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
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* 1. Breadcrumb Navigation */}
      <div>
        <Link
          href={`/org/${slug}/classes`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
          <span>Quay lại danh sách Lớp &amp; Nhóm</span>
        </Link>
      </div>

      {/* 2. Unified Hero Header Banner (Seamless, Anti-Slop, No Nested Frames) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200/70 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          {/* Monogram Box */}
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-xs shrink-0 select-none">
            {monogram}
          </div>

          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider font-mono">
                {organizationName}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Đang hoạt động
              </span>
              {getGroupTypeBadge(classData.groupType)}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight truncate">
              {classData.name}
            </h1>

            {/* Seamless Metadata Row */}
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-neutral-400 flex-wrap pt-0.5">
              <span className="font-mono text-neutral-700 dark:text-neutral-300">
                <strong className="font-bold">{members.length}</strong> thành viên
              </span>
              <span>&bull;</span>
              <span className="font-mono text-neutral-700 dark:text-neutral-300">
                <strong className="font-bold">{assignments.length}</strong> đề đã giao
              </span>
              {classData.term && (
                <>
                  <span>&bull;</span>
                  <span>Đợt: <strong>{classData.term}</strong></span>
                </>
              )}
              <span>&bull;</span>
              <div className="flex items-center gap-1.5">
                <span>Mã lớp:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                  {classData.classCode}
                </span>
                <button
                  type="button"
                  onClick={copyJoinCode}
                  title="Sao chép mã lớp"
                  className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md text-slate-400 hover:text-blue-600 transition cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls for Organization Managers */}
        {isManager && (
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setIsAddMembersOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 bg-slate-50 dark:bg-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-750 rounded-xl transition cursor-pointer shadow-2xs"
            >
              <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Thêm thành viên</span>
            </button>

            <Link
              href={`/personal/live-room/new?classId=${classData.id}&orgId=${organizationId}&orgSlug=${slug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 bg-slate-50 dark:bg-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-750 rounded-xl transition cursor-pointer shadow-2xs"
            >
              <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Thi trực tiếp</span>
            </Link>

            <Link
              href={`/org/${slug}/campaigns/new?classId=${classData.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Giao đề đánh giá</span>
            </Link>

            <Link
              href={`/org/${slug}/grading?classId=${classData.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
              title="Mở Bàn chấm bài cho lớp này"
            >
              <span>Chấm bài</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* 3. Navigation Tabs (Modern Pill Tabs, không gạch chân border-b) */}
      <div>
        <nav className="inline-flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-zinc-900/80 rounded-xl overflow-x-auto text-xs font-semibold" aria-label="Tabs lớp học">
          {/* Tab 1: Bảng tin & Thông báo */}
          <button
            type="button"
            onClick={() => setActiveTab('stream')}
            className={`inline-flex items-center gap-2 py-1.5 px-3 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'stream'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" strokeWidth={1.75} />
            <span>Bảng tin &amp; Thông báo</span>
          </button>

          {/* Tab 2: Đề đánh giá đã giao */}
          <button
            type="button"
            onClick={() => setActiveTab('assignments')}
            className={`inline-flex items-center gap-2 py-1.5 px-3 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'assignments'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <BookOpen className="w-4 h-4" strokeWidth={1.75} />
            <span>Đề khảo thí ({assignments.length})</span>
          </button>

          {/* Tab 3: Tài liệu & Học liệu */}
          <button
            type="button"
            onClick={() => setActiveTab('materials')}
            className={`inline-flex items-center gap-2 py-1.5 px-3 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'materials'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <FileText className="w-4 h-4" strokeWidth={1.75} />
            <span>Tài liệu &amp; Học liệu</span>
          </button>

          {/* Tab 4: Thành viên */}
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`inline-flex items-center gap-2 py-1.5 px-3 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'members'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Users className="w-4 h-4" strokeWidth={1.75} />
            <span>Thành viên ({members.length})</span>
          </button>

          {/* Tab 5: Cài đặt lớp */}
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`inline-flex items-center gap-2 py-1.5 px-3 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Settings className="w-4 h-4" strokeWidth={1.75} />
            <span>Cài đặt lớp</span>
          </button>
        </nav>
      </div>

      {/* 4. Tab Content (Clean, Spacious, No nested border clutters) */}
      <div className="pt-2">
        {/* TAB 1: Bảng tin & Thông báo */}
        {activeTab === 'stream' && (
          <ClassStreamTab
            classId={classData.id}
            role="EVALUATOR"
            currentUserId={currentUserId}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* TAB 2: Đề đánh giá đã giao */}
        {activeTab === 'assignments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Đề khảo thí giao cho lớp ({assignments.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Các bài khảo thí được giao cho học viên trong lớp thực hiện và chấm điểm theo Rubric.
                </p>
              </div>
              {isManager && (
                <Link
                  href={`/org/${slug}/campaigns/new?classId=${classData.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition cursor-pointer shadow-xs"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Giao đề mới</span>
                </Link>
              )}
            </div>

            {assignments.length === 0 ? (
              <div className="py-16 text-center rounded-2xl bg-slate-50/60 dark:bg-zinc-900/40 text-slate-400 dark:text-neutral-500 space-y-2">
                <BookOpen className="w-8 h-8 mx-auto opacity-40 text-blue-600 dark:text-blue-400" />
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
              <div className="space-y-2">
                {assignments.map((a) => (
                  <div
                    key={a.id}
                    className="p-4 bg-white dark:bg-[#111114] hover:bg-slate-50 dark:hover:bg-zinc-900/60 rounded-xl border border-slate-200/70 dark:border-zinc-800 flex items-center justify-between gap-4 text-xs transition"
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                        {a.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                        Thời lượng: {a.durationMinutes} phút • Điểm đạt: {a.passingScore}% • Hạn nộp:{' '}
                        {a.deadline ? new Date(a.deadline).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800">
                        Đang mở
                      </span>
                      <Link
                        href={`/org/${slug}/grading?classId=${classData.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition"
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

        {/* TAB 3: Tài liệu & Học liệu */}
        {activeTab === 'materials' && (
          <ClassMaterialsTab
            classId={classData.id}
            role="EVALUATOR"
            currentUserId={currentUserId}
          />
        )}

        {/* TAB 4: Thành viên */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            <ClassMemberRosterTable
              members={members}
              onOpenAddMembers={() => setIsAddMembersOpen(true)}
              onRemoveMember={handleMemberRemoved}
            />
          </div>
        )}

        {/* TAB 5: Cài đặt lớp & Quản trị */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* CỘT TRÁI (8/12 cols): Form Cài đặt, Quy chế lớp & Danger Zone */}
            <div className="lg:col-span-8 space-y-6">
              {/* Form Cài đặt thông tin */}
              <form
                onSubmit={handleSaveSettings}
                className="bg-white dark:bg-[#111114] rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-6 space-y-5 text-xs shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
              >
                <div className="flex items-center justify-between pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      Cài đặt thông tin Lớp / Không gian
                    </h3>
                  </div>
                  {saveSuccessMsg && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>{saveSuccessMsg}</span>
                    </span>
                  )}
                </div>

                {saveErrorMsg && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{saveErrorMsg}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                      Tên không gian / lớp học <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsName}
                      onChange={(e) => setSettingsName(e.target.value)}
                      placeholder="VD: Lớp Kỹ năng số K48"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-zinc-850 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                        Loại không gian
                      </label>
                      <select
                        value={settingsGroupType}
                        onChange={(e) => setSettingsGroupType(e.target.value as GroupType)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-zinc-850 transition cursor-pointer"
                      >
                        <option value="CLASS">Lớp học</option>
                        <option value="DEPARTMENT">Phòng ban</option>
                        <option value="PROJECT_GROUP">Nhóm dự án</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                        Đợt / Học kỳ
                      </label>
                      <input
                        type="text"
                        value={settingsTerm}
                        onChange={(e) => setSettingsTerm(e.target.value)}
                        placeholder="VD: Học kỳ 2, Fall 2026..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-zinc-850 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                      Mô tả không gian (tùy chọn)
                    </label>
                    <textarea
                      rows={3}
                      value={settingsDescription}
                      onChange={(e) => setSettingsDescription(e.target.value)}
                      placeholder="Nhập mô tả mục tiêu bồi dưỡng năng lực của lớp..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-zinc-850 transition resize-none"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {savingSettings ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang lưu...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Lưu thay đổi</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Section 2: Quy định & Hoạt động của học viên */}
              <div className="bg-white dark:bg-[#111114] rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-6 space-y-4 text-xs shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="pb-3">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Quy chế hoạt động của thành viên
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    Thiết lập quyền tương tác, chia sẻ tài liệu và thảo luận trong lớp.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
                    <div>
                      <strong className="text-neutral-900 dark:text-neutral-100 block">
                        Cho phép thành viên đăng bài lên Bảng tin
                      </strong>
                      <span className="text-[11px] text-slate-500 dark:text-neutral-400 block mt-0.5">
                        Học viên có thể chủ động tạo bài thảo luận mới trên luồng tin chung.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAllowMemberPost(!allowMemberPost)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        allowMemberPost ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                          allowMemberPost ? 'left-5.5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
                    <div>
                      <strong className="text-neutral-900 dark:text-neutral-100 block">
                        Cho phép thành viên tải tài liệu lên kho học liệu
                      </strong>
                      <span className="text-[11px] text-slate-500 dark:text-neutral-400 block mt-0.5">
                        Học viên có thể chia sẻ tệp tài liệu và liên kết học tập với các bạn trong lớp.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAllowMemberUpload(!allowMemberUpload)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        allowMemberUpload ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                          allowMemberUpload ? 'left-5.5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Danger Zone: Xóa lớp học */}
              {isManager && (
                <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 p-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Khu vực nguy hiểm</span>
                    </h4>
                    <p className="text-xs text-rose-700/80 dark:text-rose-400 mt-1 leading-relaxed">
                      Xóa vĩnh viễn không gian này khỏi tổ chức. Toàn bộ danh sách phân công đề khảo thí và liên kết học viên trong lớp sẽ bị gỡ bỏ. Hành động này không thể hoàn tác.
                    </p>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                      Xóa hoàn toàn Lớp / Nhóm này
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsConfirmDeleteOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa lớp học</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* CỘT PHẢI (4/12 cols): Quản lý Mã tham gia & Tóm tắt không gian */}
            <div className="lg:col-span-4 space-y-6">
              {/* Card 1: Mã tham gia Lớp học */}
              <div className="bg-white dark:bg-[#111114] rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-6 space-y-4 text-xs shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Mã tham gia Lớp học
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    Học viên trong đơn vị sử dụng mã này để gia nhập lớp ngay lập tức mà không cần phê duyệt.
                  </p>
                </div>

                {/* Big Code Box */}
                <div className="p-4 rounded-xl border border-dashed border-blue-300 dark:border-blue-800/80 bg-blue-50/50 dark:bg-blue-950/30 text-center space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 font-mono tracking-wider">
                    MÃ THAM GIA HIỆN TẠI
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-blue-600 dark:text-blue-400 select-all py-1">
                    {classData.classCode}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={copyJoinCode}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-zinc-750 bg-white dark:bg-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-800 text-neutral-800 dark:text-neutral-200 font-semibold inline-flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copiedCode ? 'Đã sao chép' : 'Chép mã'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFullscreenCode(true)}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-zinc-750 bg-white dark:bg-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-800 text-neutral-800 dark:text-neutral-200 font-semibold inline-flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                    title="Trình chiếu mã toàn màn hình"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Chiếu mã</span>
                  </button>
                </div>

                {/* Direct Link Section */}
                <div className="space-y-1.5 pt-3">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-neutral-400 block">
                    Đường dẫn tham gia trực tiếp:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={typeof window !== 'undefined' ? `${window.location.origin}/join?code=${classData.classCode}` : `/join?code=${classData.classCode}`}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] font-mono text-slate-600 dark:text-neutral-300 select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={copyJoinLink}
                      className="p-2 rounded-xl border border-slate-200 dark:border-zinc-750 bg-white dark:bg-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-neutral-200 transition cursor-pointer shadow-2xs"
                      title="Sao chép liên kết tham gia"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 2: Thông tin tổng quan không gian */}
              <div className="bg-white dark:bg-[#111114] rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-6 space-y-4 text-xs shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Thông tin không gian
                </h3>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500 dark:text-neutral-400">Trạng thái</span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Đang hoạt động
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2.5">
                    <span className="text-slate-500 dark:text-neutral-400">Hình thức không gian</span>
                    <span>{getGroupTypeBadge(settingsGroupType)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2.5">
                    <span className="text-slate-500 dark:text-neutral-400">Thành viên hiện tại</span>
                    <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      {members.length} thành viên
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2.5">
                    <span className="text-slate-500 dark:text-neutral-400">Đề khảo thí đã giao</span>
                    <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      {assignments.length} đề
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2.5">
                    <span className="text-slate-500 dark:text-neutral-400">Ngày khởi tạo</span>
                    <span className="font-mono text-neutral-700 dark:text-neutral-300">
                      {new Date(classData.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Xác nhận Xóa Lớp (Danger Modal) */}
      {isConfirmDeleteOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-md bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Xác nhận xóa Lớp / Nhóm
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                  Bạn có chắc chắn muốn xóa lớp{' '}
                  <strong className="text-neutral-900 dark:text-neutral-100">
                    &ldquo;{classData.name}&rdquo;
                  </strong>{' '}
                  (Mã: <span className="font-mono">{classData.classCode}</span>)? Toàn bộ dữ liệu thành viên và bài khảo thí trong lớp sẽ bị gỡ bỏ.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteClass}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xác nhận xóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Class Code Projector Modal */}
      {isFullscreenCode && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-6 sm:p-12 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-neutral-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="font-semibold text-sm uppercase tracking-wider text-neutral-200">
                {classData.name} • MÃ THAM GIA LỚP HỌC
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreenCode(false)}
              className="p-2 rounded-xl bg-zinc-800 text-neutral-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center space-y-6 my-auto">
            <p className="text-sm sm:text-base text-neutral-300">
              Học viên truy cập <strong className="text-white underline underline-offset-4 font-mono">/join</strong> và nhập mã sau để vào lớp:
            </p>

            <div className="inline-block py-6 px-10 sm:px-16 rounded-3xl bg-zinc-900 border-2 border-blue-500/40 shadow-2xl">
              <div className="font-mono text-5xl sm:text-7xl md:text-8xl font-black tracking-widest text-blue-400 select-all">
                {classData.classCode}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-neutral-400">
              Nhấn ESC hoặc nút đóng ở góc phải để quay lại giao diện lớp học.
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-500 pt-4">
            <span>Hệ thống Khảo thí &amp; Quản lý Lớp học NEXA</span>
            <button
              type="button"
              onClick={copyJoinCode}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2 cursor-pointer transition"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Đã sao chép mã' : 'Sao chép mã lớp'}</span>
            </button>
          </div>
        </div>
      )}

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
