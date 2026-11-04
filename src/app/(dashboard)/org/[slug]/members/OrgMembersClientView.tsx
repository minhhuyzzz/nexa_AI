'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Mail,
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
      <div className="flex flex-wrap items-center gap-6 py-3 border-y border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-neutral-400">
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
      <div className="border-b border-slate-200 dark:border-zinc-800">
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
    </div>
  );
}
