'use client';

import React from 'react';
import { InviteMemberModal } from './members/InviteMemberModal';

interface OrgInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: {
    id: string;
    name: string;
    code?: string;
    slug?: string;
  };
  userRole?: string;
}

export function OrgInviteModal({
  isOpen,
  onClose,
  organization,
  userRole,
}: OrgInviteModalProps) {
  if (!isOpen || !organization) return null;

  const isOwner = !userRole || userRole === 'ORG_OWNER';

  return (
    <InviteMemberModal
      isOpen={isOpen}
      onClose={onClose}
      organizationId={organization.id}
      organizationName={organization.name}
      isOwner={isOwner}
      onSuccess={onClose}
    />
  );
}

export default OrgInviteModal;
