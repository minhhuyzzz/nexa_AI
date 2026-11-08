export type OrgRoleType =
  | 'ORG_OWNER'
  | 'ORG_ADMIN'
  | 'ASSESSOR'
  | 'EVALUATOR'
    | 'MEMBER';

export interface OrgMemberItem {
  membershipId: string;
  userId: string;
  email: string;
  nickname: string;
  role: OrgRoleType | string;
  status: 'ACTIVE' | 'SUSPENDED' | string;
  createdAt: string;
  isCurrentUser: boolean;
  className?: string | null;
  lastActiveAt?: string | null;
}

export interface MembershipRequestItem {
  id: string;
  user_id: string;
  student_id?: string | null;
  full_name: string;
  email: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  join_source?: string;
  reason?: string | null;
  class_name?: string | null;
  proposed_role?: string;
  organization_join_codes?: { code: string; title?: string } | null;
}

export interface JoinCodeItem {
  id: string;
  code: string;
  title?: string | null;
  default_role?: string;
  class_id?: string | null;
  class_name?: string | null;
  max_uses: number;
  used_count: number;
  expires_at: string;
  is_revoked: boolean;
  created_at: string;
}

export interface OrgInvitationItem {
  id: string;
  email: string;
  org_role: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | string;
  token?: string;
  expires_at: string;
  created_at: string;
  accepted_at?: string | null;
}

export interface OrgClassItem {
  id: string;
  name: string;
  code?: string | null;
  memberCount?: number;
}
