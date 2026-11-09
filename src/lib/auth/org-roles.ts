export type StandardOrgRole = 'ORG_OWNER' | 'ORG_ADMIN' | 'ASSESSOR' | 'MEMBER';
export type OrgRole = StandardOrgRole | 'EVALUATOR';

/**
 * Chuẩn hóa mọi vai trò tổ chức về 4 vai trò chính thức.
 * Tương thích ngược 100% với dữ liệu cũ mang giá trị 'EVALUATOR'.
 */
export function normalizeOrgRole(role?: string | null): StandardOrgRole {
  if (!role) return 'MEMBER';
  const upper = role.toUpperCase().trim();
  if (upper === 'EVALUATOR' || upper === 'ASSESSOR') return 'ASSESSOR';
  if (upper === 'ORG_OWNER') return 'ORG_OWNER';
  if (upper === 'ORG_ADMIN') return 'ORG_ADMIN';
  return 'MEMBER';
}

export const STANDARD_ROLE_LABELS: Record<StandardOrgRole, string> = {
  ORG_OWNER: 'Chủ sở hữu',
  ORG_ADMIN: 'Quản trị viên',
  ASSESSOR: 'Khảo thí viên',
  MEMBER: 'Thành viên',
};

export function getOrgRoleLabel(role?: string | null): string {
  return STANDARD_ROLE_LABELS[normalizeOrgRole(role)];
}
