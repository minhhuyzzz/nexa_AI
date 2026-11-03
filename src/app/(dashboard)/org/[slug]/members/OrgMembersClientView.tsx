'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  UserCheck,
  CreditCard,
  KeyRound,
  FileSpreadsheet,
} from 'lucide-react';
import { MemberDirectoryTable } from '@/components/dashboard/org/members/MemberDirectoryTable';
import { InviteMemberDrawer } from '@/components/dashboard/org/members/InviteMemberDrawer';
import { MemberProfileDrawer } from '@/components/dashboard/org/members/MemberProfileDrawer';
import { ApprovalQueueView } from '@/components/dashboard/org/members/ApprovalQueueView';
import { PendingInvitationsView } from '@/components/dashboard/org/members/PendingInvitationsView';
import { JoinCodesView } from '@/components/dashboard/org/members/JoinCodesView';
import { BulkMemberImportModal } from '@/components/dashboard/org/BulkMemberImportModal';

import type {
  OrgMemberItem,
  MembershipRequestItem,
  JoinCodeItem,
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
  pendingRequestsCount?: number;
  pendingInvitationsCount?: number;
  maxMembers?: number;
  isManager: boolean;
}

export function OrgMembersClientView({
  organizationId,
  organizationName,
  organizationSlug,
  members: initialMembers,
  classes = [],
  entitlements,
  pendingRequestsCount: initialRequestsCount = 0,
  pendingInvitationsCount: initialInvitationsCount = 0,
  maxMembers = 50,
  isManager,
}: Props) {
  // Navigation & tabs
  const [activeTab, setActiveTab] = useState<'members' | 'requests' | 'invitations' | 'join-codes'>(
    'members'
  );

  // Core data states
  const [members, setMembers] = useState<OrgMemberItem[]>(initialMembers);
  const [requests, setRequests] = useState<MembershipRequestItem[]>([]);
  const [invitations, setInvitations] = useState<OrgInvitationItem[]>([]);
  const [joinCodes, setJoinCodes] = useState<JoinCodeItem[]>([]);

  // Counts
  const [pendingRequestsCount, setPendingRequestsCount] = useState(initialRequestsCount);
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(initialInvitationsCount);

  // Loading flags
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [loadingCodes, setLoadingCodes] = useState(false);

  // Drawers and Modals
  const [isInviteDrawerOpen, setIsInviteDrawerOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrgMemberItem | null>(null);

  // Calculation of seat quota
  const isProvisioning = Boolean(entitlements?.isProvisioning || entitlements?.status === 'PROVISIONING' || (!entitlements?.isActive && entitlements?.status !== 'EXPIRED'));
  const maxSeatsAllowed = entitlements?.maxSeats ?? (maxMembers || 50);
  const currentMemberCount = members.filter((m) => m.status === 'ACTIVE').length;
  const remainingSeats = isProvisioning ? maxSeatsAllowed : Math.max(0, maxSeatsAllowed - currentMemberCount);

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

  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch(`/api/organizations/${organizationId}/membership-requests`);
      if (res.ok) {
        const data = await res.json();
        const reqs = data.requests || [];
        setRequests(reqs);
        setPendingRequestsCount(reqs.filter((r: MembershipRequestItem) => r.status === 'PENDING').length);
      }
    } catch {
      // Keep existing state
    } finally {
      setLoadingRequests(false);
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

  const fetchJoinCodes = useCallback(async () => {
    setLoadingCodes(true);
    try {
      const res = await fetch(`/api/organizations/${organizationId}/join-codes`);
      if (res.ok) {
        const data = await res.json();
        setJoinCodes(data.codes || []);
      }
    } catch {
      // Keep existing state
    } finally {
      setLoadingCodes(false);
    }
  }, [organizationId]);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'requests') {
      fetchRequests();
    } else if (activeTab === 'invitations') {
      fetchInvitations();
    } else if (activeTab === 'join-codes') {
      fetchJoinCodes();
    }
  }, [activeTab, fetchRequests, fetchInvitations, fetchJoinCodes]);

  const handleMemberDeleted = (membershipId: string) => {
    setMembers((prev) => prev.filter((m) => m.membershipId !== membershipId));
    setSelectedMember(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Heading (Image 2 standard) */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase mb-1">
            QUẢN LÝ / NHÂN SỰ
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Thành viên
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
            Quản lý những người tham gia tổ chức và quyền truy cập của họ.
          </p>
        </div>

        {isManager && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsInviteDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-md shadow-xs transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Mời thành viên</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Meta Line (Image 2 exact replica) */}
      <div className="flex items-center gap-4 sm:gap-5 flex-wrap text-xs text-slate-600 dark:text-neutral-400 py-1">
        <span className="inline-flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-500 dark:text-neutral-400" strokeWidth={1.75} />
          <span>
            <strong className="text-neutral-900 dark:text-neutral-100 font-bold font-mono text-sm">
              {currentMemberCount}
            </strong>{' '}
            thành viên đang hoạt động
          </span>
        </span>
        <span className="text-slate-300 dark:text-zinc-700">|</span>
        <span className="inline-flex items-center gap-2">
          <Mail className="w-4 h-4 text-slate-500 dark:text-neutral-400" strokeWidth={1.75} />
          <span>
            <strong className="text-neutral-900 dark:text-neutral-100 font-bold font-mono text-sm">
              {String(pendingInvitationsCount).padStart(2, '0')}
            </strong>{' '}
            lời mời đang chờ
          </span>
        </span>
        <span className="text-slate-300 dark:text-zinc-700">|</span>
        <span className="inline-flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-slate-500 dark:text-neutral-400" strokeWidth={1.75} />
          <span>
            <strong className="text-neutral-900 dark:text-neutral-100 font-bold font-mono text-sm">
              {remainingSeats}
            </strong>{' '}
            ghế còn trống
          </span>
        </span>
      </div>

      {/* Pending Requests Attention Strip */}
      {isManager && pendingRequestsCount > 0 && activeTab !== 'requests' && (
        <div className="p-3.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" strokeWidth={1.75} />
            <span className="text-amber-900 dark:text-amber-200 font-medium">
              Có <strong className="font-bold font-mono tabular-nums">{pendingRequestsCount}</strong> người dùng đang yêu cầu tham gia tổ chức qua mã PIN.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-2xs"
          >
            Xét duyệt ngay
          </button>
        </div>
      )}

      {/* 3. Underline Navigation Tabs (Image 2 exact replica) */}
      <div className="border-b border-slate-200 dark:border-zinc-800">
        <nav className="flex space-x-6 overflow-x-auto" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-3 text-xs transition whitespace-nowrap relative ${
              activeTab === 'members'
                ? 'text-blue-600 dark:text-blue-400 font-bold after:content-[""] after:absolute after:left-0 after:right-0 after:bottom-[-1px] after:h-[2px] after:bg-blue-600 dark:after:bg-blue-400'
                : 'text-slate-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 font-medium'
            }`}
          >
            Danh sách thành viên
          </button>

          {isManager && (
            <>
              <button
                onClick={() => setActiveTab('invitations')}
                className={`pb-3 text-xs transition whitespace-nowrap relative ${
                  activeTab === 'invitations'
                    ? 'text-blue-600 dark:text-blue-400 font-bold after:content-[""] after:absolute after:left-0 after:right-0 after:bottom-[-1px] after:h-[2px] after:bg-blue-600 dark:after:bg-blue-400'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 font-medium'
                }`}
              >
                Lời mời
              </button>

              <button
                onClick={() => setActiveTab('requests')}
                className={`pb-3 text-xs transition whitespace-nowrap relative ${
                  activeTab === 'requests'
                    ? 'text-blue-600 dark:text-blue-400 font-bold after:content-[""] after:absolute after:left-0 after:right-0 after:bottom-[-1px] after:h-[2px] after:bg-blue-600 dark:after:bg-blue-400'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 font-medium'
                }`}
              >
                Yêu cầu tham gia
              </button>

              <button
                onClick={() => setActiveTab('join-codes')}
                className={`pb-3 text-xs transition whitespace-nowrap relative ${
                  activeTab === 'join-codes'
                    ? 'text-blue-600 dark:text-blue-400 font-bold after:content-[""] after:absolute after:left-0 after:right-0 after:bottom-[-1px] after:h-[2px] after:bg-blue-600 dark:after:bg-blue-400'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 font-medium'
                }`}
              >
                Mã gia nhập & QR
              </button>
            </>
          )}
        </nav>
      </div>

      {/* 4. Tab 1: Member Directory Table Directly (No noisy AI-slop boxes) */}
      {activeTab === 'members' && (
        <MemberDirectoryTable
          members={members}
          onSelectMember={(member) => setSelectedMember(member)}
          isManager={isManager}
          onOpenBulkImport={() => setIsBulkImportOpen(true)}
        />
      )}

      {/* TAB CONTENT 2: Approval Queue View (Screen 03) */}
      {activeTab === 'requests' && isManager && (
        <ApprovalQueueView
          organizationId={organizationId}
          requests={requests}
          loading={loadingRequests}
          onRefresh={fetchRequests}
          onRequestHandled={() => {
            fetchRequests();
            fetchMembers();
          }}
        />
      )}

      {/* TAB CONTENT 3: Pending Invitations View */}
      {activeTab === 'invitations' && isManager && (
        <PendingInvitationsView
          organizationId={organizationId}
          invitations={invitations}
          loading={loadingInvitations}
          onRefresh={fetchInvitations}
          onOpenInviteDrawer={() => setIsInviteDrawerOpen(true)}
          onInvitationRevoked={fetchInvitations}
        />
      )}

      {/* TAB CONTENT 4: Join Codes View (Screen 04) */}
      {activeTab === 'join-codes' && isManager && (
        <JoinCodesView
          organizationId={organizationId}
          joinCodes={joinCodes}
          classes={classes}
          loading={loadingCodes}
          onRefresh={fetchJoinCodes}
          onCodeCreated={fetchJoinCodes}
          onCodeRevoked={fetchJoinCodes}
        />
      )}

      {/* Slide-over Drawer: Invite Member (Screen 02) */}
      <InviteMemberDrawer
        isOpen={isInviteDrawerOpen}
        onClose={() => setIsInviteDrawerOpen(false)}
        organizationId={organizationId}
        organizationName={organizationName}
        classes={classes}
        remainingSeats={remainingSeats}
        maxSeats={maxSeatsAllowed}
        onSuccess={() => {
          setIsInviteDrawerOpen(false);
          fetchInvitations();
        }}
        onOpenBulkImport={() => {
          setIsInviteDrawerOpen(false);
          setIsBulkImportOpen(true);
        }}
        onSelectJoinCodesTab={() => {
          setIsInviteDrawerOpen(false);
          setActiveTab('join-codes');
        }}
      />

      {/* Slide-over Drawer: Member Profile & RBAC (Screen 06) */}
      <MemberProfileDrawer
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
        organizationId={organizationId}
        isManager={isManager}
        onUpdated={() => {
          fetchMembers();
        }}
        onDeleted={() => {
          if (selectedMember) {
            handleMemberDeleted(selectedMember.membershipId);
          }
        }}
      />

      {/* Modal: Bulk Member Import (Screen 05) */}
      <BulkMemberImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        organizationId={organizationId}
        remainingSeats={remainingSeats}
        classes={classes}
        onSuccess={() => {
          setIsBulkImportOpen(false);
          fetchInvitations();
          fetchMembers();
        }}
      />
    </div>
  );
}
