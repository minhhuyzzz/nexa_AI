'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Trash2,
  Loader2,
  Check,
  AlertCircle,
  Shield,
  Crown,
  X,
} from 'lucide-react';
import { MemberDirectoryTable } from '@/components/dashboard/org/members/MemberDirectoryTable';
import { InviteMemberModal } from '@/components/dashboard/org/members/InviteMemberModal';
import { PendingInvitationsView } from '@/components/dashboard/org/members/PendingInvitationsView';
import { BulkMemberImportModal } from '@/components/dashboard/org/BulkMemberImportModal';

import type {
  OrgMemberItem,
  OrgInvitationItem,
  OrgClassItem,
} from '@/components/dashboard/org/members/types';
import { normalizeOrgRole } from '@/lib/auth/org-roles';
import type { OrgEntitlementSummary } from '@/features/billing/services/quota-enforcement.service';

interface Props {
  organizationId: string;
  organizationName: string;
  organizationSlug?: string;
  members: OrgMemberItem[];
  classes?: OrgClassItem[];
  entitlements?: OrgEntitlementSummary;
  pendingInvitationsCount?: number;
  maxMembers?: number;
  isManager: boolean;
  isOwner?: boolean;
  currentUserRole?: string;
}

export function OrgMembersClientView({
  organizationId,
  organizationName,
  organizationSlug,
  members: initialMembers,
  classes = [],
  entitlements,
  pendingInvitationsCount: initialInvitationsCount = 0,
  maxMembers = 50,
  isManager,
  isOwner = false,
  currentUserRole,
}: Props) {
  // Navigation & tabs: 2 tabs (Member list & Invitations)
  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');

  // Core data states
  const [members, setMembers] = useState<OrgMemberItem[]>(initialMembers);
  const [invitations, setInvitations] = useState<OrgInvitationItem[]>([]);

  // Counts
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(initialInvitationsCount);

  // Loading flags
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Delete modal state
  const [memberToDelete, setMemberToDelete] = useState<OrgMemberItem | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Role assignment modal state
  const [roleMember, setRoleMember] = useState<OrgMemberItem | null>(null);
  const [selectedRole, setSelectedRole] = useState<'ORG_ADMIN' | 'ASSESSOR' | 'MEMBER'>('MEMBER');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Calculation of seat quota
  const maxSeatsAllowed = maxMembers || entitlements?.maxSeats || 500;
  const currentMemberCount = members.filter((m) => m.status === 'ACTIVE').length;
  const remainingSeats = Math.max(0, maxSeatsAllowed - currentMemberCount);

  // Fetch functions
  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/organizations/${organizationId}/members`);
      if (res.ok) {
        const data = await res.json();
        if (data.members) {
          setMembers(data.members);
        }
      }
    } catch {
      // keep existing state
    }
  }, [organizationId]);

  const fetchInvitations = useCallback(async () => {
    setLoadingInvitations(true);
    try {
      const res = await fetch(`/api/organizations/invitations?organizationId=${organizationId}`);
      if (res.ok) {
        const data = await res.json();
        const invs = data.invitations || [];
        setInvitations(invs);
        setPendingInvitationsCount(
          invs.filter(
            (i: OrgInvitationItem) => i.status === 'PENDING' && new Date(i.expires_at) >= new Date()
          ).length
        );
      }
    } catch {
      // Keep existing state
    } finally {
      setLoadingInvitations(false);
    }
  }, [organizationId]);

  // Lưu phân quyền từ Role Modal
  const handleSaveRole = async () => {
    if (!roleMember) return;
    if (!isOwner && roleMember.role === 'ORG_ADMIN') {
      setRoleError('Quản trị viên không có quyền thay đổi vai trò của Quản trị viên khác.');
      return;
    }
    if (!isOwner && selectedRole === 'ORG_ADMIN') {
      setRoleError('Chỉ Chủ sở hữu mới có quyền bổ nhiệm Quản trị viên mới.');
      return;
    }

    setIsUpdatingRole(true);
    setRoleError(null);

    try {
      const res = await fetch(`/api/organizations/${organizationId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: roleMember.userId,
          orgRole: selectedRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cập nhật vai trò thất bại');
      }

      const roleLabels: Record<string, string> = {
        ORG_ADMIN: 'Quản trị viên',
        ASSESSOR: 'Khảo thí viên',
        MEMBER: 'Thành viên',
      };

      setToastMessage({
        type: 'success',
        text: `Đã cập nhật vai trò của "${roleMember.nickname}" thành ${roleLabels[selectedRole] || selectedRole}.`,
      });
      setRoleMember(null);
      fetchMembers();
    } catch (err) {
      setRoleError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi đổi vai trò');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Bật/tắt trạng thái Tạm ngưng hoặc Kích hoạt lại
  const handleToggleMemberStatus = async (member: OrgMemberItem) => {
    if (!isOwner && member.role === 'ORG_ADMIN') {
      setToastMessage({
        type: 'error',
        text: 'Quản trị viên không có quyền thay đổi trạng thái của Quản trị viên khác.',
      });
      return;
    }
    if (member.role === 'ORG_OWNER') {
      setToastMessage({
        type: 'error',
        text: 'Chủ sở hữu không thể bị tạm ngưng.',
      });
      return;
    }

    const newStatus = member.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/organizations/${organizationId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: member.userId,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cập nhật trạng thái thất bại');
      }

      setToastMessage({
        type: 'success',
        text: `Đã ${newStatus === 'ACTIVE' ? 'kích hoạt lại' : 'tạm ngưng'} tài khoản của "${member.nickname}".`,
      });
      fetchMembers();
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Có lỗi xảy ra khi đổi trạng thái',
      });
    }
  };

  // Handler xóa thành viên khỏi tổ chức
  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    if (!isOwner && memberToDelete.role === 'ORG_ADMIN') {
      setDeleteError('Quản trị viên không có quyền xóa Quản trị viên khác.');
      return;
    }
    if (memberToDelete.role === 'ORG_OWNER') {
      setDeleteError('Chủ sở hữu không thể bị xóa khỏi tổ chức.');
      return;
    }

    setIsDeletingMember(true);
    setDeleteError(null);

    try {
      const res = await fetch(
        `/api/organizations/${organizationId}/members?userId=${memberToDelete.userId}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Xóa thành viên thất bại');
      }

      setToastMessage({
        type: 'success',
        text: `Đã xóa "${memberToDelete.nickname}" khỏi tổ chức thành công.`,
      });
      setMemberToDelete(null);
      fetchMembers();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi xóa thành viên');
    } finally {
      setIsDeletingMember(false);
    }
  };

  // Load invitations when tab changes
  useEffect(() => {
    if (activeTab === 'invitations') {
      fetchInvitations();
    }
  }, [activeTab, fetchInvitations]);

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Thành viên
          </h1>
        </div>

        {isManager && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Mời thành viên</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. KPI Summary Bar */}
      <div className="flex flex-wrap items-center gap-6 py-2 text-xs text-slate-600 dark:text-neutral-400">
        <span className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.75} />
          <span>
            <strong className="text-neutral-900 dark:text-neutral-100 font-bold font-mono text-sm tabular-nums">
              {currentMemberCount}
            </strong>{' '}
            thành viên đang hoạt động
          </span>
        </span>

        <span className="text-slate-300 dark:text-zinc-700 hidden sm:inline">|</span>

        <span className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.75} />
          <span>
            <strong className="text-neutral-900 dark:text-neutral-100 font-bold font-mono text-sm tabular-nums">
              {pendingInvitationsCount.toString().padStart(2, '0')}
            </strong>{' '}
            lời mời đang chờ
          </span>
        </span>

        <span className="text-slate-300 dark:text-zinc-700 hidden sm:inline">|</span>

        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span>
            <strong className="text-neutral-900 dark:text-neutral-100 font-bold font-mono text-sm tabular-nums">
              {remainingSeats}
            </strong>
            <span className="text-slate-400 dark:text-neutral-500"> / {maxSeatsAllowed}</span>{' '}
            ghế khả dụng
          </span>
        </span>
      </div>

      {/* 3. Navigation Tabs */}
      <div>
        <nav className="flex space-x-6 overflow-x-auto" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`pb-3 text-xs transition whitespace-nowrap relative cursor-pointer ${
              activeTab === 'members'
                ? 'text-blue-600 dark:text-blue-400 font-bold after:content-[""] after:absolute after:left-0 after:right-0 after:bottom-[-1px] after:h-[2px] after:bg-blue-600 dark:after:bg-blue-400'
                : 'text-slate-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 font-medium'
            }`}
          >
            Danh sách thành viên
          </button>

          {isManager && (
            <button
              type="button"
              onClick={() => setActiveTab('invitations')}
              className={`pb-3 text-xs transition whitespace-nowrap relative cursor-pointer ${
                activeTab === 'invitations'
                  ? 'text-blue-600 dark:text-blue-400 font-bold after:content-[""] after:absolute after:left-0 after:right-0 after:bottom-[-1px] after:h-[2px] after:bg-blue-600 dark:after:bg-blue-400'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 font-medium'
              }`}
            >
              <span>Lời mời</span>
              {pendingInvitationsCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {pendingInvitationsCount}
                </span>
              )}
            </button>
          )}
        </nav>
      </div>

      {/* 4. Tab 1: Member Directory Table with 3-dots Quick Actions */}
      {activeTab === 'members' && (
        <MemberDirectoryTable
          members={members}
          isManager={isManager}
          isOwner={isOwner}
          currentUserRole={currentUserRole}
          onOpenRoleModal={(member) => {
            setRoleError(null);
            setRoleMember(member);
            const normalized = normalizeOrgRole(member.role);
            const initialRole = (
              normalized === 'ORG_OWNER' ? 'ORG_ADMIN' : normalized
            ) as 'ORG_ADMIN' | 'ASSESSOR' | 'MEMBER';
            setSelectedRole(
              ['ORG_ADMIN', 'ASSESSOR', 'MEMBER'].includes(initialRole)
                ? initialRole
                : 'MEMBER'
            );
          }}
          onToggleStatus={handleToggleMemberStatus}
          onRequestDelete={(member) => {
            setDeleteError(null);
            setMemberToDelete(member);
          }}
          onOpenBulkImport={() => setIsBulkImportOpen(true)}
        />
      )}

      {/* 5. Tab 2: Pending Invitations View */}
      {activeTab === 'invitations' && isManager && (
        <PendingInvitationsView
          organizationId={organizationId}
          invitations={invitations}
          loading={loadingInvitations}
          onRefresh={fetchInvitations}
          onOpenInviteDrawer={() => setIsInviteModalOpen(true)}
          onInvitationRevoked={fetchInvitations}
        />
      )}

      {/* Centered Modal: Invite Member */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        organizationId={organizationId}
        organizationName={organizationName}
        classes={classes}
        remainingSeats={remainingSeats}
        maxSeats={maxSeatsAllowed}
        isOwner={isOwner}
        onSuccess={() => {
          setIsInviteModalOpen(false);
          fetchInvitations();
          fetchMembers();
        }}
        onOpenBulkImport={() => setIsBulkImportOpen(true)}
      />

      {/* Modal: Bulk Member Import via CSV */}
      <BulkMemberImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        organizationId={organizationId}
        remainingSeats={remainingSeats}
        classes={classes}
        onSuccess={() => {
          fetchMembers();
          fetchInvitations();
        }}
      />

      {/* Modal: Xác nhận xóa thành viên */}
      {memberToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 font-sans"
          onClick={() => !isDeletingMember && setMemberToDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Xác nhận xóa thành viên khỏi tổ chức
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                  Bạn có chắc chắn muốn xóa{' '}
                  <strong className="text-neutral-900 dark:text-neutral-100 font-bold">
                    {memberToDelete.nickname} ({memberToDelete.email})
                  </strong>{' '}
                  khỏi tổ chức? Quyền truy cập vào dữ liệu tổ chức sẽ bị chấm dứt.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                disabled={isDeletingMember}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-750 hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-zinc-200 text-xs font-semibold transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingMember}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {isDeletingMember ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <span>Xác nhận xóa</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Phân quyền vai trò thành viên */}
      {roleMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 font-sans"
          onClick={() => !isUpdatingRole && setRoleMember(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    Phân quyền vai trò
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    Thiết lập quyền hạn cho{' '}
                    <span className="font-semibold text-neutral-800 dark:text-zinc-200">
                      {roleMember.nickname}
                    </span>
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 dark:text-neutral-500">
                    {roleMember.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRoleMember(null)}
                disabled={isUpdatingRole}
                className="p-1 rounded-lg text-slate-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning if Target is Owner */}
            {roleMember.role === 'ORG_OWNER' ? (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Chủ sở hữu tổ chức</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                  Thành viên này nắm giữ quyền sở hữu cao nhất của tổ chức. Quyền sở hữu chỉ có thể chuyển giao tại mục Cài đặt tổ chức.
                </p>
              </div>
            ) : !isOwner && roleMember.role === 'ORG_ADMIN' ? (
              /* Warning if Actor is Admin and Target is Admin */
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Không có quyền quản lý Quản trị viên</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                  Quản trị viên không có quyền thay đổi vai trò hoặc giáng cấp Quản trị viên khác. Thao tác này chỉ dành riêng cho Chủ sở hữu tổ chức.
                </p>
              </div>
            ) : (
              /* Role Options Selection */
              <div className="space-y-2.5">
                {[
                  {
                    id: 'ORG_ADMIN' as const,
                    title: 'Quản trị viên',
                    badge: 'Toàn quyền',
                    desc: 'Toàn quyền điều hành tổ chức, phê duyệt thành viên, quản lý đơn vị và các đợt khảo thí.',
                    disabled: !isOwner,
                    disabledReason: 'Chỉ Chủ sở hữu mới có quyền bổ nhiệm Quản trị viên mới',
                  },
                  {
                    id: 'ASSESSOR' as const,
                    title: 'Khảo thí viên',
                    badge: 'Khảo thí',
                    desc: 'Soạn đề, tổ chức khảo thí, chấm bài và theo dõi tiến độ các nhóm/lớp được phân công.',
                    disabled: false,
                  },
                  {
                    id: 'MEMBER' as const,
                    title: 'Thành viên',
                    badge: 'Học viên',
                    desc: 'Tham gia học tập, làm bài khảo thí và nhận kết quả phân tích năng lực số.',
                    disabled: false,
                  },
                ].map((option) => {
                  const isSelected = selectedRole === option.id;
                  return (
                    <div
                      key={option.id}
                      onClick={() => {
                        if (!option.disabled) {
                          setSelectedRole(option.id);
                        }
                      }}
                      className={`p-3 rounded-xl border transition-all text-xs ${
                        option.disabled
                          ? 'opacity-50 cursor-not-allowed bg-slate-50/50 dark:bg-zinc-900/30 border-slate-200 dark:border-zinc-800'
                          : isSelected
                          ? 'border-blue-600 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-2xs cursor-pointer'
                          : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#141417] hover:border-slate-300 dark:hover:border-zinc-700 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                              isSelected
                                ? 'border-blue-600 bg-blue-600 dark:border-blue-500 dark:bg-blue-500'
                                : 'border-slate-300 dark:border-zinc-600'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {option.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-300">
                          {option.badge}
                        </span>
                      </div>
                      <p className="mt-1.5 pl-6 text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                        {option.desc}
                      </p>
                      {option.disabled && option.disabledReason && (
                        <p className="mt-1 pl-6 text-[10px] text-amber-600 dark:text-amber-400 italic">
                          * {option.disabledReason}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Error Message */}
            {roleError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{roleError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRoleMember(null)}
                disabled={isUpdatingRole}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-750 hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-zinc-200 text-xs font-semibold transition cursor-pointer"
              >
                Hủy
              </button>
              {roleMember.role !== 'ORG_OWNER' && (isOwner || roleMember.role !== 'ORG_ADMIN') && (
                <button
                  type="button"
                  onClick={handleSaveRole}
                  disabled={isUpdatingRole || selectedRole === roleMember.role}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingRole ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>Lưu thay đổi</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-xs font-medium animate-in slide-in-from-bottom-2 duration-200 font-sans ${
            toastMessage.type === 'success'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-neutral-950/20'
              : 'bg-rose-600 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
