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
} from 'lucide-react';
import { MemberDirectoryTable } from '@/components/dashboard/org/members/MemberDirectoryTable';
import { InviteMemberModal } from '@/components/dashboard/org/members/InviteMemberModal';
import { MemberProfileDrawer } from '@/components/dashboard/org/members/MemberProfileDrawer';
import { PendingInvitationsView } from '@/components/dashboard/org/members/PendingInvitationsView';
import { BulkMemberImportModal } from '@/components/dashboard/org/BulkMemberImportModal';

import type {
  OrgMemberItem,
  OrgInvitationItem,
  OrgClassItem,
} from '@/components/dashboard/org/members/types';
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
  // Navigation & tabs: 2 tabs (Member list & Invitations) - Direct join, no approval queue needed
  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');

  // Core data states
  const [members, setMembers] = useState<OrgMemberItem[]>(initialMembers);
  const [invitations, setInvitations] = useState<OrgInvitationItem[]>([]);

  // Counts
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(initialInvitationsCount);

  // Loading flags
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  // Modals & Drawers
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrgMemberItem | null>(null);

  // Delete modal state
  const [memberToDelete, setMemberToDelete] = useState<OrgMemberItem | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Calculation of seat quota - Prioritize organization limit with proper deduction of active members
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

  // Handler xóa thành viên khỏi tổ chức (Phương án 1: Modal xác nhận nhanh & bảo lưu lịch sử thi cử)
  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
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
        text: `Đã xóa "${memberToDelete.nickname}" khỏi tổ chức thành công. 1 ghế bản quyền đã được giải phóng.`,
      });
      setMemberToDelete(null);
      if (selectedMember?.userId === memberToDelete.userId) {
        setSelectedMember(null);
      }
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
    <div className="space-y-6">
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
              onClick={() => setIsInviteModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Mời thành viên</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. KPI Summary Bar (Inline minimalist metrics per AGENTS.md) */}
      <div className="flex flex-wrap items-center gap-6 py-3 text-xs text-slate-600 dark:text-neutral-400">
        <span className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.75} />
          <span>
            <strong className="text-neutral-900 dark:text-neutral-100 font-bold font-mono text-sm">
              {currentMemberCount}
            </strong>{' '}
            thành viên đang hoạt động
          </span>
        </span>

        <span className="text-slate-300 dark:text-zinc-700 hidden sm:inline">|</span>

        <span className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.75} />
          <span>
            <strong className="text-neutral-900 dark:text-neutral-100 font-bold font-mono text-sm">
              {pendingInvitationsCount.toString().padStart(2, '0')}
            </strong>{' '}
            lời mời đang chờ
          </span>
        </span>

        <span className="text-slate-300 dark:text-zinc-700 hidden sm:inline">|</span>

        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span>
            <strong className="text-neutral-900 dark:text-neutral-100 font-bold font-mono text-sm">
              {remainingSeats}
            </strong>
            <span className="text-slate-400 dark:text-neutral-500"> / {maxSeatsAllowed}</span>{' '}
            ghế khả dụng
          </span>
        </span>
      </div>

      {/* 3. Underline Navigation Tabs: Member Directory & Invitations */}
      <div className="">
        <nav className="flex space-x-6 overflow-x-auto" aria-label="Tabs">
          <button
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

      {/* 4. Tab 1: Member Directory Table */}
      {activeTab === 'members' && (
        <MemberDirectoryTable
          members={members}
          onSelectMember={(member) => setSelectedMember(member)}
          isManager={isManager}
          isOwner={isOwner}
          currentUserRole={currentUserRole}
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

      {/* Centered Modal: Invite Member (UC-O03) */}
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

      {/* Drawer: Detailed Member Profile */}
      <MemberProfileDrawer
        isOpen={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
        organizationId={organizationId}
        isManager={isManager}
        isOwner={isOwner}
        currentUserRole={currentUserRole}
        onRequestDelete={(member) => {
          setDeleteError(null);
          setMemberToDelete(member);
        }}
        onUpdated={() => {
          fetchMembers();
          setSelectedMember(null);
        }}
        onDeleted={() => {
          fetchMembers();
          setSelectedMember(null);
        }}
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

      {/* Modal: Xác nhận xóa thành viên (Phương án 1 per spec) */}
      {memberToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
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
                  <strong className="text-neutral-900 dark:text-neutral-100">
                    {memberToDelete.nickname}
                  </strong>{' '}
                  ({memberToDelete.email}) khỏi tổ chức?
                </p>
              </div>
            </div>

            {/* Impact Details Box */}
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-850 bg-slate-50/60 dark:bg-zinc-900/40 text-xs text-slate-600 dark:text-neutral-300 space-y-2">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Thu hồi quyền truy cập:</strong> Người này sẽ không thể vào không gian tổ chức hay làm bài thi nội bộ nữa.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Giải phóng ghế bản quyền:</strong> Tổ chức sẽ có thêm 1 ghế trống để mời thành viên khác.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Bảo toàn số liệu:</strong> Toàn bộ kết quả thi và bằng chứng 5 miền trước đây vẫn được giữ nguyên trong báo cáo tổ chức.
                </span>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                disabled={isDeletingMember}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-zinc-200 text-xs font-semibold transition cursor-pointer"
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

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-xs font-medium animate-in slide-in-from-bottom-2 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
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
